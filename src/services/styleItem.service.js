import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

function extractStyleImage(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return raw.trim() || null;
  }

  let buf = null;
  if (Buffer.isBuffer(raw)) {
    buf = raw;
  } else if (raw instanceof Uint8Array || (raw && raw.buffer)) {
    buf = Buffer.from(raw.buffer, raw.byteOffset || 0, raw.byteLength || raw.length);
  } else if (typeof raw === "object" && raw?.type === "Buffer" && Array.isArray(raw?.data)) {
    buf = Buffer.from(raw.data);
  } else if (Array.isArray(raw)) {
    buf = Buffer.from(raw);
  } else {
    try {
      buf = Buffer.from(raw);
    } catch {
      return null;
    }
  }

  if (!buf || buf.length === 0) return null;

  // Check if buffer is raw image binary (JPEG, PNG, GIF, WebP, BMP, PDF)
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng = buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isGif = buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
  const isWebp = buf.length > 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  const isBmp = buf.length > 2 && buf[0] === 0x42 && buf[1] === 0x4d;
  const isPdf = buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;

  if (isJpeg) return `data:image/jpeg;base64,${buf.toString("base64")}`;
  if (isPng) return `data:image/png;base64,${buf.toString("base64")}`;
  if (isGif) return `data:image/gif;base64,${buf.toString("base64")}`;
  if (isWebp) return `data:image/webp;base64,${buf.toString("base64")}`;
  if (isBmp) return `data:image/bmp;base64,${buf.toString("base64")}`;
  if (isPdf) return `data:application/pdf;base64,${buf.toString("base64")}`;

  const text = buf.toString("utf-8");
  return text.trim() || null;
}

const unlinkFile = (fileIdentifier) => {
  if (!fileIdentifier) return;
  const rawPath = extractStyleImage(fileIdentifier);
  if (
    !rawPath ||
    typeof rawPath !== "string" ||
    rawPath.startsWith("data:") ||
    rawPath.includes("\0") ||
    rawPath.length > 255
  ) {
    return;
  }
  const fileName = rawPath.replace(/^uploads\//, "");
  const fullPath = path.join("./uploads", fileName);
  fs.unlink(fullPath, (err) => {
    if (err) console.warn(`Could not delete file: ${fullPath}`, err.message);
    else console.log(`Deleted file: ${fullPath}`);
  });
};

function formatStyleItem(item) {
  if (!item) return item;
  return {
    ...item,
    styleImage: extractStyleImage(item.styleImage),
  };
}

async function get(req) {
  const { companyId, active } = req.query;

  let data = await prisma.styleItem.findMany({
    where: {
      active: active ? Boolean(active) : undefined,
    },
    include: {
      _count: {
        select: {
          poItems: true,
          orderItems: true,
          inwardItems: true,
        },
      },
      SizeTemplate: {
        select: {
          SizeTemplateList: {
            select: {
              sizeId: true,
            },
          },
        },
      },
      ItemGroup: true,
    },
    orderBy: {
      id: "desc",
    },
  });
  return {
    statusCode: 0,
    data: (data = data.map((color) =>
      formatStyleItem({
        ...color,
        childRecord:
          color?._count.poItems +
          color?._count.inwardItems +
          color?._count.orderItems,
      }),
    )),
  };
}

async function getOne(id) {
  const childRecordPo = await prisma.poItems.count({
    where: { styleItemId: parseInt(id) },
  });
  const childRecordInward = await prisma.inwardItems.count({
    where: { styleItemId: parseInt(id) },
  });
  const childRecodOrderEntry = await prisma.orderItems.count({
    where: { styleItemId: parseInt(id) },
  });
  const data = await prisma.styleItem.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Hsn: true,
    },
  });
  if (!data) return NoRecordFound("styleItem");
  return {
    statusCode: 0,
    data: formatStyleItem({
      ...data,
      ...{
        childRecord: childRecordPo + childRecordInward + childRecodOrderEntry,
      },
    }),
  };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.styleItem.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
      OR: [
        {
          name: {
            contains: searchKey,
          },
        },
      ],
    },
  });
  return { statusCode: 0, data: data.map((item) => formatStyleItem(item)) };
}

async function create(body, files) {
  const {
    name,
    aliasName,
    active,
    code,
    hsnId,
    uomId,
    sizeTemplateId,
    itemGroupId,
    gsmId,
    price,
    styleImage,
  } = await body;

  const matchedFile =
    files?.find(
      (f) =>
        f.fieldname === "images" ||
        f.fieldname === "styleImage" ||
        f.originalname === styleImage,
    ) || files?.[0];

  let styleImagePath = null;
  if (matchedFile) {
    styleImagePath = `uploads/${matchedFile.filename}`;
  } else if (styleImage && typeof styleImage === "string" && styleImage.trim()) {
    styleImagePath = styleImage.trim();
  }

  const data = await prisma.styleItem.create({
    data: {
      name,
      aliasName,
      active:
        active !== undefined
          ? typeof active === "string"
            ? JSON.parse(active)
            : Boolean(active)
          : false,
      code,
      hsnId: parseInt(hsnId) || null,
      uomId: parseInt(uomId) || null,
      itemGroupId: parseInt(itemGroupId) || null,
      sizeTemplateId: parseInt(sizeTemplateId) || null,
      gsmId: parseInt(gsmId) || null,
      price:
        price !== undefined && price !== "" && price !== null
          ? parseFloat(price)
          : null,
      styleImage: styleImagePath,
    },
  });
  return { statusCode: 0, data: formatStyleItem(data) };
}

async function update(id, body, files) {
  const {
    name,
    active,
    aliasName,
    code,
    hsnId,
    uomId,
    sizeTemplateId,
    itemGroupId,
    gsmId,
    price,
    styleImage,
    isDeleteImage,
  } = await body;

  const dataFound = await prisma.styleItem.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("styleItem");

  const matchedFile =
    files?.find(
      (f) =>
        f.fieldname === "images" ||
        f.fieldname === "styleImage" ||
        f.originalname === styleImage,
    ) || files?.[0];

  let styleImageUpdate = undefined;
  if (matchedFile) {
    if (dataFound.styleImage) {
      unlinkFile(dataFound.styleImage);
    }
    styleImageUpdate = `uploads/${matchedFile.filename}`;
  } else if (
    isDeleteImage === "true" ||
    isDeleteImage === true ||
    (styleImage === "" && !dataFound.styleImage)
  ) {
    if (dataFound.styleImage) {
      unlinkFile(dataFound.styleImage);
    }
    styleImageUpdate = null;
  }

  const data = await prisma.styleItem.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name,
      aliasName,
      active:
        active !== undefined
          ? typeof active === "string"
            ? JSON.parse(active)
            : Boolean(active)
          : undefined,
      code,
      hsnId: parseInt(hsnId) || null,
      uomId: parseInt(uomId) || null,
      itemGroupId: parseInt(itemGroupId) || null,
      sizeTemplateId: parseInt(sizeTemplateId) || null,
      gsmId: parseInt(gsmId) || null,
      price:
        price !== undefined && price !== "" && price !== null
          ? parseFloat(price)
          : null,
      ...(styleImageUpdate !== undefined && { styleImage: styleImageUpdate }),
    },
  });
  return { statusCode: 0, data: formatStyleItem(data) };
}

async function remove(id) {
  const dataFound = await prisma.styleItem.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (dataFound?.styleImage) {
    unlinkFile(dataFound.styleImage);
  }
  const data = await prisma.styleItem.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };
