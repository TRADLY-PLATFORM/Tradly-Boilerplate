import { useMemo, useState } from 'react'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetMyAccountsQuery } from '@/state/accounts/api'
import { useGetListingsQuery } from '@/state/listing/api'
import { useGetDonationsListQuery } from '@/state/orders/api'
import { useGetEarningsQuery, useGetTransactionsQuery } from '@/state/transactions/api'

type Row = Record<string, unknown>

function rowsFrom(value: Record<string, unknown> | undefined, candidates: string[]): Row[] {
  if (!value) return []
  for (const key of candidates) if (Array.isArray(value[key])) return value[key] as Row[]
  return []
}

function label(row: Row, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' || typeof value === 'number') return String(value)
  }
  return fallback
}

function DataList({ title, items, empty }: { title: string; items: Row[]; empty: string }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold text-foreground">{title}</h2>{items.length ? <ul className="divide-y divide-border">{items.map((item, index) => <li key={label(item, ['id', 'order_id', 'reference'], `${title}-${index}`)} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-foreground">{label(item, ['title', 'name', 'order_reference', 'transaction_type', 'type'], `${title} ${index + 1}`)}</span><span className="text-muted-foreground">{label(item, ['formatted_amount', 'formatted', 'amount', 'total'], '')}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}</section>
}

export default function SellerInsightsPanel() {
  const userId = useAuthSelector(state => state.userId)
  const { data: accountsData, isLoading: accountsLoading, isError: accountsError } = useGetMyAccountsQuery(userId, { skip: !userId })
  const account = accountsData?.accounts?.[0]
  const accountId = account?.id
  const { data: listingData } = useGetListingsQuery({ page: 1, limit: 100, account_id: accountId }, { skip: !accountId })
  const listings = listingData?.listings ?? []
  const [selectedListing, setSelectedListing] = useState('')
  const listingId = selectedListing || String(listings[0]?.id ?? '')
  const { data: earningsData, isLoading: earningsLoading, isError: earningsError } = useGetEarningsQuery({ super_type: 2, account_id: accountId }, { skip: !accountId })
  const { data: transactionData, isLoading: transactionsLoading, isError: transactionsError } = useGetTransactionsQuery({ super_type: 2, account_id: accountId, page: 1 }, { skip: !accountId })
  const { data: donationData, isLoading: donationsLoading } = useGetDonationsListQuery({ listingId }, { skip: !listingId })
  const earnings = useMemo(() => rowsFrom(earningsData, ['earnings', 'transactions', 'records']), [earningsData])
  const transactions = useMemo(() => rowsFrom(transactionData, ['transactions', 'records']), [transactionData])
  const donations = useMemo(() => rowsFrom(donationData, ['donations', 'orders', 'records']), [donationData])

  if (accountsLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading seller account…</p>
  if (accountsError) return <p role="alert" className="py-12 text-center text-sm text-destructive">Could not load your seller account.</p>
  if (!accountId) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Create a seller account to view sales and earnings.</div>

  return <div className="space-y-5">
    {account?.name && <p className="text-sm text-muted-foreground">Seller account: <span className="font-medium text-foreground">{account.name}</span></p>}
    {(earningsError || transactionsError) && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Some seller reports could not be loaded.</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      {earningsLoading ? <p className="text-sm text-muted-foreground">Loading earnings…</p> : <DataList title="Earnings" items={earnings} empty="No earnings were returned for this account." />}
      {transactionsLoading ? <p className="text-sm text-muted-foreground">Loading transactions…</p> : <DataList title="Transactions" items={transactions} empty="No transactions were returned for this account." />}
    </div>
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-foreground">Donations received</h2>{listings.length > 1 && <label className="text-sm text-muted-foreground">Listing<select value={listingId} onChange={event => setSelectedListing(event.target.value)} className="ms-2 rounded-lg border border-input bg-background px-3 py-2 text-foreground">{listings.map(listing => <option key={listing.id} value={listing.id}>{listing.title}</option>)}</select></label>}</div>
      {donationsLoading ? <p className="text-sm text-muted-foreground">Loading donations…</p> : donations.length ? <ul className="divide-y divide-border">{donations.map((donation, index) => <li key={label(donation, ['id', 'order_id'], `donation-${index}`)} className="flex justify-between gap-3 py-3 text-sm"><span>{label(donation, ['donor_name', 'name', 'order_reference'], `Donation ${index + 1}`)}</span><span className="text-muted-foreground">{label(donation, ['formatted_amount', 'amount', 'total'], '')}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{listingId ? 'No donation records were returned for this listing.' : 'You have no listings yet.'}</p>}
    </section>
  </div>
}
