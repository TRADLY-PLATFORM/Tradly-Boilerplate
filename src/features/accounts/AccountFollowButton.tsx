import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useFollowAccountMutation, useGetAccountDetailQuery, useUnfollowAccountMutation } from '@/state/accounts/api'
import { locale } from '@/src/components/layout/locale'

const followingKeys = ['is_following', 'following', 'followed', 'is_followed']
export default function AccountFollowButton({ accountId, initialFollowing: listingFollowing }: { accountId: string | number; initialFollowing?: boolean }) {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const { data } = useGetAccountDetailQuery(accountId, { skip: !accountId })
  const account = data?.account && typeof data.account === 'object' ? data.account as Record<string, unknown> : data
  const initial = listingFollowing ?? Boolean(followingKeys.some(key => account?.[key] === true || account?.[key] === 1))
  const [following, setFollowing] = useState<boolean | undefined>()
  const [follow, followState] = useFollowAccountMutation()
  const [unfollow, unfollowState] = useUnfollowAccountMutation()
  const [error, setError] = useState(false)
  const isFollowing = following ?? initial
  const toggle = async () => {
    setError(false)
    if (!isAuthenticated) return
    const result = isFollowing ? await unfollow(accountId) : await follow(accountId)
    if ('error' in result) setError(true)
    else setFollowing(!isFollowing)
  }
  if (!isAuthenticated) return <Link to={`/sign-in?next=${encodeURIComponent(window.location.pathname)}`} className="inline-flex rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground">{locale.labels.followToConnect}</Link>
  return <div className="inline-flex flex-col items-start gap-1"><button type="button" disabled={followState.isLoading || unfollowState.isLoading} onClick={() => void toggle()} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50">{followState.isLoading || unfollowState.isLoading ? locale.labels.followUpdating : isFollowing ? locale.labels.unfollow : locale.labels.follow}</button>{error && <span role="alert" className="text-xs text-destructive">{locale.labels.followError}</span>}</div>
}
