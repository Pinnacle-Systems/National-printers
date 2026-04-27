import React, { useState, useEffect } from "react";
import FxSelect from "../../../Inputs";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { getCommonParams } from "../../../Utils/helper";
import { VIEW } from "../../../icons";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import { toast } from "react-toastify";

const ProformaInvoiceItems = ({
  items,
  enrichedItems,
  setItems,
  readOnly,
  taxTemplateId,
  id,
}) => {
  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { companyId },
  });
  const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
  const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
  const { data: uomList } = useGetUomQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });

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

  useEffect(() => {
    if (!items || items.length < 14) {
      const currentLength = items?.length || 0;
      const paddingNeeded = 14 - currentLength;
      if (paddingNeeded > 0) {
        setItems([
          ...(items || []),
          ...Array.from({ length: paddingNeeded }, () => ({ ...EMPTY_ROW })),
        ]);
      }
    }
  }, [items]);

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
          poItems={enrichedItems || items}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          onCloseFocus={() => {}}
        />
      </Modal>

      <div className="w-full h-full overflow-y-auto bg-white">
        <table className="w-full border-collapse table-fixed min-h-full bg-white">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-48 px-2 py-2 text-center font-medium border border-gray-300">
                Description of Goods
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Size
              </th>

              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                GSM
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-16 px-1 py-2 text-center font-medium border border-gray-300">
                Qty
              </th>
              <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                Price
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Gross
              </th>
              <th className="w-12 px-1 py-2 text-center font-medium border border-gray-300">
                Tax
              </th>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border border-gray-200 cursor-pointer hover:bg-indigo-50`}
                onContextMenu={(e) => !readOnly && handleRightClick(e, index)}
              >
                <td className="text-[11px] text-center border border-gray-300">
                  {index + 1}
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={item.styleItemId}
                    onChange={(val) =>
                      handleInputChange(val, index, "styleItemId")
                    }
                    options={
                      styleItemList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={true} // Read-only from Order Entry
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={item.sizeId}
                    onChange={(val) => handleInputChange(val, index, "sizeId")}
                    options={
                      sizeList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={true} // Read-only from Order Entry
                    placeholder=""
                  />
                </td>

                <td className="border border-gray-300">
                  <FxSelect
                    value={item.gsmId}
                    onChange={(val) => handleInputChange(val, index, "gsmId")}
                    options={
                      gsmList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={true} // Read-only from Order Entry
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={item.hsnId}
                    onChange={(val) => handleInputChange(val, index, "hsnId")}
                    options={
                      hsnList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={true} // Read-only from Order Entry
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <FxSelect
                    value={item.uomId}
                    onChange={(val) => handleInputChange(val, index, "uomId")}
                    options={
                      uomList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={true} // Read-only from Order Entry
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300">
                  <input
                    type="number"
                    className="w-full text-[11px] text-right px-1 outline-none bg-transparent"
                    value={item.qty}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "qty")
                    }
                    readOnly={readOnly}
                    onFocus={(e) => e.target.select()}
                  />
                </td>
                <td className="border border-gray-300 border-l-2 ">
                  <input
                    type="number"
                    className="w-full text-[11px] text-right px-1 outline-none bg-transparent"
                    value={item.price}
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "price")
                    }
                    readOnly={readOnly}
                    onFocus={(e) => e.target.select()}
                  />
                </td>
                <td className="text-[11px] text-right  px-1 border border-gray-300 bg-gray-50 bg-transparent">
                  {item.amount}
                </td>
                <td className="border border-gray-300 text-center text-[11px]">
                  <button
                    disabled={!item.styleItemId}
                    className=" text-indigo-600 hover:text-indigo-800 disabled:text-gray-300"
                    onClick={() => {
                      if (!taxTemplateId) {
                        return toast.info("Please select Tax Type", {
                          position: "top-center",
                        });
                      }
                      setCurrentSelectedIndex(index);
                    }}
                  >
                    {VIEW}
                  </button>
                </td>
                <td className="border border-gray-300 text-center">
                  <input
                    className="w-full bg-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (index === items.length - 1) {
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
            <tr className="bg-gray-100 h-7 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={6}
              >
                Total Qty
              </td>
              <td className="text-right px-1 border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300"></td>
              <td className="text-right px-1 border border-gray-300  text-black">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                  .toFixed(2)}
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
              Delete Row
            </button>
            <button
              className="text-[12px] text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium rounded transition-colors"
              onClick={() => {
                setItems(Array.from({ length: 14 }, () => ({ ...EMPTY_ROW })));
                handleCloseContextMenu();
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProformaInvoiceItems;
