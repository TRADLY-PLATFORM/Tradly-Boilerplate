import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as socialAPI from '@/api/social'
import type { GetFeedParams, TradlyRecord } from '@/types/prompt-apis.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const ctx = (s: LocalState) => ({ authKey: s.auth.authKey, currency: s.app.currency, language: s.app.language })
const error = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)
const result = async (promise: Promise<unknown>, message: string): Promise<{ data: TradlyRecord } | { error: ReturnType<typeof error> }> => {
  try { const response: any = normalizeTradlyResponse(await promise, message); return response.error ? { error: error(response.error.message ?? message) } : { data: (response.data ?? {}) as TradlyRecord } }
  catch (cause) { return { error: error(cause instanceof Error ? cause.message : message) } }
}

export const socialApi = createApi({
  reducerPath: 'socialApi', baseQuery: fetchBaseQuery({ baseUrl: '/' }), tagTypes: ['SocialFeed'],
  endpoints: builder => ({
    getHomeFeed: builder.query<TradlyRecord, GetFeedParams>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(socialAPI.getHomeFeed(params, c.authKey, c.currency, c.language), 'Could not load home feed') }, providesTags: ['SocialFeed'] }),
    getActivityFeed: builder.query<TradlyRecord, GetFeedParams>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(socialAPI.getActivityFeed(params, c.authKey, c.currency, c.language), 'Could not load activity feed') }, providesTags: ['SocialFeed'] }),
    getFollowingFeed: builder.query<TradlyRecord, GetFeedParams & { page: number; type: 'listings' | string }>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(socialAPI.getFollowingFeed(params, c.authKey, c.currency, c.language), 'Could not load following feed') }, providesTags: ['SocialFeed'] }),
    getFollowingAccounts: builder.query<TradlyRecord, GetFeedParams>({ queryFn: (params, { getState }) => { const c = ctx(getState() as LocalState); return result(socialAPI.getFollowingAccounts(params, c.authKey, c.currency, c.language), 'Could not load followed accounts') }, providesTags: ['SocialFeed'] }),
  }),
})
export const { useGetHomeFeedQuery, useGetActivityFeedQuery, useGetFollowingFeedQuery, useGetFollowingAccountsQuery } = socialApi
