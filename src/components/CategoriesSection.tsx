import { Link } from 'react-router-dom'
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
}

/**
 * Fetches the top-level categories from the Tradly API and renders
 * a clickable grid. Each tile navigates to /lc/:slug.
 *
 * @sky:component categories — renders live category tiles from the API.
 * Use this component on any page that needs a category grid; do not
 * hardcode category data or hrefs.
 */
export default function CategoriesSection({ limit = 12, title, subtitle }: CategoriesSectionProps) {
  const { data, isLoading } = useGetCategoriesQuery({ page: 1, limit })
  const categories = data?.categories ?? []

  if (!isLoading && categories.length === 0) return null

  return (
    <section>
      {title && (
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            ))
          : categories.slice(0, limit).map((cat) => {
              const slug = categorySlug(cat)
              return (
                <Link
                  key={cat.id}
                  to={`/lc/${slug}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-coffee-accent/40 hover:bg-coffee-secondary/30"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                      🏷️
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground group-hover:text-coffee-accent">
                    {cat.name}
                  </span>
                  {typeof cat.total_listings === 'number' && (
                    <span className="text-xs text-muted-foreground">{cat.total_listings.toLocaleString()}</span>
                  )}
                </Link>
              )
            })}
      </div>
    </section>
  )
}
