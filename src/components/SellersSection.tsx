import { Link } from 'react-router-dom'
import { useGetPublicAccountsQuery } from '@/state/accounts/api'

/**
 * Featured sellers: the store's public seller accounts (name, picture, number of listings), each linking to its
 * seller page (/s/:id). Renders nothing when there are none, so a template can always include it.
 */
export default function SellersSection({ title, subtitle, limit = 8, className = '' }: { title: string; subtitle?: string; limit?: number; className?: string }) {
  const { data, isLoading } = useGetPublicAccountsQuery()
  const sellers = (data?.accounts ?? []).filter(account => Number(account.total_listings ?? 0) > 0).slice(0, limit)
  if (isLoading || sellers.length === 0) return null
  return (
    <section className={`mt-16 ${className}`}>
      <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sellers.map(account => {
          const image = Array.isArray(account.images) ? (account.images[0] as string | undefined) : undefined
          return (
            <Link key={account.id} to={`/s/${account.id}`} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground group-hover:text-coffee-accent">{account.name}</p>
                <p className="text-xs text-muted-foreground">{Number(account.total_listings)} {Number(account.total_listings) === 1 ? 'listing' : 'listings'}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
