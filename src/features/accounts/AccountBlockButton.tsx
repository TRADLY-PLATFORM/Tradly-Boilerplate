import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useBlockAccountMutation, useGetBlockedAccountsQuery, useUnblockAccountMutation } from '@/state/accounts/api'
import { locale } from '@/src/components/layout/locale'

export default function AccountBlockButton({ accountId, ownerUserId }: { accountId: number | string; ownerUserId?: string }) {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const userId = useAuthSelector(state => state.userId)
  const blockedQuery = useGetBlockedAccountsQuery({ page: 1 }, { skip: !isAuthenticated })
  const [block, blockState] = useBlockAccountMutation()
  const [unblock, unblockState] = useUnblockAccountMutation()
  const [error, setError] = useState(false)
  if (ownerUserId && userId && String(ownerUserId) === String(userId)) return null
  if (!isAuthenticated) return <Link to={`/sign-in?next=${encodeURIComponent(window.location.pathname)}`} className="inline-flex rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground">{locale.labels.blockSeller}</Link>

  const isBlocked = (blockedQuery.data?.accounts ?? []).some(account => String(account.id) === String(accountId))
  const isBusy = blockState.isLoading || unblockState.isLoading
  const toggle = async () => {
    setError(false)
    const result = isBlocked ? await unblock(accountId) : await block(accountId)
    if ('error' in result) setError(true)
  }

  return <div className="flex flex-col items-start gap-1">
    <button type="button" disabled={isBusy || blockedQuery.isLoading || blockedQuery.isError} onClick={() => void toggle()} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50">{isBusy ? locale.labels.followUpdating : isBlocked ? locale.labels.unblockSeller : locale.labels.blockSeller}</button>
    {blockedQuery.isError && <span role="alert" className="text-xs text-destructive">{locale.labels.blockSellerError}</span>}
    {error && <span role="alert" className="text-xs text-destructive">{locale.labels.blockSellerError}</span>}
    {isBlocked && <span className="text-xs text-muted-foreground">{locale.labels.blockedSeller}</span>}
  </div>
}
