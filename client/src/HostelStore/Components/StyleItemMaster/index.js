import { useCallback, useEffect, useRef, useState } from "react";
import secureLocalStorage from "react-secure-storage";
import {
  useAddStyleItemMasterMutation,
  useDeleteStyleItemMasterMutation,
  useGetStyleItemMasterByIdQuery,
  useGetStyleItemMasterQuery,
  useLazyGetStyleItemMasterByIdQuery,
  useUpdateStyleItemMasterMutation,
} from "../../../redux/services/StyleItemMasterService";
import Swal from "sweetalert2";
import {
  Check,
  Power,
  UploadCloud,
  Eye,
  Trash2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  DropdownInput,
  ReusableTable,
  TextInputNew,
  TextInputNew1,
  ToggleButton,
} from "../../../Inputs";
import Modal from "../../../UiComponents/Modal";
import { statusDropdown } from "../../../Utils/DropdownData";
import { dropDownListObject } from "../../../Utils/contructObject";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetSizeTemplateQuery } from "../../../redux/services/SizeTemplateMaster";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService";
import { DropdownWithModal } from "../../../Inputs/Reuseable";
import { ItemGroup, UomMaster, SizeTemplate, HsnMaster, Gsm } from "..";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags";
import { useFormKeyboardNavigation } from "../../../CustomHooks/useFormKeyboardNavigation";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { renameFile } from "../../../Utils/helper";
import { getImageUrlPath } from "../../../Constants";

const MODEL = "Item Master";
export default function Form({ onSuccess, defaultName = "" }) {
  const [form, setForm] = useState(false);

  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState(defaultName || "");
  const [price, setPrice] = useState(false);
  const [active, setActive] = useState(false);
  const [aliasName, setAliasName] = useState("");
  const [hsnId, setHsnId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const childRecord = useRef(0);
  const [itemGroupId, setItemGroupId] = useState("");
  const [sizeTemplateId, setSizeTemplateId] = useState("");
  const [uomId, setUomId] = useState("");
  const [gsmId, setGsmId] = useState("");
  const [styleImage, setStyleImage] = useState(null);
  const [isDeleteImage, setIsDeleteImage] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [dispatchInvalidate] = useInvalidateTags();
  const { refs, handlers, focusFirstInput } = useFormKeyboardNavigation();

  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };
  const { data: hsnList } = useGetHsnMasterQuery({ params });
  const { data: uomList } = useGetUomQuery({ params });
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({ params });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({ params });
  const { data: gsmList } = useGetGsmMasterQuery({ params });

  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetStyleItemMasterQuery({ params, searchParams: searchValue });

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetStyleItemMasterByIdQuery(id, { skip: !id });
  const [trigger, { data: LazyData }] = useLazyGetStyleItemMasterByIdQuery();

  const [addData] = useAddStyleItemMasterMutation();
  const [updateData] = useUpdateStyleItemMasterMutation();
  const [removeData] = useDeleteStyleItemMasterMutation();

  const getImgSrc = (img) => {
    if (!img) return "";
    if (img instanceof File) return URL.createObjectURL(img);
    if (typeof img === "string" && img.startsWith("data:")) return img;
    return getImageUrlPath(img);
  };

  function openPreview(filePath) {
    if (!filePath) return;
    setPreviewImageUrl(getImgSrc(filePath));
    setPreviewModalOpen(true);
  }

  useEffect(() => {
    const handleKeyDownModal = (e) => {
      if (e.key === "Escape" && previewModalOpen) {
        setPreviewModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDownModal);
    return () => window.removeEventListener("keydown", handleKeyDownModal);
  }, [previewModalOpen]);

  const syncFormWithDb = useCallback(
    (data) => {
      setName(data?.name || defaultName || "");
      setActive(id ? (data?.active ?? false) : true);
      setAliasName(data?.aliasName || "");
      setHsnId(data?.hsnId ? data?.hsnId : "");
      setItemGroupId(data?.itemGroupId ? data?.itemGroupId : "");
      setUomId(data?.uomId ? data?.uomId : "");
      setSizeTemplateId(data?.sizeTemplateId ? data?.sizeTemplateId : "");
      setGsmId(data?.gsmId ? data?.gsmId : "");
      setPrice(data?.price ? data?.price?.toFixed(2) : "");
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      setStyleImage(data?.styleImage || null);
      setIsDeleteImage(false);
    },
    [id, defaultName],
  );

  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    id,
    name,
    active,
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
    aliasName,
    hsnId,
    itemGroupId,
    sizeTemplateId,
    uomId,
    gsmId,
    price,
    styleImage,
  };

  const validateData = (data) => {
    if (data.name && data.itemGroupId && data?.uomId && data?.hsnId) {
      return true;
    }
    return false;
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      const formData = new FormData();
      for (let key in data) {
        if (key === "styleImage") {
          if (data[key] instanceof File) {
            formData.append("images", data[key]);
            formData.append("styleImage", data[key].name);
          } else if (data[key]) {
            formData.append("styleImage", data[key]);
          } else {
            formData.append("styleImage", "");
          }
        } else if (
          Array.isArray(data[key]) ||
          (typeof data[key] === "object" && data[key] !== null)
        ) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
      formData.append("isDeleteImage", isDeleteImage ? "true" : "false");
      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: formData }).unwrap();
      } else {
        returnData = await callback(formData).unwrap();
      }
      setId(returnData?.data?.id);
      if (onSuccess) {
        await Swal.fire({
          title: text + "  " + "Successfully",
          icon: "success",
        });
        onSuccess(returnData?.data?.id);
        return;
      }
      if (nextProcess == "new") {
        syncFormWithDb(undefined);
        onNew();
        countryNameRef?.current?.focus();
      } else {
        setForm(false);
      }
      Swal.fire({
        title: text + "  " + "Successfully",
        icon: "success",
      });
      syncFormWithDb(undefined);

      dispatchInvalidate();
    } catch (error) {
      console.log("handle", error);
      Swal.fire({
        icon: "error",
        title: "Submission error",
        text: error?.data?.message || "Something went wrong!",
      });
    }
  };

  const saveData = (nextProcess) => {
    let foundItem;
    if (id) {
      foundItem = allData?.data
        ?.filter((i) => i.id !== id)
        ?.some(
          (item) =>
            item.name?.trim().toLowerCase() === name?.trim().toLowerCase(),
        );
    } else {
      foundItem = allData?.data?.some(
        (item) =>
          item.name?.trim().toLowerCase() === name?.trim().toLowerCase(),
      );
    }

    if (foundItem) {
      Swal.fire({
        text: "The Item Name already exists.",
        icon: "warning",
        timer: 1500,
        didClose: () => {
          countryNameRef?.current?.focus();
        },
      });
      return false;
    }
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "error",
        timer: 1000,
        didClose: () => {
          countryNameRef?.current?.focus();
        },
      });
      return;
    }

    if (id) {
      if (!window.confirm("Are you sure save the details ...?")) {
        return;
      }
    }
    if (id) {
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
    }
  };

  const handleDelete = async (id) => {
    const { data } = await trigger(id);
    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      if (data?.data?.childRecord > 0) {
        Swal.fire({
          icon: "error",
          title: "Child record Exists",
          text: "Data cannot be deleted!",
        });
      } else {
        try {
          let deldata = await removeData(id).unwrap();
          if (deldata?.statusCode == 1) {
            Swal.fire({
              icon: "error",
              title: deldata?.message || "Data cannot be deleted!",
            });
            return;
          }
          setId("");
          Swal.fire({
            title: "Deleted Successfully",
            icon: "success",
            timer: 1000,
          });
          syncFormWithDb(undefined);

          setForm(false);
          dispatchInvalidate();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Submission error",
            text: error.data?.message || "Something went wrong!",
          });
          setForm(false);
        }
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
    setForm(true);
    setSearchValue("");
    setReadOnly(false);
    syncFormWithDb(undefined);
    setStyleImage(null);
    setIsDeleteImage(false);
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
      accessor: (item, index) => parseInt(index) + parseInt(1),
      className: "font-medium text-gray-900 text-center w-[10px] py-1",
      search: "",
    },
    {
      header: "Item Name",
      accessor: (item) => item.name,
      className: "font-medium text-gray-900  w-[400px]  py-1  px-2",
      search: "Item Name",
    },
    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      className: "font-medium text-gray-900 text-center w-[10px] py-1",
      search: "",
    },
  ];

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

  const {
    firstInputRef: countryNameRef,
    toggleButtonRef,
    saveCloseButtonRef,
    saveNewButtonRef,
  } = refs;
  useEffect(() => {
    if ((form || onSuccess) && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form, onSuccess]);

  const formBody = (
    <div className="flex-1 p-3">
      <div className="bg-white p-3 rounded-md border border-gray-200">
        <fieldset className="rounded">
          <div className="w-full grid grid-cols-12 gap-4">
            {/* Left 8 columns: Form Inputs in 2 columns */}
            <div className="col-span-8 grid grid-cols-2 gap-3">
              <div>
                <TextInputNew1
                  ref={countryNameRef}
                  name="Item Name"
                  type="text"
                  value={name}
                  setValue={setName}
                  required={true}
                  readOnly={readOnly}
                  disabled={childRecord.current > 0}
                />
              </div>
              <div>
                <TextInputNew1
                  name="Alias Name"
                  type="text"
                  value={aliasName}
                  setValue={setAliasName}
                  readOnly={readOnly}
                />
              </div>

              <div>
                <DropdownWithModal
                  name="Item Group"
                  options={dropDownListObject(
                    id
                      ? itemGroupList?.data
                      : itemGroupList?.data?.filter((item) => item?.active),
                    "name",
                    "id",
                  )}
                  value={itemGroupId}
                  setValue={setItemGroupId}
                  required={true}
                  readOnly={readOnly}
                  className={`w-full`}
                  disabled={childRecord.current > 0}
                  addNewLabel="+ Add New Item Group"
                  childComponent={ItemGroup}
                  addNewModalWidth="w-[40%] h-[45%]"
                />
              </div>
              <div>
                <DropdownWithModal
                  name="Uom"
                  options={dropDownListObject(
                    id
                      ? uomList?.data
                      : uomList?.data?.filter((item) => item?.active),
                    "name",
                    "id",
                  )}
                  value={uomId}
                  setValue={setUomId}
                  required={true}
                  readOnly={readOnly}
                  className={`w-full`}
                  disabled={childRecord.current > 0}
                  addNewLabel="+ Add New Uom"
                  childComponent={UomMaster}
                  addNewModalWidth="w-[40%] h-[45%]"
                />
              </div>

              <div>
                <DropdownWithModal
                  name="Hsn"
                  options={dropDownListObject(
                    id
                      ? hsnList?.data
                      : hsnList?.data?.filter((item) => item?.active),
                    "name",
                    "id",
                  )}
                  value={hsnId}
                  setValue={setHsnId}
                  required={true}
                  readOnly={readOnly}
                  className={`w-full`}
                  disabled={childRecord.current > 0}
                  addNewLabel="+ Add New Hsn"
                  childComponent={HsnMaster}
                  addNewModalWidth="w-[40%] h-[50%]"
                />
              </div>
              <div>
                <DropdownWithModal
                  name="GSM"
                  options={dropDownListObject(
                    id
                      ? gsmList?.data
                      : gsmList?.data?.filter((item) => item?.active),
                    "name",
                    "id",
                  )}
                  value={gsmId}
                  setValue={setGsmId}
                  readOnly={readOnly}
                  className={`w-full`}
                  disabled={childRecord.current > 0}
                  addNewLabel="+ Add New Gsm"
                  childComponent={Gsm}
                  addNewModalWidth="w-[40%] h-[50%]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs border text-right pr-2 border-gray-300 rounded-lg
focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
transition-all duration-150 shadow-2xs ${readOnly ? "bg-slate-100" : ""}
`}
                  placeholder="0.00"
                  onBlur={(e) => {
                    const formattedValue =
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value).toFixed(2);

                    setPrice(formattedValue);
                  }}
                  disabled={childRecord.current > 0}
                />
              </div>
              <div>
                <ToggleButton
                  name="Status"
                  options={statusDropdown}
                  value={active}
                  setActive={setActive}
                  required={true}
                  readOnly={readOnly}
                  ref={toggleButtonRef}
                  onKeyDown={handlers.handleToggleKeyDown}
                  tabIndex={0}
                />
              </div>
            </div>

            {/* Right 4 columns: Dedicated Large Item Image UI */}
            <div className="col-span-4 flex flex-col h-full">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Item Image
              </label>
              <div className="flex-1 min-h-[250px] p-2.5 border border-gray-200 rounded-xl bg-slate-50/50 shadow-2xs flex flex-col justify-between">
                {styleImage ? (
                  <div className="flex flex-col h-full justify-between">
                    <div
                      className="relative flex-1 min-h-[185px] max-h-[200px] w-full rounded-lg bg-white border border-gray-200 flex items-center justify-center p-2 cursor-pointer group overflow-hidden shadow-2xs hover:border-blue-400 transition"
                      onClick={() => openPreview(styleImage)}
                      title="Click to view full image in modal"
                    >
                      <img
                        src={getImgSrc(styleImage)}
                        alt={name || "Item Preview"}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                        <Eye size={24} className="drop-shadow" />
                        <span className="text-[11px] font-semibold drop-shadow">
                          Click to enlarge
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between gap-1">
                      <span
                        className="truncate text-[11px] text-green-700 font-semibold max-w-[130px]"
                        title={
                          styleImage instanceof File
                            ? styleImage.name
                            : typeof styleImage === "string" &&
                              styleImage.startsWith("data:")
                            ? "Attached Image"
                            : styleImage
                        }
                      >
                        ✅{" "}
                        {styleImage instanceof File
                          ? styleImage.name
                          : typeof styleImage === "string" &&
                            styleImage.startsWith("data:")
                          ? "Attached Image"
                          : styleImage}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPreview(styleImage)}
                          className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-100 rounded font-medium flex items-center gap-1 border border-blue-300"
                          title="View in modal"
                        >
                          <Eye size={12} /> View
                        </button>
                        {!readOnly && (
                          <label
                            htmlFor={
                              childRecord.current <= 0
                                ? "style-image-upload"
                                : undefined
                            }
                            className={`px-2 py-0.5 text-xs rounded font-medium border ${
                              childRecord.current > 0
                                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                : "text-indigo-600 hover:bg-indigo-100 border-indigo-300 cursor-pointer"
                            }`}
                            title={
                              childRecord.current > 0
                                ? "Cannot change: Child record exists"
                                : "Change image"
                            }
                          >
                            Change
                          </label>
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              if (childRecord.current > 0) return;
                              setStyleImage(null);
                              setIsDeleteImage(true);
                            }}
                            disabled={childRecord.current > 0}
                            className={`px-1.5 py-0.5 text-xs rounded font-bold border ${
                              childRecord.current > 0
                                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-100 border-red-300"
                            }`}
                            title={
                              childRecord.current > 0
                                ? "Cannot delete: Child record exists"
                                : "Remove image"
                            }
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={
                      !readOnly && childRecord.current <= 0
                        ? "style-image-upload"
                        : undefined
                    }
                    className={`w-full h-full min-h-[220px] border-2 border-dashed border-gray-300 rounded-xl bg-white p-4 flex flex-col items-center justify-center text-center transition ${
                      !readOnly && childRecord.current <= 0
                        ? "cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 group"
                        : "cursor-not-allowed bg-slate-50 opacity-75"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform border ${
                        !readOnly && childRecord.current <= 0
                          ? "bg-blue-50 text-blue-600 border-blue-100 group-hover:scale-110"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      }`}
                    >
                      <UploadCloud size={24} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {!readOnly && childRecord.current <= 0
                        ? "Upload Item Image"
                        : "Item Image"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {childRecord.current > 0
                        ? "Disabled: Child record exists"
                        : !readOnly
                        ? "Click to browse (PNG, JPG, WebP)"
                        : "No image attached"}
                    </span>
                    {!readOnly && (
                      <span
                        className={`mt-3 px-3 py-1 border rounded-md text-xs font-medium shadow-2xs transition-colors ${
                          childRecord.current > 0
                            ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                        }`}
                      >
                        Browse File
                      </span>
                    )}
                  </label>
                )}

                <input
                  type="file"
                  id="style-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (childRecord.current > 0) return;
                    if (e.target.files[0]) {
                      setStyleImage(renameFile(e.target.files[0]));
                      setIsDeleteImage(false);
                      e.target.value = "";
                    }
                  }}
                  disabled={readOnly || childRecord.current > 0}
                />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );

  const renderImagePreviewModal = () => {
    if (!previewModalOpen) return null;
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        onClick={() => setPreviewModalOpen(false)}
      >
        <div
          className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-400" />
              <span className="text-sm font-semibold truncate max-w-lg">
                {name ? `${name} - Image Preview` : "Item Image Preview"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-gray-800 p-1 rounded-md transition"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4 flex items-center justify-center bg-gray-950 max-h-[80vh] overflow-auto">
            <img
              src={previewImageUrl}
              alt={name || "Style Item Large Preview"}
              className="max-h-[74vh] max-w-full object-contain rounded-md shadow-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  if (onSuccess) {
    return (
      <div
        onKeyDown={handleKeyDown}
        className="h-full flex flex-col bg-gray-200"
      >
        <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
          <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
            Add New Style Item
          </h2>
          <button
            type="button"
            onClick={() => saveData("close")}
            ref={saveCloseButtonRef}
            onKeyDown={handlers.handleSaveCloseKeyDown(saveData)}
            className="px-3 py-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 border border-blue-600 flex items-center gap-1 text-xs"
          >
            <Check size={14} />
            Save
          </button>
        </div>

        {formBody}
        {renderImagePreviewModal()}
      </div>
    );
  }

  return (
    <div onKeyDown={handleKeyDown} className="p-1">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-xl font-bold font-segoe text-gray-800 ">
          Item Master
        </h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-xs px-2 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Item
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-3">
        <ReusableTable
          columns={columns}
          data={allData?.data || []}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          itemsPerPage={10}
        />
      </div>
      {form && (
        <Modal
          isOpen={form}
          form={form}
          widthClass={"w-[1050px] max-w-[95vw]"}
          onClose={() => {
            setForm(false);
            syncFormWithDb(undefined);
            setId("");
          }}
        >
          <div className="h-full flex flex-col bg-gray-200">
            <div className="border-b py-2 px-4 mt-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
                  {id
                    ? !readOnly
                      ? "Edit Item"
                      : "Item Master"
                    : "Add New Item"}
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
                      ref={saveCloseButtonRef} // ✅ Add ref
                      tabIndex={0}
                      onKeyDown={handlers.handleSaveCloseKeyDown(saveData)}
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
                      onKeyDown={handlers.handleSaveNewKeyDown(saveData)}
                      ref={saveNewButtonRef} // ✅ Add ref
                      tabIndex={0}
                    >
                      <Check size={14} />
                      {"Save & New"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {formBody}
          </div>
        </Modal>
      )}
      {renderImagePreviewModal()}
    </div>
  );
}
