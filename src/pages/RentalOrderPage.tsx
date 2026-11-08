import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useGetOrderDetailQuery } from '@/state/orders/api'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import RentalItemSummary from '@/src/features/orders/RentalItemSummary'
import { getItemOrderType, isRentalItem, normalizeOrderDate } from '@/src/features/orders/order-item-display'
import { locale } from '@/src/components/layout/locale'

const STATUS: Record<number, string> = { 1: 'Pending', 2: 'Confirmed', 3: 'Processing', 7: 'Completed', 8: 'Cancelled', 9: 'Refunded', 10: 'Failed' }

export default function RentalOrderPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetOrderDetailQuery(id, { skip: !id })
  if (isLoading) return <Layout><div className="py-20 text-center text-sm text-muted-foreground">Loading reservation…</div></Layout>
  if (isError || !data) return <Layout><div className="py-20 text-center text-destructive">Reservation not found.</div></Layout>

  const order: any = data.order
  const rentalItems: any[] = (order.order_details ?? []).filter((item: any) => isRentalItem(item, order.type ?? ''))
  if (!rentalItems.length) return <Layout><div className="py-20 text-center">This order has no rental reservation. <Link className="text-coffee-accent underline" to={`/orders/${id}`}>Open order details</Link>.</div></Layout>
  const status = STATUS[order.order_status] ?? `Status ${order.order_status}`
  const total = order.customer_pricing?.grand_total ?? order.grand_total ?? order.offer_total

  return <Layout>
    <div className="mb-7 flex items-center justify-between gap-3"><Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="gap-1.5 pl-0 text-coffee-accent hover:bg-transparent"><ArrowLeft className="h-4 w-4" /> My orders</Button><Link to={`/orders/${id}?view=standard`} className="text-sm text-coffee-accent underline">Standard order view</Link></div>
    <header className="mb-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">{locale.labels.rentalReservation} #{order.order_reference}</p><h1 className="mt-1 font-display text-2xl font-bold">{locale.labels.rentalReservation}</h1><p className="mt-1 text-sm text-muted-foreground">{status}</p></header>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7"><h2 className="font-display text-lg font-bold">{locale.labels.rentalOrderDates}</h2>{rentalItems.map((item: any) => {
        const start = item.schedule_start_at ? dayjs(normalizeOrderDate(item.schedule_start_at)) : null
        const end = item.schedule_end_at ? dayjs(normalizeOrderDate(item.schedule_end_at)) : null
        const type = getItemOrderType(item, order.type ?? '')
        return <article key={item.id} className="rounded-xl border border-border p-4"><div className="flex gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{item.listing?.images?.[0] && <img src={item.listing.images[0]} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><h3 className="font-semibold">{item.listing?.title ?? locale.labels.rental}</h3>{item.variant?.name && <p className="text-sm text-muted-foreground">{item.variant.name}</p>}</div></div>{start?.isValid() && <p className="mt-4 flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-coffee-accent" />{start.format('MMM D, YYYY')}{end?.isValid() ? ` – ${end.format('MMM D, YYYY')}` : ''}</p>}<RentalItemSummary item={item} orderType={type} /></article>
      })}</section>
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-lg font-bold">{locale.labels.rentalReservation}</h2><div className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">{locale.labels.orderReference}</span><span className="font-semibold">{order.order_reference}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Status</span><span className="font-semibold">{status}</span></div>{total?.formatted && <div className="flex justify-between gap-3 border-t border-border pt-3"><span className="text-muted-foreground">Total</span><span className="font-semibold">{total.formatted}</span></div>}</div><Link to="/orders" className="block"><Button variant="outline" className="btn-secondary w-full">My orders</Button></Link></aside>
    </div>
  </Layout>
}
