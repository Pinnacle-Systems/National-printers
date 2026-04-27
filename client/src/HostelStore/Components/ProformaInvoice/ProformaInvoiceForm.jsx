import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    TextInput,
    DropdownInput,
    DateInputNew,
} from "../../../Inputs";
import {
    useAddProformaInvoiceMutation,
    useUpdateProformaInvoiceMutation,
    useDeleteProformaInvoiceMutation,
    useGetProformaInvoiceByIdQuery,
    useGetProformaInvoiceQuery,
} from "../../../redux/uniformService/ProformaInvoiceService";
import { getCommonParams } from "../../../Utils/helper";
import { dropDownListObject } from "../../../Utils/contructObject";
import ProformaInvoiceItems from "./ProformaInvoiceItems.jsx";
import moment from "moment";
import { PDFViewer } from "@react-pdf/renderer";
import Modal from "../../../UiComponents/Modal";
import ProformaInvoicePrintFormat from "./ProformaInvoicePrintFormat.jsx";
import tw from "../../../Utils/tailwind-react-pdf";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { ModeChip } from "../../../Utils/helper";
import { FiEdit2, FiSave, FiFileText } from "react-icons/fi";
import { useGetOrderEntryQuery, useLazyGetOrderEntryByIdQuery } from "../../../redux/uniformService/OrderEntryService";

const ProformaInvoiceForm = ({
    readOnly,
    setReadOnly,
    id,
    setId,
    onClose,
    termsData,
}) => {
    const { branchId, companyId, finYearId, userId } = getCommonParams();

    const [docId, setDocId] = useState("New");
    const [docDate, setDocDate] = useState(moment().format("YYYY-MM-DD"));
    const [deliveryDate, setDeliveryDate] = useState(moment().format("YYYY-MM-DD"));
    const [customerId, setCustomerId] = useState("");
    const [orderEntryId, setOrderEntryId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [termsAndCondition, setTermsAndCondition] = useState("");
    const [termsId, setTermsId] = useState("");
    const [items, setItems] = useState([]);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    const { data: allData } = useGetProformaInvoiceQuery({ params: { branchId } });
    const { data: singleData } = useGetProformaInvoiceByIdQuery(id, { skip: !id });
    const { data: orderList } = useGetOrderEntryQuery({ params: { branchId } });
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
        if (id && singleData?.data) {
            const data = singleData.data;
            setDocId(data.docId);
            setDocDate(moment(data.docDate).format("YYYY-MM-DD"));
            setDeliveryDate(moment(data.deliveryDate).format("YYYY-MM-DD"));
            setCustomerId(data.customerId?.toString());
            setOrderEntryId(data.orderEntryId?.toString() || "");
            setRemarks(data.remarks || "");
            setTermsAndCondition(data.termsAndCondition || "");
            setTermsId(data.termsId?.toString() || "");
            setItems(data.items || []);
        }
    }, [id, singleData]);

    useEffect(() => {
        if (orderEntryId && !id) {
            const fetchOrderDetails = async () => {
                try {
                    const res = await triggerGetOrderById(orderEntryId).unwrap();
                    if (res.data) {
                        const order = res.data;
                        setCustomerId(order.customerId?.toString() || "");
                        setDeliveryDate(order.deliveryDate ? moment(order.deliveryDate).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"));
                        setTermsId(order.termsId?.toString() || "");
                        setTermsAndCondition(order.termsAndCondition || "");
                        
                        // Populate items from orderItems
                        if (order.orderItems && order.orderItems.length > 0) {
                            const mappedItems = order.orderItems.map(oi => ({
                                styleItemId: oi.styleItemId?.toString(),
                                qty: oi.orderQty || 0,
                                price: 0, // Prices usually entered in Proforma
                                taxPercent: 0,
                                discountType: "PERCENTAGE",
                                discountValue: 0,
                                amount: 0,
                                sizeId: oi.sizeId?.toString(),
                                uomId: oi.uomId?.toString(),
                                gsmId: oi.gsmId?.toString(),
                            }));
                            setItems(mappedItems);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch order details", error);
                }
            };
            fetchOrderDetails();
        }
    }, [orderEntryId, triggerGetOrderById, id]);

    const handleSave = async () => {
        if (!orderEntryId || items.length === 0) {
            toast.error("Please select an Order and add at least one item.");
            return;
        }

        const payload = {
            userId,
            branchId,
            companyId,
            finYearId,
            docDate,
            deliveryDate,
            customerId,
            orderEntryId,
            remarks,
            termsAndCondition,
            termsId,
            items: JSON.stringify(items),
        };

        try {
            if (id) {
                await updateData({ id, body: payload }).unwrap();
                toast.success("Proforma Invoice updated successfully");
            } else {
                const res = await addData(payload).unwrap();
                setId(res.data.id);
                toast.success("Proforma Invoice created successfully");
            }
            setReadOnly(true);
        } catch (error) {
            toast.error(error.data?.message || "Failed to save Proforma Invoice");
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this Proforma Invoice?")) {
            try {
                await removeData(id).unwrap();
                toast.success("Deleted successfully");
                onClose();
            } catch (error) {
                toast.error("Failed to delete");
            }
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
        setDeliveryDate(moment().format("YYYY-MM-DD"));
        setCustomerId("");
        setOrderEntryId("");
        setRemarks("");
        setTermsAndCondition("");
        setTermsId("");
        setItems([]);
    };

    useEffect(() => {
        if (termsId && termsData?.data) {
            const term = termsData.data.find(t => t.id.toString() === termsId);
            if (term) setTermsAndCondition(term.termsAndCondition);
        }
    }, [termsId, termsData]);

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return (
        <div className="flex flex-col h-full bg-[#F1F1F0] p-1" onKeyDown={handleKeyDown}>
            <Modal
                isOpen={printModalOpen}
                onClose={() => setPrintModalOpen(false)}
                widthClass={"w-[90%] h-[90%]"}
            >
                <PDFViewer style={tw("w-full h-full")}>
                    <ProformaInvoicePrintFormat data={singleData?.data} />
                </PDFViewer>
            </Modal>

            <div className="w-full mx-auto rounded-md shadow-lg px-2 py-1 bg-white mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        Proforma Invoice
                        <ModeChip id={id} readOnly={readOnly} />
                    </h1>
                    <button
                        onClick={onClose}
                        className="text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="Back to Report"
                    >
                        <IoArrowBackCircleSharp className="w-7 h-7" />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-3">
                        <h2 className="text-xs font-bold text-gray-700 mb-2 uppercase">Basic Details</h2>
                        <div className="grid grid-cols-4 gap-2">
                            <TextInput name="Doc No" value={docId} disabled={true} />
                            <DateInputNew
                                name="Doc Date"
                                value={docDate}
                                setValue={setDocDate}
                                readOnly={readOnly}
                                required={true}
                            />
                            <DateInputNew
                                name="Delivery Date"
                                value={deliveryDate}
                                setValue={setDeliveryDate}
                                readOnly={readOnly}
                            />
                            <DropdownInput
                                name="Order No"
                                options={dropDownListObject(orderList?.data, "docId", "id")}
                                value={orderEntryId}
                                setValue={setOrderEntryId}
                                readOnly={readOnly}
                                required={true}
                            />
                        </div>
                    </div>

                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1 flex flex-col justify-center">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Grand Total</p>
                            <p className="text-4xl font-black text-emerald-600">
                                <span className="text-lg font-normal text-emerald-500 mr-1">₹</span>
                                {totalAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm mb-2 h-[55vh] overflow-auto">
                    <h2 className="text-xs font-bold text-gray-700 mb-2 uppercase">Invoice Items</h2>
                    <ProformaInvoiceItems
                        items={items}
                        setItems={setItems}
                        readOnly={readOnly}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
                        <h2 className="text-xs font-bold text-gray-700 mb-2 uppercase">Terms & Conditions</h2>
                        <DropdownInput
                            name="Select Terms Template"
                            options={dropDownListObject(termsData?.data, "name", "id")}
                            value={termsId}
                            setValue={setTermsId}
                            readOnly={readOnly}
                        />
                        <textarea
                            className="w-full mt-2 p-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            rows={4}
                            value={termsAndCondition}
                            onChange={(e) => setTermsAndCondition(e.target.value)}
                            readOnly={readOnly}
                            placeholder="Terms and conditions..."
                        />
                    </div>
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
                        <h2 className="text-xs font-bold text-gray-700 mb-2 uppercase">Remarks</h2>
                        <textarea
                            className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            rows={6}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            readOnly={readOnly}
                            placeholder="Internal remarks..."
                        />
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-2 border border-slate-200 p-2 py-3 bg-white rounded-md shadow-sm flex items-center justify-between gap-x-4">
                <div className="flex gap-2">
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            className="bg-emerald-600 text-white px-4 py-1 rounded-md hover:bg-emerald-700 flex items-center gap-2 text-xs transition-all shadow-sm"
                        >
                            <FiSave className="w-4 h-4" />
                            {id ? "Update Changes" : "Save Invoice"}
                        </button>
                    )}
                    {id && (
                        <button
                            onClick={() => setPrintModalOpen(true)}
                            className="bg-slate-600 text-white px-4 py-1 rounded-md hover:bg-slate-700 flex items-center gap-2 text-xs transition-all shadow-sm"
                        >
                            <FiFileText className="w-4 h-4" />
                            PDF Export
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    {id && readOnly && (
                        <button
                            className="bg-amber-500 text-white px-4 py-1 rounded-md hover:bg-amber-600 flex items-center gap-2 text-xs transition-all shadow-sm"
                            onClick={() => setReadOnly(false)}
                        >
                            <FiEdit2 className="w-4 h-4" />
                            Edit Invoice
                        </button>
                    )}
                    <button
                        onClick={onNew}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-1 rounded-md hover:bg-slate-50 flex items-center text-xs transition-all shadow-sm"
                    >
                        New Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProformaInvoiceForm;
