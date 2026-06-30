import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as shippingAPI from '@/api/shipping-methods'
import type { GetShippingMethodsResponse } from '@/types/checkout.types'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const ctx = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const shippingMethodsApi = createApi({
  reducerPath: 'shippingMethodsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['ShippingMethod'],
  keepUnusedDataFor: 600,
  endpoints: (builder) => ({

    // result.data → { shipping_methods: ShippingMethod[] }
    // type: 'tenant' for platform-wide methods (default for checkout page)
    // Pass account_id to get seller-specific methods
    getShippingMethods: builder.query<GetShippingMethodsResponse, { type?: string; account_id?: number } | void>({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await shippingAPI.getShippingMethods(params ?? {}, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch shipping methods' } }
          return { data: { shipping_methods: res.data!.shipping_methods } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['ShippingMethod'],
    }),


    // SendCloud shipment sub-methods — fetched after user picks shipping method + address country
    // result.data → { shipment_methods: ShipmentMethod[] }
    getSendCloudShipmentMethods: builder.query<
      import('@/types/checkout.types').GetShipmentMethodsResponse,
      { shipping_method_id: number; country: string }
    >({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await shippingAPI.getSendCloudShipmentMethods(params, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch shipment methods' } }
          return { data: { shipment_methods: res.data!.shipment_methods } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
    }),

    // External extension shipment sub-methods — requires address id
    getExternalShipmentMethods: builder.query<
      import('@/types/checkout.types').GetShipmentMethodsResponse,
      { shipping_method_id: number; shipping_address_id: number }
    >({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await shippingAPI.getExternalShipmentMethods(params, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch shipment methods' } }
          return { data: { shipment_methods: res.data!.shipment_methods } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
    }),

  }),
})

export const {
  useGetShippingMethodsQuery,
  useGetSendCloudShipmentMethodsQuery,
  useGetExternalShipmentMethodsQuery,
} = shippingMethodsApi
