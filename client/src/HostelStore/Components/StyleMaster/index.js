import React, { useCallback, useEffect, useRef, useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { Check, Plus, Power } from "lucide-react";
import Swal from "sweetalert2";
import {
  CheckBoxNew,
  ReusableTable,
  TextInputNew,
  TextInputNew1,
  ToggleButton,
} from "../../../Inputs";
import {
  useAddStyleMasterMutation,
  useDeleteStyleMasterMutation,
  useGetStyleMasterByIdQuery,
  useGetStyleMasterQuery,
  useUpdateStyleMasterMutation,
} from "../../../redux/services/StyleMasterService";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService";
import Modal from "../../../UiComponents/Modal";
import { statusDropdown } from "../../../Utils/DropdownData";
import { useDispatch, useSelector } from "react-redux";
import { push } from "../../../redux/features/opentabs";
import { DropdownWithModal } from "../../../Inputs/Reuseable";
import { StyleItemMaster } from "..";
import { dropDownListObject } from "../../../Utils/contructObject";
const MODEL = "Style Master";

const StyleMaster = ({
  onSuccess,
  onClose,
  defaultName = "",
  embeddedMode = false,
  defaultStyleItemId = "",
} = {}) => {
  const [form, setForm] = useState(embeddedMode || !!onSuccess);

  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState(defaultName || "");
  const [styleItemId, setStyleItemId] = useState(defaultStyleItemId || "");
  const [active, setActive] = useState(true);
  const [hidePrintFormat, setHidePrintFormat] = useState(false);

  const countryNameRef = useRef(null);

  useEffect(() => {
    if ((form || onSuccess) && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form, onSuccess]);

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (defaultStyleItemId) setStyleItemId(defaultStyleItemId);
  }, [defaultStyleItemId]);

  const [searchValue, setSearchValue] = useState("");

  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params,
    searchParams: searchValue,
  });
  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetStyleMasterQuery({ params, searchParams: searchValue });
  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetStyleMasterByIdQuery(id, { skip: !id });

  const [addData] = useAddStyleMasterMutation();
  const [updateData] = useUpdateStyleMasterMutation();
  const [removeData] = useDeleteStyleMasterMutation();

  const childRecord = useRef(0);

  const syncFormWithDb = useCallback(
    (data) => {
      setName(data?.name ? data.name : defaultName || "");
      setStyleItemId(
        data?.styleItemId ? data?.styleItemId : defaultStyleItemId || "",
      );
      setActive(id ? (data?.active ? data.active : false) : true);
      setHidePrintFormat(data?.hidePrintFormat ? data?.hidePrintFormat : false);

      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      countryNameRef?.current?.focus();
    },
    [id, defaultName, defaultStyleItemId],
  );

  useEffect(() => {
    if (id && singleData?.data) {
      syncFormWithDb(singleData?.data);
    }
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    id,
    active,
    styleItemId,
    hidePrintFormat,
    //  productType,
    name,
    // seoTitle, sleeve, fabricId, sizeTemplateId,
    // pattern, occassion, material, active, washCare, hsn,
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };

  const validateData = (data) => {
    if (data.styleItemId && data.name) {
      return true;
    }
    return false;
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: data }).unwrap();
      } else {
        returnData = await callback(data).unwrap();
      }
      if (returnData?.data?.id) {
        setId(returnData.data.id);
      }
      // toast.success(text + "Successfully");
      Swal.fire({
        title: text + "  " + "Successfully",
        icon: "success",
        timer: 1500,
      });
      if (onSuccess && returnData?.data?.id) {
        onSuccess(returnData.data.id);
        if (onClose) onClose();
        return;
      }
      if (nextProcess == "new") {
        syncFormWithDb(undefined);
        onNew();
      } else {
        setForm(false);
        if (onClose) onClose();
      }
      countryNameRef.current?.focus();
    } catch (error) {
      console.log("handle");
    }
  };

  const saveData = (nextProcess) => {
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "warning",
        timer: 1000,
      });
      return;
    }
    let foundItem;
    const currentName = (name || "").trim().toLowerCase();
    const currentStyleItemId = parseInt(styleItemId);

    if (id) {
      foundItem = allData?.data
        ?.filter((i) => i.id != id)
        ?.some(
          (item) =>
            (item.name || "").trim().toLowerCase() === currentName &&
            parseInt(item.styleItemId) === currentStyleItemId,
        );
    } else {
      foundItem = allData?.data?.some(
        (item) =>
          (item.name || "").trim().toLowerCase() === currentName &&
          parseInt(item.styleItemId) === currentStyleItemId,
      );
    }

    if (foundItem) {
      Swal.fire({
        text: "The Style Name already exists for this Item.",
        icon: "warning",
        showConfirmButton: false,
      });
      return false;
    }
    if (id) {
      if (!window.confirm("Are you sure update the details ...?")) {
        return;
      }
    }

    if (id) {
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
    }
  };

  const deleteData = async (id, childRecord) => {
    if (childRecord) {
      Swal.fire({
        icon: "error",
        title: "Child record Exists",
      });
      return;
    }
    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      try {
        let deldata = await removeData(id).unwrap();
        if (deldata?.statusCode == 1) {
          Swal.fire({
            icon: "error",
            title: deldata?.message || "Something went wrong!",
          });
          return;
        }
        setId("");
        Swal.fire({
          title: "Deleted Successfully",
          icon: "success",
        });
        setForm(false);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Submission error",
          text: error.data?.message || "Something went wrong!",
        });
        setForm(false);
      }
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData();
    }
  };

  const onNew = () => {
    setId("");
    setName("");
    setStyleItemId("");
    setForm(true);
    syncFormWithDb(undefined);
    setReadOnly(false);
    setHidePrintFormat(false);
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }

  const handleView = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(true);
  };
  const handleEdit = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(false);
  };

  const ACTIVE = (
    <div className="bg-gradient-to-r from-green-200 to-green-500 inline-flex items-center justify-center rounded-full border-2 w-6 border-green-500 shadow-lg text-white hover:scale-110 transition-transform duration-300">
      <Power size={10} />
    </div>
  );
  const INACTIVE = (
    <div className="bg-gradient-to-r from-red-200 to-red-500 inline-flex items-center justify-center rounded-full border-2 w-6 border-red-500 shadow-lg text-white hover:scale-110 transition-transform duration-300">
      <Power size={10} />
    </div>
  );
  const columns = [
    {
      header: "S.No",
      accessor: (item, index) => index + 1,
      className: "font-medium text-gray-900 w-12  text-center",
    },

    {
      header: "Style Name",
      accessor: (item) => item?.name,
      //   cellClass: () => "font-medium  text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-96",
    },

    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  // const openPartyModal = useSelector((state) => state?.party);

  // console.log(openPartyModal, "openPartyModal")

  if (onSuccess || embeddedMode) {
    return (
      <div
        onKeyDown={handleKeyDown}
        className="h-full flex flex-col bg-gray-200"
      >
        <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
              {id
                ? !readOnly
                  ? "Edit Style Master"
                  : "Style Master"
                : "Add New Style"}
            </h2>
          </div>
          <div className="flex gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 text-red-600 hover:bg-red-600 hover:text-white border border-red-600 text-xs rounded"
              >
                Cancel
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  saveData("close");
                }}
                className="px-3 py-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 border border-blue-600 flex items-center gap-1 text-xs"
              >
                <Check size={14} />
                {id ? "Update" : "Save & close"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-1 gap-3 h-full">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <DropdownWithModal
                      name="Item Name"
                      options={dropDownListObject(
                        styleItemList?.data?.filter((item) => item?.active),
                        "name",
                        "id",
                      )}
                      value={styleItemId}
                      setValue={setStyleItemId}
                      required={true}
                      readOnly={readOnly || !!defaultStyleItemId}
                      className="w-full"
                      disabled={childRecord.current > 0 || !!defaultStyleItemId}
                      addNewLabel="+ Add New Item Group"
                      childComponent={StyleItemMaster}
                      addNewModalWidth="w-[65%] h-[58%]"
                      ref={countryNameRef}
                    />
                  </div>
                  <div>
                    <TextInputNew1
                      name="Style Name"
                      type="text"
                      value={name}
                      setValue={setName}
                      required={true}
                      readOnly={readOnly}
                      disabled={childRecord.current > 0}
                    />
                  </div>
                </div>
                <div className="my-3 flex items-center">
                  <CheckBoxNew
                    name="Hide in PDF"
                    value={hidePrintFormat}
                    setValue={setHidePrintFormat}
                    readOnly={readOnly}
                  />
                </div>
                <div className="mt-2">
                  <ToggleButton
                    name="Status"
                    options={statusDropdown}
                    value={active}
                    setActive={setActive}
                    required={true}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onKeyDown={handleKeyDown} className="p-1">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-xl font-bold font-segoe text-gray-800 ">
          Style Master
        </h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-xs px-2 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Style
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
        <ReusableTable
          columns={columns}
          data={allData?.data}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={deleteData}
          itemsPerPage={10}
        />
      </div>

      <div>
        {form === true && (
          <Modal
            isOpen={form}
            form={form}
            widthClass={"w-[46%] h-[57%]"}
            onClose={() => {
              setForm(false);
            }}
          >
            <div className="h-full flex flex-col bg-gray-200 ">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit Style Master"
                        : "Style Master"
                      : "Add New Style  "}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <div>
                    {readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(false);
                          setSearchValue("");
                          setId(false);
                        }}
                        className="px-3 py-1 text-red-600 hover:bg-red-600 hover:text-white border border-red-600 text-xs rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          saveData("close");
                        }}
                        className="px-3 py-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 
                                                border border-blue-600 flex items-center gap-1 text-xs"
                      >
                        <Check size={14} />
                        {id ? "Update" : "Save & close"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!readOnly && !id && (
                      <button
                        type="button"
                        onClick={() => {
                          saveData("new");
                        }}
                        className="px-3 py-1 hover:bg-green-600 hover:text-white rounded text-green-600 
                                                      border border-green-600 flex items-center gap-1 text-xs"
                      >
                        <Check size={14} />
                        {"Save & New"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3 ">
                <div className="grid grid-cols-1  gap-3  h-full ">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
                      <div className="grid grid-cols-2  gap-3  ">
                        <div>
                          <DropdownWithModal
                            name="Item Name"
                            options={dropDownListObject(
                              id
                                ? styleItemList?.data
                                : styleItemList?.data?.filter(
                                    (item) => item?.active,
                                  ),
                              "name",
                              "id",
                            )}
                            value={styleItemId}
                            setValue={setStyleItemId}
                            required={true}
                            readOnly={readOnly}
                            className={`w-full`}
                            disabled={childRecord.current > 0}
                            addNewLabel="+ Add New Item Group"
                            childComponent={StyleItemMaster}
                            addNewModalWidth="w-[65%] h-[58%]"
                            ref={countryNameRef}
                          />
                        </div>
                        <div className="">
                          <TextInputNew1
                            name="Style Name"
                            type="text"
                            value={name}
                            setValue={setName}
                            required={true}
                            readOnly={readOnly}
                            disabled={childRecord.current > 0}
                          />
                        </div>
                      </div>
                      <div className="my-6 flex items-center">
                        <CheckBoxNew
                          name="Hide in PDF"
                          value={hidePrintFormat}
                          setValue={setHidePrintFormat}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="mt-2">
                        <ToggleButton
                          name="Status"
                          options={statusDropdown}
                          value={active}
                          setActive={setActive}
                          required={true}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default StyleMaster;
