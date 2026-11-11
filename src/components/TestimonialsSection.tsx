import { useGetListingsQuery } from '@/state/listing/api'
import { useGetReviewsQuery } from '@/state/reviews/api'
import { locale } from '@/src/components/layout/locale'

type Review = Record<string, unknown>
const reviewsOf = (data: Record<string, unknown> | undefined): Review[] => {
  const list = data?.reviews ?? data?.items
  return Array.isArray(list) ? (list as Review[]) : []
}
const text = (item: Review, keys: string[]) => {
  for (const key of keys) if (typeof item[key] === 'string' && (item[key] as string).trim()) return (item[key] as string).trim()
  return ''
}

/**
 * What real customers wrote: reviews of the store's top listings, four stars and up, with a comment. Nothing is
 * invented: with no qualifying reviews the section renders nothing (no heading), so a template can always include it.
 */
export default function TestimonialsSection({ title, subtitle, limit = 3, id, className = '' }: { title?: string; subtitle?: string; limit?: number; id?: string; className?: string }) {
  const { data } = useGetListingsQuery({ page: 1, limit: 6 })
  const ids = (data?.listings ?? []).map(listing => listing.id)
  const a = useGetReviewsQuery({ listing_id: ids[0], page: 1 }, { skip: !ids[0] })
  const b = useGetReviewsQuery({ listing_id: ids[1], page: 1 }, { skip: !ids[1] })
  const c = useGetReviewsQuery({ listing_id: ids[2], page: 1 }, { skip: !ids[2] })
  const d = useGetReviewsQuery({ listing_id: ids[3], page: 1 }, { skip: !ids[3] })
  const good = [a, b, c, d]
    .flatMap(result => reviewsOf(result.data))
    .filter(review => Number(review.rating ?? review.score) >= 4 && text(review, ['comment', 'review', 'content']).length >= 20)
    .slice(0, limit)
  if (good.length === 0) return null
  return (
    <section id={id} className={`mt-16 ${className}`}>
      <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title ?? locale.labels.testimonialsTitle}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {good.map((review, index) => (
          <figure key={text(review, ['id']) || index} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-coffee-accent" aria-label={`${Number(review.rating ?? review.score)} / 5`}>{'★'.repeat(Math.round(Number(review.rating ?? review.score)))}</p>
            <blockquote className="mt-2 text-sm text-foreground">“{text(review, ['comment', 'review', 'content'])}”</blockquote>
            <figcaption className="mt-3 text-xs font-medium text-muted-foreground">{text(review, ['user_name', 'name', 'author']) || locale.labels.testimonialsCustomer}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
