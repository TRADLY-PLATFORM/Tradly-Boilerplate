import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetActivityFeedQuery, useGetFollowingAccountsQuery, useGetFollowingFeedQuery, useGetHomeFeedQuery } from '@/state/social/api'
import { locale } from '@/src/components/layout/locale'

type Row = Record<string, unknown>
const list = (data: Row | undefined): Row[] => {
  if (!data) return []
  for (const key of ['listings', 'activities', 'feeds', 'items', 'accounts']) if (Array.isArray(data[key])) return data[key] as Row[]
  const nested = data.data as Row | undefined
  if (nested) return list(nested)
  return []
}
const text = (row: Row, keys: string[]) => {
  for (const key of keys) if (typeof row[key] === 'string' || typeof row[key] === 'number') return String(row[key])
  return ''
}
type FeedMode = 'home' | 'activity' | 'following' | 'accounts'

export default function MarketplaceFeed() {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const [mode, setMode] = useState<FeedMode>('home')
  const home = useGetHomeFeedQuery({ page: 1 }, { skip: mode !== 'home' })
  const activities = useGetActivityFeedQuery({ page: 1 }, { skip: mode !== 'activity' })
  const following = useGetFollowingFeedQuery({ page: 1, type: 'listings' }, { skip: !isAuthenticated || mode !== 'following' })
  const accounts = useGetFollowingAccountsQuery({ page: 1 }, { skip: !isAuthenticated || mode !== 'accounts' })
  const active = mode === 'home' ? home : mode === 'activity' ? activities : mode === 'following' ? following : accounts
  const rows = list(active.data as Row | undefined)
  const modes: FeedMode[] = ['home', 'activity', ...(isAuthenticated ? ['following', 'accounts'] as FeedMode[] : [])]
  const labels: Record<FeedMode, string> = { home: locale.labels.homeFeed, activity: locale.labels.activityFeed, following: locale.labels.followingFeed, accounts: locale.labels.followingAccounts }
  return <section className="my-10" aria-labelledby="market-feed-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="market-feed-title" className="font-display text-2xl font-bold text-foreground">{locale.labels.marketplaceFeed}</h2><p className="mt-1 text-sm text-muted-foreground">{locale.labels.feedDescription}</p></div><div className="flex flex-wrap gap-2">{modes.map(item => <button key={item} type="button" aria-pressed={item === mode} onClick={() => setMode(item)} className={`rounded-full border px-3 py-1.5 text-sm ${item === mode ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground'}`}>{labels[item]}</button>)}</div></div>
    {!isAuthenticated && mode !== 'home' && mode !== 'activity' ? <p className="mt-4 text-sm text-muted-foreground">{locale.labels.feedSignIn}</p> : active.isLoading ? <p className="mt-4 text-sm text-muted-foreground">{locale.labels.feedLoading}</p> : active.isError ? <p role="alert" className="mt-4 text-sm text-destructive">{locale.labels.feedError}</p> : rows.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.slice(0, 6).map((row, index) => {
      const id = text(row, ['id', 'listing_id', 'account_id'])
      const slug = text(row, ['slug', 'listing_slug'])
      const title = text(row, ['title', 'name', 'message', 'description']) || locale.labels.feedItem
      const image = text(row, ['image', 'image_url', 'featured_image'])
      const route = slug && (row.listing_id != null || row.order_type != null || row.type === 'listings') ? `/l/${slug}` : undefined
      const content = <><div className="flex items-center gap-3">{image && <img src={image} alt="" className="h-12 w-12 rounded-lg object-cover" />}<div className="min-w-0"><h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{text(row, ['account_name', 'user_name', 'created_at'])}</p></div></div></>
      return route ? <Link key={id || index} to={route} className="rounded-xl border border-border bg-card p-4 hover:border-primary">{content}</Link> : <article key={id || index} className="rounded-xl border border-border bg-card p-4">{content}</article>
    })}</div> : <p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{locale.labels.feedEmpty}</p>}
  </section>
}
