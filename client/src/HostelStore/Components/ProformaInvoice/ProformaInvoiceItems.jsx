import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { getCommonParams } from "../../../Utils/helper";
import { DropdownWithSearch } from "../../../Inputs";

const ProformaInvoiceItems = ({ items, setItems, readOnly }) => {
    const { companyId } = getCommonParams();
    const { data: styleItemList } = useGetStyleItemMasterQuery({ params: { companyId } });
    const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
    const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
    const { data: uomList } = useGetUomQuery({ params: { companyId } });

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                styleItemId: "",
                sizeId: "",
                uomId: "",
                gsmId: "",
                qty: 0,
                price: 0,
                taxPercent: 0,
                discountType: "PERCENTAGE",
                discountValue: 0,
                amount: 0,
            },
        ]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleInputChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Calculate amount
        const qty = parseFloat(newItems[index].qty) || 0;
        const price = parseFloat(newItems[index].price) || 0;
        const tax = parseFloat(newItems[index].taxPercent) || 0;
        const discValue = parseFloat(newItems[index].discountValue) || 0;
        const discType = newItems[index].discountType;

        let baseAmount = qty * price;
        let discount = 0;
        if (discType === "PERCENTAGE") {
            discount = (baseAmount * discValue) / 100;
        } else {
            discount = discValue;
        }

        let afterDiscount = baseAmount - discount;
        let taxAmount = (afterDiscount * tax) / 100;
        newItems[index].amount = (afterDiscount + taxAmount).toFixed(2);

        setItems(newItems);
    };

    return (
        <div className="overflow-x-auto h-full">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-emerald-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-emerald-800 uppercase w-8">S#</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-emerald-800 uppercase min-w-[180px]">Style Item</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-emerald-800 uppercase w-28">Size</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-emerald-800 uppercase w-20">UOM</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold text-emerald-800 uppercase w-20">GSM</th>
                        <th className="px-2 py-2 text-center text-[10px] font-bold text-emerald-800 uppercase w-20">Qty</th>
                        <th className="px-2 py-2 text-center text-[10px] font-bold text-emerald-800 uppercase w-24">Price</th>
                        <th className="px-2 py-2 text-center text-[10px] font-bold text-emerald-800 uppercase w-16">Tax%</th>
                        <th className="px-2 py-2 text-center text-[10px] font-bold text-emerald-800 uppercase w-32">Discount</th>
                        <th className="px-2 py-2 text-right text-[10px] font-bold text-emerald-800 uppercase w-28">Amount</th>
                        {!readOnly && (
                            <th className="px-2 py-2 text-center text-[10px] font-bold text-emerald-800 uppercase w-10">
                                <button
                                    onClick={handleAddItem}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-2 py-1 text-xs text-gray-500 font-medium">{index + 1}</td>
                            <td className="px-1 py-1">
                                <DropdownWithSearch
                                    value={item.styleItemId}
                                    setValue={(val) => handleInputChange(index, "styleItemId", val)}
                                    options={styleItemList?.data?.filter(p => p.active)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <DropdownWithSearch
                                    value={item.sizeId}
                                    setValue={(val) => handleInputChange(index, "sizeId", val)}
                                    options={sizeList?.data?.filter(p => p.active)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <DropdownWithSearch
                                    value={item.uomId}
                                    setValue={(val) => handleInputChange(index, "uomId", val)}
                                    options={uomList?.data?.filter(p => p.active)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <DropdownWithSearch
                                    value={item.gsmId}
                                    setValue={(val) => handleInputChange(index, "gsmId", val)}
                                    options={gsmList?.data?.filter(p => p.active)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <input
                                    type="number"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-center focus:ring-1 focus:ring-emerald-500"
                                    value={item.qty}
                                    onChange={(e) => handleInputChange(index, "qty", e.target.value)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <input
                                    type="number"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-right focus:ring-1 focus:ring-emerald-500"
                                    value={item.price}
                                    onChange={(e) => handleInputChange(index, "price", e.target.value)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <input
                                    type="number"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-center focus:ring-1 focus:ring-emerald-500"
                                    value={item.taxPercent}
                                    onChange={(e) => handleInputChange(index, "taxPercent", e.target.value)}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="px-1 py-1">
                                <div className="flex gap-1">
                                    <select
                                        className="text-[10px] border border-gray-300 rounded px-0.5 focus:ring-1 focus:ring-emerald-500"
                                        value={item.discountType}
                                        onChange={(e) => handleInputChange(index, "discountType", e.target.value)}
                                        disabled={readOnly}
                                    >
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">₹</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-right focus:ring-1 focus:ring-emerald-500"
                                        value={item.discountValue}
                                        onChange={(e) => handleInputChange(index, "discountValue", e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </td>
                            <td className="px-2 py-1 text-xs text-right font-bold text-slate-800">
                                {item.amount}
                            </td>
                            {!readOnly && (
                                <td className="px-2 py-1 text-center">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProformaInvoiceItems;
