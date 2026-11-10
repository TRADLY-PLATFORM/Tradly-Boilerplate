import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { locale } from '@/src/components/layout/locale'

/**
 * Check-in / check-out / guests for stays and rentals. It keeps the choice in the page address
 * (`?start_at=&end_at=&adults=&children=`); the home page's listing cards carry those four values to the listing page,
 * where the rental picker is already filled in and shows availability and the total for the dates.
 * Used by any template that sells stays (resorts, villas, rooms): `<StaySearch />`.
 */
export default function StaySearch({ className = '' }: { className?: string }) {
  const [params, setParams] = useSearchParams()
  const [startDate, setStartDate] = useState(params.get('start_at') ?? '')
  const [endDate, setEndDate] = useState(params.get('end_at') ?? '')
  const [adults, setAdults] = useState(Math.max(1, Number(params.get('adults')) || 2))
  const [children, setChildren] = useState(Math.max(0, Number(params.get('children')) || 0))

  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const validDates = !startDate || !endDate || dayjs(endDate).isAfter(dayjs(startDate))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!startDate || !endDate || !validDates) return
    const next = new URLSearchParams(params)
    next.set('start_at', startDate)
    next.set('end_at', endDate)
    next.set('adults', String(adults))
    next.set('children', String(children))
    setParams(next, { replace: true })
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <form onSubmit={submit} className={`grid gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm sm:grid-cols-2 lg:grid-cols-5 lg:items-end ${className}`}>
      <label className="space-y-1.5 text-sm font-medium">
        {locale.labels.stayCheckIn}
        <Input type="date" min={tomorrow} value={startDate} onChange={event => setStartDate(event.target.value)} required />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        {locale.labels.stayCheckOut}
        <Input type="date" min={startDate || dayjs().add(2, 'day').format('YYYY-MM-DD')} value={endDate} onChange={event => setEndDate(event.target.value)} required />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        {locale.labels.stayAdults}
        <Input type="number" min={1} max={20} value={adults} onChange={event => setAdults(Math.max(1, Number(event.target.value) || 1))} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        {locale.labels.stayChildren}
        <Input type="number" min={0} max={20} value={children} onChange={event => setChildren(Math.max(0, Number(event.target.value) || 0))} />
      </label>
      <Button type="submit" className="btn-hero h-10" disabled={!validDates}>{locale.labels.stayCheck}</Button>
      {!validDates && <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-5">{locale.labels.rentalInvalidDates}</p>}
    </form>
  )
}
