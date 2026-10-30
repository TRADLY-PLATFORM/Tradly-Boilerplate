import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as checkoutAPI from '@/api/checkout'
import * as ordersAPI from '@/api/orders'
import type {
  CheckoutResponse,
  DirectCheckoutInput,
  GetOrdersParams,
  GetOrdersResponse,
  GetOrderDetailResponse,
  UpdateOrderStatusInput,
  UpdateShipmentStatusInput,
  VerifyOrderInput,
} from '@/types/order.types'
import type { FullCheckoutPayload } from '@/types/checkout.types'
import type { PaymentIntentResponse } from '@/api/checkout'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const getContext = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Order'],
  keepUnusedDataFor: 120,
  endpoints: (builder) => ({

    // ── Checkout ──────────────────────────────────────────────────────────────

    // result.data → { order_reference: string }
    // Payment channel determines what happens next (see CheckoutPage payment routing)
    checkout: builder.mutation<CheckoutResponse, FullCheckoutPayload>({
      queryFn: async (input, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await checkoutAPI.checkout(input, authKey, currency, language), 'Checkout failed', ['order_reference'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Checkout failed', data: { code: (res.error as any).code } } as any }
          return { data: res.data! }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      invalidatesTags: ['Order', 'Cart'] as any,
    }),

    // Stripe SDK flow: call after checkout to get client_secret → navigate to /payment
    paymentIntent: builder.mutation<PaymentIntentResponse, string>({
      queryFn: async (orderReference, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await checkoutAPI.getPaymentIntent(orderReference, authKey, currency, language), 'Payment intent failed', ['client_secret'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Payment intent failed' } }
          return { data: res.data! }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
    }),

    directCheckout: builder.mutation<CheckoutResponse, { listingId: number; input: DirectCheckoutInput }>({
      queryFn: async ({ listingId, input }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await checkoutAPI.directCheckout(listingId, input, authKey, currency, language), 'Checkout failed', ['order_reference'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Checkout failed' } }
          return { data: res.data! }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
    }),

    // ── Orders ────────────────────────────────────────────────────────────────

    getOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.getOrders(params, authKey, currency, language), 'Failed to fetch orders', ['orders', 'page', 'total_records'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch orders' } }
          return { data: { orders: res.data!.orders, page: res.data!.page, total_records: res.data!.total_records } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      providesTags: ['Order'],
    }),

    getDonationsList: builder.query<Record<string, unknown>, { listingId: number | string; page?: number; per_page?: number }>({
      queryFn: async ({ listingId, ...params }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.getDonationsList(listingId, params, authKey, currency, language), 'Could not load donations')
          if (res?.error) return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Could not load donations' } }
          return { data: (res as any).data ?? {} }
        } catch (err) { return { error: { status: 'CUSTOM_ERROR', error: err instanceof Error ? err.message : 'Unexpected error' } } }
      },
    }),

    getOrderDetail: builder.query<GetOrderDetailResponse, string | number>({
      queryFn: async (id, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.getOrderDetail(id, authKey, currency, language), 'Order not found', ['order'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Order not found' } }
          return { data: { order: res.data!.order } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      providesTags: (_result, _err, id) => [{ type: 'Order', id: String(id) }],
    }),

    updateOrderStatus: builder.mutation<void, UpdateOrderStatusInput>({
      queryFn: async (input, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.updateOrderStatus(input, authKey, currency, language), 'Status update failed')
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Status update failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      invalidatesTags: (_result, _err, { id }) => ['Order', { type: 'Order', id: String(id) }],
    }),

    updateShipmentStatus: builder.mutation<void, UpdateShipmentStatusInput>({
      queryFn: async (input, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.updateShipmentStatus(input, authKey, currency, language), 'Shipment update failed')
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Shipment update failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      invalidatesTags: (_result, _err, { order_id }) => [{ type: 'Order', id: String(order_id) }],
    }),

    verifyOrder: builder.mutation<GetOrderDetailResponse, VerifyOrderInput>({
      queryFn: async (input, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await ordersAPI.verifyOrderDetails(input, authKey, currency, language), 'Verification failed', ['order'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Verification failed' } }
          return { data: { order: res.data!.order } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
    }),

  }),
})

export const {
  useCheckoutMutation,
  usePaymentIntentMutation,
  useDirectCheckoutMutation,
  useGetOrdersQuery,
  useGetDonationsListQuery,
  useGetOrderDetailQuery,
  useUpdateOrderStatusMutation,
  useUpdateShipmentStatusMutation,
  useVerifyOrderMutation,
} = ordersApi
