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
        }
      },
      attachments: true,
      Branch: true,
      customer: true,
      OrderEntry: {
        include: {
          orderItems: {
            include: {
              StyleItem: true,
              Size: true,
              Uom: true,
              Gsm: true,
            }
          }
        }
      },
    },
  });
  if (!data) return NoRecordFound("Proforma Invoice");
  return { statusCode: 0, data };
}

async function create(body) {
  const {
    userId,
    branchId,
    companyId,
    docDate,
    customerId,
    deliveryDate,
    remarks,
    finYearId,
    items,
    attachments,
    termsAndCondition,
    termsId,
    orderEntryId,
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
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      createdById: parseInt(userId),
      branchId: parseInt(branchId),
      companyId: parseInt(companyId),
      customerId: customerId ? parseInt(customerId) : null,
      finYearId: parseInt(finYearId),
      orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
      remarks,
      termsAndCondition,
      termsId: termsId ? parseInt(termsId) : null,
      items: {
        createMany: {
          data: JSON.parse(items || "[]").map((item) => ({
            styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
            sizeId: item.sizeId ? parseInt(item.sizeId) : null,
            uomId: item.uomId ? parseInt(item.uomId) : null,
            gsmId: item.gsmId ? parseInt(item.gsmId) : null,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            taxPercent: parseFloat(item.taxPercent || 0),
            discountType: item.discountType,
            discountValue: parseFloat(item.discountValue || 0),
            amount: parseFloat(item.amount || 0),
          })),
        },
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
    customerId,
    deliveryDate,
    remarks,
    items,
    attachments,
    termsId,
    termsAndCondition,
    orderEntryId,
  } = body;

  const parseItems = JSON.parse(items || "[]");
  const parseAttachments = JSON.parse(attachments || "[]");
  const incomingAttachmentIds = parseAttachments
    ?.filter((i) => i.id)
    .map((i) => parseInt(i.id));

  const dataFound = await prisma.proformaInvoice.findUnique({
    where: { id: parseInt(id) },
    include: { attachments: true },
  });

  if (!dataFound) return NoRecordFound("Proforma Invoice");

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

  const data = await prisma.proformaInvoice.update({
    where: { id: parseInt(id) },
    data: {
      docDate: docDate ? new Date(docDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      updatedById: parseInt(userId),
      customerId: customerId ? parseInt(customerId) : null,
      remarks,
      termsAndCondition,
      termsId: termsId ? parseInt(termsId) : null,
      orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
      items: {
        deleteMany: {},
        createMany: {
          data: parseItems.map((item) => ({
            styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
            sizeId: item.sizeId ? parseInt(item.sizeId) : null,
            uomId: item.uomId ? parseInt(item.uomId) : null,
            gsmId: item.gsmId ? parseInt(item.gsmId) : null,
            qty: parseFloat(item.qty || 0),
            price: parseFloat(item.price || 0),
            taxPercent: parseFloat(item.taxPercent || 0),
            discountType: item.discountType,
            discountValue: parseFloat(item.discountValue || 0),
            amount: parseFloat(item.amount || 0),
          })),
        },
      },
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
