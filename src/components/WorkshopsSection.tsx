import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useGetListingsQuery } from '@/state/listing/api'
import { locale } from '@/src/components/layout/locale'

/**
 * Upcoming workshops, classes and events: the store's own event listings (`order_type=events`), newest first.
 * Renders nothing (no heading either) when the store has none, so a template can always include it. Dates, seats and
 * the sign-up flow are on each event's page (/l/:slug); this only shows what is on offer.
 */
export default function WorkshopsSection({ title, subtitle, id, limit = 6, className = '' }: { title: string; subtitle?: string; id?: string; limit?: number; className?: string }) {
  const { data, isLoading } = useGetListingsQuery({ order_type: 'events', page: 1, limit })
  const events = (data?.listings ?? []).slice(0, limit)
  if (isLoading || events.length === 0) return null
  return (
    <section id={id} className={`mt-16 ${className}`}>
      <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map(event => (
        <Link key={event.id} to={`/l/${event.slug || event.id}`} className="group overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-shadow hover:shadow-md">
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            {event.images?.[0] && <img src={event.images[0]} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
          </div>
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">{event.title}</h3>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-coffee-accent">{event.offer_price?.formatted}</span>
              <span className="inline-flex items-center text-muted-foreground group-hover:text-foreground">{locale.labels.workshopsPickDate}<ArrowRight className="ml-1 h-3.5 w-3.5" /></span>
            </div>
          </div>
        </Link>
      ))}
      </div>
    </section>
  )
}
