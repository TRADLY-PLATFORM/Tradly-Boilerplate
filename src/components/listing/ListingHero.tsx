// Design-only: the whole body of a listing page (gallery, title, price, purchase controls, details, seller,
// related items). Sky Builder may regenerate this file for each site. It reads everything from `data` and renders
// `children` (the purchase controls) once. No fetching, state or API calls here: that lives in ListingDetailPage.
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import type { ListingHeroProps } from './listingHero.types'

export default function ListingHero({ data, children }: ListingHeroProps) {
  const main = data.images[data.activeImageIndex] ?? data.images[0]

  return (
    <div className="space-y-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-coffee-secondary/20 mb-3">
            {main ? (
              <img src={main} alt={data.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                {data.labels.noImage}
              </div>
            )}
          </div>
          {data.images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {data.images.slice(0, 6).map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => data.onSelectImage(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${index === data.activeImageIndex ? 'border-coffee-accent' : 'border-border'}`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{data.sellerName}</p>
            <h1 className="font-display text-2xl font-bold text-foreground leading-snug mb-2">{data.title}</h1>
            {data.rating && (
              <div className="flex items-center gap-1 text-yellow-500 text-sm mb-3">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-semibold">{data.rating.average.toFixed(1)}</span>
                <span className="text-muted-foreground text-xs">
                  ({data.rating.count} {data.labels.reviews})
                </span>
              </div>
            )}
          </div>

          {data.priceLabel && (
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-coffee-accent">{data.priceLabel}</span>
              {data.comparePriceLabel && (
                <span className="text-muted-foreground text-base line-through">{data.comparePriceLabel}</span>
              )}
              {data.discountLabel && (
                <Badge className="bg-destructive text-destructive-foreground text-xs">{data.discountLabel}</Badge>
              )}
            </div>
          )}

          {data.stockNote && (
            <p className={`text-sm font-semibold ${data.stockNote.tone === 'out' ? 'text-destructive' : 'text-yellow-600'}`}>
              {data.stockNote.text}
            </p>
          )}

          {data.donation && (
            <div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-coffee-accent rounded-full transition-all" style={{ width: `${data.donation.percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{data.donation.goalLabel}</p>
            </div>
          )}

          <Separator />

          {children}

        </div>
      </div>

      {(data.descriptionHtml || data.facts.length > 0) && (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {data.descriptionHtml && (
            <div className="md:col-span-2">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">{data.labels.aboutThisListing}</h2>
              <div
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.descriptionHtml }}
              />
            </div>
          )}
          {data.facts.length > 0 && (
            <div className={data.descriptionHtml ? '' : 'md:col-span-3'}>
              <h2 className="font-display text-lg font-bold text-foreground mb-3">{data.labels.details}</h2>
              <dl className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
                {data.facts.map((fact, index) => (
                  <div key={index} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-muted-foreground">{fact.label}</dt>
                    <dd className="text-right font-medium text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {data.seller && (
        <div>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">{data.labels.soldBy}</h2>
          <div className="flex max-w-md items-center gap-4 rounded-2xl border border-border bg-card p-4">
            {data.seller.avatar ? (
              <img src={data.seller.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coffee-secondary/30 font-display text-xl font-bold text-foreground">
                {data.seller.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground">{data.seller.name}</p>
              {data.seller.listingCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {data.seller.listingCount} {data.labels.listingsCount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {data.related.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">{data.labels.relatedTitle}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.related.map((item, index) => (
              <Link key={index} to={item.href} className="group block">
                <div className="aspect-square overflow-hidden rounded-xl bg-coffee-secondary/20">
                  {item.image && <img src={item.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm font-semibold text-coffee-accent">{item.priceLabel}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
