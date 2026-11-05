import { useGetListingLikesQuery, useUnlikeListingMutation } from '@/state/listing/api'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { locale } from '@/src/components/layout/locale'

type ListingLike = Record<string, any>
type SavedListing = { id: number; slug: string; title: string; images: string[]; accountName: string; price: string }

function getRows(data: Record<string, unknown> | undefined): ListingLike[] {
  if (!data) return []
  for (const key of ['listings', 'listing_likes', 'saved_listings', 'likes']) {
    const value = data[key]
    if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object') as ListingLike[]
  }
  return []
}

function toSavedListing(row: ListingLike): SavedListing | null {
  const listing = row.listing && typeof row.listing === 'object' ? row.listing : row
  const id = Number(listing.id ?? listing.listing_id ?? row.listing_id)
  if (!Number.isFinite(id) || id <= 0) return null
  return {
    id,
    slug: String(listing.slug ?? id),
    title: String(listing.title ?? locale.labels.listingNotFound),
    images: Array.isArray(listing.images) ? listing.images.filter((image: unknown): image is string => typeof image === 'string') : [],
    accountName: String(listing.account?.name ?? locale.labels.unknownSeller),
    price: String(listing.offer_price?.formatted ?? listing.list_price?.formatted ?? ''),
  }
}

export default function SavedListingsPage() {
  const { data, isLoading, isError, refetch } = useGetListingLikesQuery({ page: 1 })
  const [unlike, unlikeState] = useUnlikeListingMutation()
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const listings = getRows(data).map(toSavedListing).filter((item): item is SavedListing => !!item)

  const remove = async (id: number) => {
    setRemovingId(id)
    setError('')
    const result = await unlike({ id })
    if ('error' in result) setError(locale.labels.removeSavedListingError)
    else await refetch()
    setRemovingId(null)
  }

  return <Layout>
    <header className="mb-7 flex items-center gap-3">
      <Heart className="h-7 w-7 text-coffee-accent" />
      <div><h1 className="font-display text-2xl font-bold text-foreground">{locale.labels.savedListings}</h1><p className="mt-1 text-sm text-muted-foreground">{locale.labels.savedListingsDescription}</p></div>
    </header>
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    {isLoading ? <p role="status" className="py-16 text-center text-sm text-muted-foreground">{locale.labels.feedLoading}</p>
      : isError ? <p role="alert" className="py-16 text-center text-sm text-destructive">{locale.labels.savedListingsError}</p>
      : listings.length === 0 ? <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">{locale.labels.savedListingsEmpty}</div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map(listing => <article key={listing.id} className="overflow-hidden rounded-xl border border-border bg-card">
        <Link to={`/listing/${listing.slug}`} className="block aspect-square bg-muted">{listing.images[0] ? <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground">{locale.labels.noImage}</div>}</Link>
        <div className="p-4"><p className="text-xs text-muted-foreground">{listing.accountName}</p><Link to={`/listing/${listing.slug}`} className="mt-1 block font-semibold text-foreground hover:text-coffee-accent">{listing.title}</Link>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-coffee-accent">{listing.price}</span><Button type="button" variant="outline" size="sm" disabled={unlikeState.isLoading && removingId === listing.id} onClick={() => void remove(listing.id)} aria-label={`${locale.labels.removeSavedListing}: ${listing.title}`}><Trash2 className="me-1 h-4 w-4" />{locale.labels.remove}</Button></div>
        </div>
      </article>)}</div>}
  </Layout>
}
