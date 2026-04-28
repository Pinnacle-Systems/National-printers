import React, { useState, useEffect } from "react";
import FxSelect from "../../../Inputs";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { getCommonParams } from "../../../Utils/helper";

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

  const EMPTY_ROW = {
    styleItemId: "",
    sizeId: "",
    uomId: "",
    gsmId: "",
    hsnId: "",
    orderQty: "",
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const addRow = () => {
    setOrderItems([...orderItems, EMPTY_ROW]);
  };

  const deleteRow = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleInputChange = (value, index, field) => {
    const newRows = [...orderItems];
    let updatedRow = { ...newRows[index], [field]: value };

    // Auto-fill UOM, GSM, and HSN when item is chosen
    if (field === "styleItemId" && value) {
      const selectedItem = styleItemList?.data?.find(
        (item) => item.id === value,
      );
      if (selectedItem) {
        updatedRow = {
          ...updatedRow,
          uomId: selectedItem.uomId || "",
          gsmId: selectedItem.gsmId || "",
          hsnId: selectedItem.hsnId || "",
        };
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
      <div className="w-[70vw]  h-[300px] overflow-y-auto mb-2 bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-64 px-2 py-2 text-center font-medium border border-gray-300">
                Description of Goods
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Size
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
                  <FxSelect
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
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={row.sizeId}
                    onChange={(val) => handleInputChange(val, index, "sizeId")}
                    options={(sizeList?.data || [])
                      .filter((item) => (id ? true : item.active))
                      .map((item) => ({ label: item.name, value: item.id }))}
                    readOnly={readOnly}
                    placeholder=""
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
                          ? Number(row.orderQty).toFixed(2)
                          : ""
                    }
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "orderQty")
                    }
                    onBlur={(e) => {
                      const val = e.target.value;
                      handleInputChange(
                        val ? Number(val).toFixed(2) : "",
                        index,
                        "orderQty",
                      );
                      setFocusedField(null);
                    }}
                    disabled={readOnly}
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
                colSpan={6}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300 text-black">
                {orderItems
                  ?.reduce((sum, row) => sum + (Number(row.orderQty) || 0), 0)
                  .toFixed(2)}
              </td>
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
    </>
  );
};

export default OrderItems;
