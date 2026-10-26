import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as membershipsAPI from '@/api/memberships'
import type { CreateMembershipInput, GetMembershipsParams } from '@/api/memberships'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })

export const membershipsApi = createApi({
  reducerPath: 'membershipsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Membership'],
  endpoints: builder => ({
    getMemberships: builder.query<{ memberships: any[]; pagination?: Record<string, number> }, GetMembershipsParams>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await membershipsAPI.getMemberships(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load memberships')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not load memberships' } }
          const data: any = result.data
          if (!Array.isArray(data?.memberships)) return { error: { status: 'CUSTOM_ERROR', error: 'Tradly returned incomplete membership data.' } }
          return { data: { memberships: data.memberships, pagination: data.pagination } }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: ['Membership'],
    }),
    createMembership: builder.mutation<{ membership: any }, CreateMembershipInput>({
      queryFn: async (input, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await membershipsAPI.createMembership(input, ctx.authKey, ctx.currency, ctx.language), 'Could not join this membership', ['membership'])
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not join this membership' } }
          return { data: { membership: result.data!.membership } }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: ['Membership'],
    }),
  }),
})

export const { useGetMembershipsQuery, useCreateMembershipMutation } = membershipsApi
