import React, { useState, useEffect } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import { useGetStyleMasterQuery } from "../../../redux/services/StyleMasterService";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService";
import {
  useGetSizeTemplateQuery,
  useLazyGetSizeTemplateByIdQuery,
} from "../../../redux/services/SizeTemplateMaster";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import Modal from "../../../UiComponents/Modal";
import { StyleMaster, Size } from "..";
import { Plus } from "lucide-react";
import Swal from "sweetalert2";

const createEmptyBreakupRow = () => ({
  sizeId: null,
  qty: "",
  barcodeFrom: "",
  barcodeTo: "",
});

const createEmptyStyleItem = () => ({
  styleId: "",
  trackingType: "Size",
  description: "",
  sizeBreakup: Array.from({ length: 5 }, createEmptyBreakupRow),
});

const OrderStyleItems = ({
  isOpen,
  onClose,
  parentItem,
  onSaveStyles,
  readOnly,
  styleItemList,
  uomList,
  id,
}) => {
  const { companyId } = getCommonParams();

  const { data: styleMasterList } = useGetStyleMasterQuery({
    params: { companyId },
  });
  const { data: sizeList } = useGetSizeMasterQuery({
    params: { companyId },
  });
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({
    params: { companyId },
  });
  const [triggerGetTemplateById] = useLazyGetSizeTemplateByIdQuery();

  const [styleRows, setStyleRows] = useState([]);
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);

  // Initialize or hydrate styles whenever modal opens
  useEffect(() => {
    if (isOpen && parentItem) {
      let existing = parentItem.orderStyleItems || parentItem.styleItems || [];
      if (
        existing.length === 0 &&
        (parentItem.sizeBreakup?.length > 0 || parentItem.trackingType)
      ) {
        // Fallback: hydrate legacy item as 1 initial style
        existing = [
          {
            styleId: parentItem.styleId || "",
            trackingType: parentItem.trackingType || "Size",
            orderQty: parentItem.orderQty || 0,
            description: parentItem.description || "",
            sizeBreakup:
              parentItem.sizeBreakup && parentItem.sizeBreakup.length > 0
                ? parentItem.sizeBreakup
                : Array.from({ length: 5 }, createEmptyBreakupRow),
          },
        ];
      }

      if (existing.length > 0) {
        setStyleRows(
          existing.map((item) => {
            let breakup = [...(item.sizeBreakup || [])];
            if (breakup.length < 5) {
              const padding = Array.from(
                { length: 5 - breakup.length },
                createEmptyBreakupRow,
              );
              breakup = [...breakup, ...padding];
            }
            return {
              ...item,
              trackingType: item.trackingType || "Size",
              sizeTemplateId: item.sizeTemplateId || "",
              description: item.description || "",
              orderQty:
                item.orderQty !== undefined && item.orderQty !== null
                  ? Number(item.orderQty)
                  : breakup.reduce((sum, b) => sum + (Number(b.qty) || 0), 0),
              sizeBreakup: breakup,
            };
          }),
        );
      } else {
        setStyleRows([createEmptyStyleItem()]);
      }
      setActiveStyleIndex(0);
    }
  }, [isOpen, parentItem]);

  // Focus management when tracking type or active style changes
  useEffect(() => {
    if (isOpen && activeStyleIndex !== null && styleRows[activeStyleIndex]) {
      setTimeout(() => {
        const trackingType = styleRows[activeStyleIndex]?.trackingType;
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
      }, 150);
    }
  }, [isOpen, activeStyleIndex]);

  // Filter styles matching the selected Description of Goods (styleItemId)
  const filteredStyles = (styleMasterList?.data || []).filter((item) => {
    if (!parentItem?.styleItemId) return true;
    if (item.styleItemId) {
      return String(item.styleItemId) === String(parentItem.styleItemId);
    }
    return false;
  });

  const availableStyles =
    filteredStyles.length > 0 ? filteredStyles : styleMasterList?.data || [];

  // Add a new style row on the left side
  const handleAddStyleRow = () => {
    const newStyle = createEmptyStyleItem();
    setStyleRows((prev) => {
      const updated = [...prev, newStyle];
      const newIndex = updated.length - 1;
      setActiveStyleIndex(newIndex);
      setTimeout(() => {
        const nextEl = document.getElementById(`styleId-input-${newIndex}`);
        if (nextEl) nextEl.focus();
      }, 100);
      return updated;
    });
  };

  // Delete a style row on the left side
  const handleDeleteStyleRow = (index, e) => {
    e?.stopPropagation();
    if (styleRows.length <= 1) {
      setStyleRows([createEmptyStyleItem()]);
      setActiveStyleIndex(0);
      return;
    }
    const updated = styleRows.filter((_, i) => i !== index);
    setStyleRows(updated);
    if (activeStyleIndex >= updated.length) {
      setActiveStyleIndex(updated.length - 1);
    }
  };

  // Delete all styles
  const handleDeleteAllStyles = () => {
    setStyleRows([createEmptyStyleItem()]);
    setActiveStyleIndex(0);
  };

  // Handle changes to Style dropdown or Type dropdown on the left side
  const handleStyleFieldChange = (index, field, value) => {
    const updated = [...styleRows];
    let row = { ...updated[index], [field]: value };

    // Validation: Same style cannot have the same tracking type
    if (field === "styleId" && value) {
      const trackingType = row.trackingType || "Size";
      const isDuplicate = updated.some(
        (r, idx) =>
          idx !== index &&
          String(r.styleId) === String(value) &&
          (r.trackingType || "Size") === trackingType,
      );
      if (isDuplicate) {
        const styleName =
          findFromList(value, styleMasterList?.data, "name") || "This style";
        Swal.fire({
          icon: "warning",
          title: "Duplicate Style and Type",
          text: `${styleName} with tracking type '${trackingType}' is already added. A style cannot have the same tracking type more than once.`,
          timer: 3000,
        });
        return;
      }
    }

    if (field === "trackingType" && value) {
      if (row.styleId) {
        const isDuplicate = updated.some(
          (r, idx) =>
            idx !== index &&
            String(r.styleId) === String(row.styleId) &&
            (r.trackingType || "Size") === value,
        );
        if (isDuplicate) {
          const styleName =
            findFromList(row.styleId, styleMasterList?.data, "name") ||
            "This style";
          Swal.fire({
            icon: "warning",
            title: "Duplicate Style and Type",
            text: `${styleName} with tracking type '${value}' already exists. A style cannot have the same tracking type more than once.`,
            timer: 3000,
          });
          return;
        }
      }
      row.sizeBreakup = Array.from({ length: 5 }, createEmptyBreakupRow);
      row.orderQty = 0;
    }

    updated[index] = row;
    setStyleRows(updated);
  };

  // Handle Size Breakup changes on the right side
  const handleSizeBreakupChange = (sizeIndex, field, value) => {
    const updated = [...styleRows];
    const currentRow = { ...updated[activeStyleIndex] };
    const breakup = [...(currentRow.sizeBreakup || [])];

    // Validation: in Size Wise Breakup, the same size cannot be chosen twice
    if (
      field === "sizeId" &&
      value &&
      (currentRow.trackingType || "Size") === "Size"
    ) {
      const isDuplicateSize = breakup.some(
        (item, i) => i !== sizeIndex && String(item.sizeId) === String(value),
      );
      if (isDuplicateSize) {
        const sizeName =
          findFromList(value, sizeList?.data, "name") || "This size";
        Swal.fire({
          icon: "warning",
          title: "Duplicate Size",
          text: `Size '${sizeName}' is already selected for this style. Each size must be unique.`,
          timer: 2500,
        });
        return;
      }
    }

    breakup[sizeIndex] = { ...breakup[sizeIndex], [field]: value };

    currentRow.sizeBreakup = breakup;

    if (field === "qty") {
      const totalQty = breakup.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      );
      currentRow.orderQty = totalQty;
    }

    if (currentRow.trackingType === "Barcode") {
      if (field === "barcodeFrom") currentRow.barcodeFrom = value;
      if (field === "barcodeTo") currentRow.barcodeTo = value;
    }

    updated[activeStyleIndex] = currentRow;
    setStyleRows(updated);
  };

  // Handle template selection on the right side
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

    setStyleRows((prev) => {
      const updated = [...prev];
      if (activeStyleIndex !== null && updated[activeStyleIndex]) {
        updated[activeStyleIndex] = {
          ...updated[activeStyleIndex],
          sizeTemplateId: templateId,
          sizeBreakup:
            newBreakup.length > 0
              ? newBreakup
              : Array.from({ length: 5 }, createEmptyBreakupRow),
          orderQty: 0,
        };
      }
      return updated;
    });
  };

  // Add a row to the breakup table on the right side
  const addModalRow = () => {
    setStyleRows((prev) => {
      const updated = [...prev];
      const currentRow = { ...updated[activeStyleIndex] };
      currentRow.sizeBreakup = [
        ...(currentRow.sizeBreakup || []),
        createEmptyBreakupRow(),
      ];
      updated[activeStyleIndex] = currentRow;
      return updated;
    });
  };

  // Delete a row from the breakup table
  const deleteModalRow = (index) => {
    setStyleRows((prev) => {
      const updated = [...prev];
      const currentRow = { ...updated[activeStyleIndex] };
      const breakup = currentRow.sizeBreakup || [];
      let newBreakup;
      if (breakup.length <= 5) {
        newBreakup = breakup.map((item, i) =>
          i === index ? createEmptyBreakupRow() : item,
        );
      } else {
        newBreakup = breakup.filter((_, i) => i !== index);
      }
      currentRow.sizeBreakup = newBreakup;
      currentRow.orderQty = newBreakup.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      );
      updated[activeStyleIndex] = currentRow;
      return updated;
    });
  };

  // Delete all rows in the breakup table
  const deleteModalAllRows = () => {
    setStyleRows((prev) => {
      const updated = [...prev];
      const currentRow = { ...updated[activeStyleIndex] };
      currentRow.sizeBreakup = Array.from({ length: 5 }, createEmptyBreakupRow);
      currentRow.orderQty = 0;
      updated[activeStyleIndex] = currentRow;
      return updated;
    });
  };

  // Right-click context menu handler
  const handleRightClick = (event, rowIndex, type = "BREAKUP") => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
      type,
    });
  };

  // Save and close
  const handleDone = () => {
    const validStyles = styleRows.filter(
      (r) => r.styleId || Number(r.orderQty) > 0,
    );

    // Validate: Same style cannot have the same tracking type
    const seenCombos = new Set();
    for (let i = 0; i < validStyles.length; i++) {
      const st = validStyles[i];
      if (st.styleId) {
        const comboKey = `${st.styleId}-${st.trackingType || "Size"}`;
        if (seenCombos.has(comboKey)) {
          const styleName =
            findFromList(st.styleId, styleMasterList?.data, "name") ||
            `Style #${i + 1}`;
          Swal.fire({
            icon: "warning",
            title: "Duplicate Style and Type",
            text: `${styleName} with tracking type '${st.trackingType || "Size"}' is added more than once.`,
          });
          return;
        }
        seenCombos.add(comboKey);
      }
    }

    // Validate: in Size Wise Breakup, no duplicate sizes allowed
    for (let i = 0; i < validStyles.length; i++) {
      const st = validStyles[i];
      if ((st.trackingType || "Size") === "Size") {
        const selectedSizes = (st.sizeBreakup || [])
          .map((b) => b.sizeId)
          .filter(
            (sizeId) =>
              sizeId !== undefined && sizeId !== null && sizeId !== "",
          );
        if (selectedSizes.length > 0) {
          const uniqueSizes = new Set(selectedSizes);
          if (selectedSizes.length !== uniqueSizes.size) {
            const styleName =
              findFromList(st.styleId, styleMasterList?.data, "name") ||
              `Style #${i + 1}`;
            Swal.fire({
              icon: "warning",
              title: "Duplicate Size",
              text: `Duplicate sizes selected under ${styleName}. Each size must be unique.`,
            });
            return;
          }
        }
      }
    }

    const totalQty = validStyles.reduce(
      (sum, r) => sum + (Number(r.orderQty) || 0),
      0,
    );
    onSaveStyles(validStyles, totalQty);
    onClose();
  };

  const activeStyle = styleRows[activeStyleIndex] || {};
  const currentTrackingType = activeStyle.trackingType || "Size";
  const parentName =
    findFromList(parentItem?.styleItemId, styleItemList?.data, "name") ||
    "Description of Goods";
  const parentUom =
    findFromList(parentItem?.uomId, uomList?.data, "name") || "";

  const totalOverallQty = styleRows.reduce(
    (sum, r) => sum + (Number(r.orderQty) || 0),
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDone}
      widthClass="w-[1300px] max-w-[95vw] h-[85vh]"
    >
      <div className="bg-slate-100 p-3 rounded-lg flex flex-col h-full">
        {/* Modal Top Header */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Styles & Breakup
              </span>
              <h2 className="text-base font-bold text-slate-800">
                {parentName}
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Select styles and configure size / barcode breakup for each style.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-gray-500 block">
                Total Qty:
              </span>
              <span className="text-base font-bold text-indigo-700">
                {totalOverallQty} {parentUom}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* Master-Detail Split Content */}
        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
          {/* ================= LEFT SIDE: STYLES TABLE ================= */}
          <div className="col-span-5 bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Styles List ({styleRows.length})
              </h3>
              <button
                type="button"
                onClick={handleAddStyleRow}
                disabled={readOnly}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Plus size={13} /> Add Style
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded">
              <table className="w-full border-separate border-spacing-0 table-fixed text-[11px]">
                <thead className="text-gray-700 text-[11px]">
                  <tr>
                    <th className="sticky top-0 z-20 bg-gray-100 w-8 py-1.5 text-center font-bold border-b border-r border-slate-200">
                      S.No
                    </th>
                    <th className="sticky top-0 z-20 bg-gray-100 w-48 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                      Style
                    </th>
                    <th className="sticky top-0 z-20 bg-gray-100 w-28 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                      Type
                    </th>
                    <th className="sticky top-0 z-20 bg-gray-100 w-16 px-1 py-1.5 text-center font-bold border-b border-slate-200">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {styleRows.map((row, idx) => {
                    const isSelected = idx === activeStyleIndex;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setActiveStyleIndex(idx)}
                        onContextMenu={(e) =>
                          !readOnly && handleRightClick(e, idx, "STYLE")
                        }
                        className={`cursor-pointer transition-colors border-b border-slate-200 h-8 ${
                          isSelected
                            ? "bg-indigo-50 font-medium"
                            : idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-gray-50 hover:bg-slate-50"
                        }`}
                      >
                        <td
                          className={`text-center border-r border-slate-200 ${
                            isSelected
                              ? "border-l-4 border-l-indigo-600 text-indigo-700 font-bold"
                              : ""
                          }`}
                        >
                          {idx + 1}
                        </td>

                        {/* Style Selection with FxSelectWithAdd */}
                        <td
                          className="border-r border-slate-200 grid-editable-cell"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStyleIndex(idx);
                          }}
                        >
                          <FxSelectWithAdd
                            inputId={`styleId-input-${idx}`}
                            value={row.styleId}
                            onChange={(val) => {
                              handleStyleFieldChange(idx, "styleId", val);
                            }}
                            options={availableStyles
                              .filter((item) => (id ? true : item.active))
                              .map((item) => ({
                                label: item.name,
                                value: item.id,
                              }))}
                            readOnly={readOnly}
                            placeholder=""
                            addNew={true}
                            childComponent={StyleMaster}
                            childProps={{
                              defaultStyleItemId: parentItem?.styleItemId,
                            }}
                            addNewModalWidth="w-[50%] h-[57%]"
                          />
                        </td>

                        {/* Tracking Type Dropdown */}
                        <td
                          className="border-r border-slate-200 px-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            id={`trackingType-input-${idx}`}
                            value={row.trackingType || "Size"}
                            onChange={(e) =>
                              handleStyleFieldChange(
                                idx,
                                "trackingType",
                                e.target.value,
                              )
                            }
                            onFocus={() => setActiveStyleIndex(idx)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const qtyInput = document.getElementById(
                                  `style-orderQty-${idx}`,
                                );
                                if (qtyInput) qtyInput.focus();
                              }
                            }}
                            disabled={readOnly}
                            className="w-full h-6 text-[11px] bg-transparent outline-none cursor-pointer"
                          >
                            <option value="Size">Size</option>
                            <option value="Barcode">Barcode</option>
                            <option value="Size + Barcode">
                              Size + Barcode
                            </option>
                          </select>
                        </td>

                        {/* Style Total Qty */}
                        <td
                          className="text-right px-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStyleIndex(idx);
                          }}
                        >
                          <input
                            id={`style-orderQty-${idx}`}
                            type="text"
                            readOnly
                            value={row.orderQty || 0}
                            onFocus={() => setActiveStyleIndex(idx)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (idx === styleRows.length - 1) {
                                  handleAddStyleRow();
                                } else {
                                  setActiveStyleIndex(idx + 1);
                                  setTimeout(() => {
                                    const nextEl =
                                      document.getElementById(
                                        `styleId-input-${idx + 1}`,
                                      ) ||
                                      document.getElementById(
                                        `style-orderQty-${idx + 1}`,
                                      );
                                    if (nextEl) nextEl.focus();
                                  }, 50);
                                }
                              }
                            }}
                            className="w-full text-right bg-transparent outline-none cursor-pointer font-bold text-indigo-700 pr-1 select-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-[11px] text-gray-500 flex justify-between items-center px-1">
              <span>Click a style row to edit its breakup on the right.</span>
              <span className="font-bold text-slate-700">
                Total: {totalOverallQty}
              </span>
            </div>
          </div>

          {/* ================= RIGHT SIDE: EXACT BREAKUP STRUCTURE (L812-L1295) ================= */}
          <div className="col-span-7 bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            {/* Header section matching StyleList design */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2.{" "}
                  {currentTrackingType === "Barcode"
                    ? "Barcode Wise Breakup"
                    : currentTrackingType === "Size + Barcode"
                      ? "Size + Barcode Wise Breakup"
                      : "Size Wise Breakup"}
                </h3>
                <span className="text-[11px] text-indigo-600 font-medium">
                  (
                  {findFromList(
                    activeStyle.styleId,
                    styleMasterList?.data,
                    "name",
                  ) || `Style #${activeStyleIndex + 1}`}
                  )
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-indigo-700">
                  Qty: {activeStyle.orderQty || 0}
                </span>
                <button
                  type="button"
                  onClick={addModalRow}
                  disabled={readOnly}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Add Row
                </button>
              </div>
            </div>

            {/* Main breakup content area like original lines 840-1280 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Table scroll container (original L854) */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded">
                {/* --- BARCODE TYPE TABLE --- */}
                {currentTrackingType === "Barcode" && (
                  <table className="w-full border-separate border-spacing-0 table-fixed text-[11px]">
                    <thead className="text-gray-700 text-[11px]">
                      <tr>
                        <th className="sticky top-0 z-20 bg-gray-100 w-10 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Barcode From
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Barcode To
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 w-20 px-1 py-1.5 text-center font-bold border-b border-slate-200">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStyle.sizeBreakup?.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`h-8 border-b border-slate-200 transition-colors ${
                            idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-gray-50 hover:bg-slate-50"
                          }`}
                          onContextMenu={(e) =>
                            !readOnly && handleRightClick(e, idx, "BREAKUP")
                          }
                        >
                          <td className="text-center border-r border-slate-200 text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="border-r border-slate-200 px-1">
                            <input
                              id={`barcodeFrom-${idx}`}
                              type="text"
                              className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none"
                              value={item.barcodeFrom || ""}
                              onChange={(e) =>
                                handleSizeBreakupChange(
                                  idx,
                                  "barcodeFrom",
                                  e.target.value,
                                )
                              }
                              disabled={readOnly}
                            />
                          </td>
                          <td className="border-r border-slate-200 px-1">
                            <input
                              type="text"
                              className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none"
                              value={item.barcodeTo || ""}
                              onChange={(e) =>
                                handleSizeBreakupChange(
                                  idx,
                                  "barcodeTo",
                                  e.target.value,
                                )
                              }
                              disabled={readOnly}
                            />
                          </td>
                          <td className="px-1 text-right">
                            <input
                              type="number"
                              className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] font-bold text-indigo-700 outline-none"
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
                                    (activeStyle.sizeBreakup?.length || 0) - 1
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
                      ))}
                    </tbody>
                  </table>
                )}

                {/* --- SIZE TYPE TABLE --- */}
                {currentTrackingType === "Size" && (
                  <table className="w-full border-separate border-spacing-0 table-fixed text-[11px]">
                    <thead className="text-gray-700 text-[11px]">
                      <tr>
                        <th className="sticky top-0 z-20 bg-gray-100 w-10 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 w-24 px-1 py-1.5 text-center font-bold border-b border-slate-200">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStyle.sizeBreakup?.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`h-8 border-b border-slate-200 transition-colors ${
                            idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-gray-50 hover:bg-slate-50"
                          }`}
                          onContextMenu={(e) =>
                            !readOnly && handleRightClick(e, idx, "BREAKUP")
                          }
                        >
                          <td className="text-center border-r border-slate-200 text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td
                            data-grid-row={idx}
                            data-grid-col={1}
                            data-grid-editable="true"
                            className="border-r border-slate-200 grid-editable-cell text-[11px]"
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
                          <td className="px-1 text-right">
                            <input
                              id={`sizeQty-${idx}`}
                              type="number"
                              className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] font-bold text-indigo-700 outline-none"
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
                                    (activeStyle.sizeBreakup?.length || 0) - 1
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
                      ))}
                    </tbody>
                  </table>
                )}

                {/* --- SIZE + BARCODE TYPE TABLE --- */}
                {currentTrackingType === "Size + Barcode" && (
                  <table className="w-full border-separate border-spacing-0 table-fixed text-[11px]">
                    <thead className="text-gray-700 text-[11px]">
                      <tr>
                        <th className="sticky top-0 z-20 bg-gray-100 w-10 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          S.No
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 w-36 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Size
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Barcode From
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 px-1 py-1.5 text-center font-bold border-b border-r border-slate-200">
                          Barcode To
                        </th>
                        <th className="sticky top-0 z-20 bg-gray-100 w-20 px-1 py-1.5 text-center font-bold border-b border-slate-200">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStyle.sizeBreakup?.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`h-8 border-b border-slate-200 transition-colors ${
                            idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-gray-50 hover:bg-slate-50"
                          }`}
                          onContextMenu={(e) =>
                            !readOnly && handleRightClick(e, idx, "BREAKUP")
                          }
                        >
                          <td className="text-center border-r border-slate-200 text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td
                            data-grid-row={idx}
                            data-grid-col={1}
                            data-grid-editable="true"
                            className="border-r border-slate-200 grid-editable-cell text-[11px]"
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
                          <td className="border-r border-slate-200 px-1">
                            <input
                              id={`sizeBarcodeFrom-${idx}`}
                              type="text"
                              className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none"
                              value={item.barcodeFrom || ""}
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
                          <td className="border-r border-slate-200 px-1">
                            <input
                              type="text"
                              className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none"
                              value={item.barcodeTo || ""}
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
                          <td className="px-1 text-right">
                            <input
                              type="number"
                              className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] font-bold text-indigo-700 outline-none"
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
                                    (activeStyle.sizeBreakup?.length || 0) - 1
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
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Description textarea from original L1265-1280 */}
              <div className="mt-2 bg-white p-2 border border-slate-200 rounded">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5 uppercase">
                  Description
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded p-1.5 text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                  rows="2"
                  value={activeStyle.description || ""}
                  onChange={(e) => {
                    const updated = [...styleRows];
                    updated[activeStyleIndex] = {
                      ...updated[activeStyleIndex],
                      description: e.target.value,
                    };
                    setStyleRows(updated);
                  }}
                  disabled={readOnly}
                  placeholder="Enter style description here..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${contextMenu.mouseY}px`,
            left: `${contextMenu.mouseX}px`,
            boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
            padding: "4px",
            borderRadius: "4px",
            zIndex: 3000,
          }}
          className="bg-white border border-gray-200 shadow-xl"
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="flex flex-col min-w-[100px]">
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-medium rounded transition-colors"
              onClick={() => {
                if (contextMenu.type === "STYLE") {
                  handleDeleteStyleRow(contextMenu.rowId);
                } else {
                  deleteModalRow(contextMenu.rowId);
                }
                setContextMenu(null);
              }}
            >
              Delete
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                if (contextMenu.type === "STYLE") {
                  handleDeleteAllStyles();
                } else {
                  deleteModalAllRows();
                }
                setContextMenu(null);
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OrderStyleItems;
