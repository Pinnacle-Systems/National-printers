import React, { useEffect, useState, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import {
  TextInput,
  DropdownInput,
  DateInputNew,
} from "../../../Inputs/index.js";
import {
  useAddSalesDeliveryMutation,
  useUpdateSalesDeliveryMutation,
  useGetSalesDeliveryByIdQuery,
  useGetSalesDeliveryQuery,
} from "../../../redux/uniformService/SalesDeliveryServices.js";
import {
  findFromList,
  getCommonParams,
  ModeChip,
} from "../../../Utils/helper.js";
import {
  dropDownListObject,
  dropDownListObjectMultiple,
} from "../../../Utils/contructObject.js";
import SalesDeliveryItems from "./SalesDeliveryItems.jsx";
import moment from "moment";
import { PDFViewer } from "@react-pdf/renderer";
import Modal from "../../../UiComponents/Modal/index.js";
import SalesDeliveryPrintFormat from "./SalesDeliveryPrintFormat.jsx";
import tw from "../../../Utils/tailwind-react-pdf.js";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { FiEdit2, FiSave, FiPrinter, FiEye } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import { useGetOrderEntryQuery } from "../../../redux/uniformService/OrderEntryService.js";
import {
  CommonFormFooter,
  TransactionLayout,
} from "../../../Basic/components/Reuseable/index.js";
import {
  useGetTaxTemplateQuery,
  useGetTaxTemplateByIdQuery,
} from "../../../redux/services/TaxTemplateServices.js";
import { calculateTaxWithHSNBreakupAndInsertIntoPoItems } from "../../../Utils/taxSummary.js";
import PoSummary from "../PurchaseOrder/PoSummary.js";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService.js";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";
import { useLazyGetProformaInvoiceByIdQuery } from "../../../redux/uniformService/ProformaInvoiceService.js";
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

const SalesDeliveryForm = ({
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
  console.log("orderEntryId", orderEntryId);
  const [profromaInvoiceId, setProfromaInvoiceId] = useState("");
  const [proformaDocId, setProformaDocId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [termsAndCondition, setTermsAndCondition] = useState("");
  const [termsId, setTermsId] = useState("");
  const [salesDeliveryItems, setSalesDeliveryItems] = useState(padItems([]));
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [summary, setSummary] = useState(false);
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [deliveryType, setDeliveryType] = useState("self");
  const [deliveryCustomer, setDeliveryCustomer] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("By cash");
  const [deliveryCharge, setDeliveryCharge] = useState("");

  const [netAmount, setNetAmount] = useState();
  const effectiveReadOnly = readOnly;
  console.log(deliveryCustomer, "ddeliveryCustomere");

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    contactPerson: "",
    phone: "",
  });

  const customerRef = useRef(null);

  const { data: allData } = useGetSalesDeliveryQuery({
    params: { branchId },
  });
  const { data: singleData } = useGetSalesDeliveryByIdQuery(id, {
    skip: !id,
  });
  const { data: orderList } = useGetOrderEntryQuery({
    params: { branchId, isProforma: true },
  });
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

  const [triggerGetProformaInvoiceById] = useLazyGetProformaInvoiceByIdQuery();

  const [addData] = useAddSalesDeliveryMutation();
  const [updateData] = useUpdateSalesDeliveryMutation();

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
      setProfromaInvoiceId(data?.profromaInvoiceId);
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
      if (data.salesDeliveryItems?.length > 0) {
        loadedVersions = [
          ...new Set(
            data.salesDeliveryItems.map((i) => i.quoteVersion).filter(Boolean),
          ),
        ].sort((a, b) => b - a);
      }

      const formattedItems = data.salesDeliveryItems?.map((item) => ({
        ...item,
        price: Number(item.price || 0), // ✅ keep number
      }));
      setSalesDeliveryItems(padItems(formattedItems));
      setDiscountValue(data?.discountValue);
      setDiscountType(data?.discountType);
      setDeliveryCharge(data?.deliveryCharge);
      setNetAmount(data?.netAmount);
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
    if (profromaInvoiceId) {
      const fetchOrderDetails = async () => {
        try {
          const res =
            await triggerGetProformaInvoiceById(profromaInvoiceId).unwrap();

          if (res.data) {
            const order = res.data;
            setProformaDocId(order.docId);
            setCustomerId(order.customerId);

            if (!id) {
              setTermsId(order.termsId || "");
              setTermsAndCondition(order.termsAndCondition || "");
              setTaxTemplateId(order.taxTemplateId || "");
              setDeliveryType(order?.deliveryType);
              setDeliveryCustomer(order?.deliveryCustomerId);
              setModeOfPayment(order?.modeOfPayment);
              setDeliveryCharge(order?.deliveryCharge);
              if (order.items && order.items.length > 0) {
                const maxQuoteVersion = Math.max(
                  ...order.items.map((oi) => oi.quoteVersion || 1),
                );

                const filteredItems = order.items.filter(
                  (oi) => (oi.quoteVersion || 1) === maxQuoteVersion,
                );

                const mappedItems = filteredItems.map((oi) => ({
                  styleItemId: oi.styleItemId,
                  itemGroupId: oi.itemGroupId,
                  hsnId: oi.hsnId,
                  trackingType: oi.trackingType || "None",
                  uomId: oi.uomId,
                  gsmId: oi.gsmId,
                  qty: parseFloat(oi.qty) || 0,
                  deliveryQty: 0,
                  price: oi.price || "",
                  taxPercent: parseFloat(oi.Hsn?.tax) || 0,
                  discountType: oi?.discountType,
                  discountValue: oi?.discountValue,
                  remarks: oi.remarks || "",
                  salesDeliveryBreakUp:
                    oi.sizeBreakup?.map((val) => ({
                      ...val,
                      proformaSizeBreakupId: val.id,
                    })) || [],
                }));
                setSalesDeliveryItems(padItems(mappedItems));
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
  }, [profromaInvoiceId, triggerGetProformaInvoiceById, id]);

  const handleSave = async (pendingAction = null) => {
    if (!profromaInvoiceId) {
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

    const filteredItems = salesDeliveryItems.filter((item) => item.styleItemId);

    if (filteredItems.length === 0) {
      Swal.fire({
        title: "Warning",
        text: "Please add at least one item.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const missingQtyIndex = salesDeliveryItems.findIndex(
      (item) => item.styleItemId && (!item.qty || parseFloat(item.qty) <= 0),
    );

    if (missingQtyIndex !== -1) {
      Swal.fire({
        title: "Warning",
        text: `Delivery Qty must be greater than zero in row no ${
          missingQtyIndex + 1
        }`,
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const missingPriceIndex = salesDeliveryItems.findIndex(
      (item) =>
        item.styleItemId && (!item.price || parseFloat(item.price) <= 0),
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
      profromaInvoiceId,
      remarks,
      termsAndCondition,
      termsId,
      taxTemplateId,
      deliveryType,
      deliveryCustomerId: deliveryCustomer || null,
      modeOfPayment,
      deliveryCharge: Number(deliveryCharge) || 0,
      salesDeliveryItems: filteredItems,
      discountType,
      discountValue,
      netAmount,
    };
    console.log(payload, "payload");

    try {
      let savedId = id;
      if (id) {
        const res = await updateData({ id, body: payload }).unwrap();
        if (res?.statusCode === 1) {
          throw new Error(res?.message || "Failed to update Proforma Invoice");
        }
        Swal.fire({
          title: "Success",
          text: "Proforma Invoice updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const res = await addData(payload).unwrap();
        if (res?.statusCode === 1) {
          throw new Error(res?.message || "Failed to create Proforma Invoice");
        }
        savedId = res?.data?.id;
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

      if (pendingAction === "new") {
        onNew();
      } else if (pendingAction === "close") {
        onClose();
      }
      invalidateOrderEntryModule();
    } catch (error) {
      console.log(error, "errorcheckingasfkljklas");

      Swal.fire({
        title: "Error",
        text: error?.message || "Failed to save Proforma Invoice",
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
    setSalesDeliveryItems(padItems([]));
    setCustomerDetails({ name: "", contactPerson: "", phone: "" });
  };

  useEffect(() => {
    if (termsId && termsData?.data) {
      const term = termsData.data.find((t) => t.id === termsId);
      if (term) setTermsAndCondition(term.termsAndCondition);
    }
  }, [termsId, termsData]);

  const totalAmount = salesDeliveryItems.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );
  const totalQty = salesDeliveryItems.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0,
  );

  const actionButtonClass =
    "px-3 py-2 rounded-md flex items-center justify-center text-sm text-white transition";

  const headerContent = (
    <div className="flex flex-wrap gap-1 items-stretch">
      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Basic Details
        </h2>
        <div className="flex gap-2">
          <div className="w-32">
            <TextInput name="Sale Order No" value={docId} disabled={true} />
          </div>
          <div className="w-24">
            <DateInputNew
              name="Sale Order Date"
              value={docDate}
              setValue={setDocDate}
              disabled={true}
              required={true}
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
          <div className="w-72">
            <DropdownInput
              ref={customerRef}
              name="Customer"
              options={dropDownListObject(customerList?.data, "name", "id")}
              value={customerId}
              setValue={(val) => {
                setCustomerId(val);
                setOrderEntryId(""); // Clear order if customer changes
                setSalesDeliveryItems(padItems([])); // Clear table if customer changes
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
          <div className="w-36">
            <DropdownInput
              name="Order No"
              options={dropDownListObjectMultiple(
                filteredOrderList.map((item) => ({
                  ...item,
                  id: item.ProformaInvoices?.[0]?.id,
                })),
                ["docId"],
                "id",
              )}
              value={profromaInvoiceId}
              setValue={setProfromaInvoiceId}
              readOnly={effectiveReadOnly || !!id}
              required={true}
            />
          </div>
          <div className="w-36">
            <TextInput
              name="Proforma Invoice No"
              value={proformaDocId}
              setValue={setProformaDocId}
              readOnly={true}
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
              readOnly={true}
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
              readOnly={true}
            />
          </div>
          <div className="w-60">
            <DropdownInput
              name="Delivery Customer"
              options={dropDownListObject(customerList?.data, "name", "id")}
              value={deliveryCustomer}
              setValue={setDeliveryCustomer}
              readOnly={true}
            />
          </div>
          <div className="w-24">
            <DropdownInput
              name="Payment Mode"
              options={[
                { show: "By cash", value: "By cash" },
                { show: "By cheque", value: "By cheque" },
                { show: "By UPI", value: "By UPI" },
                { show: "By card", value: "By card" },
              ]}
              value={modeOfPayment}
              setValue={setModeOfPayment}
              readOnly={true}
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
    const filteredItems = salesDeliveryItems.filter((i) => i.styleItemId);
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
      false,
      "deliveryQty",
    );
  }, [salesDeliveryItems, isSupplierOutside, discountType, discountValue]);

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
          {
            key: "finalAmount",
            label: "Net Bill Value",
            renderValue: () => (
              <div className="flex items-center">
                <span className="text-slate-600 mr-1">Rs.</span>
                <input
                  type="number"
                  className="w-20 text-right border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-indigo-500 text-[11px]"
                  value={netAmount}
                  onChange={(e) => setNetAmount(e.target.value)}
                  readOnly={effectiveReadOnly}
                  placeholder="0.00"
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setNetAmount(val);
                    } else {
                      const num = parseFloat(val);
                      setNetAmount(isNaN(num) ? "" : Number(num).toFixed(2));
                    }
                  }}
                />
              </div>
            ),
            summaryColumn: "right",
          },
        ]}
        extraTotalsContent={taxBreakdownContent}
        extraTotalsContentColumn="right"
      />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-4 pb-4 px-2">
        {/* Left Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!effectiveReadOnly && (
            <>
              <button
                onClick={() => handleSave("close")}
                className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs font-medium"
              >
                <HiX className="w-3.5 h-3.5 mr-2" />
                Save & Close
              </button>

              <button
                onClick={() => handleSave("new")}
                className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs font-medium"
              >
                <HiOutlineRefresh className="w-3.5 h-3.5 mr-2" />
                Save & New
              </button>
            </>
          )}
        </div>

        {/* Right Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!(!readOnly || !id) && (
            <button
              onClick={() => setReadOnly(false)}
              className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 flex items-center text-xs font-medium"
            >
              <FiEdit2 className="w-3.5 h-3.5 mr-2" />
              Edit
            </button>
          )}

          <button
            onClick={() => {
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
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-xs font-medium"
          >
            <FiEye className="w-3.5 h-3.5 mr-2" />
            View Summary
          </button>

          <button
            onClick={() => setPrintModalOpen(true)}
            className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 flex items-center text-xs font-medium"
          >
            <FiPrinter className="w-3.5 h-3.5 mr-2" />
            Print
          </button>
        </div>
      </div>
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
          poItems={salesDeliveryItems}
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
          <SalesDeliveryPrintFormat
            data={{
              ...singleData?.data,
              salesDeliveryItems: salesDeliveryItems.filter(
                (i) => i.styleItemId,
              ),
              calculations: enrichedData,
              isSupplierOutside,
            }}
          />
        </PDFViewer>
      </Modal>

      <TransactionLayout
        title="Sales Delivery"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <SalesDeliveryItems
            salesDeliveryItems={salesDeliveryItems}
            enrichedItems={enrichedData}
            setSalesDeliveryItems={setSalesDeliveryItems}
            readOnly={effectiveReadOnly}
            taxTemplateId={taxTemplateId}
            id={id}
            isSupplierOutside={isSupplierOutside}
          />
        }
        footer={footerContent}
      />
    </>
  );
};

export default SalesDeliveryForm;
