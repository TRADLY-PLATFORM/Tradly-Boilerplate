import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as tenantDataAPI from '@/api/tenant-data'
import type { TradlyRecord } from '@/types/prompt-apis.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const ctx = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })
const custom = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)
const request = async (operation: Promise<unknown>, fallback: string): Promise<{ data: TradlyRecord } | { error: ReturnType<typeof custom> }> => {
  try { const response: any = normalizeTradlyResponse(await operation, fallback); return response.error ? { error: custom(response.error.message ?? fallback) } : { data: (response.data ?? {}) as TradlyRecord } }
  catch (cause) { return { error: custom(cause instanceof Error ? cause.message : fallback) } }
}

export const tenantDataApi = createApi({
  reducerPath: 'tenantDataApi', baseQuery: fetchBaseQuery({ baseUrl: '/' }), tagTypes: ['TenantData'],
  endpoints: builder => ({
    getTenantLanguages: builder.query<TradlyRecord, void>({ queryFn: (_arg, { getState }) => { const c = ctx(getState() as LocalState); return request(tenantDataAPI.getTenantLanguages(c.authKey, c.currency, c.language), 'Could not load tenant languages') }, providesTags: ['TenantData'] }),
    getCurrencies: builder.query<TradlyRecord, void>({ queryFn: (_arg, { getState }) => { const c = ctx(getState() as LocalState); return request(tenantDataAPI.getCurrencies(c.authKey, c.currency, c.language), 'Could not load currencies') }, providesTags: ['TenantData'] }),
    getCurrencyDetail: builder.query<TradlyRecord, number | string>({ queryFn: (id, { getState }) => { const c = ctx(getState() as LocalState); return request(tenantDataAPI.getCurrencyDetail(id, c.authKey, c.currency, c.language), 'Could not load currency') }, providesTags: (_r, _e, id) => [{ type: 'TenantData', id: `currency-${id}` }] }),
    getTenantCountries: builder.query<TradlyRecord, void>({ queryFn: (_arg, { getState }) => { const c = ctx(getState() as LocalState); return request(tenantDataAPI.getTenantCountries(c.authKey, c.currency, c.language), 'Could not load tenant countries') }, providesTags: ['TenantData'] }),
  }),
})
export const { useGetTenantLanguagesQuery, useGetCurrenciesQuery, useGetCurrencyDetailQuery, useGetTenantCountriesQuery } = tenantDataApi
