import React, { useState, useEffect } from "react";
import FxSelect from "../../../Inputs";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { FiEye } from "react-icons/fi";
import { useGetSizeTemplateQuery } from "../../../redux/services/SizeTemplateMaster";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import Modal from "../../../UiComponents/Modal";

const ProformaInvoiceItems = ({
  items,
  enrichedItems,
  setItems,
  readOnly,
  taxTemplateId,
  id,
}) => {
  console.log("items", items);
  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { companyId },
  });
  const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
  const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
  const { data: uomList } = useGetUomQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({
    params: { companyId },
  });

  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  const EMPTY_ROW = {
    styleItemId: "",
    sizeId: "",
    uomId: "",
    gsmId: "",
    hsnId: "",
    qty: 0,
    price: 0,
    amount: 0, // Used for "Gross"
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const addRow = () => {
    setItems([...items, EMPTY_ROW]);
  };

  const deleteRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleInputChange = (value, index, field) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Calculate gross (amount)
    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].price) || 0;
    newItems[index].amount = (qty * price).toFixed(2);

    setItems(newItems);
  };

  const handleOpenSizeModal = (index) => {
    setActiveRowIndex(index);
    setSizeModalOpen(true);
  };

  // The padding to 14 elements is now handled synchronously in the parent (ProformaInvoiceForm)
  // to avoid a layout shift ("shake") when new data is loaded.

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          setCurrentSelectedIndex(null);
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedItems?.items || items}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          onCloseFocus={() => {}}
        />
      </Modal>

      {sizeModalOpen && activeRowIndex !== null && (
        <Modal
          isOpen={sizeModalOpen}
          onClose={() => setSizeModalOpen(false)}
          widthClass="w-[750px]"
        >
          <div className="bg-slate-100 p-3 rounded-lg">
            <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
              <h3 className="text-[16px] font-bold text-slate-800">
                {items[activeRowIndex]?.trackingType === "Barcode"
                  ? "Barcode Wise Breakup"
                  : items[activeRowIndex]?.trackingType ===
                      "Size Template + Barcode"
                    ? "Size + Barcode Wise Breakup"
                    : "Size Wise Breakup"}
              </h3>
              <button
                className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold shadow-sm"
                onClick={() => setSizeModalOpen(false)}
              >
                Done
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              {items[activeRowIndex]?.trackingType !== "Barcode" && (
                <div className="mb-3 bg-slate-50 p-2 border border-slate-200 rounded flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Size Template
                  </span>
                  <span className="text-[12px] font-bold text-slate-700">
                    {sizeTemplateList?.data?.find(
                      (t) => t.id === items[activeRowIndex]?.sizeTemplateId,
                    )?.name || "No Template Selected"}
                  </span>
                </div>
              )}
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-12">
                        S.No
                      </th>
                      {items[activeRowIndex]?.trackingType !== "Barcode" && (
                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                          Size
                        </th>
                      )}
                      {(items[activeRowIndex]?.trackingType === "Barcode" ||
                        items[activeRowIndex]?.trackingType ===
                          "Size Template + Barcode") && (
                        <>
                          <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                            Barcode From
                          </th>
                          <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                            Barcode To
                          </th>
                        </>
                      )}
                      <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-24">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items[activeRowIndex]?.sizeBreakup || []).map(
                      (breakup, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="border-b border-r border-slate-200 text-center text-[11px]">
                            {idx + 1}
                          </td>
                          {items[activeRowIndex]?.trackingType !==
                            "Barcode" && (
                            <td className="border-b border-r border-slate-200 text-left pl-1 text-[11px]">
                              {findFromList(
                                breakup.sizeId,
                                sizeList?.data,
                                "name",
                              )}
                            </td>
                          )}
                          {(items[activeRowIndex]?.trackingType === "Barcode" ||
                            items[activeRowIndex]?.trackingType ===
                              "Size Template + Barcode") && (
                            <>
                              <td className="border-b border-r border-slate-200 text-left pl-1  text-[11px]">
                                {breakup.barcodeFrom}
                              </td>
                              <td className="border-b border-r border-slate-200 text-left pl-1  text-[11px]">
                                {breakup.barcodeTo}
                              </td>
                            </>
                          )}
                          <td className="border-b border-r border-slate-200 text-right px-2 text-[11px]">
                            {Number(breakup.qty).toFixed(3)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td
                        colSpan={
                          items[activeRowIndex]?.trackingType === "Barcode"
                            ? 3
                            : items[activeRowIndex]?.trackingType ===
                                "Size Template + Barcode"
                              ? 4
                              : 2
                        }
                        className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]"
                      >
                        Total
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                        {(items[activeRowIndex]?.sizeBreakup || [])
                          .reduce((sum, b) => sum + (Number(b.qty) || 0), 0)
                          .toFixed(3)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <div className="w-full h-full overflow-y-auto bg-white">
        <table className="w-[80vw] border-collapse table-fixed min-h-full bg-white">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[11px]">
            <tr>
              <th className="w-6 px-1 py-1.5 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-48 px-2 py-1.5 text-center font-medium border border-gray-300">
                Description of Goods
              </th>
              <th className="w-16 px-2 py-1.5 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-20 px-2 py-1.5 text-center font-medium border border-gray-300">
                Type
              </th>
              <th className="w-14 px-1 py-1.5 text-center font-medium border border-gray-300">
                Size / Barcode
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Qty
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Price
              </th>
              <th className="w-16 px-1 py-1.5 text-center font-medium border border-gray-300">
                Gross
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Tax
              </th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => (
              <tr
                key={index}
                className={`h-7 hover:bg-indigo-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="text-[11px] text-center border border-gray-300">
                  {index + 1}
                </td>
                <td className="border border-gray-300 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-[11px]">
                  {findFromList(item.styleItemId, styleItemList?.data, "name")}
                </td>
                <td className="border border-gray-300 text-right pr-1 text-[11px]">
                  {findFromList(item.hsnId, hsnList?.data, "name")}
                </td>
                <td className="border border-gray-300 text-left pl-1 text-[11px]">
                  {item.trackingType || ""}
                </td>
                <td className="border border-gray-300 text-center">
                  <button
                    disabled={!item.styleItemId || item.trackingType === "None"}
                    className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors"
                    onClick={() => handleOpenSizeModal(index)}
                    title="View Size Breakup"
                  >
                    <FiEye size={16} className="inline" />
                  </button>
                </td>
                <td className="border border-gray-300 text-left pl-1 text-[11px]">
                  {findFromList(item.uomId, uomList?.data, "name")}
                </td>
                <td className="border border-gray-300 text-right px-1 text-[11px]">
                  {item.styleItemId ? (item.qty || 0).toFixed(3) : ""}
                </td>
                <td className="border border-gray-300 text-right px-1">
                  <input
                    type="number"
                    className="w-full text-[11px] text-right outline-none bg-transparent"
                    value={
                      focusedField === `${index}`
                        ? (item.price ?? "")
                        : item.price !== undefined &&
                            item.price !== null &&
                            item.price !== ""
                          ? Number(item.price).toFixed(2)
                          : ""
                    }
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "price")
                    }
                    readOnly={readOnly || !item.styleItemId}
                    onFocus={(e) => {
                      e.target.select();
                      setFocusedField(`${index}`);
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        handleInputChange("", index, "price");
                      } else {
                        const num = parseFloat(val);
                        handleInputChange(
                          isNaN(num) ? "" : Number(num).toFixed(2),
                          index,
                          "price",
                        );
                      }
                      setFocusedField(null);
                    }}
                  />
                </td>
                <td className="border border-gray-300 text-right px-1 text-[11px]">
                  {item.styleItemId ? Number(item.amount || 0).toFixed(2) : ""}
                </td>
                <td className="border border-gray-300 text-center text-[11px]">
                  <button
                    disabled={!item.styleItemId}
                    className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors"
                    onClick={() => {
                      if (!taxTemplateId) {
                        return Swal.fire({
                          title: "Information",
                          text: "Please select Tax Type",
                          icon: "info",
                          confirmButtonColor: "#3085d6",
                        });
                      }
                      setCurrentSelectedIndex(index);
                    }}
                  >
                    <FiEye size={16} className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 h-7 font-bold text-gray-800 text-[11px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={6}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0)
                  .toFixed(3)}
              </td>
              <td className="border border-gray-300"></td>
              <td className="text-right px-1 border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${contextMenu.mouseY}px`,
            left: `${contextMenu.mouseX}px`,
            boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
            padding: "4px",
            borderRadius: "4px",
            zIndex: 1000,
          }}
          className="bg-white border border-gray-200 shadow-xl"
          onMouseLeave={handleCloseContextMenu}
        >
          <div className="flex flex-col min-w-[100px]">
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-medium rounded transition-colors"
              onClick={() => {
                deleteRow(contextMenu.rowId);
                handleCloseContextMenu();
              }}
            >
              Delete Row
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                setItems(Array.from({ length: 14 }, () => ({ ...EMPTY_ROW })));
                handleCloseContextMenu();
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )} */}
    </>
  );
};

export default ProformaInvoiceItems;
