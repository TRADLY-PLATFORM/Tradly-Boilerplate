import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as bundlesAPI from '@/api/bundles'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })
const customError = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)

export const bundlesApi = createApi({
  reducerPath: 'bundlesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Bundle'],
  endpoints: builder => ({
    getBundleItems: builder.query<{ items: any[]; bundle_price: number; component_total: number; saving: number }, number | string>({
      queryFn: async (listingId, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.getBundleItems(listingId, ctx.authKey, ctx.currency, ctx.language), 'Could not load bundle contents')
          if (result.error) return { error: customError(result.error.message ?? 'Could not load bundle contents') }
          const data: any = result.data
          if (!Array.isArray(data?.items)) return { error: customError('Tradly returned incomplete bundle contents.') }
          return { data: { items: data.items, bundle_price: Number(data.bundle_price) || 0, component_total: Number(data.component_total) || 0, saving: Number(data.saving) || 0 } }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
      providesTags: (_result, _error, id) => [{ type: 'Bundle', id: String(id) }],
    }),
    getBundleStock: builder.query<Record<string, unknown>, { listingId: number | string; quantity?: number }>({
      queryFn: async ({ listingId, quantity = 1 }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.getBundleStock(listingId, quantity, ctx.authKey, ctx.currency, ctx.language), 'Could not check bundle stock')
          if (result.error) return { error: customError(result.error.message ?? 'Could not check bundle stock') }
          return { data: result.data as Record<string, unknown> }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
    }),
    getBundlePool: builder.query<{ pool: any[]; min_quantity: number; max_quantity: number | null }, number | string>({
      queryFn: async (listingId, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.getBundlePool(listingId, ctx.authKey, ctx.currency, ctx.language), 'Could not load bundle choices')
          if (result.error) return { error: customError(result.error.message ?? 'Could not load bundle choices') }
          const data: any = result.data
          if (!Array.isArray(data?.pool)) return { error: customError('Tradly returned incomplete bundle choices.') }
          return { data: { pool: data.pool, min_quantity: Number(data.min_quantity) || 1, max_quantity: data.max_quantity == null ? null : Number(data.max_quantity) } }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
      providesTags: (_result, _error, id) => [{ type: 'Bundle', id: String(id) }],
    }),
    getBundleSelection: builder.query<Record<string, unknown>, { listingId: number | string; selectionId: number | string }>({
      queryFn: async ({ listingId, selectionId }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.getBundleSelection(listingId, selectionId, ctx.authKey, ctx.currency, ctx.language), 'Could not load bundle selection')
          if (result.error) return { error: customError(result.error.message ?? 'Could not load bundle selection') }
          return { data: result.data as Record<string, unknown> }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
    }),
    addBundleItem: builder.mutation<void, { listingId: number | string; componentListingId: number; quantity: number; orderBy?: number }>({
      queryFn: async ({ listingId, componentListingId, quantity, orderBy }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.addBundleItem(listingId, { component_listing_id: componentListingId, quantity, ...(orderBy !== undefined ? { order_by: orderBy } : {}) }, ctx.authKey, ctx.currency, ctx.language), 'Could not add bundle component')
          if (result.error) return { error: customError(result.error.message ?? 'Could not add bundle component') }
          return { data: undefined }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
      invalidatesTags: (_result, _error, { listingId }) => [{ type: 'Bundle', id: String(listingId) }],
    }),
    addBundlePoolItem: builder.mutation<void, { listingId: number | string; componentListingId: number; orderBy?: number }>({
      queryFn: async ({ listingId, componentListingId, orderBy }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.addBundlePoolItem(listingId, { component_listing_id: componentListingId, ...(orderBy !== undefined ? { order_by: orderBy } : {}) }, ctx.authKey, ctx.currency, ctx.language), 'Could not add bundle choice')
          if (result.error) return { error: customError(result.error.message ?? 'Could not add bundle choice') }
          return { data: undefined }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
      invalidatesTags: (_result, _error, { listingId }) => [{ type: 'Bundle', id: String(listingId) }],
    }),
    submitBundleSelection: builder.mutation<{ selection_id: number; bundle_price: number; selected_count: number }, { listingId: number | string; selectedListingIds: number[]; quantity: number }>({
      queryFn: async ({ listingId, selectedListingIds, quantity }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await bundlesAPI.submitBundleSelection(listingId, { selected_listing_ids: selectedListingIds, quantity }, ctx.authKey, ctx.currency, ctx.language), 'Could not save bundle selection', ['selection_id'])
          if (result.error) return { error: customError(result.error.message ?? 'Could not save bundle selection') }
          return { data: result.data as { selection_id: number; bundle_price: number; selected_count: number } }
        } catch (error) { return { error: customError(error instanceof Error ? error.message : 'Unexpected error') } }
      },
    }),
  }),
})

export const { useGetBundleItemsQuery, useGetBundleStockQuery, useLazyGetBundleStockQuery, useGetBundlePoolQuery, useGetBundleSelectionQuery, useAddBundleItemMutation, useAddBundlePoolItemMutation, useSubmitBundleSelectionMutation } = bundlesApi
