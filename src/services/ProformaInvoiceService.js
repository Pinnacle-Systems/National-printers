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

const REFERENCE_PAGE = "PROFORMA INVOICE";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.proformaInvoice.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [
        { createdAt: { gte: startTime } },
        { createdAt: { lte: endTime } },
      ],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/PI/1`;
  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));
    if(!isNaN(lastNum)){
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
  
  let data = await prisma.proformaInvoice.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startTime } },
            { createdAt: { lte: finYearDate.endTime } },
          ]
        : undefined,
      docId: serachDocNo ? { contains: serachDocNo } : undefined,
      customer: searchCustomer ? { name: { contains: searchCustomer } } : undefined,
      OrderEntry: searchOrderNo ? { docId: { contains: searchOrderNo } } : undefined,
    },
    include: {
      customer: { select: { id: true, name: true } },
      items: true,
      OrderEntry: { select: { id: true, docId: true } },
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
  const data = await prisma.proformaInvoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: {
        include: {
          StyleItem: true,
          Size: true,
          Uom: true,
          Gsm: true,
          Hsn: true,
          SizeTemplate: true,
          sizeBreakup: { include: { Size: true } },
        },
        orderBy: { itemOrder: "asc" },
      },
      attachments: true,
      Branch: true,
      customer: true,
      OrderEntry: {
        include: {
          customer: true,
          orderItems: {
            include: {
              StyleItem: true,
              SizeTemplate: true,
              sizeBreakup: { include: { Size: true } },
              Uom: true,
              Gsm: true,
              Hsn: true,
            },
            orderBy: { itemOrder: "asc" },
          }
        }
      },
    },
  });
  if (!data) return NoRecordFound("Proforma Invoice");

  if (data && data.OrderEntry && data.items) {
    const styleItemCounts = {};
    data.items = data.items.map((item) => {
      // If trackingType is already present, it means it's newly saved data
      if (item.trackingType) return item;

      const styleId = item.styleItemId;
      styleItemCounts[styleId] = (styleItemCounts[styleId] || 0) + 1;
      const count = styleItemCounts[styleId];

      let matchCount = 0;
      const orderItem = data.OrderEntry.orderItems.find((oi) => {
        if (oi.styleItemId === styleId) {
          matchCount++;
          return matchCount === count;
        }
        return false;
      });

      if (orderItem) {
        return {
          ...item,
          trackingType: orderItem.trackingType,
          sizeTemplateId: orderItem.sizeTemplateId,
          SizeTemplate: orderItem.SizeTemplate,
          sizeBreakup: orderItem.sizeBreakup,
          remarks: orderItem.remarks,
        };
      }
      return item;
    });
  }

  return { statusCode: 0, data };
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
    items,
    attachments,
    termsAndCondition,
    termsId,
    orderEntryId,
    taxTemplateId,
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

  const data = await prisma.proformaInvoice.create({
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
      orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
      taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
      remarks,
      termsAndCondition,
      termsId: termsId ? parseInt(termsId) : null,
      items: {
        create: JSON.parse(items || "[]").map((item, idx) => ({
          StyleItem: item.styleItemId ? { connect: { id: parseInt(item.styleItemId) } } : undefined,
          Size: item.sizeId ? { connect: { id: parseInt(item.sizeId) } } : undefined,
          Uom: item.uomId ? { connect: { id: parseInt(item.uomId) } } : undefined,
          Gsm: item.gsmId ? { connect: { id: parseInt(item.gsmId) } } : undefined,
          Hsn: item.hsnId ? { connect: { id: parseInt(item.hsnId) } } : undefined,
          SizeTemplate: item.sizeTemplateId ? { connect: { id: parseInt(item.sizeTemplateId) } } : undefined,
          qty: parseFloat(item.qty || 0),
          price: parseFloat(item.price || 0),
          taxPercent: parseFloat(item.taxPercent || 0),
          discountType: item.discountType,
          discountValue: parseFloat(item.discountValue || 0),
          amount: parseFloat(item.amount || 0),
          trackingType: item.trackingType,
          remarks: item.remarks,
          itemOrder: idx,
          sizeBreakup: {
            create: (item.sizeBreakup || [])
              .filter((sb) => (parseFloat(sb.qty) || 0) > 0)
              .map((sb) => ({
                Size: sb.sizeId ? { connect: { id: parseInt(sb.sizeId) } } : undefined,
                qty: parseFloat(sb.qty || 0),
                barcodeFrom: sb.barcodeFrom,
                barcodeTo: sb.barcodeTo,
              })),
          },
        })),
      },
      attachments: attachments && JSON.parse(attachments)?.length > 0
        ? {
            createMany: {
              data: JSON.parse(attachments).map((sub) => ({
                date: sub?.date ? new Date(sub?.date) : undefined,
                filePath: sub?.filePath ? sub?.filePath : undefined,
                name: sub?.name ? sub?.name : undefined,
              })),
            },
          }
        : undefined,
    },
  });

  return { statusCode: 0, data };
}

async function update(id, body, files) {
  const {
    userId,
    branchId,
    docDate,
    userDate,
    customerId,
    deliveryDate,
    remarks,
    items,
    attachments,
    termsId,
    termsAndCondition,
    orderEntryId,
    taxTemplateId,
    isApproved,
  } = body;

  const parseItems = JSON.parse(items || "[]");
  const parseAttachments = JSON.parse(attachments || "[]");
  const incomingAttachmentIds = parseAttachments
    ?.filter((i) => i.id)
    .map((i) => parseInt(i.id));

  const dataFound = await prisma.proformaInvoice.findUnique({
    where: { id: parseInt(id) },
    include: { attachments: true, items: true },
  });

  if (!dataFound) return NoRecordFound("Proforma Invoice");

  // ── Fast path: approval-only toggle ─────────────────────────────────────
  // When only approvalStatus (or isApproved) is sent from the report page,
  // skip the full update to avoid overwriting all other fields with null.
  const approvalStatus = body.approvalStatus;

  const isApprovalOnlyUpdate =
    (approvalStatus !== undefined || isApproved !== undefined) &&
    !docDate && !customerId && !userId && !items;

  if (isApprovalOnlyUpdate) {
    // Derive both fields from approvalStatus if provided, else from isApproved
    let newStatus = approvalStatus;
    let newIsApproved;
    if (approvalStatus) {
      newIsApproved = approvalStatus === "APPROVED";
    } else {
      newIsApproved = isApproved === "true" || isApproved === true;
      newStatus = newIsApproved ? "APPROVED" : "REVOKED";
    }
    const data = await prisma.proformaInvoice.update({
      where: { id: parseInt(id) },
      data: { isApproved: newIsApproved, approvalStatus: newStatus },
    });
    return { statusCode: 0, data };
  }
  // ────────────────────────────────────────────────────────────────────────

  // Handle file unlinking for removed attachments
  const removedAttachments = dataFound.attachments.filter(
    (existing) => !incomingAttachmentIds.includes(existing.id),
  );
  removedAttachments.forEach((att) => {
    if (att.filePath) {
      const fullPath = path.join("./uploads", att.filePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.warn(`Could not delete file: ${fullPath}`, err.message);
      });
    }
  });

  const currentQuoteVersion = dataFound.quoteVersion || 1;
  const latestItems = dataFound.items.filter(i => i.quoteVersion === currentQuoteVersion);

  let isTableChanged = false;
  if (parseItems.length !== latestItems.length) {
    isTableChanged = true;
  } else {
    isTableChanged = parseItems.some((newItem, index) => {
      // Assuming ordered arrays from the client match the order of latestItems, or we just compare element by element.
      // Since ProformaInvoiceForm sets/gets the entire array in order, index matching works fine.
      const oldItem = latestItems[index];
      if (!oldItem) return true;
      return (
        parseInt(newItem.styleItemId || 0) !== parseInt(oldItem.styleItemId || 0) ||
        parseFloat(newItem.qty || 0) !== parseFloat(oldItem.qty || 0) ||
        parseFloat(newItem.price || 0) !== parseFloat(oldItem.price || 0) ||
        parseFloat(newItem.taxPercent || 0) !== parseFloat(oldItem.taxPercent || 0) ||
        (newItem.discountType || null) !== (oldItem.discountType || null) ||
        parseFloat(newItem.discountValue || 0) !== parseFloat(oldItem.discountValue || 0) ||
        parseInt(newItem.sizeId || 0) !== parseInt(oldItem.sizeId || 0) ||
        parseInt(newItem.uomId || 0) !== parseInt(oldItem.uomId || 0) ||
        parseInt(newItem.gsmId || 0) !== parseInt(oldItem.gsmId || 0) ||
        parseInt(newItem.hsnId || 0) !== parseInt(oldItem.hsnId || 0)
      );
    });
  }

  const nextQuoteVersion = isTableChanged ? currentQuoteVersion + 1 : currentQuoteVersion;

  const data = await prisma.proformaInvoice.update({
    where: { id: parseInt(id) },
    data: {
      docDate: docDate ? new Date(docDate) : null,
      userDate: userDate ? new Date(userDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      updatedById: parseInt(userId),
      customerId: customerId ? parseInt(customerId) : null,
      remarks,
      termsAndCondition,
      termsId: termsId ? parseInt(termsId) : null,
      orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
      taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
      quoteVersion: nextQuoteVersion,
      ...(isApproved !== undefined && { isApproved: isApproved === "true" || isApproved === true }),
      items: isTableChanged ? {
        deleteMany: {},
        create: parseItems.map((item, idx) => ({
          StyleItem: item.styleItemId ? { connect: { id: parseInt(item.styleItemId) } } : undefined,
          Size: item.sizeId ? { connect: { id: parseInt(item.sizeId) } } : undefined,
          Uom: item.uomId ? { connect: { id: parseInt(item.uomId) } } : undefined,
          Gsm: item.gsmId ? { connect: { id: parseInt(item.gsmId) } } : undefined,
          Hsn: item.hsnId ? { connect: { id: parseInt(item.hsnId) } } : undefined,
          SizeTemplate: item.sizeTemplateId ? { connect: { id: parseInt(item.sizeTemplateId) } } : undefined,
          qty: parseFloat(item.qty || 0),
          price: parseFloat(item.price || 0),
          taxPercent: parseFloat(item.taxPercent || 0),
          discountType: item.discountType,
          discountValue: parseFloat(item.discountValue || 0),
          amount: parseFloat(item.amount || 0),
          quoteVersion: nextQuoteVersion,
          trackingType: item.trackingType,
          remarks: item.remarks,
          itemOrder: idx,
          sizeBreakup: {
            create: (item.sizeBreakup || [])
              .filter((sb) => (parseFloat(sb.qty) || 0) > 0)
              .map((sb) => ({
                Size: sb.sizeId ? { connect: { id: parseInt(sb.sizeId) } } : undefined,
                qty: parseFloat(sb.qty || 0),
                barcodeFrom: sb.barcodeFrom,
                barcodeTo: sb.barcodeTo,
              })),
          },
        })),
      } : undefined,
      attachments: {
        deleteMany: {
          ...(incomingAttachmentIds.length > 0 && {
            id: { notIn: incomingAttachmentIds },
          }),
        },
        update: parseAttachments
          .filter((item) => item.id)
          .map((sub) => ({
            where: { id: parseInt(sub.id) },
            data: {
              date: sub?.date ? new Date(sub?.date) : undefined,
              filePath: (() => {
                const matchedFile = files?.find(
                  (f) => f.originalname === sub.filePath,
                );
                return matchedFile ? matchedFile.filename : sub.filePath;
              })(),
              name: sub?.name ? sub?.name : undefined,
            },
          })),
        create: parseAttachments
          .filter((item) => !item.id)
          .map((sub) => ({
            date: sub?.date ? new Date(sub?.date) : undefined,
            filePath: (() => {
              const matchedFile = files?.find(
                (f) => f.originalname === sub.filePath,
              );
              return matchedFile ? matchedFile.filename : sub.filePath;
            })(),
            name: sub?.name ? sub?.name : undefined,
          })),
      },
    },
  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const dataFound = await prisma.proformaInvoice.findUnique({
    where: { id: parseInt(id) },
    include: { attachments: true },
  });

  if (!dataFound) return NoRecordFound("Proforma Invoice");

  dataFound.attachments.forEach((att) => {
    if (att.filePath) {
      const fullPath = path.join("./uploads", att.filePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.warn(`Could not delete: ${fullPath}`, err.message);
      });
    }
  });

  const data = await prisma.proformaInvoice.delete({
    where: { id: parseInt(id) },
  });

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };
