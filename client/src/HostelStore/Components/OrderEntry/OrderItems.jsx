import React, { useState, useEffect } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import Swal from "sweetalert2";
import { Gsm, Size, StyleItemMaster, UomMaster } from "..";
import { FiEye, FiImage } from "react-icons/fi";
import Modal from "../../../UiComponents/Modal";
import { getImageUrlPath } from "../../../Constants/index.js";
import {
  useGetSizeTemplateQuery,
  useLazyGetSizeTemplateByIdQuery,
} from "../../../redux/services/SizeTemplateMaster";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService";
import { ItemGroup } from "..";

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
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({
    params: { companyId },
  });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({
    params: { companyId },
  });
  const [triggerGetTemplateById] = useLazyGetSizeTemplateByIdQuery();

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
    trackingType: "Size",
    sizeTemplateId: "",
    uomId: "",
    gsmId: "",
    hsnId: "",
    orderQty: "",
    price: "",
    StyleItem: null,
    remarks: "",
    description: "",
    sizeBreakup: [],
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);

  useEffect(() => {
    if (!sizeModalOpen && pendingFocus !== null) {
      const element = document.getElementById(`remarks-input-${pendingFocus}`);
      if (element) {
        element.focus();
        element.select();
      }
      setPendingFocus(null);
    }
  }, [sizeModalOpen, pendingFocus]);

  useEffect(() => {
    if (sizeModalOpen && activeRowIndex !== null) {
      setTimeout(() => {
        const trackingType = orderItems[activeRowIndex]?.trackingType;
        let elementId = "";
        if (trackingType === "Barcode") {
          elementId = "barcodeFrom-0";
        } else if (trackingType === "Size") {
          elementId = "sizeQty-0";
        } else if (trackingType === "Size + Barcode") {
          elementId = "sizeBarcodeFrom-0";
        }

        if (elementId) {
          const element = document.getElementById(elementId);
          if (element) {
            element.focus();
            element.select?.();
          }
        }
      }, 200);
    }
  }, [sizeModalOpen, activeRowIndex]);

  const handleCloseSizeModal = () => {
    setSizeModalOpen(false);
  };

  const handleOpenSizeModal = async (index) => {
    setActiveRowIndex(index);
    setSizeModalOpen(true);
    setPendingFocus(index);

    setOrderItems((prev) => {
      const newRows = [...prev];
      if (newRows[index]) {
        let currentBreakup = [...(newRows[index].sizeBreakup || [])];

        // Ensure at least 5 rows initially
        const minRows = 5;
        if (currentBreakup.length < minRows) {
          const padding = Array.from(
            { length: minRows - currentBreakup.length },
            () => ({
              sizeId: null,
              qty: "",
              barcodeFrom: "",
              barcodeTo: "",
            }),
          );
          currentBreakup = [...currentBreakup, ...padding];
        }

        newRows[index].sizeBreakup = currentBreakup;
      }
      return newRows;
    });
  };

  const handleTemplateChange = async (templateId) => {
    let newBreakup = [];
    if (templateId) {
      try {
        const response = await triggerGetTemplateById(templateId).unwrap();
        const template = response?.data;
        if (template && template.SizeTemplateList) {
          newBreakup = template.SizeTemplateList.map((t) => ({
            sizeId: t.sizeId,
            qty: "",
            barcodeFrom: "",
            barcodeTo: "",
          }));
        }
      } catch (e) {
        console.error("Failed to fetch Size details", e);
      }
    }

    setOrderItems((prev) => {
      const newRows = [...prev];
      if (activeRowIndex !== null && newRows[activeRowIndex]) {
        newRows[activeRowIndex] = {
          ...newRows[activeRowIndex],
          sizeTemplateId: templateId,
          sizeBreakup: newBreakup,
          orderQty: 0,
        };
      }
      return newRows;
    });
  };

  const handleSizeBreakupChange = (sizeIndex, field, value) => {
    const newRows = [...orderItems];
    const currentRow = { ...newRows[activeRowIndex] };
    const newBreakup = [...(currentRow.sizeBreakup || [])];
    newBreakup[sizeIndex] = { ...newBreakup[sizeIndex], [field]: value };

    currentRow.sizeBreakup = newBreakup;

    if (field === "qty") {
      const totalQty = newBreakup.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      );
      currentRow.orderQty = totalQty;
    }

    // Sync barcode ranges back to main row for simple Barcode tracking
    if (currentRow.trackingType === "Barcode") {
      if (field === "barcodeFrom") currentRow.barcodeFrom = value;
      if (field === "barcodeTo") currentRow.barcodeTo = value;
    }

    newRows[activeRowIndex] = currentRow;
    setOrderItems(newRows);
  };

  const addRow = () => {
    setOrderItems([...orderItems, EMPTY_ROW]);
  };

  const deleteRow = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleInputChange = (value, index, field) => {
    const newRows = [...orderItems];
    let updatedRow = { ...newRows[index], [field]: value };

    // Clear previous tracking data if tracking type is changed
    if (field === "trackingType") {
      updatedRow.sizeBreakup = [];
      updatedRow.barcodeFrom = "";
      updatedRow.barcodeTo = "";
      updatedRow.orderQty = "";
      updatedRow.sizeTemplateId = "";
    }

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
          gsmId: selectedItem.gsmId || "",
          hsnId: selectedItem.hsnId || "",
          sizeTemplateId: selectedItem.sizeTemplateId || "",
          price: selectedItem.price?.toFixed(2) || "",
          StyleItem: selectedItem,
          sizeBreakup: [],
          orderQty: "",
          barcodeFrom: "",
          barcodeTo: "",
          description: "",
        };
      } else {
        updatedRow = {
          ...updatedRow,
          StyleItem: null,
        };
      }
    }

    newRows[index] = updatedRow;
    setOrderItems(newRows);
  };

  const deleteModalRow = (index) => {
    setOrderItems((prev) => {
      const newRows = [...prev];
      const currentRow = { ...newRows[activeRowIndex] };
      const currentBreakup = currentRow.sizeBreakup || [];

      let newBreakup;
      if (currentBreakup.length <= 5) {
        newBreakup = currentBreakup.map((item, i) => {
          if (i === index) {
            return {
              sizeId: null,
              qty: "",
              barcodeFrom: "",
              barcodeTo: "",
            };
          }
          return item;
        });
      } else {
        newBreakup = currentBreakup.filter((_, i) => i !== index);
      }

      currentRow.sizeBreakup = newBreakup;
      currentRow.orderQty = newBreakup.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      );
      newRows[activeRowIndex] = currentRow;
      return newRows;
    });
  };

  const deleteModalAllRows = () => {
    setOrderItems((prev) => {
      const newRows = [...prev];
      const currentRow = { ...newRows[activeRowIndex] };

      currentRow.sizeBreakup = Array.from({ length: 5 }, () => ({
        sizeId: null,
        qty: "",
        barcodeFrom: "",
        barcodeTo: "",
      }));

      currentRow.orderQty = 0;
      newRows[activeRowIndex] = currentRow;
      return newRows;
    });
  };

  const addModalRow = () => {
    setOrderItems((prev) => {
      const newRows = [...prev];
      const currentRow = { ...newRows[activeRowIndex] };
      currentRow.sizeBreakup = [
        ...(currentRow.sizeBreakup || []),
        { sizeId: null, qty: "", barcodeFrom: "", barcodeTo: "" },
      ];
      newRows[activeRowIndex] = currentRow;
      return newRows;
    });
  };

  const handleRightClick = (event, rowIndex, type) => {
    event.preventDefault();
    // If it's a modal row, allow right-click for any tracking type
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
      type,
    });
  };

  const deleteSelectedRows = () => {
    setOrderItems((rows) => rows.filter((r) => !r.selected));
    setContextMenu(null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteAllRows = () => {
    setOrderItems(Array.from({ length: 14 }, () => ({ ...EMPTY_ROW })));
  };

  // Row initialization is now handled in the parent OrderEntryForm

  return (
    <>
      <div className="w-full h-full overflow-y-auto mb-2 bg-white border border-slate-200 rounded-md">
        <table className="w-[98vw] border-collapse table-fixed">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-6 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                S.No
              </th>
              <th className="w-[400px] px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Description of Goods
              </th>
              <th className="w-44 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Item Group
              </th>
              <th className="w-24 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                HSN
              </th>
              <th className="w-28 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Type
              </th>
              <th className="w-24 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Size / Barcode
              </th>
              <th className="w-24 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                UOM
              </th>
              <th className="w-24 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Qty
              </th>
              <th className="w-24 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Price
              </th>
              <th className="w-16 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Image
              </th>
              <th className="w-full px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems?.map((row, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} h-7 border border-gray-200 cursor-pointer hover:bg-indigo-50`}
                onContextMenu={(e) =>
                  !readOnly && handleRightClick(e, index, "")
                }
              >
                <td className="text-[11px] text-center border border-gray-300">
                  {index + 1}
                </td>

                <td className="border border-gray-300 grid-editable-cell">
                  <FxSelectWithAdd
                    inputId={`styleItemId-input-${index}`}
                    value={row.styleItemId}
                    onChange={(val) => {
                      handleInputChange(val, index, "styleItemId");
                      // Automatically focus tracking type after style selection
                      // Use a slightly longer timeout to avoid Enter bubbling
                      setTimeout(() => {
                        const nextEl = document.getElementById(
                          `trackingType-input-${index}`,
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
                          const reqEl = document.getElementById(
                            "customerRequirements",
                          );
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else {
                          // If value exists, move to Tracking Type
                          e.preventDefault();
                          const nextEl = document.getElementById(
                            `trackingType-input-${index}`,
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
                    addNewModalWidth="w-[50%] h-[57%]"
                  />
                </td>

                <td className="border border-gray-300">
                  <span className="w-full text-[11px] text-left pl-1 outline-none bg-transparent">
                    {findFromList(
                      row.itemGroupId,
                      itemGroupList?.data,
                      "name",
                    ) || ""}
                  </span>
                </td>
                <td className="border border-gray-300">
                  <span className="w-full block text-[11px] text-right pr-1 outline-none bg-transparent">
                    {findFromList(row.hsnId, hsnList?.data, "name") || ""}
                  </span>
                </td>
                <td className="border border-gray-300 grid-editable-cell">
                  <select
                    id={`trackingType-input-${index}`}
                    value={row.trackingType || "None"}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "trackingType")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!row.styleItemId) {
                          e.preventDefault();
                          const reqEl = document.getElementById(
                            "customerRequirements",
                          );
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (row.trackingType === "None") {
                            const qtyEl = document.getElementById(
                              `orderQty-input-${index}`,
                            );
                            if (qtyEl) qtyEl.focus();
                          } else {
                            const breakupEl = document.getElementById(
                              `breakup-btn-${index}`,
                            );
                            if (breakupEl) breakupEl.focus();
                          }
                        }
                      }
                    }}
                    disabled={readOnly}
                    className={`  pl-2 h-full text-[11px] cursor-pointer outline-none w-full bg-transparent   rounded-sm transition-all `}
                  >
                    {/* <option value="None">None</option> */}

                    <option value="Size">Size</option>
                    <option value="Barcode">Barcode</option>
                    <option value="Size + Barcode">Size + Barcode</option>
                  </select>
                </td>
                <td className="border border-gray-300 text-center items-center">
                  <button
                    id={`breakup-btn-${index}`}
                    type="button"
                    onClick={() => handleOpenSizeModal(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !readOnly) {
                        e.preventDefault();
                        handleOpenSizeModal(index);
                      }
                    }}
                    disabled={!row.styleItemId || row.trackingType === "None"}
                    className="  text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
                    title="View Sizes"
                  >
                    <FiEye size={18} />
                  </button>
                </td>

                <td className="border border-gray-300">
                  <span className="w-full text-[11px] text-left pl-1 outline-none bg-transparent">
                    {findFromList(row.uomId, uomList?.data, "name") || ""}
                  </span>
                </td>

                <td className="border border-gray-300 grid-editable-cell">
                  <input
                    id={`orderQty-input-${index}`}
                    type="number"
                    className="w-full h-full  text-[11px] text-right px-1 outline-none bg-transparent"
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
                          const reqEl = document.getElementById(
                            "customerRequirements",
                          );
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
                      ["Size", "Size + Barcode", "Barcode"].includes(
                        row.trackingType,
                      )
                    }
                    readOnly={
                      readOnly ||
                      ["Size", "Size + Barcode", "Barcode"].includes(
                        row.trackingType,
                      )
                    }
                  />
                </td>

                <td className="border border-gray-300 grid-editable-cell">
                  <input
                    value={row?.price || ""}
                    className="w-full text-[11px]  text-right pr-1 outline-none bg-transparent"
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "price")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!row.styleItemId) {
                          e.preventDefault();
                          const reqEl = document.getElementById(
                            "customerRequirements",
                          );
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
                  ></input>
                </td>

                <td className="border border-gray-300 text-center px-1 py-0.5 w-16">
                  {(() => {
                    const currentStyleItem =
                      row?.StyleItem ||
                      styleItemList?.data?.find(
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

                <td className="border border-gray-300 grid-editable-cell">
                  <input
                    id={`remarks-input-${index}`}
                    type="text"
                    className="w-full h-full text-[11px]  outline-none px-1 bg-transparent"
                    value={row.remarks || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "remarks")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        e.preventDefault();
                        if (!row.styleItemId) {
                          const reqEl = document.getElementById(
                            "customerRequirements",
                          );
                          if (reqEl) {
                            reqEl.focus();
                            reqEl.select?.();
                          }
                        } else {
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
                    disabled={readOnly}
                    placeholder="Remarks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <tr className="bg-gray-100 h-7 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={7}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300 text-black">
                {orderItems?.reduce(
                  (sum, row) => sum + (Number(row.orderQty) || 0),
                  0,
                )}
              </td>
              <td className="text-right px-1 border border-gray-300 text-black">
                {orderItems
                  ?.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300"></td>
              <td className="border border-gray-300"></td>
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
                if (contextMenu.type === "MODAL") {
                  deleteModalRow(contextMenu.rowId);
                } else {
                  deleteRow(contextMenu.rowId);
                }
                handleCloseContextMenu();
              }}
            >
              Delete
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                if (contextMenu.type === "MODAL") {
                  deleteModalAllRows();
                } else {
                  handleDeleteAllRows();
                }
                handleCloseContextMenu();
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {sizeModalOpen && activeRowIndex !== null && (
        <Modal
          isOpen={sizeModalOpen}
          onClose={handleCloseSizeModal}
          widthClass="w-[750px]"
        >
          <div className="bg-slate-100 p-3 rounded-lg">
            {/* Header section like the reference image */}
            <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
              <h3 className="text-[16px] font-bold text-slate-800">
                {orderItems[activeRowIndex]?.trackingType === "Barcode"
                  ? "Barcode Wise Breakup"
                  : orderItems[activeRowIndex]?.trackingType ===
                      "Size + Barcode"
                    ? "Size + Barcode Wise Breakup"
                    : "Size Wise Breakup"}
              </h3>
              <div className="flex gap-2">
                <button
                  className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  onClick={handleCloseSizeModal}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Main content area */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              {/* {orderItems[activeRowIndex]?.trackingType !== "Barcode" && (
                <div className="mb-3 bg-slate-50 p-2 border border-slate-200 rounded flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Size
                  </span>
                  <span className="text-[12px] font-bold text-slate-700">
                    {sizeTemplateList?.data?.find(
                      (t) =>
                        t.id === orderItems[activeRowIndex]?.sizeTemplateId,
                    )?.name || "No Template Selected"}
                  </span>
                </div>
              )} */}
              <div className="h-[220px] overflow-y-auto">
                {/* --- BARCODE TYPE TABLE --- */}
                {orderItems[activeRowIndex]?.trackingType === "Barcode" && (
                  <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-11">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Barcode From
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Barcode To
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-24">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems[activeRowIndex]?.sizeBreakup?.map(
                        (item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition-colors"
                            onContextMenu={(e) =>
                              !readOnly && handleRightClick(e, idx, "MODAL")
                            }
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0.5 text-center text-[11px] text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="border-b border-r border-slate-200 px-1">
                              <input
                                id={`barcodeFrom-${idx}`}
                                type="text"
                                className="w-full border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                value={item.barcodeFrom}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "barcodeFrom",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                placeholder="From"
                              />
                            </td>
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                type="text"
                                className="w-full h-7 border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                value={item.barcodeTo}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "barcodeTo",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !readOnly &&
                                    idx ===
                                      orderItems[activeRowIndex]?.sizeBreakup
                                        ?.length -
                                        1
                                  ) {
                                    e.preventDefault();
                                    addModalRow();
                                  }
                                }}
                                disabled={readOnly}
                                placeholder="To"
                              />
                            </td>
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                type="number"
                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                value={
                                  item.qty !== undefined &&
                                  item.qty !== null &&
                                  item.qty !== ""
                                    ? Number(item.qty)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "qty",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !readOnly &&
                                    idx ===
                                      orderItems[activeRowIndex]?.sizeBreakup
                                        ?.length -
                                        1
                                  ) {
                                    e.preventDefault();
                                    addModalRow();
                                  }
                                }}
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}

                {/* --- Size TYPE TABLE --- */}
                {orderItems[activeRowIndex]?.trackingType === "Size" && (
                  <table className="w-[450px] border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-6">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-40 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-16 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems[activeRowIndex]?.sizeBreakup?.map(
                        (item, idx) => (
                          <tr
                            key={idx}
                            className="h-8 hover:bg-slate-50 transition-colors"
                            onContextMenu={(e) =>
                              !readOnly && handleRightClick(e, idx, "MODAL")
                            }
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">
                              {idx + 1}
                            </td>
                            <td
                              data-grid-row={idx}
                              data-grid-col={1}
                              data-grid-editable="true"
                              className="grid-editable-cell border border-gray-300 text-[11px]"
                            >
                              <FxSelectWithAdd
                                value={item.sizeId || ""}
                                onChange={(val) =>
                                  handleSizeBreakupChange(idx, "sizeId", val)
                                }
                                disabled={readOnly}
                                options={(sizeList?.data || [])
                                  .filter((item) => (id ? true : item.active))
                                  .map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                  }))}
                                readOnly={readOnly}
                                placeholder=""
                                onKeyDown={(event) => {
                                  if (event.key === "Delete") {
                                    handleSizeBreakupChange(idx, "sizeId", "");
                                  }
                                }}
                                addNew={true}
                                childComponent={Size}
                                addNewModalWidth="w-[30%] h-[45%]"
                                advanceOnEnter
                                advanceOnSelect
                                menuPortalTarget={document.body}
                              />
                            </td>
                            {/* <td className="border-b border-r border-slate-200 px-1 py-0 text-[11px] text-black">
                              <select
                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] text-black outline-none focus:bg-white"
                                value={item.sizeId || ""}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "sizeId",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                              >
                                <option value="">Select Size</option>
                                {sizeList?.data?.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </td> */}
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                id={`sizeQty-${idx}`}
                                type="number"
                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                value={
                                  item.qty !== undefined &&
                                  item.qty !== null &&
                                  item.qty !== ""
                                    ? Number(item.qty)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "qty",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !readOnly &&
                                    idx ===
                                      orderItems[activeRowIndex]?.sizeBreakup
                                        ?.length -
                                        1
                                  ) {
                                    e.preventDefault();
                                    addModalRow();
                                  }
                                }}
                                disabled={readOnly}
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}

                {/* --- Size + BARCODE TYPE TABLE --- */}
                {orderItems[activeRowIndex]?.trackingType ===
                  "Size + Barcode" && (
                  <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-10">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-28">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-32">
                          From
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-32">
                          To
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-20">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems[activeRowIndex]?.sizeBreakup?.map(
                        (item, idx) => (
                          <tr
                            key={idx}
                            className="h-8 hover:bg-slate-50 transition-colors"
                            onContextMenu={(e) =>
                              !readOnly && handleRightClick(e, idx, "MODAL")
                            }
                          >
                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black ">
                              {idx + 1}
                            </td>
                            <td
                              data-grid-row={idx}
                              data-grid-col={1}
                              data-grid-editable="true"
                              className="grid-editable-cell border border-gray-300 text-[11px]"
                            >
                              <FxSelectWithAdd
                                value={item.sizeId || ""}
                                onChange={(val) =>
                                  handleSizeBreakupChange(idx, "sizeId", val)
                                }
                                disabled={readOnly}
                                options={(sizeList?.data || [])
                                  .filter((item) => (id ? true : item.active))
                                  .map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                  }))}
                                readOnly={readOnly}
                                placeholder=""
                                onKeyDown={(event) => {
                                  if (event.key === "Delete") {
                                    handleSizeBreakupChange(idx, "sizeId", "");
                                  }
                                }}
                                addNew={true}
                                childComponent={Size}
                                addNewModalWidth="w-[30%] h-[45%]"
                                advanceOnEnter
                                advanceOnSelect
                                menuPortalTarget={document.body}
                              />
                            </td>
                            {/* <td className="border-b border-r border-slate-200 px-1 py-0 text-[11px] text-black">
                              <select
                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] text-black outline-none focus:bg-white"
                                value={item.sizeId || ""}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "sizeId",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                              >
                                <option value="">Select Size</option>
                                {sizeList?.data?.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </td> */}
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                id={`sizeBarcodeFrom-${idx}`}
                                type="text"
                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                value={item.barcodeFrom}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "barcodeFrom",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                placeholder="From"
                              />
                            </td>
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                type="text"
                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                value={item.barcodeTo}
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "barcodeTo",
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                placeholder="To"
                              />
                            </td>
                            <td className="border-b border-r border-slate-200 px-1 py-0">
                              <input
                                type="number"
                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                value={
                                  item.qty !== undefined &&
                                  item.qty !== null &&
                                  item.qty !== ""
                                    ? Number(item.qty)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleSizeBreakupChange(
                                    idx,
                                    "qty",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !readOnly &&
                                    idx ===
                                      orderItems[activeRowIndex]?.sizeBreakup
                                        ?.length -
                                        1
                                  ) {
                                    e.preventDefault();
                                    addModalRow();
                                  }
                                }}
                                disabled={readOnly}
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}
                {(!orderItems[activeRowIndex]?.sizeBreakup ||
                  orderItems[activeRowIndex].sizeBreakup.length === 0) && (
                  <div className="text-center p-8 text-slate-400 text-sm font-medium italic">
                    No items found for this tracking mode.
                  </div>
                )}
              </div>
              <div className="mt-3 bg-white p-3 rounded-lg shadow-sm">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded p-2 text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                  rows="2"
                  value={orderItems[activeRowIndex]?.description || ""}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.value,
                      activeRowIndex,
                      "description",
                    )
                  }
                  disabled={readOnly}
                  placeholder="Enter description here..."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

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
