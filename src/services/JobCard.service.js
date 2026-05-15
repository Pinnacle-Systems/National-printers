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

// -------------------------------------------------------------
// Doc ID Generator
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// GET ALL
// -------------------------------------------------------------
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
      OrderEntry: { select: { id: true, docId: true } },
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

// -------------------------------------------------------------
// GET ONE
// -------------------------------------------------------------
async function getOne(id) {
  const data = await prisma.jobCard.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          address: true,
          gstNo: true,
          contactMobile: true,
          contactNumber: true,
          contactPersonName: true,
        },
      },
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
        include: { Mac: { select: { id: true, name: true } } },
      },
      printingDetails: {
        include: { Process: { select: { id: true, name: true } } },
      },
      finishingProcesses: {
        include: { Process: { select: { id: true, name: true } } },
      },
      plateDetails: true,
      processRoute: {
        include: { Process: { select: { id: true, name: true } } },
      },
      LabelSize: { select: { id: true, name: true } },
      FullBoardSize: { select: { id: true, name: true } },
      CuttingSizeDtl: { select: { id: true, name: true } },
      Designer: { select: { id: true, name: true } },
      FollowUp: { select: { id: true, name: true } },
      OrderEntryItem: {
        include: {
          StyleItem: { select: { name: true } },
          ItemGroup: { select: { name: true } },
          sizeBreakup: {
            include: { Size: { select: { id: true, name: true } } },
          },
        },
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

// -------------------------------------------------------------
// SAFE ARRAY PARSER
// -------------------------------------------------------------
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (!val || val === "undefined") return [];
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (err) {
      console.warn("JSON Parse Failed:", val);
      return [];
    }
  }
  return [];
}

// -------------------------------------------------------------
// CREATE
// -------------------------------------------------------------
async function create(body) {
  try {
    const {
      userId,
      branchId,
      finYearId,
      docDate,
      orderEntryId,
      proformaInvoiceId,
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
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
      followUpId,
      tagCardUps,
      jobRunTime,
      department,
      itemGroup,
      orderEntryItemId,
      styleItemId,
      labelQuality,
      labelBlock,
      labelRollQty,
      labelCutAndSeal,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      selectedPrinting,
      selectedFinishing,
      plateDetails,
      labelSizeId,
      totalMeter,
      submitApproval,
    } = body;

    const safeBoardItems = safeArray(boardItems);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safePrinting = safeArray(selectedPrinting);
    const safeFinishing = safeArray(selectedFinishing);
    const safePlateDetails = safeArray(plateDetails);

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
          OrderEntry: orderEntryId ? { connect: { id: Number(orderEntryId) } } : undefined,
          ProformaInvoice: proformaInvoiceId ? { connect: { id: Number(proformaInvoiceId) } } : undefined,
          orderType: orderType || null,
          orderQty: orderQty ? Number(orderQty) : null,
          customer: customerId ? { connect: { id: Number(customerId) } } : undefined,
          gsm: gsmId ? { connect: { id: Number(gsmId) } } : undefined,
          Board: boardId ? { connect: { id: Number(boardId) } } : undefined,
          FullBoardSize: fullBoardId ? { connect: { id: Number(fullBoardId) } } : undefined,
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          CuttingSizeDtl: cuttingSizeId ? { connect: { id: Number(cuttingSizeId) } } : undefined,
          LabelSize: labelSizeId ? { connect: { id: Number(labelSizeId) } } : undefined,
          totalMeter: totalMeter ? Number(totalMeter) : null,
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
          Designer: designerId ? { connect: { id: Number(designerId) } } : undefined,
          FollowUp: followUpId ? { connect: { id: Number(followUpId) } } : undefined,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime ? Number(jobRunTime) : null,
          department: department || null,
          itemGroup: itemGroup || null,
          OrderEntryItem: orderEntryItemId ? { connect: { id: Number(orderEntryItemId) } } : undefined,
          StyleItem: styleItemId ? { connect: { id: Number(styleItemId) } } : undefined,
          labelQuality: labelQuality || null,
          labelBlock: labelBlock || null,
          labelRollQty: labelRollQty || null,
          labelCutAndSeal: labelCutAndSeal || null,

          boardQualities: safeBoardItems.length ? {
            create: safeBoardItems.map((id) => ({ boardId: Number(id) })),
          } : undefined,

          processDetails: safeProcesses.length ? {
            create: safeProcesses.map((id) => ({ processId: Number(id) })),
          } : undefined,

          laminationDetails: safeLaminations.length ? {
            create: safeLaminations.map((l) => ({
              laminationId: Number(l.processId),
              isFront: !!l.isFront,
              isFrontAndBack: !!l.isFrontAndBack,
            })),
          } : undefined,

          varnishDetails: safeVarnishes.length ? {
            create: safeVarnishes.map((v) => ({
              varnishId: Number(v.processId),
              isFront: !!v.isFront,
              isFrontAndBack: !!v.isFrontAndBack,
            })),
          } : undefined,

          machineDetails: safeMachines.length ? {
            create: safeMachines.map((id) => ({ macId: Number(id) })),
          } : undefined,

          processRoute: safeProcessRoute.length ? {
            create: safeProcessRoute.map((r, idx) => ({
              processId: Number(r.processId),
              type: r.type,
              sequence: idx + 1,
              isFront: !!r.isFront,
              isFrontAndBack: !!r.isFrontAndBack,
            })),
          } : undefined,

          printingDetails: safePrinting.length ? {
            create: safePrinting.map((id) => ({ processId: Number(id) })),
          } : undefined,

          finishingProcesses: safeFinishing.length ? {
            create: safeFinishing.map((id) => ({ processId: Number(id) })),
          } : undefined,

          plateDetails: safePlateDetails.length ? {
            create: safePlateDetails.map((p) => ({
              plateName: p.plateName,
              qty: Number(p.qty),
            })),
          } : undefined,
        },
      });

      if (submitApproval && hasApproval && module) {
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

    return { statusCode: 0, data };
  } catch (err) {
    console.error("CREATE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

async function update(id, body) {
  try {
    const {
      userId,
      branchId,
      docDate,
      orderEntryId,
      proformaInvoiceId,
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
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
      followUpId,
      tagCardUps,
      jobRunTime,
      department,
      itemGroup,
      orderEntryItemId,
      styleItemId,
      labelQuality,
      labelBlock,
      labelRollQty,
      labelCutAndSeal,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      selectedPrinting,
      selectedFinishing,
      plateDetails,
      labelSizeId,
      totalMeter,
      submitApproval,
    } = body;

    const safeBoardItems = safeArray(boardItems);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safePrinting = safeArray(selectedPrinting);
    const safeFinishing = safeArray(selectedFinishing);
    const safePlateDetails = safeArray(plateDetails);

    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );

    let data;

    await prisma.$transaction(async (tx) => {
      const jcId = parseInt(id);

      // Delete old relations
      await tx.boardQuality.deleteMany({ where: { jobCardId: jcId } });
      await tx.processDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.laminationDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.varnishDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.machineDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.processRoute.deleteMany({ where: { jobCardId: jcId } });
      await tx.printingDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.finishingProcess.deleteMany({ where: { jobCardId: jcId } });
      await tx.plateDetails.deleteMany({ where: { jobCardId: jcId } });

      data = await tx.jobCard.update({
        where: { id: jcId },
        data: {
          docDate: docDate ? new Date(docDate) : null,
          updatedBy: userId ? { connect: { id: Number(userId) } } : undefined,
          OrderEntry: orderEntryId ? { connect: { id: Number(orderEntryId) } } : { disconnect: true },
          ProformaInvoice: proformaInvoiceId ? { connect: { id: Number(proformaInvoiceId) } } : { disconnect: true },
          orderType: orderType || null,
          orderQty: orderQty ? Number(orderQty) : null,
          customer: customerId ? { connect: { id: Number(customerId) } } : { disconnect: true },
          gsm: gsmId ? { connect: { id: Number(gsmId) } } : { disconnect: true },
          Board: boardId ? { connect: { id: Number(boardId) } } : { disconnect: true },
          FullBoardSize: fullBoardId ? { connect: { id: Number(fullBoardId) } } : { disconnect: true },
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          CuttingSizeDtl: cuttingSizeId ? { connect: { id: Number(cuttingSizeId) } } : { disconnect: true },
          LabelSize: labelSizeId ? { connect: { id: Number(labelSizeId) } } : { disconnect: true },
          totalMeter: totalMeter ? Number(totalMeter) : null,
          runningQty: runningQty ? Number(runningQty) : null,
          isFourColor: !!isFourColor,
          isCutColor: !!isCutColor,
          isFront: !!isFront,
          isFrontAndBack: !!isFrontAndBack,
          isCMYK: !!isCMYK,
          isCutColMachine: !!isCutColMachine,
          isFrontMachine: !!isFrontMachine,
          isFrontBackMachine: !!isFrontBackMachine,
          Plate: plateId ? { connect: { id: Number(plateId) } } : { disconnect: true },
          Die: dieId ? { connect: { id: Number(dieId) } } : { disconnect: true },
          totalPlateSet: totalPlateSet ? Number(totalPlateSet) : null,
          remarks: remarks || null,
          Designer: designerId ? { connect: { id: Number(designerId) } } : { disconnect: true },
          FollowUp: followUpId ? { connect: { id: Number(followUpId) } } : { disconnect: true },
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime ? Number(jobRunTime) : null,
          department: department || null,
          itemGroup: itemGroup || null,
          OrderEntryItem: orderEntryItemId ? { connect: { id: Number(orderEntryItemId) } } : { disconnect: true },
          StyleItem: styleItemId ? { connect: { id: Number(styleItemId) } } : { disconnect: true },
          labelQuality: labelQuality || null,
          labelBlock: labelBlock || null,
          labelRollQty: labelRollQty || null,
          labelCutAndSeal: labelCutAndSeal || null,

          boardQualities: safeBoardItems.length ? {
            create: safeBoardItems.map((id) => ({ boardId: Number(id) })),
          } : undefined,

          processDetails: safeProcesses.length ? {
            create: safeProcesses.map((id) => ({ processId: Number(id) })),
          } : undefined,

          laminationDetails: safeLaminations.length ? {
            create: safeLaminations.map((l) => ({
              laminationId: Number(l.processId),
              isFront: !!l.isFront,
              isFrontAndBack: !!l.isFrontAndBack,
            })),
          } : undefined,

          varnishDetails: safeVarnishes.length ? {
            create: safeVarnishes.map((v) => ({
              varnishId: Number(v.processId),
              isFront: !!v.isFront,
              isFrontAndBack: !!v.isFrontAndBack,
            })),
          } : undefined,

          machineDetails: safeMachines.length ? {
            create: safeMachines.map((id) => ({ macId: Number(id) })),
          } : undefined,

          processRoute: safeProcessRoute.length ? {
            create: safeProcessRoute.map((r, idx) => ({
              processId: Number(r.processId),
              type: r.type,
              sequence: idx + 1,
              isFront: !!r.isFront,
              isFrontAndBack: !!r.isFrontAndBack,
            })),
          } : undefined,

          printingDetails: safePrinting.length ? {
            create: safePrinting.map((id) => ({ processId: Number(id) })),
          } : undefined,

          finishingProcesses: safeFinishing.length ? {
            create: safeFinishing.map((id) => ({ processId: Number(id) })),
          } : undefined,

          plateDetails: safePlateDetails.length ? {
            create: safePlateDetails.map((p) => ({
              plateName: p.plateName,
              qty: Number(p.qty),
            })),
          } : undefined,
        },
      });

      if (submitApproval && hasApproval && module) {
        await tx.approvalLog.deleteMany({
          where: {
            referenceId: jcId,
            referencePage: REFERENCE_PAGE,
            status: { in: ["REJECTED", "NOTAPPROVED"] },
          },
        });

        const includeClause = await buildIncludeForModule(module.id);
        const fullRecord = await tx.jobCard.findUnique({
          where: { id: jcId },
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

    return { statusCode: 0, data };
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

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
    return { statusCode: 1, message: err.message };
  }
}

async function getJobCardList(req) {
  const { branchId } = req.query;

  let result = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
    },
    select: {
      id: true,
      docId: true,
      orderQty: true,
      styleItemId: true,
      OrderEntryItem: {
        select: {
          styleItemId: true,
        },
      },
      customer: { select: { name: true } },
      processRoute: {
        include: {
          Process: {
            select: {
              name: true,
              isOutSide: true,
            },
          },
        },
      },
      OrderEntry: { select: { docId: true } },
    },
    orderBy: {
      docId: "desc",
    },
  });

  const data = result.map((item) => ({
    id: item.id,
    docId: item.docId,
    orderQty: item.orderQty,
    styleItemId: item.styleItemId || item.OrderEntryItem?.styleItemId || null,
    customerName: item.customer?.name || "",
    orderEntryDocId: item.OrderEntry?.docId || "",
    processRoute: item.processRoute || [],
  }));

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove, getJobCardList };
