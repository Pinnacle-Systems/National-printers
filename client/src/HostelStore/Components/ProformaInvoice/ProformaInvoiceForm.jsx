import React, { useEffect, useState, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import { TextInput, DropdownInput, DateInputNew } from "../../../Inputs";
import {
  useAddProformaInvoiceMutation,
  useUpdateProformaInvoiceMutation,
  useDeleteProformaInvoiceMutation,
  useGetProformaInvoiceByIdQuery,
  useGetProformaInvoiceQuery,
} from "../../../redux/uniformService/ProformaInvoiceService";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { dropDownListObject } from "../../../Utils/contructObject";
import ProformaInvoiceItems from "./ProformaInvoiceItems.jsx";
import moment from "moment";
import { PDFViewer } from "@react-pdf/renderer";
import Modal from "../../../UiComponents/Modal";
import ProformaInvoicePrintFormat from "./ProformaInvoicePrintFormat.jsx";
import tw from "../../../Utils/tailwind-react-pdf";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { FiEdit2, FiSave, FiPrinter, FiEye } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import {
  useGetOrderEntryQuery,
  useLazyGetOrderEntryByIdQuery,
} from "../../../redux/uniformService/OrderEntryService";
import {
  CommonFormFooter,
  TransactionActions,
  TransactionLayout,
} from "../../../Basic/components/Reuseable";
import {
  useGetTaxTemplateQuery,
  useGetTaxTemplateByIdQuery,
} from "../../../redux/services/TaxTemplateServices.js";
import { calculateTaxWithHSNBreakupAndInsertIntoPoItems } from "../../../Utils/taxSummary";
import PoSummary from "../PurchaseOrder/PoSummary";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";

const EMPTY_ROW = {
  styleItemId: "",
  trackingType: "None",
  sizeTemplateId: "",
  sizeId: "",
  barcodeFrom: "",
  barcodeTo: "",
  uomId: "",
  gsmId: "",
  hsnId: "",
  qty: 0,
  price: "",
  amount: 0,
  remarks: "",
  sizeBreakup: [],
};

const padItems = (itemsArray = []) => {
  const minLength = 14;
  const currentLength = itemsArray.length;
  if (currentLength < minLength) {
    const padding = Array.from({ length: minLength - currentLength }, () => ({
      ...EMPTY_ROW,
    }));
    return [...itemsArray, ...padding];
  }
  return itemsArray;
};

const ProformaInvoiceForm = ({
  readOnly,
  setReadOnly,
  id,
  setId,
  onClose,
  termsData,
  customerList,
}) => {
  const { branchId, companyId, finYearId, userId } = getCommonParams();

  const [docId, setDocId] = useState("New");
  const [docDate, setDocDate] = useState(moment().format("YYYY-MM-DD"));
  const [userDate, setUserDate] = useState(moment().format("YYYY-MM-DD"));
  const [customerId, setCustomerId] = useState("");
  const [orderEntryId, setOrderEntryId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [termsAndCondition, setTermsAndCondition] = useState("");
  const [termsId, setTermsId] = useState("");
  const [items, setItems] = useState(padItems([]));
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [summary, setSummary] = useState(false);
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [deliveryType, setDeliveryType] = useState("self");
  const [deliveryCustomer, setDeliveryCustomer] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("By cash");
  const [deliveryCharge, setDeliveryCharge] = useState("");

  const [selectedQuoteVersion, setSelectedQuoteVersion] = useState("Latest");
  const [availableVersions, setAvailableVersions] = useState([]);
  const isOldVersion = selectedQuoteVersion !== "Latest";
  const effectiveReadOnly = readOnly || isOldVersion;
  console.log(deliveryCustomer, "ddeliveryCustomere");

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    contactPerson: "",
    phone: "",
  });

  const customerRef = useRef(null);

  const { data: allData } = useGetProformaInvoiceQuery({
    params: { branchId },
  });
  const { data: singleData } = useGetProformaInvoiceByIdQuery(id, {
    skip: !id,
  });
  const { data: orderList } = useGetOrderEntryQuery({ params: { branchId } });
  const { data: taxTypeList } = useGetTaxTemplateQuery({
    params: { companyId },
  });
  const { data: supplierData } = useGetPartyByIdQuery(customerId, {
    skip: !customerId,
  });

  const filteredOrderList = useMemo(() => {
    if (!customerId || !orderList?.data) return [];
    return orderList.data.filter(
      (order) => parseInt(order.customerId) === parseInt(customerId),
    );
  }, [customerId, orderList]);

  const [triggerGetOrderById] = useLazyGetOrderEntryByIdQuery();

  const [addData] = useAddProformaInvoiceMutation();
  const [updateData] = useUpdateProformaInvoiceMutation();
  const [removeData] = useDeleteProformaInvoiceMutation();

  useEffect(() => {
    if (!id && allData?.nextDocId) {
      setDocId(allData.nextDocId);
    }
  }, [id, allData]);

  useEffect(() => {
    if (!id && !readOnly) {
      setTimeout(() => {
        customerRef.current?.focus();
      }, 100);
    }
  }, [id, readOnly]);

  useEffect(() => {
    if (id && singleData?.data) {
      const data = singleData.data;
      setDocId(data.docId);
      setDocDate(moment(data.docDate).format("YYYY-MM-DD"));
      setUserDate(
        data.userDate
          ? moment(data.userDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      );
      setCustomerId(data.customerId);
      setOrderEntryId(data.orderEntryId || "");
      setRemarks(data.remarks || "");
      setTermsAndCondition(data.termsAndCondition || "");
      setTermsId(data.termsId || "");
      setTaxTemplateId(data.taxTemplateId || "");
      setDeliveryType(data.deliveryType || "self");
      setDeliveryCustomer(data.deliveryCustomerId || "");
      setModeOfPayment(data.modeOfPayment || "By cash");
      setDeliveryCharge(data.deliveryCharge || "");
      console.log(data.deliveryCustomerId, "deliveryCustomerId");
      let loadedVersions = [];
      if (data.items?.length > 0) {
        loadedVersions = [
          ...new Set(data.items.map((i) => i.quoteVersion).filter(Boolean)),
        ].sort((a, b) => b - a);
      }
      setAvailableVersions(loadedVersions);
      setSelectedQuoteVersion("Latest");

      const targetVersion =
        loadedVersions.length > 0 ? Math.max(...loadedVersions, 1) : 1;
      const filteredItems = (data.items || []).filter(
        (i) => (i.quoteVersion || 1) === targetVersion,
      );
      const formattedItems = filteredItems.map((item) => ({
        ...item,
        price: Number(item.price || 0), // ✅ keep number
      }));
      console.log("filteredItems", filteredItems);
      setItems(padItems(formattedItems));

      const cust = data.customer || data.OrderEntry?.customer;
      if (cust) {
        setCustomerDetails({
          name: cust.name || "",
          contactPerson: cust.contactPersonName || "",
          phone: cust.contactNumber || "",
        });
      }
    }
  }, [id, singleData]);

  useEffect(() => {
    if (singleData?.data?.items && id) {
      let targetVersion;
      if (selectedQuoteVersion === "Latest") {
        const versions = [
          ...new Set(
            singleData.data.items.map((i) => i.quoteVersion).filter(Boolean),
          ),
        ];
        targetVersion = versions.length > 0 ? Math.max(...versions) : 1;
      } else {
        targetVersion = parseInt(selectedQuoteVersion.replace("V", ""));
      }

      const itemsArr = singleData.data.items;
      const filteredItems = itemsArr.filter(
        (i) => (i.quoteVersion || 1) === targetVersion,
      );
      const formattedItems = filteredItems.map((item) => ({
        ...item,
        price: Number(item.price || 0),
      }));
      setItems(padItems(formattedItems));
    }
  }, [selectedQuoteVersion, singleData, id]);

  useEffect(() => {
    if (customerId && customerList?.data) {
      const cust = customerList.data.find(
        (c) => parseInt(c.id) === parseInt(customerId),
      );
      if (cust) {
        setCustomerDetails({
          name: cust.name || "",
          contactPerson: cust.contactPersonName || "",
          phone: cust.contactNumber || "",
        });
      }
    } else {
      setCustomerDetails({ name: "", contactPerson: "", phone: "" });
    }
  }, [customerId, customerList]);



  useEffect(() => {
    if (orderEntryId) {
      const fetchOrderDetails = async () => {
        try {
          const res = await triggerGetOrderById(orderEntryId).unwrap();
          if (res.data) {
            const order = res.data;
            setCustomerId(order.customerId);

            if (!id) {
              setTermsId(order.termsId || "");
              setTermsAndCondition(order.termsAndCondition || "");
              setTaxTemplateId(order.taxTemplateId || "");

              if (order.orderItems && order.orderItems.length > 0) {
                const mappedItems = order.orderItems.map((oi) => ({
                  styleItemId: oi.styleItemId,
                  trackingType: oi.trackingType || "None",
                  sizeTemplateId: oi.sizeTemplateId || "",
                  sizeId: oi.sizeId,
                  barcodeFrom: oi.barcodeFrom || "",
                  barcodeTo: oi.barcodeTo || "",
                  uomId: oi.uomId,
                  gsmId: oi.gsmId,
                  hsnId: oi.hsnId,
                  qty: parseFloat(oi.orderQty) || 0,
                  price: oi.price || "",
                  taxPercent: parseFloat(oi.Hsn?.tax) || 0,
                  discountType: "Percentage",
                  discountValue: 0,
                  amount:
                    (parseFloat(oi.orderQty) || 0) *
                    (parseFloat(oi.price) || 0),
                  remarks: oi.remarks || "",
                  sizeBreakup: oi.sizeBreakup || [],
                }));
                setItems(padItems(mappedItems));
              }
            }

            if (order.customer) {
              setCustomerDetails({
                name: order.customer.name || "",
                contactPerson: order.customer.contactPersonName || "",
                phone: order.customer.contactNumber || "",
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch order details", error);
        }
      };
      fetchOrderDetails();
    }
  }, [orderEntryId, triggerGetOrderById, id]);

  const handleSave = async (pendingAction = null) => {
    if (!orderEntryId) {
      Swal.fire({
        title: "Warning",
        text: "Please select an Order No.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (!taxTemplateId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Tax Template.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const filteredItems = items.filter((item) => item.styleItemId);

    if (filteredItems.length === 0) {
      Swal.fire({
        title: "Warning",
        text: "Please add at least one item.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const missingPriceIndex = items.findIndex(
      (item) => item.styleItemId && (!item.price || parseFloat(item.price) <= 0),
    );

    if (missingPriceIndex !== -1) {
      Swal.fire({
        title: "Warning",
        text: `Price missing in row no ${missingPriceIndex + 1}`,
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const payload = {
      userId,
      branchId,
      companyId,
      finYearId,
      docDate,
      userDate,
      deliveryDate: docDate,
      customerId,
      orderEntryId,
      remarks,
      termsAndCondition,
      termsId,
      taxTemplateId,
      deliveryType,
      deliveryCustomerId: deliveryCustomer || null,
      modeOfPayment,
      deliveryCharge: Number(deliveryCharge) || 0,
      items: JSON.stringify(filteredItems),
    };

    try {
      let savedId = id;
      if (id) {
        await updateData({ id, body: payload }).unwrap();
        Swal.fire({
          title: "Success",
          text: "Proforma Invoice updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const res = await addData(payload).unwrap();
        savedId = res.data.id;
        setId(savedId);
        Swal.fire({
          title: "Success",
          text: "Proforma Invoice created successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setReadOnly(true);
      setSelectedQuoteVersion("Latest");

      if (pendingAction === "new") {
        onNew();
      } else if (pendingAction === "close") {
        onClose();
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.data?.message || "Failed to save Proforma Invoice",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      handleSave();
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
    setDocId("New");
    setDocDate(moment().format("YYYY-MM-DD"));
    setUserDate(moment().format("YYYY-MM-DD"));
    setCustomerId("");
    setOrderEntryId("");
    setRemarks("");
    setTermsAndCondition("");
    setTermsId("");
    setTaxTemplateId("");
    setDeliveryType("self");
    setDeliveryCustomer("");
    setModeOfPayment("By cash");
    setDeliveryCharge("");
    setItems(padItems([]));
    setCustomerDetails({ name: "", contactPerson: "", phone: "" });
    setSelectedQuoteVersion("Latest");
    setAvailableVersions([]);
  };

  useEffect(() => {
    if (termsId && termsData?.data) {
      const term = termsData.data.find((t) => t.id === termsId);
      if (term) setTermsAndCondition(term.termsAndCondition);
    }
  }, [termsId, termsData]);

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );
  const totalQty = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0,
  );

  const actionButtonClass =
    "px-3 py-2 rounded-md flex items-center justify-center text-sm text-white transition";

  const leftActions = [
    ...(!effectiveReadOnly
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
            onClick: () => handleSave("close"),
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
            onClick: () => handleSave("new"),
            className: `bg-indigo-600 hover:bg-indigo-700 ${actionButtonClass}`,
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
      hidden: !readOnly || !id || isOldVersion,
    },
    {
      key: "summary",
      icon: <FiEye className="h-4 w-4" />,
      hoverLabel: "View Summary",
      iconOnly: true,
      onClick: () => {
        if (!taxTemplateId) {
          Swal.fire({
            title: "Information",
            text: "Please Select Tax Template !",
            icon: "info",
            confirmButtonColor: "#3085d6",
          });
          return;
        }
        setSummary(true);
      },
      className:
        "bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition",
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

  const headerContent = (
    <div className="flex flex-col md:flex-row gap-1">
      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Basic Details
        </h2>
        <div className="flex gap-2">
          <div className="w-32">
            <TextInput name="PI No" value={docId} disabled={true} />
          </div>
          <div className="w-24">
            <DateInputNew
              name="PI Date"
              value={docDate}
              setValue={setDocDate}
              disabled={true}
              required={true}
              type="date"
            />
          </div>
          <div className="w-24">
            <DateInputNew
              name="User Date"
              value={userDate}
              setValue={setUserDate}
              disabled={effectiveReadOnly}
              required={false}
              type="date"
            />
          </div>
        </div>
      </div>

      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Order Details
        </h2>
        <div className="flex gap-2">
          <div className="w-60">
            <DropdownInput
              ref={customerRef}
              name="Customer"
              options={dropDownListObject(customerList?.data, "name", "id")}
              value={customerId}
              setValue={(val) => {
                setCustomerId(val);
                setOrderEntryId(""); // Clear order if customer changes
                setItems(padItems([])); // Clear table if customer changes
                if (deliveryType === "self") {
                  setDeliveryCustomer(val);
                }
              }}
              readOnly={effectiveReadOnly || !!id}
              required={true}
            />
          </div>
          <div className="w-28">
            <TextInput
              name="Contact Person"
              value={customerDetails.contactPerson}
              disabled={true}
            />
          </div>
          <div className="w-24">
            <TextInput
              name="Phone"
              value={customerDetails.phone}
              disabled={true}
            />
          </div>
          <div className="w-32">
            <DropdownInput
              name="Order No"
              options={dropDownListObject(filteredOrderList, "docId", "id")}
              value={orderEntryId}
              setValue={setOrderEntryId}
              readOnly={effectiveReadOnly || !!id}
              required={true}
            />
          </div>
          <div className="w-24">
            <DropdownInput
              name="Tax Type"
              options={dropDownListObject(
                taxTypeList ? taxTypeList?.data : [],
                "name",
                "id",
              )}
              value={taxTemplateId}
              setValue={setTaxTemplateId}
              required={true}
              readOnly={effectiveReadOnly || !!id}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm overflow-hidden">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Delivery Details
        </h2>
        <div className="flex gap-2">
          <div className="w-24">
            <DropdownInput
              name="Delivery Type"
              options={[
                { show: "To Self", value: "self" },
                { show: "To Others", value: "others" },
              ]}
              value={deliveryType}
              setValue={(val) => {
                setDeliveryType(val);
                if (val === "self") {
                  setDeliveryCustomer(customerId);
                } else {
                  setDeliveryCustomer("");
                }
              }}
              readOnly={effectiveReadOnly}
            />
          </div>
          <div className="w-64">
            <DropdownInput
              name="Delivery Customer"
              options={dropDownListObject(customerList?.data, "name", "id")}
              value={deliveryCustomer}
              setValue={setDeliveryCustomer}
              readOnly={effectiveReadOnly || deliveryType === "self"}
            />
          </div>
          <div className="w-22">
            <DropdownInput
              name="Mode of Payment"
              options={[
                { show: "By cash", value: "By cash" },
                { show: "By cheque", value: "By cheque" },
                { show: "By UPI", value: "By UPI" },
                { show: "By card", value: "By card" },
              ]}
              value={modeOfPayment}
              setValue={setModeOfPayment}
              readOnly={effectiveReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const isSupplierOutside = useMemo(() => {
    return supplierData?.data?.City?.state?.name !== "TAMILNADU";
  }, [supplierData]);

  const enrichedData = useMemo(() => {
    const filteredItems = items.filter((i) => i.styleItemId);
    if (!filteredItems.length)
      return {
        items: [],
        gross: 0,
        taxable: 0,
        net: 0,
        slabBreakup: [],
        roundOff: 0,
      };

    // We need taxPercent for each item. If missing, we should ideally get it from HSN master.
    // For now, we'll try to use what's in the item.
    return calculateTaxWithHSNBreakupAndInsertIntoPoItems(
      filteredItems,
      isSupplierOutside,
      discountType,
      discountValue,
    );
  }, [items, isSupplierOutside, discountType, discountValue]);

  const versionDropdown = (
    <div className="flex items-center gap-2 ml-2">
      <span className="text-xs text-gray-500 mt-1">Version</span>

      <div className="relative">
        <select
          value={selectedQuoteVersion}
          onChange={(e) => setSelectedQuoteVersion(e.target.value)}
          className="appearance-none bg-white border border-gray-300 text-gray-700 text-xs rounded-md pl-2 pr-6 py-1 
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 
                   hover:border-gray-400 transition"
        >
          {availableVersions.length > 0 ? (
            availableVersions.map((v) => (
              <option
                key={v}
                value={
                  Math.max(...availableVersions) === v ? "Latest" : `V${v}`
                }
              >
                {Math.max(...availableVersions) === v ? "Latest" : `V${v}`}
              </option>
            ))
          ) : (
            <option value="Latest">Latest</option>
          )}
        </select>

        {/* Custom arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-gray-400">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  const taxBreakdownContent =
    enrichedData.slabBreakup.length > 0 ? (
      <div className="space-y-0.5 border-t border-slate-100 pt-1">
        {enrichedData.slabBreakup
          .filter((row) => (row.amount || 0) > 0)
          .map((row) => (
            <div
              key={`${row.tax}-${row.amount}`}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="text-slate-500">{row.tax}</span>
              <span className="font-medium text-slate-700">
                {`Rs.${parseFloat(row.amount || 0).toFixed(2)}`}
              </span>
            </div>
          ))}
      </div>
    ) : null;

  const footerContent = (
    <>
      <CommonFormFooter
        remarks={remarks}
        setRemarks={setRemarks}
        terms={termsAndCondition}
        setTerms={setTermsAndCondition}
        readOnly={effectiveReadOnly}
        showTermSelect={true}
        termValue={termsId}
        onTermChange={(value) => setTermsId(value)}
        termOptions={
          termsData?.data?.map((item) => ({
            value: item.id,
            label: item.name,
            templateText: item.termsAndCondition || "",
          })) || []
        }
        totalsRows={[
          {
            key: "totalQty",
            label: "Total Qty",
            value: totalQty,
            summaryColumn: "right",
          },
          {
            key: "taxableAmount",
            label: "Taxable Amount",
            value: `Rs.${enrichedData.taxable.toFixed(2)}`,
            summaryColumn: "right",
          },
          {
            key: "deliveryCharge",
            label: "Delivery Charge",
            renderValue: () => (
              <div className="flex items-center">
                <span className="text-slate-600 mr-1">Rs.</span>
                <input
                  type="number"
                  className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-indigo-500 text-[11px]"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  readOnly={effectiveReadOnly}
                  placeholder="0.00"
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setDeliveryCharge(val);
                    } else {
                      const num = parseFloat(val);
                      setDeliveryCharge(
                        isNaN(num) ? "" : Number(num).toFixed(2),
                      );
                    }
                  }}
                />
              </div>
            ),
            summaryColumn: "right",
          },
          {
            key: "netAmount",
            label: "Net Amount",
            value: `Rs.${(enrichedData.net + (Number(deliveryCharge) || 0)).toFixed(2)}`,
            summaryColumn: "right",
            emphasized: true,
          },
        ]}
        extraTotalsContent={taxBreakdownContent}
        extraTotalsContentColumn="right"
      />
      <TransactionActions
        leftActions={leftActions}
        rightActions={rightActions}
      />
    </>
  );

  return (
    <>
      <Modal
        isOpen={summary}
        onClose={() => setSummary(false)}
        widthClass="w-[500px]"
      >
        <PoSummary
          poItems={items}
          totals={enrichedData}
          readOnly={effectiveReadOnly}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          setSummary={setSummary}
        />
      </Modal>

      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        widthClass={"w-[90%] h-[90%]"}
      >
        <PDFViewer style={tw("w-full h-full")}>
          <ProformaInvoicePrintFormat
            data={{
              ...singleData?.data,
              items: items.filter((i) => i.styleItemId),
              calculations: enrichedData,
              isSupplierOutside,
            }}
          />
        </PDFViewer>
      </Modal>

      <TransactionLayout
        title="Proforma Invoice"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <ProformaInvoiceItems
            items={items}
            enrichedItems={enrichedData}
            setItems={setItems}
            readOnly={effectiveReadOnly}
            taxTemplateId={taxTemplateId}
            id={id}
            isSupplierOutside={isSupplierOutside}
          />
        }
        footer={footerContent}
        versionDropdown={id ? versionDropdown : null}
      />
    </>
  );
};

export default ProformaInvoiceForm;
