import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarDays, Clock3 } from 'lucide-react'
import { useGetListingDetailQuery } from '@/state/listing/api'
import { useAddToCartMutation, useClearCartMutation } from '@/state/cart/api'
import { useGetSchedulesQuery } from '@/state/schedules/api'
import { useAuthSelector } from '@/state/auth/selectors'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'

export default function BookingListingPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const authenticated = useAuthSelector(state => state.isAuthenticated)
  const { data, isLoading, isError } = useGetListingDetailQuery({ slug })
  const listing = data?.listing
  const startAt = useMemo(() => dayjs().format('YYYY-MM-DD'), [])
  const { data: availability, isLoading: schedulesLoading, isError: schedulesError } = useGetSchedulesQuery(
    { listingId: listing?.id ?? '', startAt, days: 30 },
    { skip: !listing?.id || !['events', 'appointments'].includes(listing.order_type) },
  )
  const [addToCart, { isLoading: adding }] = useAddToCartMutation()
  const [clearCart] = useClearCartMutation()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [error, setError] = useState('')
  const dates = availability?.schedules_per_day ?? []
  const date = dates.find(item => item.day === selectedDate) ?? dates[0]
  const activeDate = date?.day ?? ''
  const slots = date?.schedules.filter(slot => slot.available && (slot.stocks_left === undefined || slot.stocks_left > 0)) ?? []

  const continueToCheckout = async () => {
    if (!listing || !date || selectedSlot === null || !slots[selectedSlot]) return
    if (!authenticated) {
      navigate(`/sign-in?next=${encodeURIComponent(`/booking/${slug}`)}`)
      return
    }
    setError('')
    const clear = await clearCart()
    if ('error' in clear && (clear.error as any)?.code !== 471) {
      setError((clear.error as any)?.error ?? 'Could not prepare your booking cart.')
      return
    }
    const added = await addToCart({ listing_id: listing.id, quantity: 1 })
    if ('error' in added) {
      setError((added.error as any)?.error ?? 'Could not add this booking to your cart.')
      return
    }
    const slot = slots[selectedSlot]
    const params = new URLSearchParams({ booking_schedule_id: String(slot.id), booking_day: activeDate })
    navigate(`/checkout?${params.toString()}`)
  }

  if (isLoading) return <Layout><div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div></Layout>
  if (isError || !listing) return <Layout><div className="py-20 text-center text-destructive">Listing not found.</div></Layout>
  if (!['events', 'appointments'].includes(listing.order_type)) return <Layout><div className="py-20 text-center">This listing does not use booking availability. <Link className="text-coffee-accent underline" to={`/listing/${slug}?view=standard`}>Open the regular listing page</Link>.</div></Layout>

  return <Layout>
    <div className="mb-5 flex items-center gap-2 text-sm"><Link to={`/listing/${slug}?view=standard`} className="text-coffee-accent hover:underline">Regular listing page</Link><span className="text-muted-foreground">/</span><span>Book</span></div>
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">{listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>}</div>
        {listing.images?.length > 1 && <div className="mt-3 flex gap-2">{listing.images.slice(1, 5).map((image, index) => <img key={image + index} src={image} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div>}
      </div>
      <div className="space-y-5">
        <div><p className="text-xs text-muted-foreground">{listing.account?.name ?? 'Seller'}</p><h1 className="mt-1 font-display text-3xl font-bold">{listing.title}</h1><p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{listing.description}</p></div>
        <p className="font-display text-2xl font-bold text-coffee-accent">{listing.offer_price?.formatted ?? listing.list_price?.formatted}</p>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><CalendarDays className="h-5 w-5 text-coffee-accent" /> Choose a date</h2>
          {schedulesLoading ? <p className="text-sm text-muted-foreground">Loading available dates…</p> : schedulesError ? <p role="alert" className="text-sm text-destructive">Could not load booking availability. Refresh to try again.</p> : dates.length === 0 ? <p className="text-sm text-muted-foreground">There are no available dates in the next 30 days.</p> : <>
            <div className="flex gap-2 overflow-x-auto pb-2">{dates.map(item => <button key={item.day} type="button" onClick={() => { setSelectedDate(item.day); setSelectedSlot(null) }} className={`min-w-20 rounded-xl border px-3 py-2 text-center ${activeDate === item.day ? 'border-coffee-accent bg-coffee-secondary/30' : 'border-border'}`}><span className="block text-[11px] text-muted-foreground">{dayjs(item.day).format('ddd')}</span><span className="font-semibold">{dayjs(item.day).format('MMM D')}</span></button>)}</div>
            <h3 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" /> Available times</h3>
            {slots.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map((slot, index) => <button key={`${slot.id}-${slot.start_time}`} type="button" aria-pressed={selectedSlot === index} onClick={() => setSelectedSlot(index)} className={`rounded-lg border px-3 py-2 text-sm ${selectedSlot === index ? 'border-coffee-accent bg-coffee-secondary/30 font-semibold' : 'border-border hover:border-coffee-accent'}`}>{slot.start_time} – {slot.end_time}{slot.stocks_left !== undefined && <span className="mt-1 block text-[10px] text-muted-foreground">{slot.stocks_left} left</span>}</button>)}</div> : <p className="text-sm text-muted-foreground">No times are available on this date.</p>}
          </>}
        </section>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button onClick={continueToCheckout} disabled={!dates.length || selectedSlot === null || adding} className="btn-hero w-full">{adding ? 'Preparing booking…' : 'Continue to checkout'}</Button>
        <p className="text-xs text-muted-foreground">Your selected time will be confirmed during checkout.</p>
      </div>
    </div>
  </Layout>
}
