import React, { useState, useEffect } from "react";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import {
  useGetBranchByIdQuery,
  useUpdateBranchMutation,
} from "../../../redux/services/BranchMasterService";

const ToggleRow = ({ title, description, checked, onChange, disabled }) => (
  <div className="p-4 bg-white rounded shadow-sm border border-gray-200 m-2 flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
  </div>
);

const ProformaInvoiceSettings = () => {
  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId",
  );

  const {
    data: singleData,
    isFetching,
    isLoading,
  } = useGetBranchByIdQuery(branchId, { skip: !branchId });

  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const [proformaInvoiceEnabled, setProformaInvoiceEnabled] = useState(false);
  const [proformaInvoiceApprovalEnabled, setProformaInvoiceApprovalEnabled] =
    useState(false);

  useEffect(() => {
    if (singleData?.data) {
      setProformaInvoiceEnabled(
        singleData.data.proformaInvoiceEnabled || false,
      );
      setProformaInvoiceApprovalEnabled(
        singleData.data.proformaInvoiceApprovalEnabled || false,
      );
    }
  }, [singleData, isFetching, isLoading]);

  const saveSettings = async (updates) => {
    if (!singleData?.data) return;
    const payload = { ...singleData.data, ...updates };
    try {
      const response = await updateBranch(payload).unwrap();
      if (response.statusCode === 0) {
        toast.success("Proforma Invoice settings updated successfully!");
      } else {
        toast.error(response.message || "Failed to update settings.");
        return false;
      }
    } catch {
      toast.error("An error occurred while updating settings.");
      return false;
    }
    return true;
  };

  const handleProformaToggle = async (e) => {
    const newValue = e.target.checked;
    setProformaInvoiceEnabled(newValue);
    // If disabling proforma, also disable approval
    const approvalValue = newValue ? proformaInvoiceApprovalEnabled : false;
    if (!newValue) setProformaInvoiceApprovalEnabled(false);
    const ok = await saveSettings({
      proformaInvoiceEnabled: newValue,
      proformaInvoiceApprovalEnabled: approvalValue,
    });
    if (!ok) setProformaInvoiceEnabled(!newValue);
  };

  const handleApprovalToggle = async (e) => {
    const newValue = e.target.checked;
    setProformaInvoiceApprovalEnabled(newValue);
    const ok = await saveSettings({ proformaInvoiceApprovalEnabled: newValue });
    if (!ok) setProformaInvoiceApprovalEnabled(!newValue);
  };

  if (isLoading || isFetching) {
    return (
      <div className="p-8 text-center text-gray-500">Loading settings...</div>
    );
  }

  return (
    <div className="container mx-auto col-span-7 h-full bg-theme flex flex-col frame p-4">
      <fieldset className="frame my-1">
        <legend className="sub-heading">
          Proforma Invoice Order Integration
        </legend>

        <ToggleRow
          title="Enable Proforma Invoice for Job Card Orders"
          description="If enabled, the Order No in the Job Card module will Show only if the proforma invoice is generated for that order."
          checked={proformaInvoiceEnabled}
          onChange={handleProformaToggle}
          disabled={isUpdating}
        />

        {proformaInvoiceEnabled && (
          <ToggleRow
            title="Require Approval for Proforma Invoices"
            description="If enabled, only explicitly approved Proforma Invoices will appear in the Job Card Order dropdown. An Approve button will be visible in the Proforma Invoice Report."
            checked={proformaInvoiceApprovalEnabled}
            onChange={handleApprovalToggle}
            disabled={isUpdating}
          />
        )}
      </fieldset>
    </div>
  );
};

export default ProformaInvoiceSettings;
