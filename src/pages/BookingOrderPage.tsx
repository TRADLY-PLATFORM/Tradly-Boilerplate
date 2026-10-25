import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, CalendarDays, Clock3, MapPin } from 'lucide-react'
import { useGetOrderDetailQuery } from '@/state/orders/api'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'

const STATUS: Record<number, string> = { 1: 'Pending', 2: 'Confirmed', 3: 'Processing', 7: 'Completed', 8: 'Cancelled', 9: 'Refunded', 10: 'Failed' }

export default function BookingOrderPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetOrderDetailQuery(id, { skip: !id })
  if (isLoading) return <Layout><div className="py-20 text-center text-sm text-muted-foreground">Loading booking…</div></Layout>
  if (isError || !data) return <Layout><div className="py-20 text-center text-destructive">Booking not found.</div></Layout>

  const order: any = data.order
  const items: any[] = order.order_details ?? []
  const bookingItems = items.filter(item => item.schedule_start_at)
  const item = bookingItems[0]
  if (!item) return <Layout><div className="py-20 text-center">This order does not contain a scheduled booking. <Link className="text-coffee-accent underline" to={`/orders/${id}`}>Open standard order details</Link>.</div></Layout>

  const start = dayjs(item.schedule_start_at)
  const end = item.schedule_end_at ? dayjs(item.schedule_end_at) : null
  const calendarStart = start.startOf('month').startOf('week')
  const days = Array.from({ length: 42 }, (_, index) => calendarStart.add(index, 'day'))
  const scheduledDate = start.format('YYYY-MM-DD')

  return <Layout>
    <div className="mb-7 flex items-center justify-between gap-3">
      <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="gap-1.5 pl-0 text-coffee-accent hover:bg-transparent"><ArrowLeft className="h-4 w-4" /> My orders</Button>
      <Link to={`/orders/${id}?view=standard`} className="text-sm text-coffee-accent underline">Standard order view</Link>
    </div>
    <div className="mb-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">Booking #{order.order_reference}</p><h1 className="mt-1 font-display text-2xl font-bold">Your booking</h1><p className="mt-1 text-sm text-muted-foreground">{STATUS[order.order_status] ?? `Status ${order.order_status}`}</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{start.format('MMMM YYYY')}</h2><span className="text-xs text-muted-foreground">Booked date highlighted</span></div>
        <div className="grid grid-cols-7 gap-1 text-center">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 text-xs font-semibold text-muted-foreground">{day}</div>)}
          {days.map(day => {
            const booked = day.format('YYYY-MM-DD') === scheduledDate
            return <div key={day.format('YYYY-MM-DD')} aria-current={booked ? 'date' : undefined} className={`grid aspect-square place-items-center rounded-xl text-sm ${booked ? 'bg-coffee-accent font-bold text-white ring-2 ring-coffee-accent/30' : day.month() === start.month() ? 'text-foreground' : 'text-muted-foreground/40'}`}>{day.date()}</div>
          })}
        </div>
      </section>
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex gap-3">{item.listing?.images?.[0] && <img src={item.listing.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />}<div><h2 className="font-semibold">{item.listing?.title ?? 'Appointment'}</h2><Link to={`/booking/${item.listing?.slug ?? item.listing_id}`} className="text-xs text-coffee-accent underline">View booking page</Link></div></div>
        <div className="border-t border-border pt-4"><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-coffee-accent" />{start.format('dddd, MMMM D, YYYY')}</p><p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />{start.format('h:mm A')}{end ? ` – ${end.format('h:mm A')}` : ''}</p></div>
        {order.account?.name && <p className="flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{order.account.name}</p>}
        <div className="border-t border-border pt-4 text-xs text-muted-foreground">Order reference: <span className="font-semibold text-foreground">{order.order_reference}</span></div>
        {bookingItems.length > 1 && <p className="text-xs text-muted-foreground">This order contains {bookingItems.length} scheduled items. The calendar highlights the first booking; each booking time is listed below.</p>}
        {bookingItems.length > 1 && <div className="space-y-2 border-t border-border pt-4">{bookingItems.slice(1).map((booking: any) => <div key={booking.id} className="text-sm"><p className="font-medium">{booking.listing?.title ?? 'Booking'}</p><p className="text-xs text-muted-foreground">{dayjs(booking.schedule_start_at).format('MMM D, YYYY · h:mm A')}{booking.schedule_end_at ? ` – ${dayjs(booking.schedule_end_at).format('h:mm A')}` : ''}</p></div>)}</div>}
      </aside>
    </div>
  </Layout>
}
