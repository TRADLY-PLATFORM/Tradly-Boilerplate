import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetMyAccountsQuery, usePatchAccountMutation, useUpdateAccountMutation } from '@/state/accounts/api'
import type { SellerAccount } from '@/api/accounts'
import { Button } from '@/src/components/ui/button'
import { locale } from '@/src/components/layout/locale'

function SellerAccountCard({ account }: { account: SellerAccount }) {
  const [updateAccount, updateState] = useUpdateAccountMutation()
  const [patchAccount, patchState] = usePatchAccountMutation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const active = account.active !== false

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const values = new FormData(event.currentTarget)
    const result = await updateAccount({ accountId: account.id, account: {
      name: String(values.get('name') ?? '').trim(),
      description: String(values.get('description') ?? '').trim(),
      ...(Array.isArray(account.category_id) ? { category_id: account.category_id } : {}),
    } })
    if ('error' in result) setError(locale.labels.sellerAccountUpdateError)
    else setMessage(locale.labels.sellerAccountUpdated)
  }

  const toggleActive = async () => {
    setMessage('')
    setError('')
    const result = await patchAccount({ accountId: account.id, active: !active })
    if ('error' in result) setError(locale.labels.sellerAccountStatusError)
    else setMessage(locale.labels.sellerAccountStatusUpdated)
  }

  return <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-foreground">{account.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{active ? locale.labels.sellerAccountActive : locale.labels.sellerAccountInactive}</span></div>
    {message && <p role="status" className="mb-3 text-sm text-foreground">{message}</p>}
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <form onSubmit={event => void save(event)} className="space-y-4">
      <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{locale.labels.sellerAccountName}</span><input name="name" required maxLength={100} defaultValue={account.name} className="h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{locale.labels.sellerAccountDescription}</span><textarea name="description" maxLength={2000} rows={3} defaultValue={account.description ?? ''} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={updateState.isLoading} className="btn-hero">{updateState.isLoading ? locale.labels.savingChoices : locale.labels.save}</Button><Button type="button" variant="outline" disabled={patchState.isLoading} onClick={() => void toggleActive()}>{active ? locale.labels.sellerAccountDeactivate : locale.labels.sellerAccountReactivate}</Button></div>
    </form>
  </article>
}

export default function SellerAccountsPage() {
  const userId = useAuthSelector(state => state.userId)
  const { data, isLoading, isError } = useGetMyAccountsQuery(userId, { skip: !userId })
  const accounts = data?.accounts ?? []
  return <Layout>
    <header className="mb-7"><h1 className="font-display text-2xl font-bold text-foreground">{locale.labels.sellerAccounts}</h1><p className="mt-1 text-sm text-muted-foreground">{locale.labels.sellerAccountsDescription}</p></header>
    {isLoading ? <p role="status" className="py-16 text-center text-sm text-muted-foreground">{locale.labels.feedLoading}</p>
      : isError ? <p role="alert" className="py-16 text-center text-sm text-destructive">{locale.labels.sellerAccountsError}</p>
      : accounts.length === 0 ? <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">{locale.labels.sellerAccountsEmpty}</div>
      : <div className="grid gap-5 lg:grid-cols-2">{accounts.map(account => <SellerAccountCard key={account.id} account={account} />)}</div>}
  </Layout>
}
