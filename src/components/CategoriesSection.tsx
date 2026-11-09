import { Link, useSearchParams } from 'react-router-dom'
import { useGetCategoriesQuery } from '@/state/categories/api'
import type { Category } from '@/types/category.types'

function categorySlug(cat: Category): string {
  return cat.slug ?? `${cat.id}-${String(cat.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

interface CategoriesSectionProps {
  /** Max number of categories to show (default 12) */
  limit?: number
  title?: string
  subtitle?: string
  /**
   * How the categories look. Every variant shows the same live categories with the same /lc/:slug links:
   * 'tiles' (default) round icon tiles in a grid; 'cards' wide cards with a small picture and an arrow;
   * 'list' numbered editorial rows; 'pills' a wrapping row of rounded links; 'mosaic' big picture tiles with the
   * name on top (the first one is wider); 'tabs' a row of filter tabs that sets ?category= on the current page.
   */
  variant?: CategoriesVariant
}

export type CategoriesVariant = 'tiles' | 'cards' | 'list' | 'pills' | 'mosaic' | 'tabs'

// Categories made through the API usually have no picture, so the fallback is the first letter on a tone of the
// site's own palette instead of one shared icon (which made every site's category strip look the same).
const TONES = [
  'bg-primary/15 text-primary',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-muted text-foreground',
]
const tone = (index: number) => TONES[index % TONES.length]
const initial = (cat: Category) => String(cat.name ?? '?').trim().charAt(0).toUpperCase() || '?'

/**
 * Fetches the top-level categories from the Tradly API and renders
 * a clickable grid. Each tile navigates to /lc/:slug.
 *
 * @sky:component categories — renders live category tiles from the API.
 * Use this component on any page that needs a category grid; do not
 * hardcode category data or hrefs.
 */
export default function CategoriesSection({ limit = 12, title, subtitle, variant = 'tiles' }: CategoriesSectionProps) {
  const { data, isLoading } = useGetCategoriesQuery({ page: 1, limit })
  const [searchParams, setSearchParams] = useSearchParams()
  const categories = data?.categories ?? []

  if (!isLoading && categories.length === 0) return null

  if (variant === 'tabs') {
    const active = searchParams.get('category') ?? ''
    const seen = new Set<string>()
    const tabs = categories.filter((cat) => {
      const key = String(cat.name).trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const choose = (id: string) => {
      const next = new URLSearchParams(searchParams)
      if (id) next.set('category', id)
      else next.delete('category')
      setSearchParams(next, { replace: true })
    }
    const tabClass = (on: boolean) =>
      `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${on ? 'border-coffee-accent bg-coffee-accent text-white' : 'border-border bg-card text-foreground hover:border-coffee-accent/50'}`
    return (
      <div role="tablist" aria-label="Categories" className="flex gap-2 overflow-x-auto pb-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-muted" />)
        ) : (
          <>
            <button type="button" role="tab" aria-selected={!active} className={tabClass(!active)} onClick={() => choose('')}>All</button>
            {tabs.map((cat) => (
              <button key={cat.id} type="button" role="tab" aria-selected={active === String(cat.id)} className={tabClass(active === String(cat.id))} onClick={() => choose(String(cat.id))}>
                {cat.name}
              </button>
            ))}
          </>
        )}
      </div>
    )
  }

  const shown = isLoading ? [] : categories.slice(0, limit)
  const heading = title && (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
  const count = (cat: Category) =>
    typeof cat.total_listings === 'number' ? <span className="text-xs text-muted-foreground">{cat.total_listings.toLocaleString()}</span> : null
  const skeleton = (cls: string) => Array.from({ length: Math.min(limit, 6) }).map((_, i) => <div key={i} className={`animate-pulse bg-muted ${cls}`} />)

  if (variant === 'pills') {
    return (
      <section>
        {heading}
        <div className="flex flex-wrap gap-2">
          {isLoading && skeleton('h-9 w-28 rounded-full')}
          {shown.map((cat) => (
            <Link key={cat.id} to={`/lc/${categorySlug(cat)}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (variant === 'list') {
    return (
      <section>
        {heading}
        <ol className="divide-y divide-border border-y border-border">
          {isLoading && skeleton('h-14 w-full')}
          {shown.map((cat, i) => (
            <li key={cat.id}>
              <Link to={`/lc/${categorySlug(cat)}`} className="group flex items-baseline gap-4 py-4 transition-colors hover:text-primary">
                <span className="w-8 shrink-0 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-xl font-semibold text-foreground group-hover:text-primary sm:text-2xl">{cat.name}</span>
                <span className="ml-auto flex items-center gap-3">
                  {count(cat)}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  if (variant === 'cards') {
    return (
      <section>
        {heading}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && skeleton('h-20 rounded-2xl')}
          {shown.map((cat, i) => (
            <Link key={cat.id} to={`/lc/${categorySlug(cat)}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-bold ${tone(i)}`}>{initial(cat)}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{cat.name}</span>
                {count(cat)}
              </span>
              <span aria-hidden="true" className="pr-2 text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (variant === 'mosaic') {
    return (
      <section>
        {heading}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {isLoading && skeleton('aspect-[4/3] rounded-2xl')}
          {shown.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/lc/${categorySlug(cat)}`}
              className={`group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl ${cat.image ? 'bg-muted' : tone(i)} ${i === 0 ? 'col-span-2' : ''}`}
            >
              {cat.image ? (
                <>
                  <img src={cat.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </>
              ) : (
                <span aria-hidden="true" className="absolute right-4 top-1 font-display text-7xl font-bold opacity-25">{initial(cat)}</span>
              )}
              <span className={`relative p-4 font-display text-lg font-semibold ${cat.image ? 'text-white' : ''}`}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      {heading}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            ))
          : shown.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/lc/${categorySlug(cat)}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-coffee-accent/40 hover:bg-coffee-secondary/30"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-xl font-bold ${tone(i)}`}>{initial(cat)}</span>
                )}
                <span className="text-sm font-medium text-foreground group-hover:text-coffee-accent">{cat.name}</span>
                {count(cat)}
              </Link>
            ))}
      </div>
    </section>
  )
}
