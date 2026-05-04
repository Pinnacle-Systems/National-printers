import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import {
  buildIncludeForModule,
  createApprovalLog,
  evaluateConfigs,
  getApprovalStatus,
  getModuleApprovalSetup,
} from "../utils/approvalHelper.js";
const REFERENCE_PAGE = "JOB CARD";

// ─────────────────────────────────────────────
// Doc ID Generator
// ─────────────────────────────────────────────
async function getNextDocId(branchId, shortCode, startTime, endTime) {
  const lastObject = await prisma.jobCard.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/JC/1`;

  if (lastObject) {
    const lastNo = parseInt(lastObject.docId.split("/").at(-1)) || 0;
    newDocId = `${branchObj.branchCode}/${shortCode}/JC/${lastNo + 1}`;
  }

  return newDocId;
}

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchOrderType,
    finYearId,
    searchCustomer,
  } = req.query;

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

  let data = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startTime } },
            { createdAt: { lte: finYearDate.endTime } },
          ]
        : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      orderType: searchOrderType ? { contains: searchOrderType } : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
    },
    orderBy: { id: "desc" },
  });

  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }

  let totalCount = data.length;

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );

  const jobCardIds = data.map((o) => o.id);

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
    select: {
      id: true,
      referenceId: true,
      status: true,
      remarks: true,
      currentLevel: true,
      LevelLogs: {
        select: {
          action: true,
          levelNo: true,
          userId: true,
          createdAt: true,
          User: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const approvalLogMap = approvalLogs.reduce((acc, log) => {
    acc[log.referenceId] = log;
    return acc;
  }, {});

  const activeConfigs =
    hasApproval && module
      ? await prisma.approvalConfig.findMany({
          where: {
            moduleId: module.id,
            branchId: parseInt(branchId),
            active: true,
          },
          include: {
            ConfigConditions: {
              include: { Field: true, Operator: true, CompareField: true },
            },
            approvalLevels: {
              include: { LevelUsers: true },
              orderBy: { levelNo: "asc" },
            },
          },
        })
      : [];

  let resolvedData = data.map((jobCard) => {
    const log = approvalLogMap[jobCard.id] ?? null;

    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, jobCard);
    }

    return {
      ...jobCard,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
    };
  });

  if (pagination) {
    resolvedData = resolvedData.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return { statusCode: 0, data: resolvedData, nextDocId: newDocId, totalCount };
}

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────
async function getOne(id) {
  const data = await prisma.jobCard.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
      Branch: { select: { branchName: true } },
      Plate: { select: { id: true, name: true } },
      Die: { select: { id: true, name: true } },
      boardQualities: {
        include: { Board: { select: { id: true, name: true } } },
      },
      processDetails: {
        include: { Process: { select: { id: true, name: true } } },
      },
      laminationDetails: {
        include: { Lamination: { select: { id: true, name: true } } },
      },
      varnishDetails: {
        include: { Varnish: { select: { id: true, name: true } } },
      },
      machineDetails: {
        include: { Machine: { select: { id: true, name: true } } },
      },
      processRoute: {
        include: { Process: { select: { id: true, name: true } } },
      },
    },
  });

  if (!data) return NoRecordFound("Job Card");

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    data.branchId,
  );
  let log = null;
  let shouldTrigger = false;

  if (hasApproval && module) {
    log = await prisma.approvalLog.findFirst({
      where: {
        referencePage: REFERENCE_PAGE,
        referenceId: data.id,
      },
      include: {
        LevelLogs: {
          include: {
            User: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!log) {
      const activeConfigs = await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: parseInt(data.branchId),
          active: true,
        },
        include: {
          ConfigConditions: {
            include: {
              Field: true,
              Operator: true,
              CompareField: true,
            },
          },
        },
      });

      if (activeConfigs.length > 0) {
        shouldTrigger = evaluateConfigs(activeConfigs, data);
      }
    }
  }

  return {
    statusCode: 0,
    data: {
      ...data,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      approvalLog: log,
    },
  };
}

// ─────────────────────────────────────────────
// SAFE ARRAY PARSER (NO JSON ERRORS)
// ─────────────────────────────────────────────
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (val === "undefined") return [];
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (err) {
      console.warn("⚠️ JSON Parse Failed:", val);
      return [];
    }
  }
  return [];
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────
async function create(body) {
  try {
    const {
      userId,
      branchId,
      finYearId,
      docDate,
      orderEntryId,
      proformaInvoiceId, // ✅ added back
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoard,
      noOfPockets,
      cuttingSize,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlateSet,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
    } = body;

    const safeBoardItems = safeArray(boardItems);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);

    console.log("✅ SAFE ARRAYS:");
    console.log({
      safeBoardItems,
      safeProcesses,
      safeLaminations,
      safeVarnishes,
      safeMachines,
    });

    let finYearDate = await getFinYearStartTimeEndTime(finYearId);

    const shortCode = finYearDate
      ? getYearShortCodeForFinYear(
          finYearDate.startDateStartTime,
          finYearDate.endDateEndTime,
        )
      : "";

    const newDocId = await getNextDocId(
      branchId,
      shortCode,
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    );

    console.log("📄 NEW DOC ID:", newDocId);

    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );

    let data;

    await prisma.$transaction(async (tx) => {
      data = await tx.jobCard.create({
        data: {
          docId: newDocId,
          docDate: docDate ? new Date(docDate) : null,

          createdBy: userId ? { connect: { id: Number(userId) } } : undefined,
          Branch: branchId ? { connect: { id: Number(branchId) } } : undefined,

          OrderEntry: orderEntryId
            ? { connect: { id: Number(orderEntryId) } }
            : undefined,
          ProformaInvoice: proformaInvoiceId
            ? { connect: { id: Number(proformaInvoiceId) } }
            : undefined,
          orderType: orderType || null,
          orderQty: orderQty ? Number(orderQty) : null,
          customer: customerId
            ? { connect: { id: Number(customerId) } }
            : undefined,

          gsm: gsmId ? { connect: { id: Number(gsmId) } } : undefined,
          Board: boardId ? { connect: { id: Number(boardId) } } : undefined,

          fullBoard: fullBoard ? Number(fullBoard) : null,
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          cuttingSize: cuttingSize || null,
          runningQty: runningQty ? Number(runningQty) : null,

          isFourColor: !!isFourColor,
          isCutColor: !!isCutColor,
          isFront: !!isFront,
          isFrontAndBack: !!isFrontAndBack,

          isCMYK: !!isCMYK,
          isCutColMachine: !!isCutColMachine,
          isFrontMachine: !!isFrontMachine,
          isFrontBackMachine: !!isFrontBackMachine,

          Plate: plateId ? { connect: { id: Number(plateId) } } : undefined,
          Die: dieId ? { connect: { id: Number(dieId) } } : undefined,
          totalPlateSet: totalPlateSet ? Number(totalPlateSet) : null,

          remarks: remarks || null,
          Designer: designerId
            ? { connect: { id: Number(designerId) } }
            : undefined,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,

          boardQualities: safeBoardItems.length
            ? {
                create: safeBoardItems.map((id) => ({
                  boardId: Number(id),
                })),
              }
            : undefined,

          processDetails: safeProcesses.length
            ? {
                create: safeProcesses.map((id) => ({
                  processId: Number(id),
                })),
              }
            : undefined,

          laminationDetails: safeLaminations.length
            ? {
                create: safeLaminations.map((l) => ({
                  laminationId: Number(l.processId),
                  isFront: !!l.isFront,
                  isFrontAndBack: !!l.isFrontAndBack,
                })),
              }
            : undefined,

          varnishDetails: safeVarnishes.length
            ? {
                create: safeVarnishes.map((v) => ({
                  varnishId: Number(v.processId),
                  isFront: !!v.isFront,
                  isFrontAndBack: !!v.isFrontAndBack,
                })),
              }
            : undefined,

          machineDetails: safeMachines.length
            ? {
                create: safeMachines.map((id) => ({
                  machineId: Number(id),
                })),
              }
            : undefined,

          processRoute: safeProcessRoute.length
            ? {
                create: safeProcessRoute.map((r, idx) => ({
                  processId: Number(r.processId),
                  type: r.type,
                  sequence: idx + 1,
                  isFront: !!r.isFront,
                  isFrontAndBack: !!r.isFrontAndBack,
                })),
              }
            : undefined,
        },
      });

      if (hasApproval && module) {
        const includeClause = await buildIncludeForModule(module.id);

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: data.id },
          include: includeClause,
        });

        await createApprovalLog(
          tx,
          branchId,
          module.id,
          data.id,
          REFERENCE_PAGE,
          fullRecord,
          data.docId,
          userId,
        );
      }
    });

    console.log("✅ CREATED SUCCESS:", data);

    return { statusCode: 0, data };
  } catch (err) {
    console.error("❌ SERVICE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
async function update(id, body) {
  try {
    const {
      userId,
      branchId,
      docDate,
      orderEntryId,
      proformaInvoiceId, // ✅ added back
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoard,
      noOfPockets,
      cuttingSize,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlateSet,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      submitApproval,
    } = body;

    const dataFound = await prisma.jobCard.findUnique({
      where: { id: parseInt(id) },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );

    let data;
    await prisma.$transaction(async (tx) => {
      await tx.boardQuality.deleteMany({ where: { jobCardId: parseInt(id) } });
      await tx.processDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.laminationDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.varnishDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.machineDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.processRoute.deleteMany({ where: { jobCardId: parseInt(id) } });

      data = await tx.jobCard.update({
        where: { id: parseInt(id) },
        data: {
          docDate: docDate ? new Date(docDate) : null,
          updatedBy: userId ? { connect: { id: parseInt(userId) } } : undefined,
          Branch: branchId ? { connect: { id: parseInt(branchId) } } : undefined,
          OrderEntry: orderEntryId
            ? { connect: { id: parseInt(orderEntryId) } }
            : undefined,
          ProformaInvoice: proformaInvoiceId
            ? { connect: { id: parseInt(proformaInvoiceId) } }
            : undefined,
          orderType: orderType || null,
          orderQty: orderQty ? parseInt(orderQty) : null,
          customer: customerId
            ? { connect: { id: parseInt(customerId) } }
            : undefined,
          gsm: gsmId ? { connect: { id: parseInt(gsmId) } } : undefined,
          Board: boardId ? { connect: { id: parseInt(boardId) } } : undefined,
          fullBoard: fullBoard ? parseInt(fullBoard) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSize: cuttingSize || null,
          runningQty: runningQty ? parseInt(runningQty) : null,
          isFourColor: Boolean(isFourColor),
          isCutColor: Boolean(isCutColor),
          isFront: Boolean(isFront),
          isFrontAndBack: Boolean(isFrontAndBack),
          isCMYK: Boolean(isCMYK),
          isCutColMachine: Boolean(isCutColMachine),
          isFrontMachine: Boolean(isFrontMachine),
          isFrontBackMachine: Boolean(isFrontBackMachine),
          Plate: plateId ? { connect: { id: parseInt(plateId) } } : undefined,
          Die: dieId ? { connect: { id: parseInt(dieId) } } : undefined,
          totalPlateSet: totalPlateSet ? parseInt(totalPlateSet) : null,
          remarks: remarks || null,
          Designer: designerId
            ? { connect: { id: parseInt(designerId) } }
            : undefined,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,

          boardQualities:
            boardItems.length > 0
              ? {
                  create: boardItems.map((bId) => ({
                    boardId: parseInt(bId),
                  })),
                }
              : undefined,

          processDetails:
            selectedProcesses.length > 0
              ? {
                  create: selectedProcesses.map((pId) => ({
                    processId: parseInt(pId),
                  })),
                }
              : undefined,

          laminationDetails:
            laminations.length > 0
              ? {
                  create: laminations.map((l) => ({
                    laminationId: parseInt(l.processId),
                    isFront: Boolean(l.isFront),
                    isFrontAndBack: Boolean(l.isFrontAndBack),
                  })),
                }
              : undefined,

          varnishDetails:
            varnishes.length > 0
              ? {
                  create: varnishes.map((v) => ({
                    varnishId: parseInt(v.processId),
                    isFront: Boolean(v.isFront),
                    isFrontAndBack: Boolean(v.isFrontAndBack),
                  })),
                }
              : undefined,

          machineDetails:
            selectedMachines.length > 0
              ? {
                  create: selectedMachines.map((mId) => ({
                    machineId: parseInt(mId),
                  })),
                }
              : undefined,

          processRoute: processRoute.length
            ? {
                create: processRoute.map((r, idx) => ({
                  processId: parseInt(r.processId),
                  type: r.type,
                  sequence: idx + 1,
                  isFront: Boolean(r.isFront),
                  isFrontAndBack: Boolean(r.isFrontAndBack),
                })),
              }
            : undefined,
        },
      });

      if (submitApproval && hasApproval && module) {
        await tx.approvalLog.deleteMany({
          where: {
            referenceId: parseInt(id),
            referencePage: REFERENCE_PAGE,
            status: { in: ["REJECTED", "NOTAPPROVED"] },
          },
        });

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: parseInt(id) },
          include: await buildIncludeForModule(module.id),
        });

        await createApprovalLog(
          tx,
          branchId,
          module.id,
          data.id,
          REFERENCE_PAGE,
          fullRecord,
          data.docId,
          userId,
        );
      }
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function remove(id) {
  try {
    const jobCardId = parseInt(id);
    await prisma.approvalLog.deleteMany({
      where: { referencePage: REFERENCE_PAGE, referenceId: jobCardId },
    });

    const dataFound = await prisma.jobCard.findUnique({
      where: { id: jobCardId },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    const data = await prisma.jobCard.delete({
      where: { id: jobCardId },
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────
export { get, getOne, create, update, remove };
