import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { rentalsApi } from '@/state/rentals/api'
import type { Listing } from '@/types/listing.types'
import { isRentalAvailabilityConfirmed } from './availability'

export type StayAvailability = {
  /** The listings to show: rentals that are not free for the chosen dates are left out; everything else stays. */
  listings: Listing[]
  /** True while dates are chosen and availability is still being checked. */
  checking: boolean
  /** True when dates are chosen (the grid is filtered). */
  filtering: boolean
  /** How many rentals were left out. */
  hidden: number
}

/**
 * Filters the home grid by the dates picked in <StaySearch /> (`?start_at=&end_at=&adults=`).
 * Each rental on the page is checked with Tradly's availability endpoint for one unit; a rental that answers
 * "not available" is hidden. A check that fails (network, a duration rule) keeps the listing visible: the listing
 * page then explains the problem, and a hiccup never empties the page.
 */
export function useStayAvailability(listings: Listing[]): StayAvailability {
  const [params] = useSearchParams()
  const dispatch = useDispatch<any>()
  const start = params.get('start_at') || ''
  const end = params.get('end_at') || ''
  const validDates = !!start && !!end && dayjs(end).isAfter(dayjs(start))
  const rentals = useMemo(() => listings.filter(listing => listing.order_type === 'rental'), [listings])
  const key = `${start}|${end}|${rentals.map(listing => listing.id).join(',')}`
  const [state, setState] = useState<{ key: string; unavailable: Set<number> } | null>(null)

  useEffect(() => {
    if (!validDates || rentals.length === 0) return
    let cancelled = false
    const startAt = dayjs(start).startOf('day').toISOString()
    const endAt = dayjs(end).startOf('day').toISOString()
    void Promise.all(rentals.map(async listing => {
      try {
        const result = await dispatch(rentalsApi.endpoints.getRentalAvailability.initiate({ listing_id: listing.id, start_at: startAt, end_at: endAt, units: 1 }))
        if (result.error || !result.data) return null
        return isRentalAvailabilityConfirmed(result.data, 1) ? null : listing.id
      } catch {
        return null
      }
    })).then(ids => {
      if (!cancelled) setState({ key, unavailable: new Set(ids.filter((id): id is number => id !== null)) })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, validDates])

  const ready = validDates && state?.key === key
  const unavailable = ready ? state!.unavailable : new Set<number>()
  const visible = listings.filter(listing => !unavailable.has(listing.id))
  return { listings: visible, checking: validDates && rentals.length > 0 && !ready, filtering: validDates, hidden: listings.length - visible.length }
}
