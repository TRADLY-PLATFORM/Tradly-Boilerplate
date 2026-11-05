import { Link, useParams } from 'react-router-dom'
import Layout from '@/src/components/Layout'
import { useGetCollectionDataQuery, useGetCollectionDetailQuery } from '@/state/discovery/api'
import { locale } from '@/src/components/layout/locale'

type Row = Record<string, unknown>
const record = (data: Row | undefined) => (data?.collection && typeof data.collection === 'object' ? data.collection as Row : data ?? {})
const rows = (data: Row | undefined): Row[] => {
  if (!data) return []
  for (const key of ['listings', 'items', 'collection_data', 'data']) if (Array.isArray(data[key])) return data[key] as Row[]
  return []
}
const text = (row: Row, keys: string[]) => {
  for (const key of keys) if (typeof row[key] === 'string' || typeof row[key] === 'number') return String(row[key])
  return ''
}

export default function CollectionPage() {
  const { collectionId = '' } = useParams<{ collectionId: string }>()
  const detail = useGetCollectionDetailQuery(collectionId, { skip: !collectionId })
  const data = useGetCollectionDataQuery({ collection_id: collectionId, page: 1 }, { skip: !collectionId })
  const collection = record(detail.data)
  const items = rows(data.data)
  return <Layout><div className="mx-auto max-w-6xl"><Link to="/" className="text-sm text-muted-foreground underline">{locale.labels.home}</Link>
    {detail.isLoading && <p className="py-10 text-sm text-muted-foreground">{locale.labels.collectionsLoading}</p>}
    {(detail.isError || data.isError) && <p role="alert" className="py-10 text-sm text-destructive">{locale.labels.collectionsError}</p>}
    {!detail.isLoading && !detail.isError && <><header className="py-8"><h1 className="font-display text-3xl font-bold text-foreground">{text(collection, ['title', 'name']) || locale.labels.collection}</h1><p className="mt-2 text-muted-foreground">{text(collection, ['description', 'subtitle'])}</p></header>
      {data.isLoading ? <p className="text-sm text-muted-foreground">{locale.labels.feedLoading}</p> : items.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((item, index) => {
        const listing = item.listing && typeof item.listing === 'object' ? item.listing as Row : item
        const slug = text(listing, ['slug'])
        const title = text(listing, ['title', 'name']) || locale.labels.feedItem
        const image = text(listing, ['image', 'image_url', 'featured_image'])
        const card = <div className="overflow-hidden rounded-xl border border-border bg-card">{image && <img src={image} alt="" className="aspect-square w-full object-cover" />}<div className="p-3"><p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p></div></div>
        return slug ? <Link key={text(listing, ['id']) || index} to={`/listing/${slug}`}>{card}</Link> : <div key={index}>{card}</div>
      })}</div> : !data.isLoading && !data.isError ? <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{locale.labels.collectionsEmpty}</p> : null}
    </>}
  </div></Layout>
}
