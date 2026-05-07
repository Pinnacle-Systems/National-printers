import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
  DateInputNew,
  DropdownInput,
  ReusableInput,
  TextInput,
} from "../../../Inputs";
import { poTypes, productionTypes } from "../../../Utils/DropdownData";
import { FiCheck, FiEdit2, FiSave, FiSend } from "react-icons/fi";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
  findFromList,
  getCommonParams,
  ModeChip,
  renameFile,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { getImageUrlPath } from "../../../Constants/index.js";
import { Plus } from "lucide-react";
import {
  useAddOrderEntryMutation,
  useGetOrderEntryByIdQuery,
  useUpdateOrderEntryMutation,
} from "../../../redux/uniformService/OrderEntryService.js";
import { QRCodeCanvas } from "qrcode.react";
import { PDFViewer } from "@react-pdf/renderer";
import OrderEntryPrintFormat from "./OrderEntryPrintFormat.jsx";
import { FiFileText } from "react-icons/fi";
import OrderItems from "./OrderItems.jsx";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import { useGetUnitOfMeasurementMasterQuery } from "../../../redux/uniformService/UnitOfMeasurementServices.js";
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService.js";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices.js";
// ── Approval imports (from File 2) ──────────────────────────────────────────
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import {
  CommonFormFooter,
  TransactionActions,
  TransactionLayout,
} from "../../../Basic/components/Reuseable/index.js";

const OrderEntryForm = ({
  onClose,
  id,
  setId,
  readOnly: parentReadOnly,
  setReadOnly,
  customerList,
  termsData,
  branchList,
  canApprove,
  userData,
  branchData,
}) => {
  const today = new Date();

  const [dispatchInvalidate] = useInvalidateTags();
  const { userId, finYearId, branchId, companyId } = getCommonParams();
  const params = {
    branchId,
    companyId,
    finYearId,
  };

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetOrderEntryByIdQuery(id, { skip: !id });

  // ── Smart readOnly: combines parent prop + childRecord ref (File 2 pattern) ──
  const childRecord = useRef(0);
  const isReadOnly = parentReadOnly;

  // Approval status helpers
  const status = singleData?.data?.approvalStatus?.status;
  const isDisabled =
    (status === "APPROVED" || status === "PENDING") && !canApprove;

  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [userDate, setUserDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [requirements, setRequirements] = useState("");
  const [orderType, setOrderType] = useState("ORDER");
  const [productionType, setProductionType] = useState("SAMPLE");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [docId, setDocId] = useState("");

  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [orderQty, setOrderQty] = useState("");
  const [termsAndCondition, setTermsAndCondition] = useState("");
  const [termsId, setTermsId] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [orderItems, setOrderItems] = useState(
    Array.from({ length: 8 }, () => ({
      styleItemId: "",
      sizeId: "",
      uomId: "",
      gsmId: "",
      hsnId: "",
      orderQty: "",
    })),
  );

  // ── Approval state (File 2) ──────────────────────────────────────────────
  const [approvalModal, setApprovalModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const qrRef = useRef(null);
  const customerRef = useRef(null);

  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { ...params },
  });
  const { data: uomList } = useGetUnitOfMeasurementMasterQuery({ params });
  const { data: sizeList } = useGetSizeMasterQuery({ params });
  const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({
    params: { companyId },
  });

  const [addData] = useAddOrderEntryMutation();
  const [updateData] = useUpdateOrderEntryMutation();
  // ── Approval mutation (File 2) ───────────────────────────────────────────
  const [addApprovalStatus] = useAddApprovalStausMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      setDocId(data?.docId ? data?.docId : "New");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );
      setUserDate(
        data?.userDate
          ? moment.utc(data.userDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );
      setOrderType(data?.orderType || "ORDER");
      setProductionType(data?.productionType || "SAMPLE");
      setCustomerId(data?.customerId || "");
      setRemarks(data?.remarks || "");
      setAttachments(data?.attachments ? data?.attachments : []);
      setOrderQty(data?.orderQty || "");
      setRequirements(data?.requirements || "");
      setDeliveryDate(
        data?.deliveryDate
          ? moment.utc(data.deliveryDate).format("YYYY-MM-DD")
          : "",
      );
      setTermsAndCondition(data?.termsAndCondition || "");
      setTermsId(data?.termsId || "");
      // ── Smart childRecord tracking (File 2) ─────────────────────────────
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      const initialItems = (data?.orderItems || []).map((item) => ({
        ...item,
        itemGroupId: item.itemGroupId || "",
        trackingType: item.trackingType || "None",
        sizeBreakup: item.sizeBreakup || [],
        price: item?.price || "",
      }));

      const emptyRowsCount = Math.max(0, 8 - initialItems.length);
      const emptyRows = Array.from({ length: emptyRowsCount }, () => ({
        itemGroupId: "",
        styleItemId: "",
        trackingType: "None",
        sizeId: "",
        sizeTemplateId: "",
        barcodeFrom: "",
        barcodeTo: "",
        uomId: "",
        gsmId: "",
        hsnId: "",
        orderQty: "",
        price: "",
        remarks: "",
        sizeBreakup: [],
      }));

      setOrderItems([...initialItems, ...emptyRows]);
    },
    [id],
  );

  useEffect(() => {
    if (id && singleData?.data) {
      syncFormWithDb(singleData.data);
    } else {
      syncFormWithDb(undefined);
    }
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  let data = {
    id,
    docDate,
    branchId,
    userId,
    orderType,
    productionType,
    customerId,
    remarks,
    finYearId,
    attachments: attachments?.filter((i) => i.filePath),
    orderQty,
    requirements,
    deliveryDate,
    termsAndCondition,
    termsId,
    docId,
    orderItems: orderItems
      ?.filter((i) => i.styleItemId && i.orderQty)
      .map((item, idx) => ({ ...item, itemOrder: idx })),
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      const formData = new FormData();
      for (let key in data) {
        if (key == "attachments") {
          formData.append(
            key,
            JSON.stringify(
              data[key].map((i) => ({
                ...i,
                filePath:
                  i.filePath instanceof File ? i.filePath.name : i.filePath,
              })),
            ),
          );
          data[key].forEach((option) => {
            if (option?.filePath instanceof File) {
              formData.append("images", option.filePath);
            }
          });
        } else if (
          Array.isArray(data[key]) ||
          (typeof data[key] === "object" && data[key] !== null)
        ) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: formData }).unwrap();
      } else {
        returnData = await callback(formData).unwrap();
      }
      if (returnData.statusCode === 1) {
        toast.error(returnData.message);
      } else {
        Swal.fire({
          icon: "success",
          title: `${text || "Saved"} Successfully`,
          showConfirmButton: false,
          timer: 2000,
          didClose: () => {
            dispatchInvalidate();

            if (returnData.statusCode === 0) {
              if (nextProcess == "new") {
                setId(0);
                setDocId("New");
                syncFormWithDb(undefined);
                setTimeout(() => {
                  customerRef.current?.focus();
                }, 100);
              }
              if (nextProcess == "close") {
                onClose();
              }
            } else {
              toast.error(returnData?.message);
            }
          },
        });
      }
    } catch (error) {
      console.log("handle", error);
    }
  };

  // ── Full duplicate detection (File 2) ────────────────────────────────────
  const findDuplicates = (items) => {
    const seen = new Map();
    const duplicates = [];

    items.forEach((item, index) => {
      // Key consists of item (styleItemId), itemGroup (itemGroupId), and type (trackingType)
      const key = `${item.styleItemId}-${item.itemGroupId}-${item.trackingType}`;
      if (seen.has(key)) {
        duplicates.push({
          firstIndex: seen.get(key),
          duplicateIndex: index,
        });
      } else {
        seen.set(key, index);
      }
    });

    return duplicates;
  };

  // ── Row-level validation (File 2) ─────────────────────────────────────────
  const validateRows = (items) => {
    const errors = [];

    items.forEach((item, index) => {
      if (!item.orderQty || Number(item.orderQty) <= 0) {
        errors.push(`Row ${index + 1}: Order Qty must be greater than 0`);
      }
      if (!item.styleItemId) {
        errors.push(`Row ${index + 1}: Style is required`);
      }

      if (!item.uomId) {
        errors.push(`Row ${index + 1}: UOM is required`);
      }
    });

    return errors;
  };

  // ── Stricter validateData (File 2 logic, keeps File 1 field names) ────────
  const validateData = (data) => {
    const items = data?.orderItems || [];
    const checks = [
      { condition: !data.orderType, title: "Order Type is required!" },
      {
        condition: !data.productionType,
        title: "Production Type is required!",
      },
      { condition: !data.deliveryDate, title: "Delivery Date is required!" },
      { condition: !data.customerId, title: "Customer is required!" },
      { condition: items.length === 0, title: "Order Items are required!" },
    ];

    const failed = checks.find((c) => c.condition);
    if (failed) {
      Swal.fire({
        icon: "warning",
        title: failed.title,
        html: failed.html,
        timer: failed.html ? undefined : 1500,
        showConfirmButton: !!failed.html,
        confirmButtonText: "OK",
      });
      return false;
    }

    const rowErrors = validateRows(items);
    if (rowErrors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Row Validation Error",
        html: `<div style="text-align:left">${rowErrors.join("<br/>")}</div>`,
      });
      return false;
    }

    const duplicates = findDuplicates(items);
    if (duplicates.length > 0) {
      const message = duplicates
        .map(
          (d) =>
            `Row ${d.duplicateIndex + 1} is duplicate of Row ${d.firstIndex + 1}`,
        )
        .join("<br/>");

      Swal.fire({
        icon: "warning",
        title: "Duplicate Items Found",
        html: `<div style="text-align:left">${message}</div>`,
      });
      return false;
    }

    return true;
  };

  // ── saveData with submitApproval option (File 2) ──────────────────────────
  const saveData = (nextProcess, options = {}) => {
    const submitApprovalFlag = !!options.submitApproval;
    if (!validateData(data)) {
      return;
    }
    if (id) {
      if (!window.confirm("Are you sure update the details ...?")) {
        return;
      }
    }
    if (nextProcess == "draft" && !id) {
      handleSubmitCustom(
        addData,
        (data = { ...data, draftSave: true }),
        "Added",
        nextProcess,
      );
    } else if (id && nextProcess == "draft") {
      handleSubmitCustom(
        updateData,
        { ...data, draftSave: true },
        "Updated",
        nextProcess,
      );
    } else if (id) {
      handleSubmitCustom(
        updateData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Updated",
        nextProcess,
      );
    } else {
      handleSubmitCustom(
        addData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Added",
        nextProcess,
      );
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData("close");
    }
  };

  useEffect(() => {
    customerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (attachments?.length >= 5) return;
    setAttachments((prev) => {
      let newArray = Array.from({ length: 5 - prev?.length }, () => {
        return { date: today, filePath: "", log: "", name: "" };
      });
      return [...prev, ...newArray];
    });
  }, [setAttachments, attachments]);

  function handleInputChange(value, index, field) {
    const newBlend = structuredClone(attachments);
    newBlend[index][field] = value;
    setAttachments(newBlend);
  }

  function openPreview(filePath) {
    window.open(
      filePath instanceof File
        ? URL.createObjectURL(filePath)
        : getImageUrlPath(filePath),
    );
  }

  function addNewComments() {
    setAttachments((prev) => [...prev, { log: "", date: today, filePath: "" }]);
  }

  function deleteRow(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Approval action handlers (File 2) ────────────────────────────────────
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
        referencePage: "ORDER ENTRY",
        recordData: {},
      }).unwrap();

      if (result.statusCode === 0) {
        toast.success(
          result.message ||
            (actionType === "APPROVE"
              ? "Order Entry Approved!"
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
    <div className="flex flex-col md:flex-row gap-2">
      <div className="flex-none border border-slate-200 p-2 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Basic Details
        </h2>
        <div className="flex gap-2">
          <div className="w-32">
            <ReusableInput label="Order Entry No" readOnly value={docId} />
          </div>
          <div className="w-32">
            <ReusableInput
              label="Order Entry Date"
              value={docDate}
              type={"date"}
              required={true}
              readOnly={true}
              disabled
            />
          </div>
          <div className="w-32">
            <ReusableInput
              label="User Date"
              value={userDate}
              setValue={setUserDate}
              type={"date"}
              required={true}
              readOnly={isReadOnly}
            />
          </div>
        </div>
      </div>

      <div className="flex-none border border-slate-200 p-2 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Order Details
        </h2>
        <div className="flex gap-2">
          <div className="w-32">
            <DropdownInput
              name="Order Type"
              options={poTypes}
              value={orderType}
              setValue={setOrderType}
              required={true}
              readOnly={isReadOnly}
              disabled={childRecord.current > 0 || isReadOnly}
              ref={customerRef}
            />
          </div>
          <div className="w-32">
            <DropdownInput
              name="Production Type"
              options={productionTypes}
              value={productionType}
              setValue={setProductionType}
              required={true}
              readOnly={isReadOnly}
              disabled={childRecord.current > 0 || isReadOnly}
            />
          </div>
          <div className="w-32">
            <DateInputNew
              name="Delivery Date"
              value={deliveryDate}
              setValue={setDeliveryDate}
              required={true}
              readOnly={isReadOnly}
              type={"date"}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 border border-slate-200 p-2 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Customer Details
        </h2>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-6">
            <DropdownWithModal
              name="Customer"
              options={dropDownListObject(
                id
                  ? customerList?.data?.filter((item) => item?.isCustomer)
                  : customerList?.data?.filter(
                      (item) => item?.active && item?.isCustomer,
                    ),
                "name",
                "id",
              )}
              value={customerId}
              setValue={setCustomerId}
              required={true}
              readOnly={isReadOnly}
              addNewLabel="+ Add New Customer"
              childComponent={PartyMaster}
              addNewModalWidth="w-[90%] h-[95%]"
              disabled={childRecord.current > 0 || isReadOnly}
            />
          </div>
          <div className="col-span-3">
            <TextInput
              name="Contact Person"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactPersonName",
              )}
              disabled={true}
            />
          </div>
          <div className="col-span-3">
            <TextInput
              name="Phone"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactNumber",
              )}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const actionButtonClass =
    "px-3 py-1.5 rounded-md flex items-center justify-center text-sm text-white transition";

  const leftActions = [
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
      disabled: isReadOnly || isDisabled,
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
      disabled: isReadOnly || isDisabled,
    },
    ...(status === "REJECTED"
      ? [
          {
            key: "submitApproval",
            icon: <FiSend className="w-4 h-4" />,
            hoverLabel: "Submit Approval",
            iconOnly: true,
            onClick: () => saveData("close", { submitApproval: true }),
            className: `bg-green-700 hover:bg-green-800 ${actionButtonClass}`,
            disabled: isReadOnly,
          },
        ]
      : []),
    ...(id && status === "PENDING" && canApprove
      ? [
          {
            key: "sendBack",
            icon: <MdKeyboardDoubleArrowLeft className="w-4 h-4" />,
            hoverLabel: "Send Back for Review",
            iconOnly: true,
            onClick: () => handleApprovalAction("REJECT"),
            className: `bg-blue-600 hover:bg-blue-700 ${actionButtonClass}`,
            disabled: isReadOnly,
          },
          {
            key: "approve",
            icon: <FiCheck className="w-4 h-4" />,
            hoverLabel: "Approve",
            iconOnly: true,
            onClick: () => handleApprovalAction("APPROVE"),
            className: `bg-green-600 hover:bg-green-700 ${actionButtonClass}`,
            disabled: isReadOnly,
          },
        ]
      : []),
  ];

  const rightActions = [
    {
      key: "edit",
      icon: <FiEdit2 className="w-4 h-4 mr-1" />,
      label: "Edit",
      onClick: () => setReadOnly(false),
      className: `bg-yellow-600 hover:bg-yellow-700 ${actionButtonClass}`,
      hidden:
        !id ||
        (parentReadOnly && !(singleData?.data?.childRecord > 0)) === false ||
        isDisabled,
    },
    {
      key: "pdf",
      icon: <FiFileText className="w-4 h-4 mr-1" />,
      label: "PDF Export",
      onClick: () => {
        if (qrRef.current) {
          setQrCodeDataUrl(qrRef.current.toDataURL("image/png"));
        }
        setPrintModalOpen(true);
      },
      className: `bg-slate-600 hover:bg-slate-700 ${actionButtonClass}`,
      hidden: !id,
    },
    {
      key: "upload",
      icon: "📎",
      label: "Upload",
      onClick: () => {
        setSelectedAttachmentIndex(null);
        setAttachmentModal(true);
      },
      className: `bg-red-600 hover:bg-red-700 ${actionButtonClass}`,
    },
  ].filter((a) => !a.hidden);

  const footerContent = (
    <>
      <CommonFormFooter
        remarks={remarks}
        setRemarks={setRemarks}
        readOnly={isReadOnly}
        totalsRows={[
          {
            key: "totalItems",
            label: "Total Items",
            value: orderItems?.filter((item) => item.styleItemId)?.length || 0,
            summaryColumn: "left",
          },
          {
            key: "totalQty",
            label: "Total Qty",
            value: orderItems
              ?.reduce((acc, item) => {
                const qty = parseFloat(item.orderQty) || 0;
                return acc + qty;
              }, 0)
              .toFixed(3),
            summaryColumn: "right",
            emphasized: true,
          },
        ]}
      />
      <TransactionActions
        leftActions={leftActions}
        rightActions={rightActions}
      />
    </>
  );

  return (
    <>
      {/* ── Approval Modal (File 2) ─────────────────────────────────────── */}
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
              ? "✅ Approve Order Entry"
              : "↩️ Send Back for Review"}
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Order Entry No</span>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setApprovalModal(false);
                }
              }}
              className="px-4 py-1.5 text-xs rounded text-white hover:bg-red-600 bg-red-500"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleConfirmAction}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmAction();
                }
              }}
              className={`px-4 py-1.5 text-xs rounded text-white font-semibold transition ${
                actionType === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
            >
              {actionLoading ? (
                <>
                  <svg
                    className="animate-spin h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Processing...
                </>
              ) : actionType === "APPROVE" ? (
                "Confirm Approve"
              ) : (
                "Send Back"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {attachmentModal && (
        <Modal
          isOpen={attachmentModal}
          onClose={() => {
            setAttachmentModal(false);
            setSelectedAttachmentIndex(null);
          }}
          widthClass="p-4 w-[600px] h-[420px]"
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-700">
              Attachments
            </h2>

            {/* Drag & Drop Zone */}
            <div
              className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && selectedAttachmentIndex !== null) {
                  handleInputChange(
                    renameFile(file),
                    selectedAttachmentIndex,
                    "filePath",
                  );
                }
              }}
              onClick={() =>
                document.getElementById("modal-file-upload")?.click()
              }
            >
              <p className="text-sm text-slate-500">
                Drag & drop here, or{" "}
                <span className="text-indigo-600 font-medium underline">
                  click to browse
                </span>
              </p>
              {selectedAttachmentIndex !== null ? (
                <p className="text-xs text-indigo-500 mt-1">
                  Uploading to row:{" "}
                  <strong>{selectedAttachmentIndex + 1}</strong>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Select a row below first
                </p>
              )}
            </div>

            {/* Hidden file input for drag & drop zone */}
            <input
              type="file"
              id="modal-file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0] && selectedAttachmentIndex !== null) {
                  handleInputChange(
                    renameFile(e.target.files[0]),
                    selectedAttachmentIndex,
                    "filePath",
                  );
                  e.target.value = "";
                }
              }}
              disabled={isReadOnly}
            />

            {/* Attachments Table */}
            <div className="max-h-[200px] overflow-auto">
              <div className="border-collapse bg-[#F1F1F0] shadow-sm overflow-auto">
                <table className="bg-gray-200 text-gray-800 text-sm table-auto w-full">
                  <thead className="py-2 font-medium sticky top-0">
                    <tr>
                      <th className="py-2 text-xs w-10 text-center border-r border-white/50">
                        S.No
                      </th>
                      <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                        Name
                      </th>
                      <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                        File
                      </th>
                      <th className="py-2 text-xs w-10 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments?.map((item, index) => (
                      <tr
                        key={index}
                        onClick={() => setSelectedAttachmentIndex(index)}
                        className={`transition-colors border-b border-gray-200 text-[12px] cursor-pointer ${
                          index === selectedAttachmentIndex
                            ? "bg-indigo-100 border-l-2 border-l-indigo-500"
                            : index % 2 === 0
                              ? "bg-white hover:bg-gray-50"
                              : "bg-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <td className="border-r border-white/50 h-8 text-center">
                          {index + 1}
                        </td>
                        <td className="border-r border-white/50 h-8">
                          <input
                            type="text"
                            className="text-left rounded py-1 px-2 w-full focus:outline-none focus:ring focus:border-blue-300 bg-transparent"
                            value={item?.name}
                            onChange={(e) =>
                              handleInputChange(e.target.value, index, "name")
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="border-r border-white/50 h-8 px-2">
                          <div className="flex items-center gap-2">
                            {!isReadOnly && (
                              <label
                                htmlFor={`modal-row-upload-${index}`}
                                className="cursor-pointer flex items-center justify-center p-1 bg-gray-100 rounded hover:bg-gray-200"
                                title="Attach file"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📎
                                <input
                                  type="file"
                                  id={`modal-row-upload-${index}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleInputChange(
                                        renameFile(e.target.files[0]),
                                        index,
                                        "filePath",
                                      );
                                      e.target.value = "";
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                              </label>
                            )}

                            {item.filePath ? (
                              <>
                                <span className="truncate max-w-[120px] text-green-700 font-medium">
                                  ✅ {item.filePath?.name ?? item.filePath}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPreview(item.filePath);
                                  }}
                                  className="text-blue-600 text-xs hover:underline"
                                >
                                  View
                                </button>
                                {!isReadOnly && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInputChange("", index, "filePath");
                                    }}
                                    className="text-red-600 text-xs"
                                    title="Remove file"
                                    disabled={isReadOnly}
                                  >
                                    ✕
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                No file
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-[30px] border-gray-200 h-8">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addNewComments();
                              }}
                              disabled={isReadOnly}
                              className="flex items-center px-1 bg-blue-50 rounded"
                            >
                              <Plus size={18} className="text-blue-800" />
                            </button>
                            <button
                              className="flex items-center px-1 bg-red-50 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRow(index);
                                if (selectedAttachmentIndex === index) {
                                  setSelectedAttachmentIndex(null);
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-red-800"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setAttachmentModal(false);
                  setSelectedAttachmentIndex(null);
                }}
                className="px-2 py-1 text-sm rounded bg-green-700 text-white hover:bg-green-800 border border-green-800"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {printModalOpen && (
        <Modal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          widthClass="w-[90%] h-[90%]"
        >
          <PDFViewer className="w-full h-full border-none">
            <OrderEntryPrintFormat
              data={data}
              customerDetails={customerList?.data?.find(
                (c) => c.id === customerId,
              )}
              branchData={branchList?.data?.find((b) => b.id === branchId)}
              qrCodeDataUrl={qrCodeDataUrl}
              styleItemList={styleItemList?.data}
              sizeList={sizeList?.data}
              uomList={uomList?.data}
              gsmList={gsmList?.data}
              hsnList={hsnList?.data}
              itemGroupList={itemGroupList?.data}
            />
          </PDFViewer>
        </Modal>
      )}

      <div className="hidden">
        <QRCodeCanvas
          id="qr-gen"
          value={docId || "New"}
          size={128}
          level={"H"}
          includeMargin={true}
          ref={qrRef}
        />
      </div>

      <TransactionLayout
        title="Order Entry"
        badge={<ModeChip id={id} readOnly={isReadOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <OrderItems
            orderItems={orderItems}
            setOrderItems={setOrderItems}
            readOnly={isReadOnly || childRecord.current > 0}
            styleItemList={styleItemList}
            sizeList={sizeList}
            uomList={uomList}
            id={id}
          />
        }
        footer={footerContent}
      />
    </>
  );
};

export default OrderEntryForm;
