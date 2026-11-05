import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as discoveryAPI from '@/api/discovery'
import type { GetPromotionsParams, TradlyId, TradlyRecord } from '@/types/prompt-apis.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const ctx = (s: LocalState) => ({ authKey: s.auth.authKey, currency: s.app.currency, language: s.app.language })
const error = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)
const result = async (promise: Promise<unknown>, message: string): Promise<{ data: TradlyRecord } | { error: ReturnType<typeof error> }> => {
  try { const response: any = normalizeTradlyResponse(await promise, message); return response.error ? { error: error(response.error.message ?? message) } : { data: (response.data ?? {}) as TradlyRecord } }
  catch (cause) { return { error: error(cause instanceof Error ? cause.message : message) } }
}

export const discoveryApi = createApi({
  reducerPath: 'discoveryApi', baseQuery: fetchBaseQuery({ baseUrl: '/' }), tagTypes: ['Collection', 'Promotion'],
  endpoints: builder => ({
    searchTags: builder.query<TradlyRecord, Record<string, unknown>>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.searchTags(params, c.authKey, c.currency, c.language), 'Could not search tags') } }),
    getCollections: builder.query<TradlyRecord, void>({ queryFn: (_arg, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.getCollections(c.authKey, c.currency, c.language), 'Could not load collections') }, providesTags: ['Collection'] }),
    getCollectionDetail: builder.query<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.getCollectionDetail(id, c.authKey, c.currency, c.language), 'Could not load collection') }, providesTags: (_r, _e, id) => [{ type: 'Collection', id: String(id) }] }),
    getCollectionData: builder.query<TradlyRecord, Record<string, unknown>>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.getCollectionData(params, c.authKey, c.currency, c.language), 'Could not load collection items') }, providesTags: ['Collection'] }),
    getPromotions: builder.query<TradlyRecord, GetPromotionsParams>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.getPromotions(params, c.authKey, c.currency, c.language), 'Could not load promotions') }, providesTags: ['Promotion'] }),
    getPromotionDetail: builder.query<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = ctx(getState() as LocalState); return result(discoveryAPI.getPromotionDetail(id, c.authKey, c.currency, c.language), 'Could not load promotion') }, providesTags: (_r, _e, id) => [{ type: 'Promotion', id: String(id) }] }),
  }),
})
export const { useSearchTagsQuery, useGetCollectionsQuery, useGetCollectionDetailQuery, useGetCollectionDataQuery, useGetPromotionsQuery, useGetPromotionDetailQuery } = discoveryApi
