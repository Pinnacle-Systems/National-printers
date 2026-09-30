import ProformaInvoiceApi from "../uniformService/ProformaInvoiceService";
import store from "../store";

export const invalidateProformaInvoiceModule = () => {
  store.dispatch(ProformaInvoiceApi.util.invalidateTags(["proformaInvoice"]));
};
