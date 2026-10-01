import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getYearShortCode,
  getDateFromDateTime,
  buildDateRange,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import fs from "fs";
import path from "path";

const REFERENCE_PAGE = "SALES DELIVERY";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.salesDelivery.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/PI/1`;
  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));
    if (!isNaN(lastNum)) {
      newDocId = `${branchObj.branchCode}/${shortCode}/PI/${lastNum + 1}`;
    }
  }
  return newDocId;
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    finYearId,
    searchCustomer,
    searchOrderNo,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(finYearDate?.startTime, finYearDate?.endTime)
    : "";

  let data = await prisma.salesDelivery.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startTime } },
            { createdAt: { lte: finYearDate.endTime } },
          ]
        : undefined,
      docId: serachDocNo ? { contains: serachDocNo } : undefined,
      customer: searchCustomer
        ? { name: { contains: searchCustomer } }
        : undefined,
      ProformaInvoice: searchOrderNo
        ? { docId: { contains: searchOrderNo } }
        : undefined,
    },
    include: {
      customer: { select: { id: true, name: true } },
      salesDeliveryItems: true,
      ProformaInvoice: {
        select: {
          id: true,
          docId: true,
          OrderEntry: { select: { id: true, docId: true } },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  if (searchDocDate) {
    data = data?.filter((item) =>
      String(getDateFromDateTime(item.docDate)).includes(searchDocDate),
    );
  }

  const totalCount = data.length;

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return {
    statusCode: 0,
    data,
    totalCount,
  };
}

async function getOne(id) {
  const data = await prisma.salesDelivery.findUnique({
    where: { id: parseInt(id) },
    include: {
      salesDeliveryItems: {
        include: {
          StyleItem: true,
          Size: true,
          Uom: true,
          Gsm: true,
          Hsn: true,
          SizeTemplate: true,
          salesDeliveryBreakUp: {
            include: {
              Size: true,

              proformaSizeBreakup: {
                include: {
                  salesDeliveryBreakups: true,
                },
              },
            },
          },
        },
        orderBy: { itemOrder: "asc" },
      },
      Branch: true,
      customer: true,
      deliveryCustomer: true,
      ProformaInvoice: {
        include: {
          customer: true,
          items: {
            include: {
              StyleItem: true,
              SizeTemplate: true,
              sizeBreakup: { include: { Size: true } },
              Uom: true,
              Gsm: true,
              Hsn: true,
            },
            orderBy: { itemOrder: "asc" },
          },
        },
      },
    },
  });
  if (!data) return NoRecordFound("Proforma Invoice");

  return {
    statusCode: 0,
    data: {
      ...data,
      salesDeliveryItems: data.salesDeliveryItems.map((item) => ({
        ...item,
        deliveryQty: item.salesDeliveryBreakUp.reduce(
          (acc1, size1) => acc1 + size1.deliveryQty,
          0,
        ),

        orderQty: item.salesDeliveryBreakUp.reduce(
          (acc1, size1) => acc1 + size1.qty,
          0,
        ),
        salesDeliveryBreakUp: item.salesDeliveryBreakUp.map((s) => ({
          ...s,
          alreadyDeliveryQty:
            s.proformaSizeBreakup?.salesDeliveryBreakups
              ?.filter((i) => i?.id !== s?.id)
              ?.reduce((acc1, size1) => acc1 + (size1.deliveryQty || 0), 0) ||
            0,
        })),
      })),
    },
  };
}

async function create(body) {
  const {
    userId,
    branchId,
    companyId,
    docDate,
    userDate,
    customerId,
    deliveryDate,
    remarks,
    finYearId,
    salesDeliveryItems,
    attachments,
    termsAndCondition,
    termsId,
    profromaInvoiceId,
    taxTemplateId,
    deliveryType,
    deliveryCustomerId,
    modeOfPayment,
    deliveryCharge,
    discountType,
    discountValue,
    netAmount,
  } = body;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";

  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );

  let stockEntries = [];
  if (salesDeliveryItems && salesDeliveryItems.length > 0) {
    salesDeliveryItems.forEach((item) => {
      const baseStock = {
        branchId: branchId ? parseInt(branchId) : null,
        profromaInvoiceId: profromaInvoiceId
          ? parseInt(profromaInvoiceId)
          : null,
        createdById: userId ? parseInt(userId) : null,
        inOrOut: "Out",
        processName: "Sales",
        styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
        itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
        uomId: item?.uomId ? parseInt(item.uomId) : null,
        hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
      };

      if (item?.salesDeliveryBreakUp?.length > 0) {
        item.salesDeliveryBreakUp.forEach((s) => {
          stockEntries.push({
            ...baseStock,
            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
            qty: s?.deliveryQty ? -Math.abs(parseFloat(s.deliveryQty)) : null,
          });
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: item?.deliveryQty
            ? -Math.abs(parseFloat(item.deliveryQty))
            : null,
        });
      }
    });
  }

  const requestedQuantities = {};
  for (const entry of stockEntries) {
    const key = `${entry.styleItemId || 0}-${entry.sizeId || 0}`;
    if (!requestedQuantities[key]) {
      requestedQuantities[key] = {
        styleItemId: entry.styleItemId,
        sizeId: entry.sizeId,
        qty: 0,
      };
    }
    requestedQuantities[key].qty += Math.abs(entry.qty || 0);
  }

  for (const key in requestedQuantities) {
    const item = requestedQuantities[key];
    const inStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        sizeId: item.sizeId,
        inOrOut: "In",
      },
    });
    const outStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        sizeId: item.sizeId,
        inOrOut: "Out",
      },
    });
    const inQty = inStockAgg._sum.qty || 0;
    const outQty = outStockAgg._sum.qty || 0;
    const availableQty = inQty + outQty;

    if (item.qty > availableQty) {
      return {
        statusCode: 1,
        message: "Insufficient stock for one or more items.",
      };
    }
  }
  let data;
  await prisma.$transaction(async (tx) => {
    data = await tx.salesDelivery.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        userDate: userDate ? new Date(userDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        companyId: parseInt(companyId),
        customerId: customerId ? parseInt(customerId) : null,
        finYearId: parseInt(finYearId),
        profromaInvoiceId: profromaInvoiceId
          ? parseInt(profromaInvoiceId)
          : null,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        deliveryType,
        deliveryCustomerId: deliveryCustomerId
          ? parseInt(deliveryCustomerId)
          : null,
        modeOfPayment,
        deliveryCharge:
          deliveryCharge && deliveryCharge !== ""
            ? parseFloat(deliveryCharge)
            : null,
        discountValue:
          discountValue && discountValue !== ""
            ? parseFloat(discountValue)
            : null,
        discountType: discountType,
        remarks,
        termsAndCondition,
        netAmount: netAmount ? parseFloat(netAmount) : 0,
        termsId: termsId ? parseInt(termsId) : null,
        salesDeliveryItems: {
          create: (salesDeliveryItems || []).map((item, idx) => ({
            styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
            itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,

            uomId: item.uomId ? parseInt(item.uomId) : null,
            gsmId: item.gsmId ? parseInt(item.gsmId) : null,
            hsnId: item.hsnId ? parseInt(item.hsnId) : null,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            taxPercent: parseFloat(item.taxPercent || 0),
            discountType: item.discountType,
            discountValue: parseFloat(item.discountValue || 0),
            trackingType: item.trackingType,
            remarks: item.remarks,
            itemOrder: idx,
            salesDeliveryBreakUp: {
              create: (item.salesDeliveryBreakUp || [])
                .filter((sb) => (parseFloat(sb.deliveryQty) || 0) > 0)
                .map((sb) => ({
                  sizeId: sb.sizeId ? parseInt(sb.sizeId) : null,
                  proformaSizeBreakupId: sb.proformaSizeBreakupId
                    ? parseInt(sb.proformaSizeBreakupId)
                    : null,
                  qty: parseFloat(sb.qty || 0),
                  barcodeFrom: sb.barcodeFrom,
                  barcodeTo: sb.barcodeTo,
                  deliveryQty: parseFloat(sb.deliveryQty || 0),
                })),
            },
          })),
        },
      },
    });

    if (stockEntries.length > 0) {
      const stockEntriesWithSalesDeliveryId = stockEntries.map((entry) => ({
        ...entry,
        salesDeliveryId: data.id,
      }));
      await tx.Stock.createMany({
        data: stockEntriesWithSalesDeliveryId,
      });
    }
    await tx.Ledger.create({
      data: {
        EntryType: "Sales",
        LedgerType: "Customer",
        creditOrDebit: "Debit",
        partyId: customerId ? parseInt(customerId) : null,
        amount: netAmount ? parseFloat(netAmount) : null,
        dcDate: docDate ? new Date(docDate) : null,
        // currencyId: currencyId ? parseInt(currencyId) : null,
        salesDeliveryId: data?.id ? parseInt(data.id) : null,
      },
    });
  });
  return { statusCode: 0, data };
}

async function update(id, body, files) {
  const {
    userId,
    branchId,
    companyId,
    docDate,
    userDate,
    customerId,
    deliveryDate,
    remarks,
    salesDeliveryItems,
    termsId,
    termsAndCondition,
    profromaInvoiceId,
    taxTemplateId,
    isApproved,
    deliveryType,
    deliveryCustomerId,
    modeOfPayment,
    deliveryCharge,
    discountValue,
    discountType,
    netAmount,
  } = body;

  const dataFound = await prisma.salesDelivery.findUnique({
    where: { id: parseInt(id) },
  });

  if (!dataFound) return { statusCode: 1, message: "Record not found" };

  const approvalStatus = body.approvalStatus;

  const isApprovalOnlyUpdate =
    (approvalStatus !== undefined || isApproved !== undefined) &&
    !docDate &&
    !customerId &&
    !salesDeliveryItems;

  if (isApprovalOnlyUpdate) {
    let newStatus = approvalStatus;
    let newIsApproved;
    if (approvalStatus) {
      newIsApproved = approvalStatus === "APPROVED";
    } else {
      newIsApproved = isApproved === "true" || isApproved === true;
      newStatus = newIsApproved ? "APPROVED" : "REVOKED";
    }
    const data = await prisma.salesDelivery.update({
      where: { id: parseInt(id) },
      data: { isApproved: newIsApproved, approvalStatus: newStatus },
    });
    return { statusCode: 0, data };
  }

  // Stock Validation & Preparation
  let stockEntries = [];
  if (salesDeliveryItems && salesDeliveryItems.length > 0) {
    salesDeliveryItems.forEach((item) => {
      const baseStock = {
        branchId: branchId ? parseInt(branchId) : null,
        profromaInvoiceId: profromaInvoiceId ? parseInt(profromaInvoiceId) : null,
        createdById: userId ? parseInt(userId) : null,
        inOrOut: "Out",
        processName: "Sales",
        styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
        itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
        uomId: item?.uomId ? parseInt(item.uomId) : null,
        hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
      };

      if (item?.salesDeliveryBreakUp?.length > 0) {
        item.salesDeliveryBreakUp.forEach((s) => {
          stockEntries.push({
            ...baseStock,
            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
            qty: s?.deliveryQty ? -Math.abs(parseFloat(s.deliveryQty)) : null,
          });
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: item?.deliveryQty ? -Math.abs(parseFloat(item.deliveryQty)) : null,
        });
      }
    });
  }

  // Stock check
  const requestedQuantities = {};
  for (const entry of stockEntries) {
    const key = `${entry.styleItemId || 0}-${entry.sizeId || 0}`;
    if (!requestedQuantities[key]) {
      requestedQuantities[key] = {
        styleItemId: entry.styleItemId,
        sizeId: entry.sizeId,
        qty: 0,
      };
    }
    requestedQuantities[key].qty += Math.abs(entry.qty || 0);
  }

  for (const key in requestedQuantities) {
    const item = requestedQuantities[key];
    const inStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        sizeId: item.sizeId,
        inOrOut: "In",
      },
    });
    // For out stock, we must exclude the current SalesDelivery's stock entries
    const outStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        sizeId: item.sizeId,
        inOrOut: "Out",
        salesDeliveryId: { not: parseInt(id) }
      },
    });
    const inQty = inStockAgg._sum.qty || 0;
    const outQty = outStockAgg._sum.qty || 0;
    const availableQty = inQty + outQty; // outQty is already negative

    if (item.qty > availableQty) {
      return {
        statusCode: 1,
        message: "Insufficient stock for one or more items.",
      };
    }
  }

  let data;
  await prisma.$transaction(async (tx) => {
    // Delete existing nested records so we can cleanly recreate them
    await tx.salesDeliveryItems.deleteMany({
      where: { salesDeliveryId: parseInt(id) }
    });
    await tx.stock.deleteMany({
      where: { salesDeliveryId: parseInt(id) }
    });
    await tx.ledger.deleteMany({
      where: { salesDeliveryId: parseInt(id) }
    });

    data = await tx.salesDelivery.update({
      where: { id: parseInt(id) },
      data: {
        docDate: docDate ? new Date(docDate) : null,
        userDate: userDate ? new Date(userDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        updatedById: parseInt(userId),
        branchId: branchId ? parseInt(branchId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        profromaInvoiceId: profromaInvoiceId ? parseInt(profromaInvoiceId) : null,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        deliveryType,
        deliveryCustomerId: deliveryCustomerId ? parseInt(deliveryCustomerId) : null,
        modeOfPayment,
        deliveryCharge: deliveryCharge && deliveryCharge !== "" ? parseFloat(deliveryCharge) : null,
        discountValue: discountValue && discountValue !== "" ? parseFloat(discountValue) : null,
        discountType: discountType,
        remarks,
        termsAndCondition,
        netAmount: netAmount ? parseFloat(netAmount) : 0,
        termsId: termsId ? parseInt(termsId) : null,
        salesDeliveryItems: {
          create: (salesDeliveryItems || []).map((item, idx) => ({
            styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
            itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
            uomId: item.uomId ? parseInt(item.uomId) : null,
            gsmId: item.gsmId ? parseInt(item.gsmId) : null,
            hsnId: item.hsnId ? parseInt(item.hsnId) : null,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            taxPercent: parseFloat(item.taxPercent || 0),
            discountType: item.discountType,
            discountValue: parseFloat(item.discountValue || 0),
            trackingType: item.trackingType,
            remarks: item.remarks,
            itemOrder: idx,
            salesDeliveryBreakUp: {
              create: (item.salesDeliveryBreakUp || [])
                .filter((sb) => (parseFloat(sb.deliveryQty) || 0) > 0)
                .map((sb) => ({
                  sizeId: sb.sizeId ? parseInt(sb.sizeId) : null,
                  proformaSizeBreakupId: sb.proformaSizeBreakupId ? parseInt(sb.proformaSizeBreakupId) : null,
                  qty: parseFloat(sb.qty || 0),
                  barcodeFrom: sb.barcodeFrom,
                  barcodeTo: sb.barcodeTo,
                  deliveryQty: parseFloat(sb.deliveryQty || 0),
                })),
            },
          })),
        },
      },
    });

    if (stockEntries.length > 0) {
      const stockEntriesWithSalesDeliveryId = stockEntries.map((entry) => ({
        ...entry,
        salesDeliveryId: data.id,
      }));
      await tx.stock.createMany({
        data: stockEntriesWithSalesDeliveryId,
      });
    }

    await tx.ledger.create({
      data: {
        EntryType: "Sales",
        LedgerType: "Customer",
        creditOrDebit: "Debit",
        partyId: customerId ? parseInt(customerId) : null,
        amount: netAmount ? parseFloat(netAmount) : null,
        dcDate: docDate ? new Date(docDate) : null,
        salesDeliveryId: data.id,
      },
    });
  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const dataFound = await prisma.salesDelivery.findUnique({
    where: { id: parseInt(id) },
  });

  if (!dataFound) return NoRecordFound("Sales Delivery");

  const data = await prisma.salesDelivery.delete({
    where: { id: parseInt(id) },
  });

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };
