import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '@/src/components/Layout'
import { Button } from '@/src/components/ui/button'
import { useGetListingsQuery } from '@/state/listing/api'
import { useGetPublicAccountsQuery } from '@/state/accounts/api'

/** /s/:id — one seller's page: who they are and all their listings. */
export default function SellerPage() {
  const { id } = useParams()
  const accountId = Number(id)
  const [page, setPage] = useState(1)
  const accounts = useGetPublicAccountsQuery()
  const { data, isLoading, isFetching } = useGetListingsQuery({ account_id: accountId, page, limit: 20 }, { skip: !Number.isFinite(accountId) })
  const listings = data?.listings ?? []
  const account = accounts.data?.accounts.find(candidate => candidate.id === accountId)
  const name = account?.name ?? listings[0]?.account?.name ?? ''
  const image = Array.isArray(account?.images) ? (account!.images[0] as string | undefined) : undefined
  const totalPages = Math.ceil((data?.total_records ?? 0) / 20)
  return (
    <Layout className="py-10">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{name || '…'}</h1>
          {typeof account?.description === 'string' && account.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{account.description}</p>}
        </div>
      </div>
      {!isLoading && listings.length === 0 && <p className="mt-10 text-sm text-muted-foreground">This seller has no listings yet.</p>}
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map(listing => (
          <Link key={listing.id} to={`/l/${listing.slug || listing.id}`} className="group overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-square overflow-hidden bg-muted">{listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{listing.title}</h3>
              <p className="mt-1 text-sm font-bold text-coffee-accent">{listing.offer_price?.formatted}</p>
            </div>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button variant="outline" className="btn-secondary" disabled={page <= 1 || isFetching} onClick={() => setPage(value => value - 1)}>← Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" className="btn-secondary" disabled={page >= totalPages || isFetching} onClick={() => setPage(value => value + 1)}>Next →</Button>
        </div>
      )}
    </Layout>
  )
}
