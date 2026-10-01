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

const SalesDeliveryItems = ({
  salesDeliveryItems,
  enrichedItems,
  setSalesDeliveryItems,
  readOnly,
  taxTemplateId,
  id,
  isSupplierOutside,
}) => {
  console.log("salesDeliveryItems", salesDeliveryItems);
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
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const addRow = () => {
    setSalesDeliveryItems([...salesDeliveryItems, EMPTY_ROW]);
  };

  const deleteRow = (index) => {
    setSalesDeliveryItems(salesDeliveryItems.filter((_, i) => i !== index));
  };

  const handleInputChange = (value, index, field) => {
    const newItems = [...salesDeliveryItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    setSalesDeliveryItems(newItems);
  };

  const handleOpenSizeModal = (index) => {
    setActiveRowIndex(index);
    setSizeModalOpen(true);
  };

  const handleContextMenu = (event, index) => {
    event.preventDefault();
    if (readOnly) return;
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      rowId: index,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const [sizeContextMenu, setSizeContextMenu] = useState(null);

  const handleSizeContextMenu = (event, breakupIndex) => {
    event.preventDefault();
    if (readOnly) return;
    setSizeContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      breakupIndex,
    });
  };

  const handleCloseSizeContextMenu = () => {
    setSizeContextMenu(null);
  };

  const handleSizeBreakupChange = (value, rowIndex, breakupIndex, field) => {
    const newItems = [...salesDeliveryItems];
    const newBreakup = [...(newItems[rowIndex].salesDeliveryBreakUp || [])];

    if (breakupIndex >= newBreakup.length) {
      for (let i = newBreakup.length; i <= breakupIndex; i++) {
        newBreakup.push({});
      }
    }

    if (field === "deliveryQty") {
      let numericValue = value === "" ? "" : Number(value);

      if (numericValue !== "") {
        const orderQty = Number(newBreakup[breakupIndex]?.qty) || 0;
        const alreadyDelivered =
          Number(newBreakup[breakupIndex]?.alreadyDeliveryQty) || 0;
        const maxAllowed = Math.max(0, orderQty - alreadyDelivered);

        if (numericValue > maxAllowed) {
          Swal.fire({
            title: "Quantity Exceeded",
            text: `Delivery Qty cannot exceed ${maxAllowed} (Order Qty: ${orderQty} - Already Delivered: ${alreadyDelivered})`,
            icon: "warning",
            confirmButtonColor: "#3085d6",
          });
          numericValue = maxAllowed;
        }
      }

      newBreakup[breakupIndex] = {
        ...newBreakup[breakupIndex],
        [field]: numericValue,
      };
    } else {
      newBreakup[breakupIndex] = {
        ...newBreakup[breakupIndex],
        [field]: value,
      };
    }

    newItems[rowIndex].salesDeliveryBreakUp = newBreakup;

    const totalDeliveryQty = newBreakup.reduce(
      (sum, b) => sum + (parseFloat(b.deliveryQty) || 0),
      0,
    );
    newItems[rowIndex].deliveryQty = totalDeliveryQty;

    setSalesDeliveryItems(newItems);
  };

  const deleteSizeBreakupRow = (breakupIndex) => {
    const newItems = [...salesDeliveryItems];
    const newBreakup = [
      ...(newItems[activeRowIndex].salesDeliveryBreakUp || []),
    ];
    newBreakup.splice(breakupIndex, 1);
    newItems[activeRowIndex].salesDeliveryBreakUp = newBreakup;

    const totalDeliveryQty = newBreakup.reduce(
      (sum, b) => sum + (parseFloat(b.deliveryQty) || 0),
      0,
    );
    newItems[activeRowIndex].deliveryQty = totalDeliveryQty;

    setSalesDeliveryItems(newItems);
  };

  // The padding to 14 elements is now handled synchronously in the parent (ProformaInvoiceForm)
  // to avoid a layout shift ("shake") when new data is loaded.

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          const index = currentSelectedIndex;
          setCurrentSelectedIndex(null);
          if (Number.isInteger(index)) {
            setTimeout(() => {
              document.getElementById(`tax-btn-${index}`)?.focus();
            }, 0);
          }
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={true}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedItems?.items || salesDeliveryItems}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          onCloseFocus={(index) => {
            // This is called by TaxDetailsFullTemplate when Enter is pressed on the last field
            setCurrentSelectedIndex(null); // Ensure modal is closed
            setTimeout(() => {
              const nextIndex = index + 1;
              const nextSizeBtn = document.getElementById(
                `size-btn-${nextIndex}`,
              );

              if (nextSizeBtn && items[nextIndex]?.styleItemId) {
                nextSizeBtn.focus();
              } else {
                document.getElementById("termsAndCondition")?.focus();
              }
            }, 50); // Small delay to allow modal to unmount
          }}
        />
      </Modal>

      {sizeModalOpen && activeRowIndex !== null && (
        <Modal
          isOpen={sizeModalOpen}
          onClose={() => {
            const index = activeRowIndex;
            setSizeModalOpen(false);
            setTimeout(() => {
              document.getElementById(`price-input-${index}`)?.focus();
            }, 0);
          }}
          widthClass="w-[850px]"
        >
          <div className="bg-slate-100 p-3 rounded-lg">
            <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
              <h3 className="text-[16px] font-bold text-slate-800">
                {console.log(
                  "salesDeliveryBreakup",
                  salesDeliveryItems[activeRowIndex]?.salesDeliveryBreakUp,
                )}
                {salesDeliveryItems[activeRowIndex]?.trackingType === "Barcode"
                  ? "Barcode Wise Breakup"
                  : salesDeliveryItems[activeRowIndex]?.trackingType ===
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
              {/* {salesDeliveryItems[activeRowIndex]?.trackingType !== "Barcode" && (
                <div className="mb-3 bg-slate-50 p-2 border border-slate-200 rounded flex salesDeliveryItems-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Size Template
                  </span>
                  <span className="text-[12px] font-bold text-slate-700">
                    {sizeTemplateList?.data?.find(
                      (t) => t.id === salesDeliveryItems[activeRowIndex]?.sizeTemplateId,
                    )?.name || "No Template Selected"}
                  </span>
                </div>
              )} */}
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full table-fixed border-separate border-spacing-0 border-t border-l border-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-12">
                        S.No
                      </th>
                      {salesDeliveryItems[activeRowIndex]?.trackingType !==
                        "Barcode" && (
                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                          Size
                        </th>
                      )}
                      {(salesDeliveryItems[activeRowIndex]?.trackingType ===
                        "Barcode" ||
                        salesDeliveryItems[activeRowIndex]?.trackingType ===
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
                        Order Qty
                      </th>
                      <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-36">
                        Already Deliverd Qty
                      </th>
                      <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-24">
                        Delivery Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const actualRows =
                        salesDeliveryItems[activeRowIndex]
                          ?.salesDeliveryBreakUp || [];
                      if (actualRows.length >= 5) return actualRows;
                      return [
                        ...actualRows,
                        ...Array(5 - actualRows.length).fill({}),
                      ];
                    })().map((breakup, idx) => (
                      <tr
                        key={idx}
                        className="h-8"
                        onContextMenu={(e) => handleSizeContextMenu(e, idx)}
                      >
                        <td className="border-b border-r border-slate-200 text-center text-[11px]">
                          {idx + 1}
                        </td>
                        {salesDeliveryItems[activeRowIndex]?.trackingType !==
                          "Barcode" && (
                          <td className="border-b border-r border-slate-200 text-left pl-1 text-[11px]">
                            {findFromList(
                              breakup.sizeId,
                              sizeList?.data,
                              "name",
                            )}
                          </td>
                        )}
                        {(salesDeliveryItems[activeRowIndex]?.trackingType ===
                          "Barcode" ||
                          salesDeliveryItems[activeRowIndex]?.trackingType ===
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
                          {breakup.qty !== undefined ? Number(breakup.qty) : ""}
                        </td>
                        <td className="border-b border-r border-slate-200 text-right px-2 text-[11px]">
                          {breakup.alreadyDeliveryQty !== undefined
                            ? Number(breakup.alreadyDeliveryQty)
                            : ""}
                        </td>
                        <td className="border-b border-r border-slate-200 text-right px-1 text-[11px]">
                          <input
                            type="number"
                            className="w-full text-right outline-none bg-transparent"
                            value={breakup.deliveryQty ?? ""}
                            onChange={(e) =>
                              handleSizeBreakupChange(
                                e.target.value,
                                activeRowIndex,
                                idx,
                                "deliveryQty",
                              )
                            }
                            readOnly={readOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td
                        colSpan={
                          salesDeliveryItems[activeRowIndex]?.trackingType ===
                          "Barcode"
                            ? 3
                            : salesDeliveryItems[activeRowIndex]
                                  ?.trackingType === "Size Template + Barcode"
                              ? 4
                              : 2
                        }
                        className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]"
                      >
                        Total
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                        {(
                          salesDeliveryItems[activeRowIndex]
                            ?.salesDeliveryBreakUp || []
                        ).reduce((sum, b) => sum + (Number(b.qty) || 0), 0)}
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                        {(
                          salesDeliveryItems[activeRowIndex]
                            ?.salesDeliveryBreakUp || []
                        ).reduce(
                          (sum, b) => sum + (Number(b.alreadyDeliveryQty) || 0),
                          0,
                        )}
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                        {(
                          salesDeliveryItems[activeRowIndex]
                            ?.salesDeliveryBreakUp || []
                        ).reduce(
                          (sum, b) => sum + (Number(b.deliveryQty) || 0),
                          0,
                        )}
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
        <table className="w-[88vw] border-collapse table-fixed min-h-full bg-white">
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
                Order Qty
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Delivery Qty
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Price
              </th>
              <th className="w-16 px-1 py-1.5 text-center font-medium border border-gray-300">
                Gross Amt
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Tax
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Tax %
              </th>
              <th className="w-12 px-1 py-1.5 text-center font-medium border border-gray-300">
                Net Amt
              </th>
            </tr>
          </thead>
          <tbody>
            {salesDeliveryItems?.map((item, index) => {
              const isFilled = !!item.styleItemId;
              const enrichedIdx =
                salesDeliveryItems
                  .slice(0, index + 1)
                  .filter((i) => i.styleItemId).length - 1;
              const enrichedItem =
                isFilled && enrichedItems?.items
                  ? enrichedItems.items[enrichedIdx]
                  : null;

              let taxPercentStr = "";
              let netAmountStr = "";

              if (enrichedItem) {
                const taxPct = Number(enrichedItem._taxPct) || 0;
                taxPercentStr = `${taxPct}%`;
                netAmountStr = enrichedItem.totals?.net?.toFixed(2) || "";
              }

              return (
                <tr
                  key={index}
                  className={`h-7 hover:bg-indigo-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                >
                  <td className="text-[11px] text-center border border-gray-300">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-[11px]">
                    {findFromList(
                      item.styleItemId,
                      styleItemList?.data,
                      "name",
                    )}
                  </td>
                  <td className="border border-gray-300 text-right pr-1 text-[11px]">
                    {findFromList(item.hsnId, hsnList?.data, "name")}
                  </td>
                  <td className="border border-gray-300 text-left pl-1 text-[11px]">
                    {item.trackingType || ""}
                  </td>
                  <td className="border border-gray-300 text-center">
                    <button
                      id={`size-btn-${index}`}
                      disabled={
                        !item.styleItemId || item.trackingType === "None"
                      }
                      className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      onClick={() => handleOpenSizeModal(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenSizeModal(index);
                        }
                      }}
                      title="View Size Breakup"
                    >
                      <FiEye size={16} className="inline" />
                    </button>
                  </td>
                  <td className="border border-gray-300 text-left pl-1 text-[11px]">
                    {findFromList(item.uomId, uomList?.data, "name")}
                  </td>
                  <td className="border border-gray-300 text-right px-1 text-[11px]">
                    {item?.qty || ""}
                  </td>
                  <td className="border border-gray-300 text-right px-1 text-[11px]">
                    {item?.deliveryQty || ""}
                  </td>
                  <td className="border border-gray-300 text-right px-1 grid-editable-cell">
                    <input
                      id={`price-input-${index}`}
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
                      readOnly={true}
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
                    {item.styleItemId
                      ? parseFloat(item.deliveryQty * item.price || 0).toFixed(
                          2,
                        )
                      : ""}
                  </td>
                  <td className="border border-gray-300 text-center text-[11px]">
                    <button
                      id={`tax-btn-${index}`}
                      disabled={!item.styleItemId}
                      className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors outline-none focus:ring-2 focus:ring-indigo-500 rounded"
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!taxTemplateId) {
                            return Swal.fire({
                              title: "Information",
                              text: "Please select Tax Type",
                              icon: "info",
                              confirmButtonColor: "#3085d6",
                            });
                          }
                          setCurrentSelectedIndex(index);
                        }
                      }}
                    >
                      <FiEye size={16} className="inline" />
                    </button>
                  </td>
                  <td className="border border-gray-300 text-right pr-1 text-[11px] ">
                    {taxPercentStr}
                  </td>
                  <td className="border border-gray-300 text-right pr-1 text-[11px] ">
                    {netAmountStr}
                  </td>
                </tr>
              );
            })}
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
                {salesDeliveryItems?.reduce(
                  (sum, i) => sum + (parseFloat(i.qty) || 0),
                  0,
                )}
              </td>
              <td className="text-right px-1 border border-gray-300">
                {salesDeliveryItems?.reduce(
                  (sum, i) => sum + (parseFloat(i.deliveryQty) || 0),
                  0,
                )}
              </td>
              <td className="text-right pr-1 border border-gray-300">
                {salesDeliveryItems?.reduce(
                  (sum, i) => sum + (parseFloat(i.price) || 0),
                  0,
                )}
              </td>
              <td className="text-right px-1 border border-gray-300">
                {salesDeliveryItems
                  ?.reduce(
                    (sum, i) =>
                      sum +
                      (parseFloat(i.deliveryQty) || 0) *
                        (parseFloat(i.price) || 0),
                    0,
                  )
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300"></td>
              <td className="border border-gray-300"></td>
              <td className="text-right px-1 border border-gray-300 text-[11px]">
                {enrichedItems?.net?.toFixed(2) || ""}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {sizeContextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${sizeContextMenu.mouseY}px`,
            left: `${sizeContextMenu.mouseX}px`,
            boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
            padding: "4px",
            borderRadius: "4px",
            zIndex: 10000,
          }}
          className="bg-white border border-gray-200 shadow-xl"
          onMouseLeave={handleCloseSizeContextMenu}
        >
          <div className="flex flex-col min-w-[100px]">
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-medium rounded transition-colors"
              onClick={() => {
                deleteSizeBreakupRow(sizeContextMenu.breakupIndex);
                handleCloseSizeContextMenu();
              }}
            >
              Delete Row
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                const newItems = [...items];
                newItems[activeRowIndex].salesDeliveryBreakUp = [];

                setSalesDeliveryItems(newItems);
                handleCloseSizeContextMenu();
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {contextMenu && (
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
                setSalesDeliveryItems(
                  Array.from({ length: 14 }, () => ({ ...EMPTY_ROW })),
                );
                handleCloseContextMenu();
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesDeliveryItems;
