import store from "../store";
import { JobCardApi } from "../uniformService";

export const invalidateJobCardModule = () => {
  store.dispatch(JobCardApi.util.invalidateTags(["jobCard"]));
};
