import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as subscriptionsAPI from '@/api/subscriptions'
import type { SubscriptionProductsQuery, SubscriptionReceiptInput } from '@/api/subscriptions'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })
const errorResult = (error: unknown, fallback: string) => ({ error: { status: 'CUSTOM_ERROR' as const, error: error instanceof Error ? error.message : fallback } })

export const subscriptionsApi = createApi({
  reducerPath: 'subscriptionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Subscription'],
  endpoints: builder => ({
    getSubscriptionProducts: builder.query<Record<string, unknown>, Record<string, unknown>>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.getSubscriptionProducts(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load subscription plans')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load subscription plans' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not load subscription plans') }
      },
      providesTags: ['Subscription'],
    }),
    getSubscriptionProduct: builder.query<Record<string, unknown>, number | string>({
      queryFn: async (id, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.getSubscriptionProduct(id, ctx.authKey, ctx.currency, ctx.language), 'Could not load subscription plan')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load subscription plan' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not load subscription plan') }
      },
      providesTags: (_result, _error, id) => [{ type: 'Subscription', id }],
    }),
    getAvailableSubscriptions: builder.query<Record<string, unknown>, SubscriptionProductsQuery>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.getAvailableSubscriptionProducts(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load available subscriptions')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load available subscriptions' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not load available subscriptions') }
      },
      providesTags: ['Subscription'],
    }),
    subscribeWithReceipt: builder.mutation<Record<string, unknown>, SubscriptionReceiptInput>({
      queryFn: async (input, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.subscribeWithReceipt(input, ctx.authKey, ctx.currency, ctx.language), 'Could not confirm subscription')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not confirm subscription' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not confirm subscription') }
      },
      invalidatesTags: ['Subscription'],
    }),
    confirmSubscriptionWithReceipt: builder.mutation<Record<string, unknown>, SubscriptionReceiptInput>({
      queryFn: async (input, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.confirmSubscriptionWithReceipt(input, ctx.authKey, ctx.currency, ctx.language), 'Could not confirm subscription')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not confirm subscription' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not confirm subscription') }
      },
      invalidatesTags: ['Subscription'],
    }),
    triggerSubscriptionEmail: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.triggerSubscriptionEmail(accountId, ctx.authKey, ctx.currency, ctx.language), 'Could not send subscription email')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not send subscription email' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not send subscription email') }
      },
    }),
    cancelSubscription: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.cancelSubscription(accountId, ctx.authKey, ctx.currency, ctx.language), 'Could not cancel subscription')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not cancel subscription' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not cancel subscription') }
      },
      invalidatesTags: ['Subscription'],
    }),
    getSubscriptionManageUrl: builder.query<Record<string, unknown>, { accountUniqueId: string; tenantUniqueId: string }>({
      queryFn: async ({ accountUniqueId, tenantUniqueId }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await subscriptionsAPI.getSubscriptionManageUrl(accountUniqueId, tenantUniqueId, ctx.authKey, ctx.currency, ctx.language), 'Could not load subscription management link')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load subscription management link' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return errorResult(error, 'Could not load subscription management link') }
      },
    }),
  }),
})

export const {
  useGetSubscriptionProductsQuery,
  useGetSubscriptionProductQuery,
  useGetAvailableSubscriptionsQuery,
  useSubscribeWithReceiptMutation,
  useConfirmSubscriptionWithReceiptMutation,
  useTriggerSubscriptionEmailMutation,
  useCancelSubscriptionMutation,
  useGetSubscriptionManageUrlQuery,
} = subscriptionsApi
