import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface ScheduleSlot {
  id: number
  start_date: string
  end_date: string
  start_time: string     // "HH:mm"
  end_time: string       // "HH:mm"
  schedule_type: number
  available: boolean
  total_stocks?: number
  stocks_left?: number
}

export interface SchedulesPerDay {
  day: string            // "YYYY-MM-DD"
  schedules: ScheduleSlot[]
}

// API returns a flat array of SchedulesPerDay directly (not wrapped in an object)
export type GetSchedulesResponse = SchedulesPerDay[]

// Fetch available schedule slots for a listing
// id: listing ID, start_at: "YYYY-MM-DD", days: how many days ahead to fetch
export const getSchedules = (
  listingId: number | string,
  startAt: string,
  days: number = 30,
  authKey: string,
  currency: string,
  language: string,
): Promise<{ ok: boolean; data?: GetSchedulesResponse; error?: { message: string } }> =>
  // SDK uses param.id in the URL path: /listings/{id}/schedules_per_day?
  // bodyParam is serialized as query string: ?days=30&start_at=...
  (TradlySDK as any).app.getSchedule({
    id: String(listingId),
    bodyParam: { days, start_at: startAt },
    pkKey: AppConfig.pkKey,
    authKey,
    currency,
    language,
  })
