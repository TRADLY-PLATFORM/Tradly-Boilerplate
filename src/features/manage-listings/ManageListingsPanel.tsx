import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetMyAccountsQuery } from '@/state/accounts/api'
import { useDeleteListingMutation, useGetListingsQuery, useMarkListingSoldMutation, useUpdateListingMutation } from '@/state/listing/api'
import type { Listing } from '@/types/listing.types'

export default function ManageListingsPanel() {
  const userId = useAuthSelector(state => state.userId)
  const { data: accountsData, isLoading: accountsLoading, isError: accountsError } = useGetMyAccountsQuery(userId, { skip: !userId })
  const accountId = accountsData?.accounts?.[0]?.id
  const { data, isLoading, isError } = useGetListingsQuery(
    { page: 1, limit: 100, account_id: accountId },
    { skip: !accountId },
  )
  const [updateListing, updateState] = useUpdateListingMutation()
  const [deleteListing, deleteState] = useDeleteListingMutation()
  const [markSold, soldState] = useMarkListingSoldMutation()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const listings = useMemo(() => data?.listings ?? [], [data])

  const save = async (event: React.FormEvent<HTMLFormElement>, listing: Listing) => {
    event.preventDefault()
    setNotice(''); setError('')
    const values = new FormData(event.currentTarget)
    const response = await updateListing({
      id: listing.id,
      listing: {
        title: String(values.get('title') ?? '').trim(),
        description: String(values.get('description') ?? '').trim(),
        images: listing.images ?? [],
      },
    })
    if ('error' in response) setError('Could not update this listing. Please try again.')
    else { setEditingId(null); setNotice('Listing updated.') }
  }

  const remove = async (listing: Listing) => {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return
    setError(''); setNotice('')
    const response = await deleteListing(listing.id)
    if ('error' in response) setError('Could not delete this listing. Please try again.')
    else setNotice('Listing deleted.')
  }

  const markListingSold = async (listing: Listing) => {
    setError(''); setNotice('')
    const response = await markSold(listing.id)
    if ('error' in response) setError('Could not mark this listing as sold. Please try again.')
    else setNotice('Listing marked as sold.')
  }

  if (accountsLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading seller account…</p>
  if (accountsError) return <p role="alert" className="py-12 text-center text-sm text-destructive">Could not load your seller account.</p>
  if (!accountId) return <div className="rounded-2xl border border-border bg-card p-8 text-center"><p className="mb-4 text-muted-foreground">Create a seller account before managing listings.</p><Link className="text-sm font-semibold text-coffee-accent underline" to="/sell">Open Sell</Link></div>
  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading listings…</p>
  if (isError) return <p role="alert" className="py-12 text-center text-sm text-destructive">Could not load your listings.</p>

  return (
    <section className="space-y-4">
      {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm text-foreground">{notice}</p>}
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {listings.length === 0 ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">You have no listings yet. <Link className="font-medium text-coffee-accent underline" to="/sell">Create a listing</Link></div> : listings.map(listing => (
        <article key={listing.id} className="rounded-2xl border border-border bg-card p-5">
          {editingId === listing.id ? (
            <form className="space-y-3" onSubmit={event => void save(event, listing)}>
              <label className="block text-sm font-medium">Title<input name="title" required defaultValue={listing.title} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
              <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={listing.description ?? ''} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label>
              <div className="flex gap-2"><button disabled={updateState.isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{updateState.isLoading ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
            </form>
          ) : (
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                {listing.images?.[0] ? <img src={listing.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-muted" />}
                <div className="min-w-0"><h2 className="truncate font-semibold text-foreground">{listing.title}</h2><p className="mt-1 text-sm text-muted-foreground">{listing.order_type} · {listing.status === 1 ? 'Active' : 'Status ' + listing.status}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/listing/${listing.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm">View</Link>
                <button onClick={() => setEditingId(listing.id)} className="rounded-lg border border-border px-3 py-2 text-sm">Edit</button>
                <button disabled={soldState.isLoading} onClick={() => void markListingSold(listing)} className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50">Mark sold</button>
                <button disabled={deleteState.isLoading} onClick={() => void remove(listing)} className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive disabled:opacity-50">Delete</button>
              </div>
            </div>
          )}
        </article>
      ))}
    </section>
  )
}
