import StyleItemMasterApi from "../services/StyleItemMasterService";
import SizeMasterApi from "../services/SizemasterService";
import ColorMasterApi from "../services/ColorMasterService";
import GsmMasterApi from "../services/GsmMasterService";
import store from "../store";

export const invalidateItems = () => {
  store.dispatch(StyleItemMasterApi.util.invalidateTags(["StyleItemMaster"]));
  store.dispatch(SizeMasterApi.util.invalidateTags(["SizeMaster"]));
  store.dispatch(ColorMasterApi.util.invalidateTags(["ColorMaster"]));
  store.dispatch(GsmMasterApi.util.invalidateTags(["GsmMaster"]));
};
