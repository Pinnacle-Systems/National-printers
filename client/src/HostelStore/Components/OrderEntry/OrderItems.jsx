import React, { useState, useEffect } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { getCommonParams } from "../../../Utils/helper";
import { Gsm, Size, StyleItemMaster, UomMaster } from "..";
import { FiEye } from "react-icons/fi";
import Modal from "../../../UiComponents/Modal";
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

  const EMPTY_ROW = {
    itemGroupId: "",
    styleItemId: "",
    trackingType: "None",
    sizeId: "",
    sizeTemplateId: "",
    barcodeFrom: "",
    barcodeTo: "",
    uomId: "",
    gsmId: "",
    hsnId: "",
    orderQty: "",
    remarks: "",
    sizeBreakup: [],
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  const handleOpenSizeModal = async (index) => {
    setActiveRowIndex(index);
    setSizeModalOpen(true);

    const currentRow = orderItems[index];
    const hasEmptyBreakup =
      !currentRow.sizeBreakup || currentRow.sizeBreakup.length === 0;

    let targetTemplateId = currentRow.sizeTemplateId;

    if (!targetTemplateId) {
      const selectedItem = styleItemList?.data?.find(
        (item) => item.id === currentRow.styleItemId,
      );
      targetTemplateId = selectedItem?.sizeTemplateId;
    }

    if (targetTemplateId && hasEmptyBreakup) {
      try {
        const response =
          await triggerGetTemplateById(targetTemplateId).unwrap();
        const template = response?.data;
        if (template && template.SizeTemplateList) {
          const initialBreakup = template.SizeTemplateList.map((t) => ({
            sizeId: t.sizeId,
            qty: "",
            barcodeFrom: "",
            barcodeTo: "",
          }));

          setOrderItems((prev) => {
            const newRows = [...prev];
            if (newRows[index]) {
              newRows[index] = {
                ...newRows[index],
                sizeTemplateId: targetTemplateId,
                sizeBreakup: initialBreakup,
              };
            }
            return newRows;
          });
        }
      } catch (e) {
        console.error("Failed to fetch size template details", e);
      }
    }
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
        console.error("Failed to fetch size template details", e);
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

    // Auto-fill Item Group, UOM, GSM, and HSN when item is chosen
    if (field === "styleItemId" && value) {
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
          sizeBreakup: [],
          orderQty: "",
          barcodeFrom: "",
          barcodeTo: "",
        };
      }
    }

    // Auto-calculate qty for Barcode tracking
    if (
      (field === "barcodeFrom" || field === "barcodeTo") &&
      updatedRow.trackingType === "Barcode"
    ) {
      const from = parseInt(updatedRow.barcodeFrom) || 0;
      const to = parseInt(updatedRow.barcodeTo) || 0;
      if (to >= from && from > 0) {
        updatedRow.orderQty = to - from + 1;
      } else {
        updatedRow.orderQty = 0;
      }
    }

    newRows[index] = updatedRow;
    setOrderItems(newRows);
  };

  const handleRightClick = (event, rowIndex, type) => {
    event.preventDefault();
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
    setOrderItems(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
  };

  // Row initialization is now handled in the parent OrderEntryForm

  return (
    <>
      <div className="w-[97vw]  h-[300px] overflow-y-auto mb-2 bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-56 py-2 text-center font-medium border border-gray-300">
                Description of Goods
              </th>
              <th className="w-40 px-1 py-2 text-center font-medium border border-gray-300">
                Item Group
              </th>

              <th className="w-36 px-1 py-2 text-center font-medium border border-gray-300">
                Type
              </th>

              <th className="w-16 px-1 py-2 text-center font-medium border border-gray-300">
                Size
              </th>
              <th className="w-28 px-1 py-2 text-center font-medium border border-gray-300">
                Barcode From
              </th>
              <th className="w-28 px-1 py-2 text-center font-medium border border-gray-300">
                Barcode To
              </th>
              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                GSM
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                Qty
              </th>
              <th className="w-40 px-1 py-2 text-center font-medium border border-gray-300">
                Remarks
              </th>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems?.map((row, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border border-gray-200 cursor-pointer h-8 hover:bg-indigo-50`}
                onContextMenu={(e) =>
                  !readOnly && handleRightClick(e, index, "")
                }
              >
                <td className="text-[11px] text-center border border-gray-300">
                  {index + 1}
                </td>

                <td className="border border-gray-300">
                  <FxSelectWithAdd
                    inputId={`styleItemId-input-${index}`}
                    value={row.styleItemId}
                    onChange={(val) =>
                      handleInputChange(val, index, "styleItemId")
                    }
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
                  <FxSelectWithAdd
                    inputId={`itemGroupId-input-${index}`}
                    value={row.itemGroupId}
                    onChange={(val) =>
                      handleInputChange(val, index, "itemGroupId")
                    }
                    options={(itemGroupList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={readOnly}
                    placeholder=""
                    addNew={true}
                    childComponent={ItemGroup}
                    addNewModalWidth="w-[50%] h-[57%]"
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={row.trackingType || "None"}
                    onChange={(val) =>
                      handleInputChange(val, index, "trackingType")
                    }
                    options={[
                      { label: "None", value: "None" },
                      { label: "Barcode", value: "Barcode" },
                      { label: "Size Template", value: "Size Template" },
                      {
                        label: "Size Template + Barcode",
                        value: "Size Template + Barcode",
                      },
                    ]}
                    readOnly={readOnly}
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <div className="flex items-center justify-center h-full w-full">
                    <button
                      type="button"
                      onClick={() => handleOpenSizeModal(index)}
                      disabled={
                        !row.styleItemId ||
                        readOnly ||
                        !["Size Template", "Size Template + Barcode"].includes(
                          row.trackingType,
                        )
                      }
                      className="p-1 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
                      title="View Sizes"
                    >
                      <FiEye size={18} />
                    </button>
                  </div>
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    className="w-full h-full min-h-[1.5rem] text-[11px] bg-transparent outline-none px-1 "
                    value={row.barcodeFrom || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "barcodeFrom")
                    }
                    readOnly={readOnly || row.trackingType !== "Barcode"}
                    disabled={readOnly || row.trackingType !== "Barcode"}
                    placeholder={row.trackingType === "Barcode" ? "From" : ""}
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    className="w-full h-full min-h-[1.5rem] text-[11px] bg-transparent outline-none px-1 "
                    value={row.barcodeTo || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "barcodeTo")
                    }
                    readOnly={readOnly || row.trackingType !== "Barcode"}
                    disabled={readOnly || row.trackingType !== "Barcode"}
                    placeholder={row.trackingType === "Barcode" ? "To" : ""}
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={row.uomId}
                    onChange={(val) => handleInputChange(val, index, "uomId")}
                    options={(uomList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={true} // Read-only as requested
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={row.gsmId}
                    onChange={(val) => handleInputChange(val, index, "gsmId")}
                    options={(gsmList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={readOnly}
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={row.hsnId}
                    onChange={(val) => handleInputChange(val, index, "hsnId")}
                    options={(hsnList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={readOnly}
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <input
                    id={`orderQty-input-${index}`}
                    type="number"
                    className="w-full text-[11px] text-right px-1 outline-none bg-transparent"
                    onFocus={(e) => {
                      e.target.select();
                      setFocusedField(`${index}`);
                    }}
                    value={
                      focusedField === `${index}`
                        ? (row?.orderQty ?? "")
                        : row?.orderQty
                          ? Number(row.orderQty).toFixed(3)
                          : ""
                    }
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "orderQty")
                    }
                    onBlur={(e) => {
                      const val = e.target.value;
                      handleInputChange(
                        val ? Number(val).toFixed(3) : "",
                        index,
                        "orderQty",
                      );
                      setFocusedField(null);
                    }}
                    disabled={
                      readOnly ||
                      ["Size Template", "Size Template + Barcode"].includes(
                        row.trackingType,
                      )
                    }
                    readOnly={
                      readOnly ||
                      ["Size Template", "Size Template + Barcode"].includes(
                        row.trackingType,
                      )
                    }
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    className="w-full h-full min-h-[1.5rem] text-[11px] outline-none px-1 bg-transparent"
                    value={row.remarks || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "remarks")
                    }
                    disabled={readOnly}
                    placeholder="Remarks"
                  />
                </td>
                <td className="border border-gray-300 text-center">
                  <input
                    className="w-full bg-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (index === orderItems.length - 1) {
                          addRow();
                        }
                      }
                    }}
                    disabled={readOnly}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 h-8 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={10}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300 text-black">
                {orderItems
                  ?.reduce((sum, row) => sum + (Number(row.orderQty) || 0), 0)
                  .toFixed(3)}
              </td>
              <td className="border border-gray-300" colSpan={2}></td>
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

      {sizeModalOpen && activeRowIndex !== null && (
        <Modal
          isOpen={sizeModalOpen}
          onClose={() => setSizeModalOpen(false)}
          widthClass="w-[700px]"
        >
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Size Wise Breakup</h3>
            <div className="mb-4 bg-gray-50 p-2 border border-gray-200 rounded-md flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-600">
                Size Template:
              </span>
              <span className="text-[12px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {sizeTemplateList?.data?.find(
                  (t) => t.id === orderItems[activeRowIndex]?.sizeTemplateId,
                )?.name || "No Template Selected"}
              </span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 text-left text-[11px] font-bold text-gray-700">
                      Size
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-left text-[11px] font-bold text-gray-700">
                      Qty
                    </th>
                    {orderItems[activeRowIndex]?.trackingType ===
                      "Size Template + Barcode" && (
                      <>
                        <th className="border border-gray-300 px-2 py-1 text-left text-[11px] font-bold text-gray-700">
                          Barcode From
                        </th>
                        <th className="border border-gray-300 px-2 py-1 text-left text-[11px] font-bold text-gray-700">
                          Barcode To
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(orderItems[activeRowIndex]?.sizeBreakup || []).map(
                    (item, idx) => {
                      const sizeName =
                        sizeList?.data?.find((s) => s.id === item.sizeId)
                          ?.name || "Unknown";
                      return (
                        <tr key={idx} className="h-7 hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-0 text-[11px]">
                            {sizeName}
                          </td>
                          <td className="border border-gray-300 px-1 py-0">
                            <input
                              type="number"
                              className="w-full h-6 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                              value={item.qty}
                              onChange={(e) =>
                                handleSizeBreakupChange(
                                  idx,
                                  "qty",
                                  e.target.value,
                                )
                              }
                              disabled={readOnly}
                              placeholder="0"
                            />
                          </td>
                          {orderItems[activeRowIndex]?.trackingType ===
                            "Size Template + Barcode" && (
                            <>
                              <td className="border border-gray-300 px-1 py-0">
                                <input
                                  type="text"
                                  className="w-full h-6 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
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
                              <td className="border border-gray-300 px-1 py-0">
                                <input
                                  type="text"
                                  className="w-full h-6 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
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
                            </>
                          )}
                        </tr>
                      );
                    },
                  )}
                  {(!orderItems[activeRowIndex]?.sizeBreakup ||
                    orderItems[activeRowIndex].sizeBreakup.length === 0) && (
                    <tr>
                      <td
                        colSpan={
                          orderItems[activeRowIndex]?.trackingType ===
                          "Size Template + Barcode"
                            ? "4"
                            : "2"
                        }
                        className="text-center p-4 text-gray-500"
                      >
                        No sizes found in template or no template assigned to
                        this style.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700 font-medium"
                onClick={() => setSizeModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default OrderItems;
