import { useSearchParams } from 'react-router-dom'
import { useGetListingsQuery } from '@/state/listing/api'
import { Skeleton } from '@/src/components/ui/skeleton'
import MediaCard from '@/src/components/MediaCard'
import { locale } from '@/src/components/layout/locale'

/**
 * Video or audio listings (`order_type`, default `video_listing`) as a grid of MediaCard tiles. It follows the home
 * page's search and category choice (`?search_key=`, `?category=`). With none published it shows a short note for the
 * owner (or nothing at all with `hideEmpty`, for secondary sections).
 */
export default function MediaGrid({ orderType = 'video', limit = 12, title, subtitle, hideEmpty = false, className = '' }: { orderType?: string; limit?: number; title?: string; subtitle?: string; hideEmpty?: boolean; className?: string }) {
  const [params] = useSearchParams()
  const search = params.get('search_key') || ''
  const category = Number(params.get('category')) || undefined
  const { data, isLoading } = useGetListingsQuery({ order_type: orderType, page: 1, limit, ...(search ? { search_key: search } : {}), ...(category ? { category_id: category } : {}) })
  const items = (data?.listings ?? []).slice(0, limit)
  if (!isLoading && items.length === 0 && hideEmpty) return null
  return (
    <section className={className}>
      {title && <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>}
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {isLoading ? (
        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i}><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="mt-2 h-4 w-3/4" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-foreground">{locale.labels.mediaEmptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{locale.labels.mediaEmptyText}</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3 lg:grid-cols-4">{items.map(item => <MediaCard key={item.id} listing={item} />)}</div>
      )}
    </section>
  )
}
