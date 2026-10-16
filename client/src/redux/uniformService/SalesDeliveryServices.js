import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SALES_DELIVERY_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const SalesDeliveryApi = createApi({
  reducerPath: "salesDelivery",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["salesDelivery"],
  endpoints: (builder) => ({
    getSalesDelivery: builder.query({
      query: ({ params }) => {
        return {
          url: SALES_DELIVERY_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["salesDelivery"],
    }),
    getSalesDeliveryById: builder.query({
      query: (id) => {
        return {
          url: `${SALES_DELIVERY_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["salesDelivery"],
    }),
    addSalesDelivery: builder.mutation({
      query: (payload) => ({
        url: SALES_DELIVERY_API,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["salesDelivery"],
    }),
    updateSalesDelivery: builder.mutation({
      query: ({ id, body }) => {
        return {
          url: `${SALES_DELIVERY_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["salesDelivery"],
    }),
    deleteSalesDelivery: builder.mutation({
      query: (id) => ({
        url: `${SALES_DELIVERY_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["salesDelivery"],
    }),
  }),
});

export const {
  useGetSalesDeliveryQuery,
  useGetSalesDeliveryByIdQuery,
  useAddSalesDeliveryMutation,
  useUpdateSalesDeliveryMutation,
  useDeleteSalesDeliveryMutation,
} = SalesDeliveryApi;

export default SalesDeliveryApi;
