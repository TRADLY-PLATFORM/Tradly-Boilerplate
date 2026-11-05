import { useNavigate } from 'react-router-dom'
import { useGetCollectionsQuery, useGetPromotionsQuery, useSearchTagsQuery } from '@/state/discovery/api'
import { locale } from '@/src/components/layout/locale'

type Row = Record<string, unknown>
const rows = (data: Row | undefined, keys: string[]): Row[] => {
  if (!data) return []
  for (const key of keys) if (Array.isArray(data[key])) return data[key] as Row[]
  const nested = data.data as Row | undefined
  if (nested) return rows(nested, keys)
  return []
}
const text = (row: Row, keys: string[]) => {
  for (const key of keys) if (typeof row[key] === 'string' || typeof row[key] === 'number') return String(row[key])
  return ''
}

export default function MarketplaceDiscoverySections() {
  const navigate = useNavigate()
  const tags = useSearchTagsQuery({})
  const collections = useGetCollectionsQuery()
  const promotions = useGetPromotionsQuery({ page: 1, type: 'listings', medium: 'web', placement: 'home' })
  const tagRows = rows(tags.data, ['tags', 'items'])
  const collectionRows = rows(collections.data, ['collections', 'items'])
  const promotionRows = rows(promotions.data, ['promos', 'promotions', 'items'])

  return <div className="space-y-10">
    <section aria-labelledby="tag-explorer-title"><h2 id="tag-explorer-title" className="font-display text-2xl font-bold text-foreground">{locale.labels.tags}</h2>{tags.isLoading ? <p className="mt-3 text-sm text-muted-foreground">{locale.labels.tagsLoading}</p> : tags.isError ? <p role="alert" className="mt-3 text-sm text-destructive">{locale.labels.tagsError}</p> : tagRows.length ? <div className="mt-4 flex flex-wrap gap-2">{tagRows.map((tag, index) => {
      const name = text(tag, ['name', 'title', 'tag'])
      const id = text(tag, ['id', 'slug']) || name
      return name ? <button type="button" key={id || index} onClick={() => navigate(`/?search_key=${encodeURIComponent(name)}`)} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary">#{name}</button> : null
    })}</div> : <p className="mt-3 text-sm text-muted-foreground">{locale.labels.tagsEmpty}</p>}</section>

    <section aria-labelledby="collections-title"><h2 id="collections-title" className="font-display text-2xl font-bold text-foreground">{locale.labels.collections}</h2>{collections.isLoading ? <p className="mt-3 text-sm text-muted-foreground">{locale.labels.collectionsLoading}</p> : collections.isError ? <p role="alert" className="mt-3 text-sm text-destructive">{locale.labels.collectionsError}</p> : collectionRows.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{collectionRows.slice(0, 6).map((collection, index) => {
      const id = text(collection, ['id', 'collection_id'])
      const name = text(collection, ['title', 'name']) || locale.labels.collection
      return <button type="button" key={id || index} onClick={() => id && navigate(`/collections/${encodeURIComponent(id)}`)} className="rounded-xl border border-border bg-card p-5 text-start hover:border-primary"><h3 className="font-semibold text-foreground">{name}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{text(collection, ['description', 'subtitle'])}</p></button>
    })}</div> : <p className="mt-3 text-sm text-muted-foreground">{locale.labels.collectionsEmpty}</p>}</section>

    <section aria-labelledby="promotions-title"><h2 id="promotions-title" className="font-display text-2xl font-bold text-foreground">{locale.labels.promotions}</h2>{promotions.isLoading ? <p className="mt-3 text-sm text-muted-foreground">{locale.labels.promotionsLoading}</p> : promotions.isError ? <p role="alert" className="mt-3 text-sm text-destructive">{locale.labels.promotionsError}</p> : promotionRows.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{promotionRows.slice(0, 4).map((promo, index) => {
      const id = text(promo, ['id', 'promo_id', 'promo_banner_id'])
      const image = text(promo, ['image', 'image_url', 'banner_image'])
      return <article key={id || index} className="overflow-hidden rounded-xl border border-border bg-card">{image && <img src={image} alt={text(promo, ['title', 'name'])} className="max-h-56 w-full object-cover" />}<div className="p-4"><h3 className="font-semibold text-foreground">{text(promo, ['title', 'name']) || locale.labels.promotions}</h3><p className="mt-1 text-sm text-muted-foreground">{text(promo, ['description', 'subtitle'])}</p></div></article>
    })}</div> : <p className="mt-3 text-sm text-muted-foreground">{locale.labels.promotionsEmpty}</p>}</section>
  </div>
}
