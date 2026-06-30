import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as schedulesAPI from '@/api/schedules'
import type { SchedulesPerDay } from '@/api/schedules'

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
          // Propagate SDK-level errors before trying to read data
          if (raw?.error)
            return { error: { status: 'CUSTOM_ERROR', error: raw.error?.message ?? 'Failed to fetch schedules' } }
          // API returns a flat array — SDK may nest it under .data or return it directly
          const arr: SchedulesPerDay[] =
            Array.isArray(raw?.data) ? raw.data :
            Array.isArray(raw) ? raw :
            raw?.data?.schedules_per_day ?? []
          return { data: { schedules_per_day: arr } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
    }),

  }),
})

export const { useGetSchedulesQuery } = schedulesApi
