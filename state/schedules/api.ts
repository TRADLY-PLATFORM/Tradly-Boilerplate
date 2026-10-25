import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as schedulesAPI from '@/api/schedules'
import type { SchedulesPerDay } from '@/api/schedules'
import { getTradlyResponseError } from '@/state/api-response'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const ctx = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const schedulesApi = createApi({
  reducerPath: 'schedulesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({

    // Fetch available schedule slots for an event/appointment listing
    // result.data → { schedules_per_day: [{ day, schedules: [{ start_time, end_time, available }] }] }
    // result.data → SchedulesPerDay[] (flat array — API returns array directly, not wrapped in an object)
    getSchedules: builder.query<{ schedules_per_day: SchedulesPerDay[] }, { listingId: number | string; startAt: string; days?: number }>({
      queryFn: async ({ listingId, startAt, days = 30 }, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await schedulesAPI.getSchedules(listingId, startAt, days, authKey, currency, language)
          const raw: any = res
          // Schedules may be returned as a direct array or inside the standard
          // SDK envelope. Reject SDK errors and malformed responses instead of
          // silently displaying an empty availability calendar.
          if (!Array.isArray(raw)) {
            const failure = getTradlyResponseError(raw, 'Failed to fetch schedules')
            if (failure)
              return { error: { status: 'CUSTOM_ERROR', error: failure } }
          }
          // API returns a flat array — SDK may nest it under .data or return it directly
          const arr: SchedulesPerDay[] | undefined =
            Array.isArray(raw?.data) ? raw.data :
            Array.isArray(raw) ? raw :
            Array.isArray(raw?.data?.schedules_per_day) ? raw.data.schedules_per_day : undefined
          if (!arr)
            return { error: { status: 'CUSTOM_ERROR', error: 'The Tradly service returned incomplete schedule data.' } }
          return { data: { schedules_per_day: arr } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
    }),

  }),
})

export const { useGetSchedulesQuery } = schedulesApi
