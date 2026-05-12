// ─────────────────────────────────────────────────────────────
// CheckBox Component
// ─────────────────────────────────────────────────────────────
export const CheckBox = ({
  name,
  value,
  setValue,
  readOnly = false,
  className,
  required = false,
  disabled = false,
  tabIndex = null,
}) => {
  return (
    <label
      className={`inline-flex items-center gap-1.5 cursor-pointer select-none
        text-xs font-medium text-slate-700 leading-none
        ${readOnly || disabled ? "opacity-50 cursor-not-allowed" : "hover:text-indigo-600"}
        ${className || ""}`}
    >
      <input
        tabIndex={tabIndex ?? undefined}
        type="checkbox"
        required={required}
        checked={value}
        onChange={() => !readOnly && !disabled && setValue(!value)}
        disabled={readOnly || disabled}
        className="
          w-[14px] h-[14px] min-w-[14px] min-h-[14px]
          rounded
          border border-slate-400
          accent-indigo-600
          cursor-pointer
          disabled:cursor-not-allowed
        "
      />
      <span>{name}</span>
    </label>
  );
};

// ─────────────────────────────────────────────────────────────
// JobCardForm — 5-column card layout
// ─────────────────────────────────────────────────────────────
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { QRCodeCanvas } from "qrcode.react";
import {
  DropdownInput,
  DropdownInputNew,
  DropdownNew,
  ReusableInput,
  TextInput,
} from "../../../Inputs";
import { orderTypes, departmentTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiEdit2,
  FiEye,
  FiPrinter,
  FiSave,
  FiSend,
} from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import {
  BoardMaster,
  DieMaster,
  Gsm,
  PartyMaster,
  PlateMaster,
} from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import {
  useAddJobCardMutation,
  useGetJobCardByIdQuery,
  useUpdateJobCardMutation,
} from "../../../redux/uniformService/JobCardService.js";
import { useGetProformaInvoiceQuery } from "../../../redux/uniformService/ProformaInvoiceService.js"; // ✅ added back
import { useGetBranchByIdQuery } from "../../../redux/services/BranchMasterService.js"; // ✅ added back
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProcessGroupMasterQuery } from "../../../redux/services/ProcessGroupMaster.service.js";
import secureLocalStorage from "react-secure-storage";
import { useGetBoardMasterQuery } from "../../../redux/services/boardService.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf.js";
import JobCardPrintFormat from "./JobCardPrintFormat.jsx";
import OrderEntryApi, {
  useGetOrderEntryQuery,
  useGetOrderEntryByIdQuery,
} from "../../../redux/uniformService/OrderEntryService.js";
import { useDispatch } from "react-redux";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";
import { useGetEmployeeQuery } from "../../../redux/services/EmployeeMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import { ProcessRoutePanel, routeKeysToDb } from "./ProcessRoutePanel.jsx";
import { MdKeyboardDoubleArrowLeft, MdArrowBack } from "react-icons/md";
import TransactionLayout from "../../../Basic/components/Reuseable/TransactionLayout.jsx";
import TransactionActions from "../../../Basic/components/Reuseable/TransactionActions.jsx";
import { HiX } from "react-icons/hi";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";

// ── Section card ─────────────────────────────────────────────
const SectionCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col ${className}`}
  >
    {title && (
      <div className="bg-[#f8f9fa] border-b border-slate-200 px-3 py-1.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#5c5cff]">
          {title}
        </h3>
      </div>
    )}
    <div className="p-2.5 flex-1">{children}</div>
  </div>
);

const Col = ({ title, children, className = "" }) => (
  <div className={`flex flex-col gap-2.5 gap-y-3 ${className}`}>{children}</div>
);

// ── Field label + input wrapper ───────────────────────────────
const Field = ({ label, children, required, className = "" }) => (
  <div className={`flex flex-col gap-0.5 ${className}`}>
    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight flex gap-1">
      {label}{" "}
      {required && <span className="text-red-500 font-bold text-xs">*</span>}
    </span>
    {children}
  </div>
);

// ── LV Row (Lamination / Varnish) ─────────────────────────────
const LVRow = ({ item, selected, onMain, onFront, onFrontBack, readOnly }) => (
  <div className="flex items-center gap-2 gap-y-4 py-1 border-b border-slate-100 last:border-0">
    <div className="flex-[2] min-w-0">
      <CheckBox
        name={item.name}
        value={!!selected}
        setValue={onMain}
        readOnly={readOnly}
      />
    </div>
    <div className="flex-1 flex justify-center">
      <CheckBox
        name=""
        value={selected?.isFront || false}
        setValue={onFront}
        readOnly={!selected || readOnly}
      />
    </div>
    <div className="flex-1 flex justify-center">
      <CheckBox
        name=""
        value={selected?.isFrontAndBack || false}
        setValue={onFrontBack}
        readOnly={!selected || readOnly}
      />
    </div>
  </div>
);

// ── Shared LV column header ───────────────────────────────────
const LVHeader = () => (
  <div className="flex items-center gap-2 pb-1 mb-1 border-b border-slate-200">
    <span className="flex-[2] text-[9px] font-bold uppercase tracking-wider text-slate-400">
      Type
    </span>
    <span className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
      Front
    </span>
    <span className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
      F&B
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
const JobCardForm = ({
  onClose,
  id,
  setId,
  readOnly,
  setReadOnly,
  customerList,
  gsmList,
  plateList,
  dieList,
  branchData,
  formOrderCustomerId,
  setFormOrderCustomerId,
  fromOrderId,
  setFromOrderId,
  fromOrderType,
  setFromOrderType,
  fromOrderQty,
  setFromOrderQty,
  canApprove,
  userData,
}) => {
  const today = new Date();

  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [orderType, setOrderType] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [docId, setDocId] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [gsmId, setGsmId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [fullBoard, setFullBoard] = useState("");
  const [noOfPockets, setNoOfPockets] = useState("");
  const [cuttingSize, setCuttingSize] = useState("");
  const [runningQty, setRunningQty] = useState("");
  const [isFourColor, setIsFourColor] = useState(false);
  const [isCutColor, setIsCutColor] = useState(false);
  const [isFront, setIsFront] = useState(false);
  const [isFrontAndBack, setIsFrontAndBack] = useState(false);

  const [isCMYK, setIsCMYK] = useState(false);
  const [isCutColMachine, setIsCutColMachine] = useState(false);
  const [isFrontMachine, setIsFrontMachine] = useState(false);
  const [isFrontBackMachine, setIsFrontBackMachine] = useState(false);
  const [totalPlateSet, setTotalPlateSet] = useState("");
  const [plateId, setPlateId] = useState("");
  const [dieId, setDieId] = useState("");

  const [boardItems, setBoardItems] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [laminations, setLaminations] = useState([]);
  const [varnishes, setVarnishes] = useState([]);
  const [orderEntryId, setOrderEntryId] = useState("");
  const [proformaInvoiceId, setProformaInvoiceId] = useState(""); // ✅ added back
  const customerRef = useRef(null);
  const { userId, finYearId, branchId, companyId } = getCommonParams();
  const [pendingAction, setPendingAction] = useState(null);
  const [jobRunTime, setJobRunTime] = useState("");
  const [processRoute, setProcessRoute] = useState([]);
  const [approvalModal, setApprovalModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [tagCardUps, setTagCardUps] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [designer, setDesigner] = useState("");
  const [orderEntryItemId, setOrderEntryItemId] = useState("");
  const [styleItemId, setStyleItemId] = useState("");
  const [sizeModal, setSizeModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const qrRef = useRef(null);

  // LABEL DETAILS STATE
  const [labelQuality, setLabelQuality] = useState("");
  const [labelBlock, setLabelBlock] = useState("");
  const [labelRollQty, setLabelRollQty] = useState("");
  const [labelCutAndSeal, setLabelCutAndSeal] = useState("");

  const dispatch = useDispatch();

  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };

  const { data: processList, isFetching: isProcessFetching } =
    useGetProcessMasterQuery({ params });
  const { data: boardData, isFetching: isBoardListFetching } =
    useGetBoardMasterQuery({ params });
  const { data: processGroupList, isFetching: isProcessGroupFetching } =
    useGetProcessGroupMasterQuery({ params });
  const { data: employeeList } = useGetEmployeeQuery({ params });
  const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
  console.log(employeeList, "employeeList");

  // ✅ added back — branch feature flags
  const { data: currentBranch } = useGetBranchByIdQuery(branchId, {
    skip: !branchId,
  });
  const isProformaEnabled =
    currentBranch?.data?.proformaInvoiceEnabled || false;
  const isApprovalEnabled =
    currentBranch?.data?.proformaInvoiceApprovalEnabled || false;

  // ✅ added back — conditional fetch based on isProformaEnabled
  const { data: orderList } = useGetOrderEntryQuery(
    { params: { companyId, branchId } },
    { skip: isProformaEnabled },
  );

  const { data: styleItemList } = useGetStyleItemMasterQuery({ params });

  // ✅ added back
  const { data: proformaList } = useGetProformaInvoiceQuery(
    { params: { companyId, branchId } },
    { skip: !isProformaEnabled },
  );

  const getGroupIds = (groupName) =>
    processGroupList?.data
      ?.find((g) => g.name?.trim().toUpperCase() === groupName.toUpperCase())
      ?.processGroupList?.map((i) => i.processId) || [];

  const filterByGroup = (groupName) => {
    const ids = getGroupIds(groupName);
    return (
      processList?.data?.filter((p) =>
        ids.some((id) => String(id) === String(p.id)),
      ) || []
    );
  };

  const boardList = boardData?.data || [];

  const { data: selectedOrderData } = useGetOrderEntryByIdQuery(orderEntryId, {
    skip: !orderEntryId,
  });

  const selectedItem = selectedOrderData?.data?.orderItems?.find(
    (i) => i.id === orderEntryItemId,
  );

  // Fallback: If "DEFAULT" group is empty, show all processes that aren't in other major groups
  const laminationIds = getGroupIds("LAMINATION");
  const varnishIds = getGroupIds("VARNISH");
  const machineIds = getGroupIds("MACHINE");

  const defaultList =
    filterByGroup("DEFAULT").length > 0
      ? filterByGroup("DEFAULT")
      : processList?.data?.filter(
          (p) =>
            !laminationIds.includes(p.id) &&
            !varnishIds.includes(p.id) &&
            !machineIds.includes(p.id),
        ) || [];

  const laminationList = filterByGroup("LAMINATION");
  const varnishList = filterByGroup("VARNISH");
  const machineList = filterByGroup("MACHINE");

  const isLabel = itemGroup?.toUpperCase() === "LABEL";

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetJobCardByIdQuery(id, { skip: !id });
  const status = singleData?.data?.approvalStatus?.status;

  const [addData] = useAddJobCardMutation();
  const [updateData] = useUpdateJobCardMutation();
  const [addApprovalStatus] = useAddApprovalStausMutation();

  const syncFormWithDb = useCallback((data) => {
    setDocId(data?.docId || "New");
    setDocDate(
      data?.docDate
        ? moment.utc(data.docDate).format("YYYY-MM-DD")
        : moment.utc(new Date()).format("YYYY-MM-DD"),
    );
    setOrderType(data?.orderType || "");
    setCustomerId(data?.customerId || "");
    setRemarks(data?.remarks || "");
    setOrderQty(data?.orderQty || "");
    setDeliveryDate(
      data?.deliveryDate
        ? moment.utc(data.deliveryDate).format("YYYY-MM-DD")
        : "",
    );
    setDepartment(data?.department || "");
    setGsmId(data?.gsmId || "");
    setFullBoard(data?.fullBoard || "");
    setNoOfPockets(data?.noOfPockets || "");
    setCuttingSize(data?.cuttingSize || "");
    setRunningQty(data?.runningQty || "");
    setIsFourColor(data?.isFourColor || false);
    setIsCutColor(data?.isCutColor || false);
    setIsFront(data?.isFront || false);
    setIsFrontAndBack(data?.isFrontAndBack || false);
    setIsCMYK(data?.isCMYK || false);
    setIsCutColMachine(data?.isCutColMachine || false);
    setIsFrontMachine(data?.isFrontMachine || false);
    setIsFrontBackMachine(data?.isFrontBackMachine || false);
    setPlateId(data?.plateId || "");
    setDieId(data?.dieId || "");
    setTotalPlateSet(data?.totalPlateSet || "");
    setBoardItems(data?.boardQualities?.map((b) => b.boardId) || []);
    setSelectedProcesses(data?.processDetails?.map((p) => p.processId) || []);
    setLaminations(
      data?.laminationDetails?.map((l) => ({
        processId: l.laminationId,
        isFront: l.isFront,
        isFrontAndBack: l.isFrontAndBack,
      })) || [],
    );
    setVarnishes(
      data?.varnishDetails?.map((v) => ({
        processId: v.varnishId,
        isFront: v.isFront,
        isFrontAndBack: v.isFrontAndBack,
      })) || [],
    );
    setSelectedMachines(data?.machineDetails?.map((m) => m.machineId) || []);
    setOrderEntryId(data?.orderEntryId || "");
    setProformaInvoiceId(data?.proformaInvoiceId || ""); // ✅ added back
    setBoardId(data?.boardId || "");
    setJobRunTime(data?.jobRunTime || "");
    setProcessRoute(
      data?.processRoute
        ? [...data.processRoute]
            .sort((a, b) => a.sequence - b.sequence)
            .map((r) => {
              const sub = r.isFront
                ? "front"
                : r.isFrontAndBack
                  ? "frontback"
                  : "";
              return `${r.type}:${r.processId}${sub ? `:${sub}` : ""}`;
            })
        : [],
    );
    setItemGroup(data?.itemGroup || "");
    setTagCardUps(data?.tagCardUps || "");
    setFollowUp(data?.followUpId || "");
    setDesigner(data?.designerId || "");
    setLabelQuality(data?.labelQuality || "");
    setLabelBlock(data?.labelBlock || "");
    setLabelRollQty(data?.labelRollQty || "");
    setLabelCutAndSeal(data?.labelCutAndSeal || "");
    setOrderEntryItemId(data?.orderEntryItemId || "");
    setStyleItemId(data?.styleItemId || "");
    setReadOnly(
      (["PENDING", "APPROVED"].includes(status) && !canApprove) || readOnly,
    );
  }, []);

  useEffect(() => {
    if (id && singleData?.data) syncFormWithDb(singleData.data);
    else syncFormWithDb(undefined);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const toggleArr = (setter, val) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val],
    );

  const toggleLV = (setter, id) =>
    setter((prev) => {
      const exists = prev.find((l) => l.processId === id);
      return exists
        ? prev.filter((l) => l.processId !== id)
        : [...prev, { processId: id, isFront: false, isFrontAndBack: false }];
    });

  const toggleLVProp = (setter, id, prop) =>
    setter((prev) =>
      prev.map((l) => (l.processId === id ? { ...l, [prop]: !l[prop] } : l)),
    );

  const data = {
    id,
    docDate,
    branchId,
    userId,
    finYearId,
    orderType,
    orderQty,
    customerId,
    boardItems,
    gsmId,
    boardId,
    remarks,
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
    selectedProcesses,
    laminations,
    varnishes,
    selectedMachines,
    orderEntryId,
    proformaInvoiceId, // ✅ added back
    jobRunTime,
    processRoute: routeKeysToDb(processRoute),
    department,
    itemGroup,
    tagCardUps,
    followUpId: followUp,
    designerId: designer,
    orderEntryItemId,
    styleItemId,
    // Label specific fields
    labelQuality,
    labelBlock,
    labelRollQty,
    labelCutAndSeal,
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      const returnData = await callback(data).unwrap();
      if (returnData.statusCode === 1) {
        toast.error(returnData.message);
      } else {
        Swal.fire({
          icon: "success",
          title: `${text || "Saved"} Successfully`,
          showConfirmButton: false,
          timer: 2000,
          didClose: () => {
            if (returnData.statusCode === 0) {
              if (!id) {
                Swal.fire({
                  icon: "question",
                  title: "Do You Want to Print?",
                  showCancelButton: true,
                  confirmButtonText: "Yes, Print",
                  cancelButtonText: "No [Esc]",
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#6b7280",
                  focusConfirm: true,
                  allowEnterKey: true,
                  allowEscapeKey: true,
                  didOpen: () => {
                    const confirmButton = Swal.getConfirmButton();
                    const cancelButton = Swal.getCancelButton();
                    if (confirmButton) {
                      confirmButton.focus();
                      confirmButton.addEventListener("keydown", (e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          cancelButton?.focus();
                        }
                      });
                    }
                    if (cancelButton) {
                      cancelButton.addEventListener("keydown", (e) => {
                        if (e.key === "Tab" && e.shiftKey) {
                          e.preventDefault();
                          confirmButton?.focus();
                        }
                      });
                    }
                  },
                }).then((result) => {
                  if (result.isConfirmed) {
                    setPrintModalOpen(true);
                    if (returnData?.data?.id) {
                      setId(returnData.data.id);
                    }
                    setPendingAction(nextProcess);
                  } else {
                    if (nextProcess === "new") {
                      syncFormWithDb(undefined);
                      setId("");
                      setDocId("New");
                      setTimeout(() => {
                        supplierRef.current?.focus();
                      }, 300);
                    }
                    if (nextProcess === "close") {
                      onClose();
                    }
                  }
                });
              } else {
                if (nextProcess === "new") {
                  setId(0);
                  setDocId("New");
                  syncFormWithDb(undefined);
                  setTimeout(() => customerRef.current?.focus(), 100);
                }
                if (nextProcess === "close") onClose();
              }
            } else {
              toast.error(returnData?.message);
            }
          },
        });
        invalidateOrderEntryModule();
      }
    } catch (error) {
      console.error("submit error", error);
    }
  };

  const validateData = (data) => {
    const checks = [
      // { condition: !data.orderEntryId, title: "Order No is required!" },
      { condition: !data.docDate, title: "Job Card Date  is required!" },
      { condition: !data.orderType, title: "Order Type is required!" },
      { condition: !data.orderQty, title: "Order Quantity is required!" },
      { condition: !data.customerId, title: "Customer is required!" },
      { condition: !data.followUpId, title: "Follow Up is required!" },
      { condition: !data.designerId, title: "Designer is required!" },
    ];
    const failed = checks.find((c) => c.condition);
    if (failed) {
      Swal.fire({
        icon: "warning",
        title: failed.title,
        timer: 1500,
        showConfirmButton: false,
      });
      return false;
    }
    return true;
  };

  const saveData = (nextProcess, options = {}) => {
    const submitApprovalFlag = !!options.submitApproval;
    if (!validateData(data)) return;
    if (id && !window.confirm("Are you sure you want to update the details?"))
      return;
    if (id)
      handleSubmitCustom(
        updateData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Updated",
        nextProcess,
      );
    else
      handleSubmitCustom(
        addData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Added",
        nextProcess,
      );
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveData("close");
    }
  };

  useEffect(() => {
    customerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (printModalOpen && qrRef.current) {
      // Small timeout to ensure canvas is fully rendered
      const timeoutId = setTimeout(() => {
        const canvas = qrRef.current.querySelector("canvas") || qrRef.current;
        if (canvas && canvas.toDataURL) {
          setQrCodeDataUrl(canvas.toDataURL());
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [printModalOpen]);

  useEffect(() => {
    if (formOrderCustomerId && fromOrderId && fromOrderType && !id) {
      setCustomerId(formOrderCustomerId);
      setOrderEntryId(fromOrderId);
      setOrderType(fromOrderType);
      setOrderQty(fromOrderQty);
    }
  }, [formOrderCustomerId, fromOrderId, fromOrderType, fromOrderQty]);

  const handleApprovalAction = (type) => {
    setActionType(type);
    setApprovalRemarks("");
    setApprovalModal(true);
  };

  const handleConfirmAction = async () => {
    if (actionType === "REJECT" && !approvalRemarks.trim()) {
      toast.warning("Remarks required for sending back!");
      return;
    }
    setActionLoading(true);
    try {
      const result = await addApprovalStatus({
        userId: userData?.id,
        remarks: approvalRemarks || null,
        actionType,
        referenceId: id,
        referencePage: "JOB CARD",
        recordData: {},
      }).unwrap();

      if (result.statusCode === 0) {
        toast.success(
          result.message ||
            (actionType === "APPROVE"
              ? "Job Card Approved!"
              : "Sent Back for Review!"),
        );
        setApprovalModal(false);
        onClose();
      } else {
        toast.error(result.message || "Action failed");
        setApprovalModal(false);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong!");
      setApprovalModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const headerContent = (
    <div className="grid grid-cols-[1.1fr_1.4fr_3.8fr_0.7fr] gap-2 p-2 bg-[#f1f3f9] rounded-md border border-slate-200 shadow-sm">
      {/* BASIC DETAILS */}
      <SectionCard title="Basic Details">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Job Card No">
            <TextInput
              label=""
              readOnly
              value={docId}
              className="bg-slate-50 font-medium"
            />
          </Field>
          <Field label="Job Card Date">
            <TextInput
              label=""
              value={docDate}
              type="date"
              readOnly
              disabled
              className="bg-slate-50"
            />
          </Field>
        </div>
      </SectionCard>

      {/* CUSTOMER DETAILS */}
      <SectionCard title="Customer Details">
        <div className="flex flex-col gap-3">
          <Field label="Customer" required>
            <DropdownWithModal
              name=""
              options={dropDownListObject(
                id
                  ? customerList?.data?.filter((i) => i?.isCustomer)
                  : customerList?.data?.filter(
                      (i) => i?.active && i?.isCustomer,
                    ),
                "name",
                "id",
              )}
              value={customerId}
              setValue={(val) => {
                setCustomerId(val);
                setOrderEntryId("");
                setProformaInvoiceId("");
                setOrderType("");
                setOrderEntryItemId("");
                setItemGroup("");
                setOrderQty("");
              }}
              required
              readOnly={readOnly}
              addNewLabel="+ Add New Customer"
              childComponent={PartyMaster}
              addNewModalWidth="w-[90%] h-[95%]"
              disabled={!!id}
              ref={customerRef}
            />
          </Field>
          <Field label="Department">
            <DropdownInput
              name=""
              options={departmentTypes}
              value={department}
              setValue={setDepartment}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ORDER DETAILS */}
      <SectionCard title="Order Details">
        <div className="grid grid-cols-12 gap-x-2 gap-y-2">
          <Field label="Order No" required className="col-span-3">
            {isProformaEnabled ? (
              <DropdownNew
                name=""
                dataList={proformaList?.data
                  ?.filter((item) => {
                    if (!customerId) return false;
                    const approvedCheck = isApprovalEnabled
                      ? item.isApproved === true
                      : true;
                    return (
                      item.orderEntryId &&
                      approvedCheck &&
                      item.customerId === customerId
                    );
                  })
                  ?.map((item) => ({
                    ...item,
                    orderDocId: item.OrderEntry?.docId || item.docId,
                  }))}
                value={proformaInvoiceId}
                setValue={(val) => {
                  setProformaInvoiceId(val);
                  const selected = proformaList?.data?.find(
                    (p) => p.id === val,
                  );
                  if (selected) {
                    setOrderEntryId(selected.orderEntryId);
                    setCustomerId(selected.customerId);
                    setOrderType(
                      selected.productionType || selected.orderType || "",
                    );
                    setOrderQty(selected.orderQty || "");
                    setOrderEntryItemId("");
                  }
                }}
                required
                readOnly={readOnly}
                disabled={readOnly}
                otherField={"orderDocId"}
              />
            ) : (
              <DropdownNew
                name=""
                dataList={orderList?.data?.filter((item) => {
                  if (!customerId) return false;
                  const approvedCheck = isApprovalEnabled
                    ? item.isApproved === true
                    : true;
                  return approvedCheck && item.customerId === customerId;
                })}
                value={orderEntryId}
                setValue={(val) => {
                  setOrderEntryId(val);
                  const selected = orderList?.data?.find((o) => o.id === val);
                  if (selected) {
                    setCustomerId(selected.customerId);
                    setOrderType(
                      selected.productionType || selected.orderType || "",
                    );
                    setOrderQty(selected.orderQty || "");
                    setOrderEntryItemId("");
                  }
                }}
                required
                readOnly={readOnly}
                disabled={readOnly}
                otherField={"docId"}
              />
            )}
          </Field>

          <Field label="Production Type" required className="col-span-2">
            <TextInput
              name=""
              value={orderType}
              readOnly
              disabled
              className="bg-slate-50 font-medium"
            />
          </Field>

          <Field label="Item Description" className="col-span-4">
            <DropdownNew
              name=""
              dataList={
                selectedOrderData?.data?.orderItems?.map((item) => ({
                  ...item,
                  itemDescription:
                    item.StyleItem?.name || item.remarks || "No Name",
                })) || []
              }
              value={orderEntryItemId}
              setValue={(val) => {
                setOrderEntryItemId(val);
                const item = selectedOrderData?.data?.orderItems?.find(
                  (i) => i.id === val,
                );
                if (item) {
                  setOrderQty(item.orderQty || orderQty);
                  setItemGroup(item.ItemGroup?.name || "");
                  setStyleItemId(item.styleItemId || "");
                }
              }}
              otherField={"itemDescription"}
              readOnly={readOnly}
              disabled={readOnly || !orderEntryId}
            />
          </Field>
          <Field label="Item Group" className="col-span-3">
            <TextInput
              value={itemGroup}
              setValue={setItemGroup}
              readOnly
              disabled
              className="w-full bg-slate-50"
            />
          </Field>
          <Field label="Order Qty" required className="col-span-2">
            <TextInput
              name=""
              value={orderQty}
              setValue={setOrderQty}
              readOnly
              disabled
              required
              type="number"
              className="text-right w-full bg-slate-50"
              placeholder="Order Qty"
            />
          </Field>

          {!isLabel && (
            <Field label="Tag/Card ups" className="col-span-2">
              <TextInput
                value={tagCardUps}
                setValue={setTagCardUps}
                readOnly={readOnly}
                className="w-full"
              />
            </Field>
          )}

          {!isLabel && (
            <Field label="Job Run time" className="col-span-2">
              <TextInput
                value={jobRunTime}
                setValue={setJobRunTime}
                readOnly={readOnly}
                className="w-full"
              />
            </Field>
          )}

          <Field label="Follow Up" required className="col-span-3">
            <DropdownNew
              name=""
              dataList={employeeList?.data || []}
              otherField="name"
              otherValue="id"
              value={followUp}
              setValue={setFollowUp}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </Field>

          <Field label="Designer" required className="col-span-3">
            <DropdownNew
              name=""
              dataList={employeeList?.data || []}
              otherField="name"
              otherValue="id"
              value={designer}
              setValue={setDesigner}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </Field>
        </div>
      </SectionCard>

      {/* QR CODE */}
      <SectionCard title="QR CODE">
        <div className="flex flex-col items-center justify-center h-full min-h-[80px] border-2 border-dashed border-slate-200 rounded text-center p-1 bg-white">
          {id ? (
            <div className="flex flex-col items-center">
              <QRCodeCanvas
                ref={qrRef}
                value={JSON.stringify({ id, docId })}
                size={80}
                className="border border-slate-200 rounded mx-auto my-2"
                level="H"
              />
              <div className="text-[9px] font-bold text-slate-800 tracking-tight">
                {docId}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium leading-tight">
              QR appears
              <br />
              after save
            </span>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const labelDetailsContent = (
    <SectionCard title="LABEL DETAILS" className="min-h-full flex-1">
      <div className="flex gap-6 p-2 flex-1 min-h-0">
        {/* LEFT SIDE: TECHNICAL FIELDS & REMARKS */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Single Row for all Technical Fields */}
          {/* Table for all Technical Fields */}
          <div className="shrink-0 border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-[11px] border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-black uppercase tracking-wider">
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 text-left w-[20%]">
                    Label Quality
                  </th>
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 text-left w-[30%]">
                    Block
                  </th>
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 text-center w-[15%]">
                    Label Qty
                  </th>
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 text-center w-[15%]">
                    Roll Qty
                  </th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-left w-[20%]">
                    Cut & Seal
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-slate-200 p-0">
                    <TextInput
                      value={labelQuality}
                      setValue={setLabelQuality}
                      readOnly={readOnly}
                      className="w-full border-none focus:ring-0 text-[11px] px-2 py-1.5"
                    />
                  </td>
                  <td className="border-r border-slate-200 p-0">
                    <TextInput
                      value={labelBlock}
                      setValue={setLabelBlock}
                      readOnly={readOnly}
                      className="w-full border-none focus:ring-0 text-[11px] px-2 py-1.5"
                    />
                  </td>
                  <td className="border-r border-slate-200 p-0">
                    <TextInput
                      value={orderQty}
                      readOnly
                      disabled
                      className="w-full border-none focus:ring-0 text-[11px] px-2 py-1.5 bg-slate-50 text-right font-bold"
                    />
                  </td>
                  <td className="border-r border-slate-200 p-0">
                    <TextInput
                      value={labelRollQty}
                      setValue={setLabelRollQty}
                      readOnly={readOnly}
                      className="w-full border-none focus:ring-0 text-[11px] px-2 py-1.5 text-right"
                    />
                  </td>
                  <td className="p-0">
                    <TextInput
                      value={labelCutAndSeal}
                      setValue={setLabelCutAndSeal}
                      readOnly={readOnly}
                      className="w-full border-none focus:ring-0 text-[11px] px-2 py-1.5"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks (Fills remaining height below the row) */}
          <div className="flex-1 flex flex-col min-h-0">
            <Field label="Remarks" className="h-full flex flex-col">
              <textarea
                className="w-full p-2 border border-slate-300 rounded-md text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none flex-1 min-h-0 bg-white transition-all shadow-inner resize-none"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                readOnly={readOnly}
                placeholder="Enter special label instructions..."
              />
            </Field>
          </div>
        </div>

        {/* RIGHT SIDE: SIZE BREAKUP */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-full">
            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 shrink-0">
              <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                Size / Barcode wise Details
              </span>
            </div>
            <div className="p-2 flex-1 overflow-auto min-h-0">
              {selectedItem?.sizeBreakup?.length > 0 ? (
                <>
                  {/* --- BARCODE TYPE TABLE --- */}
                  {selectedItem?.trackingType === "Barcode" && (
                    <table className="w-[450px] ml-0 text-[11px] border-collapse">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-50 text-black uppercase text-[10px] font-bold">
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-11">
                            S.NO
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center">
                            FROM
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center">
                            TO
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-16">
                            QTY
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem?.sizeBreakup
                          ?.filter((row) => (Number(row.qty) || 0) > 0)
                          ?.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="border border-slate-200 px-2 py-1 text-center text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left text-slate-600 font-mono">
                                {row.barcodeFrom || "-"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left text-slate-600 font-mono">
                                {row.barcodeTo || "-"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-right font-bold text-indigo-600">
                                {row.qty}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {/* --- SIZE TEMPLATE TYPE TABLE --- */}
                  {selectedItem?.trackingType === "Size Template" && (
                    <table className="w-[350px] ml-0 text-[11px] border-collapse">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-50 text-black uppercase text-[10px] font-bold">
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-11">
                            S.NO
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center">
                            SIZE
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-20">
                            QTY
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem?.sizeBreakup
                          ?.filter((row) => (Number(row.qty) || 0) > 0)
                          ?.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="border border-slate-200 px-2 py-1 text-center text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left font-medium text-slate-700">
                                {row.Size?.name ||
                                  sizeList?.data?.find(
                                    (s) => String(s.id) === String(row.sizeId),
                                  )?.name ||
                                  row.size ||
                                  "All Items"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-right font-bold text-indigo-600">
                                {row.qty}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {/* --- SIZE TEMPLATE + BARCODE TYPE TABLE --- */}
                  {selectedItem?.trackingType === "Size Template + Barcode" && (
                    <table className="w-[600px] ml-0 text-[11px] border-collapse">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-50 text-black uppercase text-[10px] font-bold">
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-11">
                            S.NO
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-24">
                            SIZE
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-24">
                            FROM
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-24">
                            TO
                          </th>
                          <th className="border border-slate-200 px-2 py-1.5 text-center w-16">
                            QTY
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem?.sizeBreakup
                          ?.filter((row) => (Number(row.qty) || 0) > 0)
                          ?.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="border border-slate-200 px-2 py-1 text-center text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left font-medium text-slate-700">
                                {row.Size?.name ||
                                  sizeList?.data?.find(
                                    (s) => String(s.id) === String(row.sizeId),
                                  )?.name ||
                                  row.size ||
                                  "All Items"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left text-slate-600 font-mono">
                                {row.barcodeFrom || "-"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-left text-slate-600 font-mono">
                                {row.barcodeTo || "-"}
                              </td>
                              <td className="border border-slate-200 px-2 py-1 text-right font-bold text-indigo-600">
                                {row.qty}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 gap-2">
                  <FiEye className="text-2xl opacity-20" />
                  <span className="text-[10px] italic">
                    No size details available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const gridItemsContent = (
    <div className="h-full overflow-y-auto px-1 bg-[#f1f3f9] p-2 rounded-md border border-slate-200 flex flex-col">
      {isLabel ? (
        <div className="min-h-full flex flex-col">{labelDetailsContent}</div>
      ) : (
        <div className="grid grid-cols-4 gap-3 items-stretch h-full">
          {/* COLUMN 1: BOARD QUALITY & SPECIFICATIONS */}
          <div className="flex flex-col gap-3 h-full">
            <SectionCard title="Board Quality">
              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                {boardList?.map((item) => (
                  <CheckBox
                    key={item.id}
                    name={item.name}
                    value={boardItems.includes(item.id)}
                    setValue={() => toggleArr(setBoardItems, item.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Specifications" className="flex-1">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="GSM">
                  <DropdownWithModal
                    name=""
                    options={dropDownListObject(
                      id
                        ? gsmList?.data
                        : gsmList?.data?.filter((i) => i?.active),
                      "name",
                      "id",
                    )}
                    value={gsmId}
                    setValue={setGsmId}
                    readOnly={readOnly}
                    addNewLabel="+ Add GSM"
                    childComponent={Gsm}
                    addNewModalWidth="w-[30%] h-[45%]"
                  />
                </Field>
                <Field label="Others / Board">
                  <DropdownWithModal
                    name=""
                    options={dropDownListObject(
                      id
                        ? boardData?.data
                        : boardData?.data?.filter((i) => i?.active),
                      "name",
                      "id",
                    )}
                    value={boardId}
                    setValue={setBoardId}
                    readOnly={readOnly}
                    addNewLabel="+ Add Board"
                    childComponent={BoardMaster}
                    addNewModalWidth="w-[30%] h-[45%]"
                  />
                </Field>
                <Field label="Full Board">
                  <TextInput
                    name=""
                    value={fullBoard}
                    setValue={setFullBoard}
                    readOnly={readOnly}
                    type="number"
                    className="text-right w-full"
                  />
                </Field>
                <Field label="Cutting Size">
                  <TextInput
                    name=""
                    value={cuttingSize}
                    setValue={setCuttingSize}
                    readOnly={readOnly}
                    className="w-full"
                  />
                </Field>
                <Field label="No. of Pockets">
                  <TextInput
                    name=""
                    value={noOfPockets}
                    setValue={setNoOfPockets}
                    readOnly={readOnly}
                    type="number"
                    className="w-full text-right"
                  />
                </Field>
                <Field label="Running Qty">
                  <TextInput
                    name=""
                    value={runningQty}
                    setValue={setRunningQty}
                    readOnly={readOnly}
                    type="number"
                    className="w-full text-right"
                  />
                </Field>
                <CheckBox
                  name="4 Color"
                  value={isFourColor}
                  setValue={setIsFourColor}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Cut Color"
                  value={isCutColor}
                  setValue={setIsCutColor}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Front"
                  value={isFront}
                  setValue={setIsFront}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Front & Back"
                  value={isFrontAndBack}
                  setValue={setIsFrontAndBack}
                  readOnly={readOnly}
                />
              </div>
            </SectionCard>
          </div>

          {/* COLUMN 2: PROCESS DETAILS & LAMINATION DETAILS */}
          <div className="flex flex-col gap-3 h-full">
            <SectionCard title="Process Details">
              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                {defaultList?.map((item) => (
                  <CheckBox
                    key={item.id}
                    name={item.name}
                    value={selectedProcesses.includes(item.id)}
                    setValue={() => toggleArr(setSelectedProcesses, item.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Lamination Details" className="flex-1">
              <LVHeader />
              <div className="space-y-1">
                {laminationList?.map((item) => {
                  const selected = laminations.find(
                    (l) => l.processId === item.id,
                  );
                  return (
                    <LVRow
                      key={item.id}
                      item={item}
                      selected={selected}
                      onMain={() => toggleLV(setLaminations, item.id)}
                      onFront={() =>
                        toggleLVProp(setLaminations, item.id, "isFront")
                      }
                      onFrontBack={() =>
                        toggleLVProp(setLaminations, item.id, "isFrontAndBack")
                      }
                      readOnly={readOnly}
                    />
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* COLUMN 3: VARNISH DETAILS & MACHINES */}
          <div className="flex flex-col gap-3 h-full">
            <SectionCard title="Varnish Details">
              <LVHeader />
              <div className="space-y-1">
                {varnishList?.map((item) => {
                  const selected = varnishes.find(
                    (v) => v.processId === item.id,
                  );
                  return (
                    <LVRow
                      key={item.id}
                      item={item}
                      selected={selected}
                      onMain={() => toggleLV(setVarnishes, item.id)}
                      onFront={() =>
                        toggleLVProp(setVarnishes, item.id, "isFront")
                      }
                      onFrontBack={() =>
                        toggleLVProp(setVarnishes, item.id, "isFrontAndBack")
                      }
                      readOnly={readOnly}
                    />
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Machines" className="flex-1">
              <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                {machineList?.map((item) => (
                  <CheckBox
                    key={item.id}
                    name={item.name}
                    value={selectedMachines.includes(item.id)}
                    setValue={() => toggleArr(setSelectedMachines, item.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          {/* COLUMN 4: MACHINE SPECS, PLATE & DIE, SIZE DETAILS */}
          <div className="flex flex-col gap-3 h-full">
            <SectionCard title="Machine Specifications">
              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                <CheckBox
                  name="CMYK"
                  value={isCMYK}
                  setValue={setIsCMYK}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Cut Col"
                  value={isCutColMachine}
                  setValue={setIsCutColMachine}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Front"
                  value={isFrontMachine}
                  setValue={setIsFrontMachine}
                  readOnly={readOnly}
                />
                <CheckBox
                  name="Front & Back"
                  value={isFrontBackMachine}
                  setValue={setIsFrontBackMachine}
                  readOnly={readOnly}
                />
              </div>
            </SectionCard>

            <SectionCard title="Plate & Die Details">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plate Details">
                    <DropdownWithModal
                      name=""
                      options={dropDownListObject(
                        id
                          ? plateList?.data
                          : plateList?.data?.filter((i) => i?.active),
                        "name",
                        "id",
                      )}
                      value={plateId}
                      setValue={setPlateId}
                      readOnly={readOnly}
                      addNewLabel="+ Add Plate"
                      childComponent={PlateMaster}
                    />
                  </Field>
                  <Field label="Die Details">
                    <DropdownWithModal
                      name=""
                      options={dropDownListObject(
                        id
                          ? dieList?.data
                          : dieList?.data?.filter((i) => i?.active),
                        "name",
                        "id",
                      )}
                      value={dieId}
                      setValue={setDieId}
                      readOnly={readOnly}
                      addNewLabel="+ Add Die"
                      childComponent={DieMaster}
                    />
                  </Field>
                </div>
                <Field label="Total Plate Sets">
                  <TextInput
                    name=""
                    value={totalPlateSet}
                    setValue={setTotalPlateSet}
                    readOnly={readOnly}
                    type="number"
                    className="w-full text-right"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Size / Barcode Details" className="flex-1">
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={() => setSizeModal(true)}
                  disabled={
                    !selectedItem || selectedItem.trackingType === "None"
                  }
                  className={`p-2 rounded-full transition-all ${
                    !selectedItem || selectedItem.trackingType === "None"
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-indigo-600 hover:bg-indigo-50 hover:scale-110 active:scale-95"
                  }`}
                  title="View Size Details"
                >
                  <FiEye size={20} />
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );

  const actionButtonClass =
    "px-3 py-2 rounded-md flex items-center justify-center text-sm text-white transition";

  const leftActions = [
    ...(!readOnly
      ? [
          {
            key: "saveAndClose",
            icon: (
              <span className="flex items-center gap-1">
                <FiSave className="h-4 w-4" />
                <HiX className="h-4 w-4" />
              </span>
            ),
            hoverLabel: "Save & Close",
            iconOnly: true,
            onClick: () => saveData("close"),
            className: `bg-indigo-500 hover:bg-indigo-600 ${actionButtonClass}`,
          },
          {
            key: "saveAndNew",
            icon: (
              <span className="flex items-center gap-1">
                <FiSave className="h-4 w-4" />
                <HiOutlineRefresh className="h-4 w-4" />
              </span>
            ),
            hoverLabel: "Save & New",
            iconOnly: true,
            onClick: () => saveData("new"),
            className: `bg-indigo-600 hover:bg-indigo-700 ${actionButtonClass}`,
          },
        ]
      : []),
    ...(status === "REJECTED" && !readOnly
      ? [
          {
            key: "submitApproval",
            icon: <FiSend className="h-4 w-4" />,
            hoverLabel: "Submit Approval",
            iconOnly: true,
            onClick: () => saveData("close", { submitApproval: true }),
            className: `bg-green-700 hover:bg-green-800 ${actionButtonClass}`,
          },
        ]
      : []),
    ...(id && status === "PENDING" && canApprove && !readOnly
      ? [
          {
            key: "reject",
            icon: <MdKeyboardDoubleArrowLeft className="h-4 w-4" />,
            hoverLabel: "Send Back for Review",
            iconOnly: true,
            onClick: () => handleApprovalAction("REJECT"),
            className: `bg-blue-600 hover:bg-blue-700 ${actionButtonClass}`,
          },
          {
            key: "approve",
            icon: <FiCheck className="h-4 w-4" />,
            hoverLabel: "Approve",
            iconOnly: true,
            onClick: () => handleApprovalAction("APPROVE"),
            className: `bg-green-600 hover:bg-green-700 ${actionButtonClass}`,
          },
        ]
      : []),
  ];

  const rightActions = [
    {
      key: "edit",
      icon: <FiEdit2 className="h-4 w-4" />,
      hoverLabel: "Edit",
      iconOnly: true,
      onClick: () => setReadOnly(false),
      className: `bg-yellow-600 hover:bg-yellow-700 ${actionButtonClass}`,
      hidden: !readOnly || !id,
    },
    {
      key: "print",
      icon: <FiPrinter className="h-4 w-4" />,
      hoverLabel: "Print",
      iconOnly: true,
      onClick: () => setPrintModalOpen(true),
      className: `bg-slate-600 hover:bg-slate-700 ${actionButtonClass}`,
    },
  ].filter((a) => !a.hidden);

  const footerContent = (
    <div className="flex flex-col gap-3 bg-[#f1f3f9] p-2 rounded-md border border-slate-200 shadow-sm">
      {/* PROCESS ROUTE & REMARKS */}
      {!isLabel && (
        <div className="grid grid-cols-[3.5fr_1fr] gap-3">
          <ProcessRoutePanel
            selectedProcesses={selectedProcesses}
            laminations={laminations}
            varnishes={varnishes}
            defaultList={defaultList}
            laminationList={laminationList}
            varnishList={varnishList}
            processRoute={processRoute}
            setProcessRoute={setProcessRoute}
            readOnly={readOnly}
          />

          <SectionCard title="Remarks" className="h-full">
            <textarea
              className="w-full h-[30px] border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-white font-normal"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional Remarks..."
              readOnly={readOnly}
            />
          </SectionCard>
        </div>
      )}

      {/* Footer Actions */}
      <TransactionActions
        leftActions={leftActions}
        rightActions={rightActions}
      />
    </div>
  );

  return (
    <>
      <Modal
        isOpen={approvalModal}
        onClose={() => setApprovalModal(false)}
        widthClass="w-[420px]"
      >
        <div className="space-y-4">
          <h2
            className={`text-base font-semibold ${
              actionType === "APPROVE" ? "text-green-700" : "text-blue-700"
            }`}
          >
            {actionType === "APPROVE"
              ? "✅ Approve Job Card"
              : "↩️ Send Back for Review"}
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Job Card No</span>
              <span className="font-medium text-gray-800">{docId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">
                {findFromList(customerId, customerList?.data, "name")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Current Approval</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : status === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                }`}
              >
                {status === "PENDING"
                  ? "Waiting For Approval"
                  : status === "SUPERSEDED"
                    ? "Re-approval Required"
                    : status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Remarks{" "}
              {actionType === "REJECT" && (
                <span className="text-red-500">* required</span>
              )}
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
              placeholder={
                actionType === "APPROVE"
                  ? "Optional remarks..."
                  : "Reason for sending back (required)..."
              }
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setApprovalModal(false)}
              className="px-4 py-1.5 text-xs rounded text-white hover:bg-red-600 bg-red-500"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleConfirmAction}
              className={`px-4 py-1.5 text-xs rounded text-white font-semibold transition ${
                actionType === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {printModalOpen && (
        <Modal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          widthClass="w-[90%] h-[90%]"
        >
          <PDFViewer className="w-full h-full border-none">
            <JobCardPrintFormat
              singleData={singleData?.data || data}
              customerList={customerList}
              gsmList={gsmList}
              boardList={boardList}
              plateList={plateList}
              dieList={dieList}
              defaultList={defaultList}
              laminationList={laminationList}
              varnishList={varnishList}
              machineList={machineList}
              branchData={branchData?.data}
              orderList={orderList}
              sizeList={sizeList}
              qrCodeDataUrl={qrCodeDataUrl}
              employeeList={employeeList}
              styleItemList={styleItemList}
            />
          </PDFViewer>
        </Modal>
      )}

      {sizeModal && (
        <Modal
          isOpen={sizeModal}
          onClose={() => setSizeModal(false)}
          widthClass="w-[650px] h-[460px]"
        >
          <div className="bg-slate-100 p-3 rounded-lg">
            {/* Header section */}
            <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
              <h3 className="text-[16px] font-bold text-slate-800">
                {selectedItem?.trackingType === "Barcode"
                  ? "Barcode Wise Breakup"
                  : selectedItem?.trackingType === "Size Template + Barcode"
                    ? "Size + Barcode Wise Breakup"
                    : "Size Wise Breakup"}
              </h3>
              <div className="flex gap-2">
                <button
                  className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  onClick={() => setSizeModal(false)}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Main content area */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              {selectedItem?.trackingType !== "Barcode" && (
                <div className="mb-3 bg-slate-50 p-2 border border-slate-200 rounded flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Size Template
                  </span>
                  <span className="text-[12px] font-bold text-slate-700">
                    {selectedItem?.SizeTemplate?.name || "No Template Selected"}
                  </span>
                </div>
              )}
              <div className="h-[250px] overflow-y-auto">
                {/* --- BARCODE TYPE TABLE --- */}
                {selectedItem?.trackingType === "Barcode" && (
                  <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-11">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Barcode From
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Barcode To
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-24">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem?.sizeBreakup
                        ?.filter((item) => (Number(item.qty) || 0) > 0)
                        ?.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0.5 text-center text-[11px] text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-1.5 text-left text-[11px] text-black font-mono">
                              {item.barcodeFrom}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-1.5 text-left text-[11px] text-black font-mono">
                              {item.barcodeTo}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[11px] text-black font-bold">
                              {item.qty}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20">
                      <tr className="bg-slate-50 font-bold">
                        <td
                          colSpan={3}
                          className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[11px] text-slate-700 uppercase"
                        >
                          Total Quantity
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[12px] text-indigo-700">
                          {selectedItem?.sizeBreakup?.reduce(
                            (sum, r) => sum + (Number(r.qty) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* --- SIZE TEMPLATE TYPE TABLE --- */}
                {selectedItem?.trackingType === "Size Template" && (
                  <table className="w-[450px] border-separate border-spacing-0 border-t border-l border-slate-200 ml-0">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-10">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-24">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem?.sizeBreakup
                        ?.filter((item) => (Number(item.qty) || 0) > 0)
                        ?.map((item, idx) => (
                          <tr
                            key={idx}
                            className="h-8 hover:bg-slate-50 transition-colors"
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">
                              {idx + 1}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                              {item.Size?.name || "All Items"}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-right text-[11px] text-black font-bold">
                              {item.qty}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20">
                      <tr className="bg-slate-50 font-bold">
                        <td
                          colSpan={2}
                          className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[11px] text-slate-700 uppercase"
                        >
                          Total Quantity
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[12px] text-indigo-700">
                          {selectedItem?.sizeBreakup?.reduce(
                            (sum, r) => sum + (Number(r.qty) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* --- SIZE TEMPLATE + BARCODE TYPE TABLE --- */}
                {selectedItem?.trackingType === "Size Template + Barcode" && (
                  <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-11">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          From
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          To
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-24">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem?.sizeBreakup
                        ?.filter((item) => (Number(item.qty) || 0) > 0)
                        ?.map((item, idx) => (
                          <tr
                            key={idx}
                            className="h-8 hover:bg-slate-50 transition-colors"
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">
                              {idx + 1}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                              {item.Size?.name || "All Items"}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-left text-[11px] text-black font-mono">
                              {item.barcodeFrom}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-left text-[11px] text-black font-mono">
                              {item.barcodeTo}
                            </td>
                            <td className="border-b border-r border-slate-200 px-3 py-0 text-right text-[11px] text-black font-bold">
                              {item.qty}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20">
                      <tr className="bg-slate-50 font-bold">
                        <td
                          colSpan={4}
                          className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[11px] text-slate-700 uppercase"
                        >
                          Total Quantity
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right text-[12px] text-indigo-700">
                          {selectedItem?.sizeBreakup?.reduce(
                            (sum, r) => sum + (Number(r.qty) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <TransactionLayout
        title="Job Card"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={gridItemsContent}
        footer={footerContent}
      />
    </>
  );
};

export default JobCardForm;
