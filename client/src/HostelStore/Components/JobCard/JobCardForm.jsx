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
import { FiCheck, FiEdit2, FiPrinter, FiSave, FiSend } from "react-icons/fi";
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
} from "../../../redux/uniformService/OrderEntryService.js";
import { useDispatch } from "react-redux";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";
import { ProcessRoutePanel, routeKeysToDb } from "./ProcessRoutePanel.jsx";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";
import { MdKeyboardDoubleArrowLeft, MdArrowBack } from "react-icons/md";
import TransactionLayout from "../../../Basic/components/Reuseable/TransactionLayout.jsx";
import TransactionActions from "../../../Basic/components/Reuseable/TransactionActions.jsx";
import { HiX } from "react-icons/hi";

// ── Section card ─────────────────────────────────────────────
const SectionCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden flex flex-col ${className}`}
  >
    {title && (
      <div className="bg-[#f8f9fa] border-b border-slate-200 px-3 py-1.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#5c5cff]">
          {title}
        </h3>
      </div>
    )}
    <div className="p-3 flex-1">{children}</div>
  </div>
);

const Col = ({ title, children, className = "" }) => (
  <div className={`flex flex-col gap-2.5 gap-y-3 ${className}`}>{children}</div>
);

// ── Field label + input wrapper ───────────────────────────────
const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
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
  const [orderType, setOrderType] = useState("ORDER");
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
  const [labelQuality, setLabelQuality] = useState("");
  const [block, setBlock] = useState("");
  const [labelQty, setLabelQty] = useState("");
  const [rollQty, setRollQty] = useState("");
  const [cutAndSeal, setCutAndSeal] = useState("");
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
    setOrderType(data?.orderType || "ORDER");
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
    setLabelQuality(data?.labelQuality || "");
    setBlock(data?.block || "");
    setLabelQty(data?.labelQty || "");
    setRollQty(data?.rollQty || "");
    setCutAndSeal(data?.cutAndSeal || "");
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
    labelQuality,
    block,
    labelQty,
    rollQty,
    cutAndSeal,
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
      { condition: !data.docDate, title: "Document Date is required!" },
      { condition: !data.orderType, title: "Order Type is required!" },
      { condition: !data.orderQty, title: "Order Quantity is required!" },
      { condition: !data.customerId, title: "Customer is required!" },
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
              setValue={setCustomerId}
              required
              readOnly={readOnly}
              addNewLabel="+ Add New Customer"
              childComponent={PartyMaster}
              addNewModalWidth="w-[90%] h-[95%]"
              disabled={!!id}
            />
          </Field>
          <Field label="Department">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-2 h-8 text-xs font-normal rounded border border-slate-300 
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-150 shadow-sm text-black"
            >
              {departmentTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* ORDER DETAILS */}
      <SectionCard title="Order Details">
        <div className="grid grid-cols-6 gap-x-2 gap-y-2">
          <Field label="Order No" required>
            {isProformaEnabled ? (
              <DropdownNew
                name=""
                dataList={proformaList?.data
                  ?.filter((item) => {
                    const approvedCheck = isApprovalEnabled
                      ? item.isApproved === true
                      : true;
                    return item.orderEntryId && approvedCheck;
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
                    setOrderType(selected.orderType || "ORDER");
                    setOrderQty(selected.orderQty || "");
                  }
                }}
                required
                readOnly={readOnly}
                disabled={readOnly}
                otherField={"orderDocId"}
                ref={customerRef}
              />
            ) : (
              <DropdownNew
                name=""
                dataList={orderList?.data?.filter((item) => {
                  if (isApprovalEnabled) return item.isApproved === true;
                  return true;
                })}
                value={orderEntryId}
                setValue={(val) => {
                  setOrderEntryId(val);
                  const selected = orderList?.data?.find((o) => o.id === val);
                  if (selected) {
                    setCustomerId(selected.customerId);
                    setOrderType(selected.orderType || "ORDER");
                    setOrderQty(selected.orderQty || "");
                  }
                }}
                required
                readOnly={readOnly}
                disabled={readOnly}
                otherField={"docId"}
                ref={customerRef}
              />
            )}
          </Field>

          <Field label="Production Type" required>
            <DropdownInput
              name=""
              options={orderTypes}
              value={orderType}
              setValue={setOrderType}
              required
              readOnly={readOnly}
              disabled={readOnly}
            />
          </Field>

          <Field label="Order Qty" required>
            <TextInput
              name=""
              value={orderQty}
              setValue={setOrderQty}
              readOnly={readOnly}
              required
              type="number"
              className="text-right w-full"
              placeholder="Order Qty"
            />
          </Field>

          <Field label="Label Quality">
            <TextInput
              value={labelQuality}
              setValue={setLabelQuality}
              readOnly={readOnly}
              className="w-full"
            />
          </Field>

          <Field label="Block">
            <TextInput
              value={block}
              setValue={setBlock}
              readOnly={readOnly}
              className="w-full"
            />
          </Field>

          <Field label="Label Qty">
            <TextInput
              value={labelQty}
              setValue={setLabelQty}
              readOnly={readOnly}
              type="number"
              className="w-full text-right"
            />
          </Field>

          <Field label="Roll Qty">
            <TextInput
              value={rollQty}
              setValue={setRollQty}
              readOnly={readOnly}
              type="number"
              className="w-full text-right"
            />
          </Field>

          <Field label="Cut & Seal">
            <TextInput
              value={cutAndSeal}
              setValue={setCutAndSeal}
              readOnly={readOnly}
              className="w-full"
            />
          </Field>

          <Field label="Job Run Time">
            <TextInput
              name=""
              value={jobRunTime}
              setValue={setJobRunTime}
              readOnly={readOnly}
              type="text"
              className="w-full"
              placeholder="Job Run Time"
            />
          </Field>

          <Field label="Item Description" className="col-span-3">
            <TextInput
              name=""
              value={
                findFromList(
                  orderEntryId,
                  orderList?.data,
                  "itemDescription",
                ) || ""
              }
              readOnly
              disabled
              className="bg-slate-50"
            />
          </Field>
        </div>
      </SectionCard>

      {/* QR CODE */}
      <SectionCard title="QR CODE">
        <div className="flex flex-col items-center justify-center h-full min-h-[80px] border-2 border-dashed border-slate-200 rounded text-center p-1 bg-white">
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            QR appears
            <br />
            after save
          </span>
        </div>
      </SectionCard>
    </div>
  );

  const gridItemsContent = (
    <div className="h-full overflow-y-auto px-1 bg-[#f1f3f9] p-2 rounded-md border border-slate-200">
      {/* ══ MIDDLE GRID — 4 COLUMNS ════════════════════════ */}
      <div className="grid grid-cols-4 gap-3 items-start">
        {/* COLUMN 1: BOARD QUALITY & SPECIFICATIONS */}
        <div className="flex flex-col gap-3">
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

          <SectionCard title="Specifications">
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
            </div>
          </SectionCard>
        </div>

        {/* COLUMN 2: PROCESS DETAILS & LAMINATION DETAILS */}
        <div className="flex flex-col gap-3">
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

          <SectionCard title="Lamination Details">
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
        <div className="flex flex-col gap-3">
          <SectionCard title="Varnish Details">
            <LVHeader />
            <div className="space-y-1">
              {varnishList?.map((item) => {
                const selected = varnishes.find((v) => v.processId === item.id);
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

          <SectionCard title="Machines">
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

        {/* COLUMN 4: MACHINE SPECS, PLATE & DIE, REMARKS */}
        <div className="flex flex-col gap-3">
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

          <SectionCard title="Size Details">
            <button className="w-full py-2 bg-[#218838] text-white rounded text-[11px] font-bold uppercase hover:bg-green-700 transition-colors shadow-sm">
              View Size Details
            </button>
          </SectionCard>
        </div>
      </div>
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
            className="w-full h-full min-h-[60px] border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-white font-normal"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional Remarks..."
            readOnly={readOnly}
          />
        </SectionCard>
      </div>

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
              data={formData}
              customerDetails={customerList?.data?.find(
                (c) => c.id === customerId,
              )}
              gsmList={gsmList?.data}
              boardData={boardData?.data}
              plateList={plateList}
              dieList={dieList}
              processList={processList?.data}
              laminationList={laminationList}
              varnishList={varnishList}
              branchData={branchData?.data}
              orderList={orderList}
            />
          </PDFViewer>
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
