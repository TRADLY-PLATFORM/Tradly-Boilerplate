import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useGetCategoriesQuery } from '@/state/categories/api'
import { useGetListingsQuery } from '@/state/listing/api'
import { locale } from '@/src/components/layout/locale'

/**
 * A home-page section for one category of listings, found by the category's name (default: a name containing "package",
 * for example "OBD packages"). It shows that category's listings as cards (picture, title, price or "Contact for pricing"
 * for enquiry-only listings), each opening its listing page, where an enquiry listing has the Enquire button. Renders
 * nothing (no heading either) when no category matches or it has no listings, so a template can always include it.
 * `match` is a case-insensitive pattern for the category name.
 */
export default function PackagesSection({ title, subtitle, match = 'package', limit = 6, id, className = '' }: { title: string; subtitle?: string; match?: string; limit?: number; id?: string; className?: string }) {
  const [pattern] = useState(() => { try { return new RegExp(match, 'i') } catch { return /package/i } })
  const categories = useGetCategoriesQuery({ page: 1, limit: 100 })
  const category = (categories.data?.categories ?? []).find(cat => pattern.test(String(cat.name ?? '')))
  const listings = useGetListingsQuery({ page: 1, limit, category_id: Number(category?.id) }, { skip: !category })
  const items = (listings.data?.listings ?? []).slice(0, limit)
  if (!category || items.length === 0) return null
  return (
    <section id={id} className={`mt-16 ${className}`}>
      <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <Link key={item.id} to={`/l/${item.slug || item.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-shadow hover:shadow-md">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              {item.images?.[0] && <img src={item.images[0]} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2">{item.title}</h3>
              <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                <span className="font-semibold text-coffee-accent">{item.offer_price?.amount > 0 ? item.offer_price.formatted : locale.labels.packageContactForPrice}</span>
                <span className="inline-flex items-center text-muted-foreground group-hover:text-foreground">{locale.labels.packageDetails}<ArrowRight className="ml-1 h-3.5 w-3.5" /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
