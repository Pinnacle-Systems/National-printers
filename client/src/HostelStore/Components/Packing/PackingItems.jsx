import React, { useState, useEffect } from "react";
import { FxSelectWithAdd } from "../../../Inputs";
import { ItemGroup, Size, StyleItemMaster, StyleMaster } from "..";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import { Plus } from "lucide-react";
// import { ItemSubGroupMaster } from "../../../Basic/components";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import { formatCurrencyAmount } from "../../../Utils/helper";
import Modal from "../../../UiComponents/Modal";
import { VIEW } from "../../../icons";
import { FaEye, FaTrash } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { useGetSizeTemplateQuery } from "../../../redux/services/SizeTemplateMaster";

import {
  DEFAULT_ROW_COUNT,
  EMPTY_SIZE_ROW,
  EMPTY_STYLE_ROW,
  makeEmptyRow,
  padRows,
} from "./OrderItemsUtils";
// import { useGetPackingControlQuery } from "../../../redux/uniformService/PackingControl";

const PackingItems = ({
  packingOrderItems,
  setPackingOrderItems,
  readOnly,
  styleItemList,
  sizeList,
  styleList,
  uomList,
  id,
  requirementRef,
  itemGroupList,
  hsnList,
  childRecord,
  itemSubGroupList,
  // enrichedItems,
  taxTemplateId,
  conversionType,
  isSupplierOutside,
  orderType,
  isCustomerExport,
  currencyCode,
  isCurrencySymbol,
}) => {
  const { companyId } = getCommonParams();

  console.log("orderItemsinpackingitems", packingOrderItems);
  const [contextMenu, setContextMenu] = useState(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [activeModalRowIndex, setActiveModalRowIndex] = useState(null);
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [activePackingBreakupInfo, setActivePackingBreakupInfo] =
    useState(null);
  // Tracks which packingSizeBreakup row is selected for the packingItems child table
  // Shape: { rowIndex: number, sizeIdx: number } | null
  const [activeSizeKey, setActiveSizeKey] = useState(null);
  const [panelTop, setPanelTop] = useState(200);
  const [panelLeft, setPanelLeft] = useState(0);
  const [packingItemsContextMenu, setPackingItemsContextMenu] = useState(null);

  // Continuously track the Packing Details panel position so the fixed
  // Packing Items panel stays aligned across scroll / zoom / resize
  useEffect(() => {
    if (!activeSizeKey) return;
    const updatePos = () => {
      const panel = document.querySelector(
        `.packing-details-panel[data-row="${activeSizeKey.rowIndex}"]`,
      );
      if (panel) {
        const rect = panel.getBoundingClientRect();
        setPanelTop(rect.top);
        setPanelLeft(rect.right);
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    const ro = new ResizeObserver(updatePos);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
      ro.disconnect();
    };
  }, [activeSizeKey]);
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({
    params: { companyId },
  });
  // const { data: packingControlData, isLoading, isFetching } = useGetPackingControlQuery({});
  let packingControlData;
  const packingPercentage = packingControlData?.data?.[0]?.packingPercentage;

  console.log(uomList, "uomList");
  const handleOpenSizeModal = (index) => {
    setActiveRowIndex(index);
    setSizeModalOpen(true);
  };
  useEffect(() => {
    if (!Array.isArray(packingOrderItems)) return;
    if (packingOrderItems.length === 0) {
      setPackingOrderItems([makeEmptyRow()]);
    }
  }, [packingOrderItems.length, id]);

  const addMainRow = () =>
    setPackingOrderItems((prev) => [...prev, makeEmptyRow()]);

  const deleteMainRow = (index) => {
    setPackingOrderItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [makeEmptyRow()] : next;
    });
  };

  const handleDeleteAllRows = () => setPackingOrderItems([makeEmptyRow()]);

  const handleSizeBreakupChange = (rowIndex, sizeIndex, field, value) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const packingSizeBreakup = [...(row.packingSizeBreakup || [])];

      if (field === "packingQty") {
        const currentSize = packingSizeBreakup[sizeIndex] || {};
        const currentQty = Number(currentSize.qty) || 0;
        const currentAlreadyPackingQty =
          Number(currentSize.alreadyPackingQty) || 0;
        const enteredPackingQty = Number(value) || 0;

        const maxAllowed =
          (currentQty * (Number(packingPercentage) || 0)) / 100 +
          currentQty -
          currentAlreadyPackingQty;

        if (enteredPackingQty > maxAllowed) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Packing Quantity",
            text: `Packing quantity cannot exceed ${maxAllowed}`,
          });
          return prev;
        }
      }

      packingSizeBreakup[sizeIndex] = {
        ...packingSizeBreakup[sizeIndex],
        [field]: value,
      };
      row.packingSizeBreakup = packingSizeBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleInputChange = (value, index, field) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      let row = { ...rows[index], [field]: value };
      if (field === "styleItemId" && value) {
        const found = styleItemList?.data?.find((i) => i.id === value);
        if (found) {
          const hsnId = found.hsnId || "";
          const hsnObj = hsnList?.data?.find((h) => h.id === hsnId);
          row = {
            ...row,
            uomId: found.uomId || "",
            hsnId: hsnId,
            taxPercent: hsnObj ? hsnObj.tax : "",
            styleBreakup: id
              ? [...(row.styleBreakup || [])]
              : [EMPTY_STYLE_ROW()],
            orderQty: row.orderQty,
          };
        }
      }

      if (field === "price" || field === "orderQty" || field === "dozen") {
        const qty = field === "orderQty" ? value : row.orderQty;
        const price = field === "price" ? value : row.price;
        const dozen = field === "dozen" ? value : qty / 12;
        if (field !== "dozen") {
          row.dozen = dozen ? Number(dozen).toFixed(2) : "";
        }
        if (conversionType === "DOZEN") {
          row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
        } else {
          row.amount = qty && price ? (qty * price).toFixed(2) : "";
        }
      }

      rows[index] = row;
      return rows;
    });
  };

  const recalculateOrderQty = (rowBreakup) => {
    let orderQty = 0;
    rowBreakup.forEach((style) => {
      style.packingSizeBreakup.forEach((sz) => {
        orderQty += Number(sz.qty) || 0;
      });
    });
    return orderQty;
  };

  const handleStyleChange = (rowIndex, styleIndex, field, value) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = [...(row.styleBreakup || [])];

      if (field === "styleId" && value) {
        const isDuplicate = breakup.some(
          (item, idx) => idx !== styleIndex && item.styleId === value,
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Style",
            text: "This style is already selected. Please select a different style.",
          });
          return prev;
        }
      }

      breakup[styleIndex] = { ...breakup[styleIndex], [field]: value };
      row.styleBreakup = breakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addStyleRow = (rowIndex) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.styleBreakup = [...(row.styleBreakup || []), EMPTY_STYLE_ROW()];
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteStyleRow = (rowIndex, styleIndex) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = row.styleBreakup.filter((_, i) => i !== styleIndex);
      row.styleBreakup = breakup.length > 0 ? breakup : [EMPTY_STYLE_ROW()];

      if (orderType !== "AGAINSTPI") {
        row.orderQty = recalculateOrderQty(row.styleBreakup);
      }

      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleNestedSizeChange = (
    rowIndex,
    styleIndex,
    sizeIndex,
    field,
    value,
  ) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const packingSizeBreakup = [...(styleObj.packingSizeBreakup || [])];

      if (field === "sizeId" && value) {
        const isDuplicate = packingSizeBreakup.some(
          (item, idx) => idx !== sizeIndex && item.sizeId === value,
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Size",
            text: "This size is already selected for this style. Please select a different size.",
          });
          return prev;
        }
      }

      if (field === "packingQty") {
        const currentSize = packingSizeBreakup[sizeIndex] || {};
        const currentQty = Number(currentSize.qty) || 0;
        const currentAlreadyPackingQty =
          Number(currentSize.alreadyPackingQty) || 0;
        const enteredPackingQty = Number(value) || 0;

        const maxAllowed =
          (currentQty * (Number(packingPercentage) || 0)) / 100 +
          currentQty -
          currentAlreadyPackingQty;

        if (enteredPackingQty > maxAllowed) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Packing Quantity",
            text: `Packing quantity cannot exceed ${maxAllowed}`,
          });
          return prev;
        }
      }

      if (field === "qty" || field === "packingQty") {
        const newValue = Number(value) || 0;
        let currentTotal = 0;

        styleBreakup.forEach((st, stIdx) => {
          st.packingSizeBreakup.forEach((sz, szIdx) => {
            if (stIdx === styleIndex && szIdx === sizeIndex) {
              currentTotal += newValue;
            } else {
              currentTotal += Number(sz.qty) || 0;
            }
          });
        });
      }

      packingSizeBreakup[sizeIndex] = {
        ...packingSizeBreakup[sizeIndex],
        [field]: value,
      };
      styleObj.packingSizeBreakup = packingSizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      rows[rowIndex] = row;
      return rows;
    });
  };

  const addNestedSizeRow = (rowIndex, styleIndex) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };

      styleObj.packingSizeBreakup = [
        ...(styleObj.packingSizeBreakup || []),
        EMPTY_SIZE_ROW(),
      ];
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteNestedSizeRow = (rowIndex, styleIndex, sizeIndex) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };

      const packingSizeBreakup = styleObj.packingSizeBreakup.filter(
        (_, i) => i !== sizeIndex,
      );
      styleObj.packingSizeBreakup =
        packingSizeBreakup.length > 0 ? packingSizeBreakup : [EMPTY_SIZE_ROW()];
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      if (orderType !== "AGAINSTPI") {
        row.orderQty = recalculateOrderQty(styleBreakup);
      }
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handlePackingBreakupChange = (
    rowIndex,
    styleIndex,
    sizeIndex,
    breakupIndex,
    field,
    value,
  ) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const packingSizeBreakup = [...(styleObj.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIndex] };
      const packingBreakup = [...(sizeObj.packingBreakup || [])];

      packingBreakup[breakupIndex] = {
        ...packingBreakup[breakupIndex],
        [field]: value,
      };

      let totalPackingQty = 0;
      packingBreakup.forEach((item) => {
        const bundle = Number(item.noOfunits) || 0;
        const qty = Number(item.qty) || 0;
        totalPackingQty += bundle * qty;
      });

      const currentQty = Number(sizeObj.qty) || 0;
      const currentAlreadyPackingQty = Number(sizeObj.alreadyPackingQty) || 0;
      const maxAllowed =
        (currentQty * (Number(packingPercentage) || 0)) / 100 +
        currentQty -
        currentAlreadyPackingQty;

      if (totalPackingQty > maxAllowed) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Packing Quantity",
          text: `Total packing quantity cannot exceed ${maxAllowed}`,
        });
        return prev;
      }

      sizeObj.packingBreakup = packingBreakup;
      sizeObj.packingQty = totalPackingQty;
      packingSizeBreakup[sizeIndex] = sizeObj;
      styleObj.packingSizeBreakup = packingSizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addPackingBreakupRow = (rowIndex, styleIndex, sizeIndex) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const packingSizeBreakup = [...(styleObj.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIndex] };

      sizeObj.packingBreakup = [
        ...(sizeObj.packingBreakup || []),
        { bundle: "", pcs: "" },
      ];

      packingSizeBreakup[sizeIndex] = sizeObj;
      styleObj.packingSizeBreakup = packingSizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deletePackingBreakupRow = (
    rowIndex,
    styleIndex,
    sizeIndex,
    breakupIndex,
  ) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const packingSizeBreakup = [...(styleObj.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIndex] };

      const packingBreakup = [...(sizeObj.packingBreakup || [])];
      packingBreakup.splice(breakupIndex, 1);

      let totalPackingQty = 0;
      packingBreakup.forEach((item) => {
        const bundle = Number(item.bundle) || 0;
        const pcs = Number(item.pcs) || 0;
        totalPackingQty += bundle * pcs;
      });

      sizeObj.packingBreakup = packingBreakup;
      sizeObj.packingQty = totalPackingQty;
      packingSizeBreakup[sizeIndex] = sizeObj;
      styleObj.packingSizeBreakup = packingSizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, rowId: rowIndex });
  };

  // ── packingItems handlers ──────────────────────────────────────────────────
  const EMPTY_PACKING_ITEM = () => ({
    packingUomId: "",
    noOfunits: "",
    qty: "",
  });

  const addPackingItem = (rowIndex, sizeIdx) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const packingSizeBreakup = [...(row.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIdx] };
      sizeObj.packingItems = [
        ...(sizeObj.packingItems || []),
        EMPTY_PACKING_ITEM(),
      ];
      packingSizeBreakup[sizeIdx] = sizeObj;
      row.packingSizeBreakup = packingSizeBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const updatePackingItem = (rowIndex, sizeIdx, piIdx, field, value) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const packingSizeBreakup = [...(row.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIdx] };
      let packingItems = [...(sizeObj.packingItems || [])];

      if (piIdx >= packingItems.length) {
        const padding = Array.from(
          { length: piIdx - packingItems.length + 1 },
          () => EMPTY_PACKING_ITEM(),
        );
        packingItems = [...packingItems, ...padding];
      }

      packingItems[piIdx] = { ...packingItems[piIdx], [field]: value };

      let totalPackingQty = 0;
      packingItems.forEach((item) => {
        const units = Number(item.noOfunits) || 0;
        const qty = Number(item.qty) || 0;
        totalPackingQty += units * qty;
      });

      const currentQty = Number(sizeObj.qty) || 0;
      const currentAlreadyPackingQty = Number(sizeObj.alreadyPackingQty) || 0;
      const maxAllowed =
        (currentQty * (Number(packingPercentage) || 0)) / 100 +
        currentQty -
        currentAlreadyPackingQty;

      if (totalPackingQty > maxAllowed) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Packing Quantity",
          text: `Total packing quantity cannot exceed ${maxAllowed}`,
        });
        return prev;
      }

      sizeObj.packingItems = packingItems;
      sizeObj.packingQty = totalPackingQty;
      packingSizeBreakup[sizeIdx] = sizeObj;
      row.packingSizeBreakup = packingSizeBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deletePackingItem = (rowIndex, sizeIdx, piIdx) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const packingSizeBreakup = [...(row.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIdx] };
      const packingItems = (sizeObj.packingItems || []).filter(
        (_, i) => i !== piIdx,
      );

      let totalPackingQty = 0;
      packingItems.forEach((item) => {
        const units = Number(item.noOfunits) || 0;
        const qty = Number(item.qty) || 0;
        totalPackingQty += units * qty;
      });

      sizeObj.packingItems = packingItems.length > 0 ? packingItems : [];
      sizeObj.packingQty = totalPackingQty;
      packingSizeBreakup[sizeIdx] = sizeObj;
      row.packingSizeBreakup = packingSizeBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteAllPackingItems = (rowIndex, sizeIdx) => {
    setPackingOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const packingSizeBreakup = [...(row.packingSizeBreakup || [])];
      const sizeObj = { ...packingSizeBreakup[sizeIdx] };
      sizeObj.packingItems = [];
      sizeObj.packingQty = 0;
      packingSizeBreakup[sizeIdx] = sizeObj;
      row.packingSizeBreakup = packingSizeBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  return (
    <>
      {/* Packing Breakup Modal */}
      <Modal
        isOpen={activePackingBreakupInfo !== null}
        onClose={() => setActivePackingBreakupInfo(null)}
        widthClass="w-[50vw]"
      >
        <div className="p-4 bg-white rounded-lg max-h-[75vh] flex flex-col">
          <h2 className="text-lg font-bold mb-4">
            Packing Breakup {"(Order Qty:- "}
            {
              packingOrderItems?.[activePackingBreakupInfo?.rowIndex]
                ?.styleBreakup?.[activePackingBreakupInfo?.styleIndex]
                ?.packingSizeBreakup?.[activePackingBreakupInfo?.sizeIndex]?.qty
            }
            {" )"}{" "}
          </h2>
          {activePackingBreakupInfo !== null && (
            <div className="flex-1 overflow-auto border border-gray-200 rounded">
              <table className="w-full text-left border-collapse border border-gray-300 bg-white text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">
                      Unit
                    </th>

                    <th className="border border-gray-300 px-2 py-1.5 text-center">
                      No. of Units
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">
                      Qty per Unit
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">
                      Total
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    packingOrderItems[activePackingBreakupInfo.rowIndex]
                      ?.styleBreakup?.[activePackingBreakupInfo.styleIndex]
                      ?.packingSizeBreakup?.[activePackingBreakupInfo.sizeIndex]
                      ?.packingBreakup || []
                  ).map((breakupRow, breakupIdx) => (
                    <tr key={breakupIdx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {breakupIdx + 1}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <FxSelectWithAdd
                          value={breakupRow.packingUomId}
                          onChange={(value) =>
                            handlePackingBreakupChange(
                              activePackingBreakupInfo.rowIndex,
                              activePackingBreakupInfo.styleIndex,
                              activePackingBreakupInfo.sizeIndex,
                              breakupIdx,
                              "packingUomId",
                              value,
                            )
                          }
                          options={(uomList?.data || [])
                            .filter((i) => (id ? true : i.active))
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={
                            readOnly ||
                            childRecord?.current > 0 ||
                            orderType === "AGAINSTPI"
                          }
                          placeholder="Select Uom"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-full text-right outline-none bg-transparent"
                          value={breakupRow.noOfunits}
                          onChange={(e) =>
                            handlePackingBreakupChange(
                              activePackingBreakupInfo.rowIndex,
                              activePackingBreakupInfo.styleIndex,
                              activePackingBreakupInfo.sizeIndex,
                              breakupIdx,
                              "noOfunits",
                              e.target.value,
                            )
                          }
                        />
                      </td>

                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-full text-right outline-none bg-transparent"
                          value={breakupRow.qty}
                          onChange={(e) =>
                            handlePackingBreakupChange(
                              activePackingBreakupInfo.rowIndex,
                              activePackingBreakupInfo.styleIndex,
                              activePackingBreakupInfo.sizeIndex,
                              breakupIdx,
                              "qty",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right bg-gray-50 font-semibold">
                        {(Number(breakupRow.noOfunits) || 0) *
                          (Number(breakupRow.qty) || 0)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              addPackingBreakupRow(
                                activePackingBreakupInfo.rowIndex,
                                activePackingBreakupInfo.styleIndex,
                                activePackingBreakupInfo.sizeIndex,
                              )
                            }
                            className="p-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200"
                          >
                            <Plus size={12} />
                          </button>
                          {breakupIdx > 0 && (
                            <button
                              onClick={() =>
                                deletePackingBreakupRow(
                                  activePackingBreakupInfo.rowIndex,
                                  activePackingBreakupInfo.styleIndex,
                                  activePackingBreakupInfo.sizeIndex,
                                  breakupIdx,
                                )
                              }
                              className="p-1 bg-red-100 rounded text-red-700 hover:bg-red-200"
                            >
                              <FaTrash size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <div className="w-full h-full overflow-y-auto mb-2 bg-white border border-slate-200 rounded-md">
        <table className="w-[60vw] border-collapse table-fixed">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-6 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                S.No
              </th>
              <th className="w-44 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Description of Goods
              </th>
              <th className="w-28 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Item Group
              </th>

              <th className="w-16 px-2 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Type
              </th>
              <th className="w-16 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                UOM
              </th>
              <th className="w-16 px-1 py-1 text-center font-medium border border-gray-300 text-[11px]">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {packingOrderItems?.map((row, index) => (
              <React.Fragment key={index}>
                <tr
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
                      <option value="None">None</option>
                      <option value="Barcode">Barcode</option>
                      <option value="Size Template">Size Template</option>
                      <option value="Size Template + Barcode">
                        Size Template + Barcode
                      </option>
                    </select>
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
                            if (index === packingOrderItems.length - 1) {
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
                        [
                          "Size Template",
                          "Size Template + Barcode",
                          "Barcode",
                        ].includes(row.trackingType)
                      }
                      readOnly={
                        readOnly ||
                        [
                          "Size Template",
                          "Size Template + Barcode",
                          "Barcode",
                        ].includes(row.trackingType)
                      }
                    />
                  </td>
                </tr>

                {row.trackingType !== "None" && row.styleItemId && (
                  <tr>
                    <td colSpan={6} className="p-0 bg-slate-50">
                      <div
                        className="mt-2 border border-slate-300 shadow-md rounded-lg mx-2 mb-4 packing-details-panel"
                        data-row={index}
                      >
                        <div className="bg-slate-100 p-3 rounded-lg">
                          <div className="bg-white p-2 rounded-lg flex justify-between items-center  shadow-sm">
                            <h3 className="text-[14px] font-bold text-slate-800">
                              Packing Details
                            </h3>
                            {activeSizeKey?.rowIndex === index &&
                              activeSizeKey?.sizeIdx !== null && (
                                <span className="text-[11px] text-indigo-600 font-semibold">
                                  Packing Items for row{" "}
                                  {activeSizeKey.sizeIdx + 1}
                                </span>
                              )}
                          </div>

                          {/* Side-by-side layout */}
                          <div className="flex gap-3">
                            {/* LEFT: packingSizeBreakup table */}
                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                              <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-10">
                                      S.No
                                    </th>
                                    {row?.trackingType !== "Barcode" && (
                                      <th className="w-28 border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                                        Size
                                      </th>
                                    )}
                                    {(row?.trackingType === "Barcode" ||
                                      row?.trackingType ===
                                        "Size Template + Barcode") && (
                                      <>
                                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-24">
                                          Barcode From
                                        </th>
                                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-24">
                                          Barcode To
                                        </th>
                                      </>
                                    )}
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                                      Order Qty
                                    </th>
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-24">
                                      Already Packed
                                    </th>
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                                      Packing Qty
                                    </th>
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                                      Gross Wt
                                    </th>
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                                      Net Wt
                                    </th>
                                    <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                                      Dimensions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const actualRows =
                                      row?.packingSizeBreakup || [];
                                    if (actualRows.length >= 5)
                                      return actualRows;
                                    return [
                                      ...actualRows,
                                      ...Array(5 - actualRows.length).fill({}),
                                    ];
                                  })().map((breakup, sizeIdx) => {
                                    const isSelected =
                                      (activeSizeKey?.rowIndex === index &&
                                        activeSizeKey?.sizeIdx === sizeIdx &&
                                        breakup.sizeId !== undefined) ||
                                      breakup.barcodeFrom !== undefined;
                                    const hasData =
                                      breakup.sizeId || breakup.barcodeFrom;
                                    const isActive =
                                      activeSizeKey?.rowIndex === index &&
                                      activeSizeKey?.sizeIdx === sizeIdx;
                                    return (
                                      <tr
                                        key={sizeIdx}
                                        className={`h-8 cursor-pointer transition-colors ${
                                          isActive
                                            ? "bg-indigo-100 ring-1 ring-inset ring-indigo-400"
                                            : hasData
                                              ? "hover:bg-indigo-50"
                                              : ""
                                        }`}
                                        onClick={(e) => {
                                          if (hasData) {
                                            if (isActive) {
                                              setActiveSizeKey(null);
                                            } else {
                                              setActiveSizeKey({
                                                rowIndex: index,
                                                sizeIdx,
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        <td className="border-b border-r border-slate-200 text-center text-[11px]">
                                          {sizeIdx + 1}
                                        </td>
                                        {row?.trackingType !== "Barcode" && (
                                          <td className="border-b border-r border-slate-200 text-left pl-1 text-[11px]">
                                            {findFromList(
                                              breakup.sizeId,
                                              sizeList?.data,
                                              "name",
                                            )}
                                          </td>
                                        )}
                                        {(row?.trackingType === "Barcode" ||
                                          row?.trackingType ===
                                            "Size Template + Barcode") && (
                                          <>
                                            <td className="border-b border-r border-slate-200 text-left pl-1 text-[11px]">
                                              {breakup.barcodeFrom}
                                            </td>
                                            <td className="border-b border-r border-slate-200 text-left pl-1 text-[11px]">
                                              {breakup.barcodeTo}
                                            </td>
                                          </>
                                        )}
                                        <td className="border-b border-r border-slate-200 text-right px-2 text-[11px]">
                                          {breakup.qty !== undefined
                                            ? Number(breakup.qty)
                                            : ""}
                                        </td>
                                        <td className="border-b border-r border-slate-200 text-right px-2 text-[11px]">
                                          {breakup.alreadyPackingQty !==
                                          undefined
                                            ? Number(breakup.alreadyPackingQty)
                                            : ""}
                                        </td>
                                        <td className="border-b border-r border-slate-200 text-right px-2 text-[11px] h-full">
                                          {breakup.packingQty !== undefined &&
                                          breakup.packingQty !== 0
                                            ? Number(breakup.packingQty)
                                            : ""}
                                        </td>
                                        <td className="border-b border-r border-slate-200 text-right p-0 text-[11px] h-full">
                                          <input
                                            type="text"
                                            className="w-full h-8 text-right px-2 outline-none bg-transparent"
                                            value={breakup.grossWeight ?? ""}
                                            onChange={(e) => {
                                              const val =
                                                e.target.value.replace(
                                                  /[^0-9.]/g,
                                                  "",
                                                );
                                              handleSizeBreakupChange(
                                                index,
                                                sizeIdx,
                                                "grossWeight",
                                                val,
                                              );
                                            }}
                                            onBlur={(e) => {
                                              if (e.target.value) {
                                                const parsed = parseFloat(
                                                  e.target.value,
                                                );
                                                if (!isNaN(parsed)) {
                                                  handleSizeBreakupChange(
                                                    index,
                                                    sizeIdx,
                                                    "grossWeight",
                                                    parsed.toFixed(3),
                                                  );
                                                }
                                              }
                                            }}
                                            disabled={readOnly}
                                          />
                                        </td>
                                        <td className="border-b border-r border-slate-200 text-right p-0 text-[11px] h-full">
                                          <input
                                            type="text"
                                            className="w-full h-8 text-right px-2 outline-none bg-transparent"
                                            value={breakup.netWeight ?? ""}
                                            onChange={(e) => {
                                              const val =
                                                e.target.value.replace(
                                                  /[^0-9.]/g,
                                                  "",
                                                );
                                              handleSizeBreakupChange(
                                                index,
                                                sizeIdx,
                                                "netWeight",
                                                val,
                                              );
                                            }}
                                            onBlur={(e) => {
                                              if (e.target.value) {
                                                const parsed = parseFloat(
                                                  e.target.value,
                                                );
                                                if (!isNaN(parsed)) {
                                                  handleSizeBreakupChange(
                                                    index,
                                                    sizeIdx,
                                                    "netWeight",
                                                    parsed.toFixed(3),
                                                  );
                                                }
                                              }
                                            }}
                                            disabled={readOnly}
                                          />
                                        </td>
                                        <td className="border-b border-r border-slate-200 text-right p-0 text-[11px] h-full">
                                          <input
                                            type="text"
                                            className="w-full h-8 text-left px-2 outline-none bg-transparent"
                                            value={breakup.dimensions ?? ""}
                                            onChange={(e) => {
                                              handleSizeBreakupChange(
                                                index,
                                                sizeIdx,
                                                "dimensions",
                                                e.target.value,
                                              );
                                            }}
                                            disabled={readOnly}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50 font-bold">
                                    <td
                                      colSpan={
                                        row?.trackingType === "Barcode"
                                          ? 3
                                          : row?.trackingType ===
                                              "Size Template + Barcode"
                                            ? 4
                                            : 2
                                      }
                                      className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]"
                                    >
                                      Total
                                    </td>
                                    <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                                      {(row?.packingSizeBreakup || []).reduce(
                                        (sum, b) => sum + (Number(b.qty) || 0),
                                        0,
                                      )}
                                    </td>
                                    <td
                                      colSpan={4}
                                      className="border-b border-r border-slate-200"
                                    ></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Placeholder hidden row: no-op, packing items panel is rendered outside the table */}

                {/* Packing Items right-click context menu */}
                {packingItemsContextMenu && (
                  <tr style={{ display: "none" }}>
                    <td></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* ── Packing Items fixed panel — completely outside all tables ── */}
      {activeSizeKey !== null &&
        (() => {
          const piRow = packingOrderItems[activeSizeKey.rowIndex];
          const sizeEntry = piRow?.packingSizeBreakup?.[activeSizeKey.sizeIdx];
          const piRows = sizeEntry?.packingItems || [];
          const display =
            piRows.length >= 4
              ? piRows
              : [
                  ...piRows,
                  ...Array.from({ length: 5 - piRows.length }, () =>
                    EMPTY_PACKING_ITEM(),
                  ),
                ];
          return (
            <div
              style={{
                position: "fixed",
                top: `${panelTop}px`,
                left: `${panelLeft}px`,
                zIndex: 1100,
              }}
              className="w-[35vw] border border-slate-300 shadow-md rounded-lg"
            >
              {/* Same outer bg as Packing Details */}
              <div className="bg-slate-100 p-3 rounded-lg">
                {/* Same title bar as Packing Details */}
                <div className="bg-white p-2 rounded-lg flex justify-between items-center  shadow-sm">
                  <h3 className="text-[14px] font-bold text-slate-800">
                    Packing Items
                  </h3>
                  <button
                    className="text-slate-500 hover:text-red-500 text-[18px] leading-none"
                    onClick={() => setActiveSizeKey(null)}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                {/* Same table wrapper as Packing Details */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible">
                  <table className="w-full table-fixed border-separate border-spacing-0 border-t border-l border-slate-200">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-8">
                          S.No
                        </th>
                        <th className="w-16 border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase">
                          UOM
                        </th>
                        <th className="w-16  border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase ">
                          No. of Units
                        </th>
                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                          Qty / Unit
                        </th>
                        <th className="border-b border-r border-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase w-20">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {display.map((pi, piIdx) => (
                        <tr
                          key={piIdx}
                          className="h-8 hover:bg-slate-50"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setPackingItemsContextMenu({
                              mouseX: e.clientX,
                              mouseY: e.clientY,
                              rowIndex: activeSizeKey.rowIndex,
                              sizeIdx: activeSizeKey.sizeIdx,
                              piIdx,
                            });
                          }}
                        >
                          <td className="border-b border-r border-slate-200 text-center text-[11px] text-slate-500">
                            {piIdx + 1}
                          </td>
                          <td className="border-b border-r border-slate-200 text-[11px] p-0">
                            <FxSelectWithAdd
                              value={pi.packingUomId || ""}
                              onChange={(val) => {
                                updatePackingItem(
                                  activeSizeKey.rowIndex,
                                  activeSizeKey.sizeIdx,
                                  piIdx,
                                  "packingUomId",
                                  val,
                                );
                              }}
                              options={(uomList?.data || [])
                                .filter((i) => (id ? true : i.active))
                                .map((i) => ({ label: i.name, value: i.id }))}
                              readOnly={readOnly}
                              placeholder="Select UOM"
                              menuPortalTarget={document.body}
                            />
                          </td>
                          <td className="border-b border-r border-slate-200 text-[11px] p-0">
                            <input
                              type="number"
                              min="0"
                              className="w-full h-full text-right px-2 text-[11px] outline-none bg-transparent"
                              value={pi.noOfunits || ""}
                              onChange={(e) => {
                                updatePackingItem(
                                  activeSizeKey.rowIndex,
                                  activeSizeKey.sizeIdx,
                                  piIdx,
                                  "noOfunits",
                                  e.target.value,
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    piIdx === piRows.length - 1 ||
                                    piRows.length === 0
                                  ) {
                                    addPackingItem(
                                      activeSizeKey.rowIndex,
                                      activeSizeKey.sizeIdx,
                                    );
                                  }
                                }
                              }}
                              disabled={readOnly}
                            />
                          </td>
                          <td className="border-b border-r border-slate-200 text-[11px] p-0">
                            <input
                              type="number"
                              min="0"
                              className="w-full h-full text-right px-2 text-[11px] outline-none bg-transparent"
                              value={pi.qty || ""}
                              onChange={(e) => {
                                updatePackingItem(
                                  activeSizeKey.rowIndex,
                                  activeSizeKey.sizeIdx,
                                  piIdx,
                                  "qty",
                                  e.target.value,
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    piIdx === piRows.length - 1 ||
                                    piRows.length === 0
                                  ) {
                                    addPackingItem(
                                      activeSizeKey.rowIndex,
                                      activeSizeKey.sizeIdx,
                                    );
                                  }
                                }
                              }}
                              disabled={readOnly}
                            />
                          </td>
                          <td className="border-b border-r border-slate-200 text-right px-2 text-[11px] font-semibold bg-slate-50">
                            {(Number(pi.noOfunits) || 0) *
                              (Number(pi.qty) || 0) || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td
                          colSpan={4}
                          className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]"
                        >
                          Total
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-[11px]">
                          {piRows.reduce(
                            (sum, pi) =>
                              sum +
                              (Number(pi.noOfunits) || 0) *
                                (Number(pi.qty) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

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

      {/* Packing Items context menu */}
      {packingItemsContextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${packingItemsContextMenu.mouseY}px`,
            left: `${packingItemsContextMenu.mouseX}px`,
            boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
            padding: "4px",
            borderRadius: "4px",
            zIndex: 1001,
          }}
          className="bg-white border border-gray-200 shadow-xl"
          onMouseLeave={() => setPackingItemsContextMenu(null)}
        >
          <div className="flex flex-col min-w-[120px]">
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-medium rounded transition-colors"
              onClick={() => {
                deletePackingItem(
                  packingItemsContextMenu.rowIndex,
                  packingItemsContextMenu.sizeIdx,
                  packingItemsContextMenu.piIdx,
                );
                setPackingItemsContextMenu(null);
              }}
            >
              Delete Row
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                deleteAllPackingItems(
                  packingItemsContextMenu.rowIndex,
                  packingItemsContextMenu.sizeIdx,
                );
                setPackingItemsContextMenu(null);
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

export default PackingItems;
