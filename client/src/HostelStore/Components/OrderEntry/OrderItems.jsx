import React, { useState, useEffect } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import Swal from "sweetalert2";
import { Gsm, StyleItemMaster, UomMaster, ItemGroup } from "..";
import { FiEye, FiImage } from "react-icons/fi";
import Modal from "../../../UiComponents/Modal";
import { getImageUrlPath } from "../../../Constants/index.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService";
import OrderStyleItems from "./OrderStyleItems";

const OrderItems = ({
  orderItems,
  setOrderItems,
  readOnly,
  styleItemList,
  sizeList,
  uomList,
  id,
}) => {
  const { companyId } = getCommonParams();
  const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({
    params: { companyId },
  });
  console.log(orderItems, "orderItems");

  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewImageTitle, setPreviewImageTitle] = useState("");

  const handleOpenImagePreview = (url, title) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setPreviewImageTitle(title || "Style Item Image");
    setImagePreviewModalOpen(true);
  };

  const EMPTY_ROW = {
    itemGroupId: "",
    styleItemId: "",
    uomId: "",
    hsnId: "",
    orderQty: "",
    price: "",
    remarks: "",
    description: "",
    orderStyleItems: [],
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);

  useEffect(() => {
    if (!styleModalOpen && pendingFocus !== null) {
      const targetIndex = pendingFocus;
      setTimeout(() => {
        const element = document.getElementById(`price-input-${targetIndex}`);
        if (element) {
          element.focus();
          element.select?.();
        }
      }, 100);
      setPendingFocus(null);
    }
  }, [styleModalOpen, pendingFocus]);

  const handleOpenStyleModal = (index) => {
    setActiveRowIndex(index);
    setStyleModalOpen(true);
    setPendingFocus(index);
  };

  const handleCloseStyleModal = () => {
    setStyleModalOpen(false);
  };

  const handleSaveStyles = (validStyles, totalQty) => {
    if (activeRowIndex === null) return;
    setPendingFocus(activeRowIndex);
    setOrderItems((prev) => {
      const newRows = [...prev];
      const currentRow = { ...newRows[activeRowIndex] };
      currentRow.orderStyleItems = validStyles;
      currentRow.orderQty = totalQty;
      newRows[activeRowIndex] = currentRow;
      return newRows;
    });
  };

  const addRow = () => {
    const newIndex = orderItems?.length || 0;
    setOrderItems([...(orderItems || []), EMPTY_ROW]);
    setTimeout(() => {
      const nextEl = document.getElementById(`styleItemId-input-${newIndex}`);
      if (nextEl) nextEl.focus();
    }, 50);
  };

  const deleteRow = (index) => {
    setOrderItems((prev) => {
      if (!prev || prev.length <= 8) {
        return (prev || []).map((item, i) =>
          i === index ? { ...EMPTY_ROW } : item,
        );
      }
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length < 8) {
        const padding = Array.from({ length: 8 - filtered.length }, () => ({
          ...EMPTY_ROW,
        }));
        return [...filtered, ...padding];
      }
      return filtered;
    });
  };

  const handleInputChange = (value, index, field) => {
    const newRows = [...orderItems];
    let updatedRow = { ...newRows[index], [field]: value };

    // Auto-fill Item Group, UOM, GSM, and HSN when item is chosen
    if (field === "styleItemId" && value) {
      const isDuplicate = orderItems.some(
        (row, idx) => idx !== index && row.styleItemId === value,
      );

      if (isDuplicate) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Item",
          text: "This item is already added to the order. Each style item must be unique.",
          timer: 2500,
        });
        return;
      }

      const selectedItem = styleItemList?.data?.find(
        (item) => item.id === value,
      );
      if (selectedItem) {
        updatedRow = {
          ...updatedRow,
          itemGroupId: selectedItem.itemGroupId || "",
          uomId: selectedItem.uomId || "",

          hsnId: selectedItem.hsnId || "",
          price: selectedItem.price?.toFixed(2) || "",
          orderStyleItems: [],
          orderQty: "",
          description: "",
        };
      } else {
        updatedRow = {
          ...updatedRow,
          orderStyleItems: [],
          orderQty: "",
        };
      }
    }

    newRows[index] = updatedRow;
    setOrderItems(newRows);
  };

  const handleRightClick = (event, rowIndex) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteAllRows = () => {
    setOrderItems(Array.from({ length: 8 }, () => ({ ...EMPTY_ROW })));
  };

  return (
    <>
      <div className="w-full h-full overflow-y-auto mb-2 bg-white border border-slate-200 rounded-md">
        <table className="w-[98vw] border-separate border-spacing-0 table-fixed border-l border-gray-300">
          <thead className="sticky top-0 z-20 bg-gray-200 text-gray-800 text-[12px] shadow-[0_-2px_0_0_#e5e7eb]">
            <tr className="sticky top-0 z-20 bg-gray-200">
              <th className="sticky top-0 z-20 bg-gray-200 w-6 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                S.No
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-[400px] px-2 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Description of Goods
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-44 px-2 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Item Group
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-24 px-2 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                HSN
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-20 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Style
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-24 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                UOM
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-24 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Qty
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-24 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Price
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-16 px-1 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Image
              </th>
              <th className="sticky top-0 z-20 bg-gray-200 w-full px-2 py-1 text-center font-medium border-t border-b border-r border-gray-300 text-[11px]">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems?.map((row, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} h-7 cursor-pointer hover:bg-indigo-50`}
                onContextMenu={(e) => !readOnly && handleRightClick(e, index)}
              >
                <td className="text-[11px] text-center border-b border-r border-gray-300">
                  {index + 1}
                </td>

                <td className="border-b border-r border-gray-300 grid-editable-cell">
                  <FxSelectWithAdd
                    inputId={`styleItemId-input-${index}`}
                    value={row.styleItemId}
                    onChange={(val) => {
                      handleInputChange(val, index, "styleItemId");
                      setTimeout(() => {
                        const nextEl = document.getElementById(
                          `style-btn-${index}`,
                        );
                        if (nextEl) {
                          nextEl.focus();
                        }
                      }, 100);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!row.styleItemId) {
                          e.preventDefault();
                          const reqEl =
                            document.getElementById("remarks") ||
                            document.getElementById("customerRequirements");
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else {
                          e.preventDefault();
                          const nextEl = document.getElementById(
                            `style-btn-${index}`,
                          );
                          if (nextEl) nextEl.focus();
                        }
                      }
                    }}
                    options={(styleItemList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={readOnly}
                    placeholder=""
                    addNew={true}
                    childComponent={StyleItemMaster}
                    addNewModalWidth="w-[1050px] max-w-[95vw]"
                  />
                </td>

                <td className="border-b border-r border-gray-300">
                  <span className="w-full text-[11px] text-left pl-1 outline-none bg-transparent">
                    {findFromList(
                      row.itemGroupId,
                      itemGroupList?.data,
                      "name",
                    ) || ""}
                  </span>
                </td>
                <td className="border-b border-r border-gray-300">
                  <span className="w-full block text-[11px] text-right pr-1 outline-none bg-transparent">
                    {findFromList(row.hsnId, hsnList?.data, "name") || ""}
                  </span>
                </td>

                {/* Style Eye Icon Column */}
                <td className="border-b border-r border-gray-300 text-center items-center">
                  <button
                    id={`style-btn-${index}`}
                    type="button"
                    onClick={() => handleOpenStyleModal(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !readOnly) {
                        e.preventDefault();
                        handleOpenStyleModal(index);
                      }
                    }}
                    disabled={!row.styleItemId}
                    className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
                    title="View Styles & Breakup"
                  >
                    <FiEye size={18} />
                  </button>
                </td>

                <td className="border-b border-r border-gray-300">
                  <span className="w-full text-[11px] text-left pl-1 outline-none bg-transparent">
                    {findFromList(row.uomId, uomList?.data, "name") || ""}
                  </span>
                </td>

                {/* Qty Column */}
                <td className="border-b border-r border-gray-300 grid-editable-cell">
                  <input
                    id={`orderQty-input-${index}`}
                    type="number"
                    className="w-full h-full text-[11px] text-right px-1 outline-none bg-transparent"
                    onFocus={(e) => {
                      e.target.select();
                      setFocusedField(`${index}`);
                    }}
                    value={
                      focusedField === `${index}`
                        ? (row?.orderQty ?? "")
                        : row?.orderQty !== undefined &&
                            row?.orderQty !== null &&
                            row?.orderQty !== ""
                          ? Number(row.orderQty)
                          : ""
                    }
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "orderQty")
                    }
                    onBlur={(e) => {
                      setFocusedField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!row.styleItemId) {
                          e.preventDefault();
                          const reqEl =
                            document.getElementById("remarks") ||
                            document.getElementById("customerRequirements");
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (index === orderItems.length - 1) {
                            addRow();
                          } else {
                            const nextStyleEl = document.getElementById(
                              `styleItemId-input-${index + 1}`,
                            );
                            if (nextStyleEl) nextStyleEl.focus();
                          }
                        }
                      }
                    }}
                    disabled={
                      readOnly ||
                      ((row.orderStyleItems || row.styleItems) &&
                        (row.orderStyleItems || row.styleItems).length > 0 &&
                        (row.orderStyleItems || row.styleItems).some(
                          (s) => Number(s.orderQty) > 0,
                        ))
                    }
                    readOnly={
                      readOnly ||
                      ((row.orderStyleItems || row.styleItems) &&
                        (row.orderStyleItems || row.styleItems).length > 0 &&
                        (row.orderStyleItems || row.styleItems).some(
                          (s) => Number(s.orderQty) > 0,
                        ))
                    }
                  />
                </td>

                {/* Price Column */}
                <td className="border-b border-r border-gray-300 grid-editable-cell">
                  <input
                    id={`price-input-${index}`}
                    value={row?.price || ""}
                    className="w-full text-[11px] text-right pr-1 outline-none bg-transparent"
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "price")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!row.styleItemId) {
                          e.preventDefault();
                          const reqEl =
                            document.getElementById("remarks") ||
                            document.getElementById("customerRequirements");
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (index === orderItems.length - 1) {
                            addRow();
                          } else {
                            const nextStyleEl = document.getElementById(
                              `styleItemId-input-${index + 1}`,
                            );
                            if (nextStyleEl) nextStyleEl.focus();
                          }
                        }
                      }
                    }}
                    onFocus={(e) => {
                      e.target.select();
                      setFocusedField(`${index}`);
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      handleInputChange(
                        val ? Number(val).toFixed(2) : "",
                        index,
                        "price",
                      );
                      setFocusedField(null);
                    }}
                    disabled={readOnly}
                  />
                </td>

                {/* Image Column */}
                <td className="border-b border-r border-gray-300 text-center px-1 py-0.5 w-16">
                  {(() => {
                    const currentStyleItem = styleItemList?.data?.find(
                      (item) => item.id === row?.styleItemId,
                    );
                    const rawImage = currentStyleItem?.styleImage;
                    const imgUrl = rawImage ? getImageUrlPath(rawImage) : null;
                    const itemName = currentStyleItem?.name || "Style Item";

                    if (!imgUrl) {
                      return (
                        <div className="flex items-center justify-center text-gray-300 text-[11px]">
                          -
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenImagePreview(imgUrl, itemName);
                          }}
                          className="relative group p-0.5 rounded border border-gray-200 hover:border-indigo-500 bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-none"
                          title="Click to preview image"
                        >
                          <img
                            src={imgUrl}
                            alt={itemName}
                            className="w-5 h-4 object-cover rounded-xs"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/35 rounded-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <FiEye className="text-white w-3 h-3" />
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </td>

                {/* Remarks Column */}
                <td className="border-b border-r border-gray-300 grid-editable-cell">
                  <input
                    id={`remarks-input-${index}`}
                    type="text"
                    className="w-full h-full text-[11px] outline-none px-1 bg-transparent"
                    value={row.remarks || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "remarks")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (index === orderItems.length - 1) {
                          addRow();
                        } else {
                          const nextStyleEl = document.getElementById(
                            `styleItemId-input-${index + 1}`,
                          );
                          if (nextStyleEl) nextStyleEl.focus();
                        }
                      } else if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        const footerRemarks =
                          document.getElementById("remarks") ||
                          document.getElementById("customerRequirements");
                        if (footerRemarks) {
                          footerRemarks.focus();
                          footerRemarks.select?.();
                        }
                      }
                    }}
                    disabled={readOnly}
                    placeholder="Remarks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-20 bg-gray-100">
            <tr className="bg-gray-100 h-7 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border-b border-r border-gray-300"
                colSpan={6}
              >
                Total
              </td>
              <td className="text-right px-1 border-b border-r border-gray-300 text-black">
                {orderItems?.reduce(
                  (sum, row) => sum + (Number(row.orderQty) || 0),
                  0,
                )}
              </td>
              <td className="text-right px-1 border-b border-r border-gray-300 text-black">
                {orderItems
                  ?.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="border-b border-r border-gray-300"></td>
              <td className="border-b border-r border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>

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
              Delete
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                handleDeleteAllRows();
                handleCloseContextMenu();
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Style & Breakup Master-Detail Modal */}
      {styleModalOpen && activeRowIndex !== null && (
        <OrderStyleItems
          isOpen={styleModalOpen}
          onClose={handleCloseStyleModal}
          parentItem={orderItems[activeRowIndex]}
          onSaveStyles={handleSaveStyles}
          readOnly={readOnly}
          styleItemList={styleItemList}
          uomList={uomList}
          id={id}
        />
      )}

      {/* Image Preview Modal */}
      {imagePreviewModalOpen && (
        <Modal
          isOpen={imagePreviewModalOpen}
          onClose={() => setImagePreviewModalOpen(false)}
          widthClass="w-[550px] max-w-[90vw]"
        >
          <div className="bg-slate-100 p-3 rounded-lg">
            <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-xs">
              <div className="flex items-center gap-2">
                <FiImage className="text-indigo-600 w-4 h-4" />
                <h3 className="text-[14px] font-bold text-slate-800 truncate max-w-[400px]">
                  {previewImageTitle
                    ? `${previewImageTitle} - Image Preview`
                    : "Style Item Image"}
                </h3>
              </div>
              <button
                type="button"
                className="bg-white text-indigo-600 border border-indigo-600 px-3 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors shadow-2xs cursor-pointer"
                onClick={() => setImagePreviewModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200 flex items-center justify-center min-h-[250px] max-h-[70vh] overflow-auto">
              <img
                src={previewImageUrl}
                alt={previewImageTitle || "Style Item"}
                className="max-h-[65vh] max-w-full object-contain rounded shadow-md"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default OrderItems;
