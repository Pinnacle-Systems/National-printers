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
      labelPrintingDetails: true,

      LabelSize: { select: { id: true, name: true } },
      FullBoardSize: { select: { id: true, name: true } },
      CuttingSizeDtl: { select: { id: true, name: true } },
      Designer: { select: { id: true, name: true } },
      FollowUp: { select: { id: true, name: true } },
      OrderEntry: {
        select: {
          id:true,docId:true,
          orderItems: {
            include: {
              StyleItem: { select: { name: true } },
              ItemGroup: { select: { name: true } },
              sizeBreakup: {
                include: { Size: { select: { id: true, name: true } } },
              },
            },
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

      submitApproval,
      // arrays

      boardQualities,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      trackingType,
      jobCardSizeDetails,
      selectedPrinting,
      selectedFinishing,
      orderItemId,
      plateDetails,
      labelSizeId,
      totalMeter,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
      splitType,
      storeId,
      selectedLabelPrinting,
      labelItemId,
      colorId,
      isHold,
      isCancelled,
      isNewPlate,
      isOldPlate,

      jobCardType,
      orderBranchId,
      dieDescription,
      dieMethod,
      lenght,
      width,
      meter,
      plateSupplierId,
      itemType,
      rollQty,
      itemGroupId,
    } = body;

    const safeBoardItems = safeArray(boardQualities);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safeJobCardSizeDetails = safeArray(jobCardSizeDetails);
    const safeSelectedPrinting = safeArray(selectedPrinting);
    const safePlateDetails = safeArray(plateDetails);
    const safeLabelPrintingDetails = safeArray(selectedLabelPrinting);
    const safeFinishingDetails = safeArray(selectedFinishing);

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
          OrderEntry: orderEntryId
            ? { connect: { id: Number(orderEntryId) } }
            : undefined,
          ProformaInvoice: proformaInvoiceId
            ? { connect: { id: Number(proformaInvoiceId) } }
            : undefined,
          orderType: orderType || null,
          jobCardType: jobCardType,
          OrderBranch: orderBranchId
            ? { connect: { id: Number(orderBranchId) } }
            : undefined,
          orderQty: orderQty ? Number(orderQty) : null,
          customer: customerId
            ? { connect: { id: Number(customerId) } }
            : undefined,
          gsm: gsmId ? { connect: { id: Number(gsmId) } } : undefined,
          Board: boardId ? { connect: { id: Number(boardId) } } : undefined,
          FullBoardSize: fullBoardId
            ? { connect: { id: Number(fullBoardId) } }
            : undefined,
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          CuttingSizeDtl: cuttingSizeId
            ? { connect: { id: Number(cuttingSizeId) } }
            : undefined,
          LabelSize: labelSizeId
            ? { connect: { id: Number(labelSizeId) } }
            : undefined,
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
          trackingType: trackingType || null,
          blockDate: blockDate ? new Date(blockDate) : null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          RefJobCard: refJobCardId
            ? { connect: { id: Number(refJobCardId) } }
            : undefined,
          Designer: designerId
            ? { connect: { id: Number(designerId) } }
            : undefined,
          FollowUp: followUpId
            ? { connect: { id: Number(followUpId) } }
            : undefined,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime ? Number(jobRunTime) : null,
          department: department || null,
          itemGroup: itemGroup || null,
          OrderEntryItem: orderItemId
            ? { connect: { id: Number(orderItemId) } }
            : { disconnect: true },
          StyleItem: styleItemId
            ? { connect: { id: Number(styleItemId) } }
            : undefined,
          labelQuality: labelQuality || null,
          labelBlock: labelBlock || null,
          labelRollQty: labelRollQty || null,
          labelCutAndSeal: labelCutAndSeal || null,
          splitType: splitType || null,
          Store: storeId ? { connect: { id: Number(storeId) } } : undefined,
          LabelItem: labelItemId
            ? { connect: { id: Number(labelItemId) } }
            : undefined,
          Color: colorId ? { connect: { id: Number(colorId) } } : undefined,
          dieDescription: dieDescription ?? null,
          dieMethod: dieMethod ?? null,
          isHold: isHold ?? false,
          isCancelled: isCancelled ?? false,
          lenght: lenght ? parseInt(lenght) : 0,
          width: width ? parseInt(width) : 0,
          meter: meter ? parseInt(meter) : 0,
          isNewPlate: !!isNewPlate,
          isOldPlate: !!isOldPlate,
          PlateSupplier: plateSupplierId
            ? { connect: { id: Number(plateSupplierId) } }
            : undefined,
          itemType: itemType || null,
          rollQty: rollQty ? parseInt(rollQty) : 0,
          boardQualities: safeBoardItems.length
            ? {
                createMany: {
                  data: safeBoardItems.map((item) => ({
                    processId: Number(item.processId),
                    gsmId: Number(item.gsmId),
                    fullBoardId: Number(item.fullBoardId),
                    noOfSheets: Number(item.noOfSheets),
                  })),
                },
              }
            : undefined,

          printingDetails: safeSelectedPrinting.length
            ? {
                createMany: {
                  data: safeSelectedPrinting.map((p) => ({
                    processId: Number(p.processId),
                    isFront: !!p.isFront,
                    isFrontAndBack: !!p.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          plateDetails: safePlateDetails.length
            ? {
                createMany: {
                  data: safePlateDetails.map((p) => ({
                    plateId: p.plateId ? parseInt(p.plateId) : null,
                    machineId: p.machineId ? parseInt(p.machineId) : null,
                    plateName: p.plateName ?? "",
                    description: p.description ?? "",
                    qty: p.qty ? Number(p.qty) : null,
                  })),
                },
              }
            : undefined,

          processDetails: safeProcesses.length
            ? {
                createMany: {
                  data: safeProcesses.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          laminationDetails: safeLaminations.length
            ? {
                createMany: {
                  data: safeLaminations.map((l) => ({
                    laminationId: Number(l.processId),
                    isFront: !!l.isFront,
                    isFrontAndBack: !!l.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          varnishDetails: safeVarnishes.length
            ? {
                createMany: {
                  data: safeVarnishes.map((v) => ({
                    varnishId: Number(v.processId),
                    isFront: !!v.isFront,
                    isFrontAndBack: !!v.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          machineDetails: safeMachines.length
            ? {
                createMany: {
                  data: safeMachines.map((id) => ({
                    macId: Number(id),
                  })),
                },
              }
            : undefined,

          processRoute: safeProcessRoute.length
            ? {
                createMany: {
                  data: safeProcessRoute.map((r, idx) => ({
                    processId: r.processId ? Number(r.processId) : null,
                    type: r.type,
                    sequence: idx + 1,
                    isFront: !!r.isFront,
                    isFrontAndBack: !!r.isFrontAndBack,
                    status: "NOT_STARTED",
                  })),
                },
              }
            : undefined,

          // jobCardSizeDetails: safeJobCardSizeDetails.length
          //   ? {
          //       createMany: {
          //         data: safeJobCardSizeDetails.map((s) => ({
          //           sizeId: s.sizeId ? Number(s.sizeId) : null,
          //           qty: s.qty ? Number(s.qty) : null,
          //           barcodeFrom: s.barcodeFrom || null,
          //           barcodeTo: s.barcodeTo || null,
          //         })),
          //       },
          //     }
          //   : undefined,

          finishingProcesses: safeFinishingDetails.length
            ? {
                createMany: {
                  data: safeFinishingDetails.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          labelPrintingDetails: safeLabelPrintingDetails.length
            ? {
                createMany: {
                  data: safeLabelPrintingDetails.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,
        },
      });
      if (itemType !== "LABEL") {
        for (const boardQuality of boardQualities) {
          const process = await tx.process.findUnique({
            where: {
              id: Number(boardQuality.processId),
            },
            select: {
              name: true,
            },
          });

          if (!process) {
            throw new Error("Board process not found");
          }
          const styleItem = await tx.styleItem.findFirst({
            where: {
              name: process.name,
            },
            select: {
              id: true,
              uomId: true,
            },
          });

          if (!styleItem) {
            throw new Error(`Style Item not found for process ${process.name}`);
          }
          await tx.stock.create({
            data: {
              branchId: branchId ? parseInt(branchId) : undefined,
              storeId: parseInt(storeId),
              styleItemId: parseInt(styleItem.id),
              gsmId: parseInt(boardQuality.gsmId),
              sizeId: parseInt(boardQuality.fullBoardId),
              inOrOut: "Out",
              qty:
                boardQuality?.noOfSheets &&
                !isNaN(parseFloat(boardQuality.noOfSheets))
                  ? -Math.abs(parseInt(boardQuality.noOfSheets))
                  : null,
              uomId: parseInt(styleItem.uomId),
              createdById: parseInt(userId),
              itemGroupId: parseInt(itemGroupId),
              jobCardId: parseInt(data.id),
              processName: "Job Card",
            },
          });
        }
      } else {
        const styleItem = await tx.styleItem.findUnique({
          where: {
            id: parseInt(labelItemId),
          },
          select: {
            id: true,
            uomId: true,
          },
        });

        await tx.stock.create({
          data: {
            branchId: branchId ? parseInt(branchId) : undefined,
            storeId: parseInt(storeId),
            styleItemId: parseInt(labelItemId),
            sizeId: parseInt(labelSizeId),
            inOrOut: "Out",
            qty:
              rollQty && !isNaN(parseFloat(rollQty))
                ? -Math.abs(parseFloat(rollQty))
                : null,
            uomId: parseInt(styleItem.uomId),
            createdById: parseInt(userId),
            itemGroupId: parseInt(itemGroupId),
            jobCardId: parseInt(data.id),
            processName: "Job Card",
            colorId: parseInt(colorId),
          },
        });
      }
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
      orderItemId,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
      splitType,
      storeId,
      selectedLabelPrinting,
      labelItemId,
      colorId,
      isHold,
      isCancelled,
      isNewPlate,
      isOldPlate,
      jobCardType,
      orderBranchId,
      dieDescription,
      dieMethod,
      lenght,
      width,
      meter,
      plateSupplierId,
      jobCardSizeDetails,
      trackingType,
      boardQualities,
      itemType,
      rollQty,
      itemGroupId,
    } = body;

    const safeBoardItems = safeArray(boardQualities);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safePrinting = safeArray(selectedPrinting);
    const safeFinishing = safeArray(selectedFinishing);
    const safePlateDetails = safeArray(plateDetails);
    const safeJobCardSizeDetails = safeArray(jobCardSizeDetails);
    const safeLabelPrintingDetails = safeArray(selectedLabelPrinting);

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
      await tx.printingDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.finishingProcess.deleteMany({ where: { jobCardId: jcId } });
      await tx.plateDetails.deleteMany({ where: { jobCardId: jcId } });
      await tx.labelPrintingDetails.deleteMany({ where: { jobCardId: jcId } });
      if (itemType !== "LABEL") {
        await tx.stock.deleteMany({
          where: {
            jobCardId: parseInt(id),
          },
        });
      }

      if (processRoute.length > 0) {
        // Fetch current DB rows for this job card
        const existingRouteRows = await tx.processRoute.findMany({
          where: { jobCardId: parseInt(id) },
          select: {
            id: true,
            processId: true,
            type: true,
            isFront: true,
            isFrontAndBack: true,
          },
        });

        // Build a lookup key identical to the frontend: "type:processId[:sub]"
        const makeRouteKey = (type, processId, isFront, isFrontAndBack) => {
          const sub = isFrontAndBack ? "frontback" : isFront ? "front" : "";
          return `${type}:${processId}${sub ? `:${sub}` : ""}`;
        };

        const existingKeyToRow = {};
        existingRouteRows.forEach((row) => {
          existingKeyToRow[
            makeRouteKey(
              row.type,
              row.processId,
              row.isFront,
              row.isFrontAndBack,
            )
          ] = row;
        });

        // Build desired key set from the incoming payload
        const incomingKeyToRoute = {};
        processRoute.forEach((r, idx) => {
          const key = makeRouteKey(
            r.type,
            Number(r.processId),
            Boolean(r.isFront),
            Boolean(r.isFrontAndBack),
          );
          incomingKeyToRoute[key] = { ...r, sequence: idx + 1 };
        });

        // Delete rows that are no longer in the incoming payload
        const keysToDelete = Object.keys(existingKeyToRow).filter(
          (k) => !incomingKeyToRoute[k],
        );
        if (keysToDelete.length > 0) {
          const idsToDelete = keysToDelete.map((k) => existingKeyToRow[k].id);
          await tx.processRoute.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Update sequence on rows that already exist (keep status/completedQty untouched)
        const keysToUpdate = Object.keys(incomingKeyToRoute).filter(
          (k) => existingKeyToRow[k],
        );
        for (const key of keysToUpdate) {
          await tx.processRoute.update({
            where: { id: existingKeyToRow[key].id },
            data: { sequence: incomingKeyToRoute[key].sequence },
          });
        }

        // Insert rows that are new
        const keysToInsert = Object.keys(incomingKeyToRoute).filter(
          (k) => !existingKeyToRow[k],
        );
        if (keysToInsert.length > 0) {
          await tx.processRoute.createMany({
            data: keysToInsert.map((k) => {
              const r = incomingKeyToRoute[k];
              return {
                jobCardId: parseInt(id),
                processId: r.processId ? Number(r.processId) : null,
                type: r.type,
                sequence: r.sequence,
                isFront: Boolean(r.isFront),
                isFrontAndBack: Boolean(r.isFrontAndBack),
                status: "NOT_STARTED",
              };
            }),
          });
        }
      } else {
        // Incoming payload has no routes — delete all existing rows
        await tx.processRoute.deleteMany({
          where: { jobCardId: parseInt(id) },
        });
      }
      // if (isAmendment) {
      //   const allocation = await tx.productionAllocation.findFirst({
      //     where: { jobCardId: parseInt(id) },
      //     select: {
      //       id: true,
      //       allocationDetails: {
      //         select: { id: true, processId: true, type: true },
      //       },
      //     },
      //   });

      //   if (allocation) {
      //     // Build a sequence lookup from the (now-synced) incoming processRoute
      //     // key: "type:processId"  →  value: sequence (1-based)
      //     const existingDtlMap = {};
      //     allocation.allocationDetails.forEach((d) => {
      //       existingDtlMap[`${d.type}:${d.processId}`] = d;
      //     });

      //     const incomingDtlMap = {};
      //     processRoute.forEach((r, idx) => {
      //       incomingDtlMap[`${r.type}:${r.processId}`] = {
      //         ...r,
      //         sequence: idx + 1,
      //       };
      //     });

      //     // DELETE removed rows
      //     const deleteIds = Object.keys(existingDtlMap)
      //       .filter((k) => !incomingDtlMap[k])
      //       .map((k) => existingDtlMap[k].id);

      //     if (deleteIds.length) {
      //       await tx.productionAllocationDtl.deleteMany({
      //         where: { id: { in: deleteIds } },
      //       });
      //     }

      //     // UPDATE existing
      //     for (const key of Object.keys(incomingDtlMap)) {
      //       if (existingDtlMap[key]) {
      //         await tx.productionAllocationDtl.update({
      //           where: { id: existingDtlMap[key].id },
      //           data: {
      //             sequence: incomingDtlMap[key].sequence,
      //           },
      //         });
      //       }
      //     }

      //     // INSERT new
      //     const insertRows = Object.keys(incomingDtlMap)
      //       .filter((k) => !existingDtlMap[k])
      //       .map((k) => ({
      //         productionAllocationId: allocation.id,
      //         processId: incomingDtlMap[k].processId,
      //         type: incomingDtlMap[k].type,
      //         sequence: incomingDtlMap[k].sequence,
      //         isInHouse: true,
      //         isOutSide: false,
      //       }));

      //     if (insertRows.length) {
      //       await tx.productionAllocationDtl.createMany({
      //         data: insertRows,
      //       });
      //     }
      //   }
      // }
      data = await tx.jobCard.update({
        where: { id: jcId },
        data: {
          docDate: docDate ? new Date(docDate) : null,
          updatedBy: userId ? { connect: { id: Number(userId) } } : undefined,
          OrderEntry: orderEntryId
            ? { connect: { id: Number(orderEntryId) } }
            : { disconnect: true },
          ProformaInvoice: proformaInvoiceId
            ? { connect: { id: Number(proformaInvoiceId) } }
            : { disconnect: true },
          orderType: orderType || null,
          orderQty: orderQty ? Number(orderQty) : null,
          customer: customerId
            ? { connect: { id: Number(customerId) } }
            : { disconnect: true },
          gsm: gsmId
            ? { connect: { id: Number(gsmId) } }
            : { disconnect: true },
          Board: boardId
            ? { connect: { id: Number(boardId) } }
            : { disconnect: true },
          FullBoardSize: fullBoardId
            ? { connect: { id: Number(fullBoardId) } }
            : { disconnect: true },
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          CuttingSizeDtl: cuttingSizeId
            ? { connect: { id: Number(cuttingSizeId) } }
            : { disconnect: true },
          LabelSize: labelSizeId
            ? { connect: { id: Number(labelSizeId) } }
            : { disconnect: true },
          totalMeter: totalMeter ? Number(totalMeter) : null,
          runningQty: runningQty ? Number(runningQty) : null,
          jobCardType: jobCardType,
          OrderBranch: orderBranchId
            ? { connect: { id: Number(orderBranchId) } }
            : { disconnect: true },
          Plate: plateId
            ? { connect: { id: Number(plateId) } }
            : { disconnect: true },
          Die: dieId
            ? { connect: { id: Number(dieId) } }
            : { disconnect: true },
          totalPlateSet: totalPlateSet ? Number(totalPlateSet) : null,
          remarks: remarks || null,
          Designer: designerId
            ? { connect: { id: Number(designerId) } }
            : { disconnect: true },
          FollowUp: followUpId
            ? { connect: { id: Number(followUpId) } }
            : { disconnect: true },
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime ? Number(jobRunTime) : null,
          department: department || null,
          itemGroup: itemGroup || null,
          OrderEntryItem: orderItemId
            ? { connect: { id: Number(orderItemId) } }
            : { disconnect: true },
          StyleItem: styleItemId
            ? { connect: { id: Number(styleItemId) } }
            : { disconnect: true },
          labelQuality: labelQuality || null,
          labelBlock: labelBlock || null,
          labelRollQty: labelRollQty || null,
          labelCutAndSeal: labelCutAndSeal || null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          RefJobCard: refJobCardId
            ? { connect: { id: Number(refJobCardId) } }
            : undefined,
          splitType: splitType || null,
          Store: storeId
            ? { connect: { id: Number(storeId) } }
            : { disconnect: true },
          LabelItem: labelItemId
            ? { connect: { id: Number(labelItemId) } }
            : { disconnect: true },
          Color: colorId
            ? { connect: { id: Number(colorId) } }
            : { disconnect: true },
          dieDescription: dieDescription ?? null,
          dieMethod: dieMethod ?? null,
          isHold: isHold ?? false,
          isCancelled: isCancelled ?? false,
          lenght: lenght ? parseInt(lenght) : 0,
          width: width ? parseInt(width) : 0,
          meter: meter ? parseInt(meter) : 0,
          isNewPlate: !!isNewPlate,
          isOldPlate: !!isOldPlate,
          PlateSupplier: plateSupplierId
            ? { connect: { id: Number(plateSupplierId) } }
            : { disconnect: true },
          blockDate: blockDate ? new Date(blockDate) : null,
          trackingType: trackingType || null,
          itemType: itemType || null,
          rollQty: rollQty ? parseInt(rollQty) : 0,
          boardQualities: safeBoardItems.length
            ? {
                createMany: {
                  data: safeBoardItems.map((item) => ({
                    processId: Number(item.processId),
                    gsmId: Number(item.gsmId),
                    fullBoardId: Number(item.fullBoardId),
                    noOfSheets: Number(item.noOfSheets),
                  })),
                },
              }
            : undefined,

          processDetails: safeProcesses.length
            ? {
                createMany: {
                  data: safeProcesses.map((id) => ({ processId: Number(id) })),
                },
              }
            : undefined,

          laminationDetails: safeLaminations.length
            ? {
                createMany: {
                  data: safeLaminations.map((l) => ({
                    laminationId: Number(l.processId),
                    isFront: !!l.isFront,
                    isFrontAndBack: !!l.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          varnishDetails: safeVarnishes.length
            ? {
                createMany: {
                  data: safeVarnishes.map((v) => ({
                    varnishId: Number(v.processId),
                    isFront: !!v.isFront,
                    isFrontAndBack: !!v.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          machineDetails: safeMachines.length
            ? {
                createMany: {
                  data: safeMachines.map((id) => ({ macId: Number(id) })),
                },
              }
            : undefined,

          // jobCardSizeDetails: safeJobCardSizeDetails.length
          //   ? {
          //       createMany: {
          //         data: safeJobCardSizeDetails.map((s) => ({
          //           sizeId: s.sizeId ? Number(s.sizeId) : null,
          //           qty: s.qty ? Number(s.qty) : null,
          //           barcodeFrom: s.barcodeFrom || null,
          //           barcodeTo: s.barcodeTo || null,
          //         })),
          //       },
          //     }
          //   : undefined,

          printingDetails: safePrinting.length
            ? {
                createMany: {
                  data: safePrinting.map((p) => ({
                    processId: Number(p.processId),
                    isFront: !!p.isFront,
                    isFrontAndBack: !!p.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          finishingProcesses: safeFinishing.length
            ? {
                createMany: {
                  data: safeFinishing.map((id) => ({ processId: Number(id) })),
                },
              }
            : undefined,

          labelPrintingDetails: safeLabelPrintingDetails.length
            ? {
                createMany: {
                  data: safeLabelPrintingDetails.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          plateDetails: safePlateDetails.length
            ? {
                createMany: {
                  data: safePlateDetails.map((p) => ({
                    plateId: p.plateId ? parseInt(p.plateId) : null,
                    machineId: p.machineId ? parseInt(p.machineId) : null,
                    plateName: p.plateName ?? "",
                    description: p.description ?? "",
                    qty: p.qty ? Number(p.qty) : null,
                  })),
                },
              }
            : undefined,
        },
      });
      if (itemType !== "LABEL") {
        for (const boardQuality of boardQualities) {
          const process = await tx.process.findUnique({
            where: {
              id: Number(boardQuality.processId),
            },
            select: {
              name: true,
            },
          });

          if (!process) {
            throw new Error("Board process not found");
          }
          const styleItem = await tx.styleItem.findFirst({
            where: {
              name: process.name,
            },
            select: {
              id: true,
              uomId: true,
            },
          });

          if (!styleItem) {
            throw new Error(`Style Item not found for process ${process.name}`);
          }
          await tx.stock.create({
            data: {
              branchId: Number(branchId),
              storeId: Number(storeId),
              styleItemId: parseInt(styleItem.id),
              gsmId: parseInt(boardQuality.gsmId),
              sizeId: parseInt(boardQuality.fullBoardId),
              inOrOut: "Out",
              qty:
                boardQuality?.noOfSheets &&
                !isNaN(parseFloat(boardQuality.noOfSheets))
                  ? -Math.abs(parseInt(boardQuality.noOfSheets))
                  : null,
              uomId: parseInt(styleItem.uomId),
              createdById: parseInt(userId),
              itemGroupId: parseInt(itemGroupId),
              jobCardId: Number(id),
              processName: "Job Card",
            },
          });
        }
      } else {
        const styleItem = await tx.styleItem.findUnique({
          where: {
            id: parseInt(labelItemId),
          },
          select: {
            id: true,
            uomId: true,
          },
        });

        await tx.stock.updateMany({
          where: {
            jobCardId: parseInt(data.id),
          },
          data: {
            branchId: branchId ? parseInt(branchId) : undefined,
            storeId: parseInt(storeId),
            styleItemId: parseInt(labelItemId),
            sizeId: parseInt(labelSizeId),
            inOrOut: "Out",
            qty:
              rollQty && !isNaN(parseFloat(rollQty))
                ? -Math.abs(parseFloat(rollQty))
                : null,
            uomId: parseInt(styleItem.uomId),
            updatedById: parseInt(userId),
            itemGroupId: parseInt(itemGroupId),
            processName: "Job Card",
            colorId: parseInt(colorId),
          },
        });
      }
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
    await prisma.stock.deleteMany({
      where: { jobCardId: jobCardId },
    });
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
              isOutsideJob: true,
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
