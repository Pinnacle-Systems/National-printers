import store from "../store";
import { stockApi } from "../services";

export const invalidateStockModule = () => {
  store.dispatch(stockApi.util.invalidateTags(["Stock"]));
};
