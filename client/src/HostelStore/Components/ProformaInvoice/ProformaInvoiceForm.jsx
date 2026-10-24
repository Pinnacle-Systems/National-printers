import React, { useEffect, useState, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import { TextInput, DropdownInput, DateInputNew } from "../../../Inputs";
import {
  useAddProformaInvoiceMutation,
  useUpdateProformaInvoiceMutation,
  useGetProformaInvoiceByIdQuery,
  useGetProformaInvoiceQuery,
} from "../../../redux/uniformService/ProformaInvoiceService";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import {
  dropDownListObject,
  dropDownListObjectMultiple,
} from "../../../Utils/contructObject";
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
  useGetOrderEntryPiQuery,
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
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags";
import { useGetbankQuery } from "../../../redux/services/BankMasterService.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { BankMaster } from "../../../Basic/components/index.js";

const EMPTY_ROW = {
  styleItemId: "",
  trackingType: "Size",
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
  const [discountType, setDiscountType] = useState("");
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
  const [orderDocId, setOrderDocId] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    contactPerson: "",
    phone: "",
  });
  const [bankId, setBankId] = useState("");
  const [validTo, setValidTo] = useState("");
  const customerRef = useRef(null);

  const { data: allData } = useGetProformaInvoiceQuery({
    params: { branchId },
  });
  const { data: bankList } = useGetbankQuery({ params: { branchId } });

  const { data: singleData } = useGetProformaInvoiceByIdQuery(id, {
    skip: !id,
  });
  const { data: orderList } = useGetOrderEntryPiQuery({ params: { branchId } });
  const { data: taxTypeList } = useGetTaxTemplateQuery({
    params: { companyId },
  });
  const { data: supplierData } = useGetPartyByIdQuery(customerId, {
    skip: !customerId,
  });
  console.log("supplierData", supplierData);
  const filteredOrderList = useMemo(() => {
    if (!customerId || !orderList?.data) return [];
    return orderList.data.filter(
      (order) => parseInt(order.customerId) === parseInt(customerId),
    );
  }, [customerId, orderList]);

  const [triggerGetOrderById] = useLazyGetOrderEntryByIdQuery();

  const [addData] = useAddProformaInvoiceMutation();
  const [updateData] = useUpdateProformaInvoiceMutation();

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
      setTermsAndCondition(
        data.termsAndCondition ||
          data.Terms?.description ||
          data.OrderEntry?.termsAndCondition ||
          "",
      );
      setTermsId(data.termsId || data.OrderEntry?.termsId || "");
      setTaxTemplateId(data.taxTemplateId || "");
      setDeliveryType(data.deliveryType || "self");
      setDeliveryCustomer(data.deliveryCustomerId || "");
      setModeOfPayment(data.modeOfPayment || "By cash");
      setDeliveryCharge(
        data.deliveryCharge !== null &&
          data.deliveryCharge !== undefined &&
          data.deliveryCharge !== ""
          ? Number(data.deliveryCharge).toFixed(2)
          : "",
      );
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
      setItems(padItems(formattedItems));
      setDiscountValue(data?.discountValue);
      setDiscountType(data?.discountType);
      const cust = data.customer || data.OrderEntry?.customer;
      if (cust) {
        setCustomerDetails({
          name: cust.name || "",
          contactPerson: cust.contactPersonName || "",
          phone: cust.contactNumber || "",
        });
      }
      setOrderDocId(data?.OrderEntry?.docId);
      setBankId(data?.bankId || "");
      setValidTo(
        data?.validTo ? moment(data.validTo).format("YYYY-MM-DD") : "",
      );
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
                  StyleItem: oi.StyleItem,
                  itemGroupId: oi.itemGroupId,
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
                  discountType: "",
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

    if (!isCustomerExport && !taxTemplateId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Tax Template.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (isCustomerExport && !bankId) {
      Swal.fire({
        title: "Warning",
        text: "Please select an Advising Bank for export customer.",
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
      orderEntryId,
      remarks,
      termsAndCondition,
      termsId,
      taxTemplateId: isCustomerExport
        ? null
        : taxTemplateId
          ? parseInt(taxTemplateId)
          : null,
      deliveryType,
      deliveryCustomerId: deliveryCustomer || null,
      modeOfPayment,
      deliveryCharge: Number(deliveryCharge) || 0,
      items: JSON.stringify(
        filteredItems.map((item) => ({
          ...item,
          taxPercent: isCustomerExport ? 0 : item.taxPercent,
        })),
      ),
      discountType,
      discountValue,
      bankId: bankId ? parseInt(bankId) : null,
      validTo: validTo ? new Date(validTo) : null,
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
      invalidateOrderEntryModule();
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
    setBankId("");
    setValidTo("");
  };

  useEffect(() => {
    if (!id && termsId && termsData?.data && !termsAndCondition) {
      const term = termsData.data.find(
        (t) => parseInt(t.id) === parseInt(termsId),
      );
      if (term) {
        setTermsAndCondition(term.description || term.termsAndCondition || "");
      }
    }
  }, [termsId, termsData, id, termsAndCondition]);

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );
  const totalQty = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0,
  );
  const isCustomerExport = useMemo(() => {
    if (supplierData?.data?.isCustomerExport !== undefined) {
      return Boolean(supplierData.data.isCustomerExport);
    }
    const cust =
      singleData?.data?.customer || singleData?.data?.OrderEntry?.customer;
    if (cust?.isCustomerExport !== undefined) {
      return Boolean(cust.isCustomerExport);
    }
    const countryName = cust?.City?.state?.country?.name;
    if (countryName) {
      return countryName.trim().toUpperCase() !== "INDIA";
    }
    return false;
  }, [supplierData, singleData]);

  useEffect(() => {
    if (isCustomerExport) {
      setTaxTemplateId("");
    }
  }, [isCustomerExport]);

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
          {/* <div className="w-24">
            <DateInputNew
              name="User Date"
              value={userDate}
              setValue={setUserDate}
              disabled={effectiveReadOnly}
              required={false}
              type="date"
            />
          </div> */}
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
          {id ? (
            <>
              {" "}
              <div className="w-36">
                <TextInput name="Order No" value={orderDocId} disabled={true} />
              </div>
            </>
          ) : (
            <>
              <div className="w-36">
                <DropdownInput
                  name="Order No"
                  options={dropDownListObject(filteredOrderList, "docId", "id")}
                  value={orderEntryId}
                  setValue={setOrderEntryId}
                  readOnly={effectiveReadOnly}
                  required={true}
                />
              </div>
            </>
          )}

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
              required={!isCustomerExport}
              readOnly={effectiveReadOnly || !!id || isCustomerExport}
              disabled={effectiveReadOnly || !!id || isCustomerExport}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="w-28">
            <DateInputNew
              name="Valid To"
              value={validTo}
              setValue={setValidTo}
              readOnly={effectiveReadOnly}
              required={true}
              type="date"
            />
          </div>
          <div className="w-72">
            <DropdownWithModal
              name="Advising Bank"
              options={dropDownListObjectMultiple(
                id
                  ? bankList?.data
                  : bankList?.data?.filter((item) => item?.active),
                ["name", "Branch.name"],
                "id",
              )}
              value={bankId}
              setValue={setBankId}
              required={isCustomerExport}
              readOnly={effectiveReadOnly}
              className={`w-[150px]`}
              addNewLabel="+ Add New Bank"
              childComponent={BankMaster}
              addNewModalWidth="w-[45%] h-[64%]"
              disabled={readOnly}
            />
          </div>
          <div className="w-28">
            <TextInput
              name="Delivery Charge"
              type="number"
              value={deliveryCharge}
              setValue={setDeliveryCharge}
              readOnly={effectiveReadOnly}
              disabled={effectiveReadOnly}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== "" && !isNaN(val)) {
                  setDeliveryCharge(parseFloat(val).toFixed(2));
                }
              }}
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
          <div className="w-72">
            <DropdownInput
              name="Delivery Customer"
              options={dropDownListObject(customerList?.data, "name", "id")}
              value={deliveryCustomer}
              setValue={setDeliveryCustomer}
              readOnly={effectiveReadOnly || deliveryType === "self"}
            />
          </div>
          <div className="w-24">
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

    if (isCustomerExport) {
      const calcItems = filteredItems.map((item) => ({
        ...item,
        taxPercent: 0,
        _taxPct: 0,
      }));

      const res = calculateTaxWithHSNBreakupAndInsertIntoPoItems(
        calcItems,
        isSupplierOutside,
        discountType,
        discountValue,
      );

      return {
        ...res,
        slabBreakup: [],
        hsnBreakup: {},
      };
    }

    return calculateTaxWithHSNBreakupAndInsertIntoPoItems(
      filteredItems,
      isSupplierOutside,
      discountType,
      discountValue,
    );
  }, [items, isSupplierOutside, discountType, discountValue, isCustomerExport]);

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

  const taxBreakdownSummaryRaw = enrichedData?.slabBreakup || [];
  const aggregatedTaxBreakdown = taxBreakdownSummaryRaw?.reduce((acc, row) => {
    const taxType = row?.tax?.split(" ")[0];
    if (!acc[taxType]) {
      acc[taxType] = { tax: taxType, amount: 0 };
    }
    acc[taxType].amount += parseFloat(row?.amount || 0);
    return acc;
  }, {});
  const taxBreakdownSummary = Object.values(aggregatedTaxBreakdown);

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
        twoColumnRightSummary={true}
        rightSummaryTitle="Summary"
        termsColSpan="md:col-span-3"
        remarksColSpan="md:col-span-3"
        summaryColSpan="md:col-span-6"
        termOptions={
          (id
            ? termsData?.data
            : termsData?.data?.filter((item) => item?.active)
          )?.map((item) => ({
            value: item?.id,
            label: item?.name,
            templateText: item?.termsAndCondition || item?.description || "",
          })) || []
        }
        totalsRows={[
          {
            key: "totalDiscount",
            label: "Total Discount",
            value: `Rs.${parseFloat((enrichedData?.itemDiscount || 0) + (enrichedData?.overallDiscount || 0)).toFixed(2)}`,
            summaryColumn: "right",
          },
          {
            key: "taxableAmount",
            label: "Taxable Amount",
            value: `Rs.${parseFloat(enrichedData?.taxable || 0).toFixed(2)}`,
            summaryColumn: "right",
          },
          ...taxBreakdownSummary.map((row, index) => ({
            key: `${row.tax}-${row.amount}`,
            label: row.tax,
            value: `Rs.${parseFloat(row.amount || 0).toFixed(2)}`,
            summaryColumn: "right",
            labelClassName: "!text-slate-500 font-normal",
            valueClassName: "text-slate-700",
            className: index === 0 ? "border-t border-slate-100 pt-1" : "",
          })),
          ...(Number(deliveryCharge) > 0
            ? [
                {
                  key: "deliveryCharge",
                  label: "Delivery Charge",
                  value: `Rs.${parseFloat(deliveryCharge).toFixed(2)}`,
                  summaryColumn: "right",
                  labelClassName: "!text-slate-500 font-normal",
                  valueClassName: "text-slate-700",
                },
              ]
            : []),
          {
            key: "roundOff",
            label: "Round Off",
            value: `Rs.${parseFloat(enrichedData?.roundOff || 0).toFixed(2)}`,
            summaryColumn: "right",
            labelClassName: "!text-slate-500 font-normal",
            valueClassName: "text-slate-700",
          },
          {
            key: "netAmount",
            label: "Net Amount",
            value: `Rs.${(parseFloat(enrichedData?.net || 0) + (Number(deliveryCharge) || 0)).toFixed(2)}`,
            summaryColumn: "right",
            emphasized: true,
          },
        ]}
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
          {!(!readOnly || !id || isOldVersion) && (
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
              if (!isCustomerExport && !taxTemplateId) {
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
          poItems={items}
          totals={enrichedData}
          readOnly={effectiveReadOnly || isCustomerExport}
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
              termsAndCondition:
                termsAndCondition ||
                singleData?.data?.termsAndCondition ||
                singleData?.data?.Terms?.description ||
                singleData?.data?.OrderEntry?.termsAndCondition,
              remarks: remarks || singleData?.data?.remarks,
              Bank:
                bankList?.data?.find(
                  (b) => parseInt(b.id) === parseInt(bankId),
                ) || singleData?.data?.Bank,
              isCustomerExport,
              deliveryCharge:
                deliveryCharge !== ""
                  ? Number(deliveryCharge)
                  : singleData?.data?.deliveryCharge || 0,
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
            isCustomerExport={isCustomerExport}
          />
        }
        footer={footerContent}
        versionDropdown={id ? versionDropdown : null}
      />
    </>
  );
};

export default ProformaInvoiceForm;
