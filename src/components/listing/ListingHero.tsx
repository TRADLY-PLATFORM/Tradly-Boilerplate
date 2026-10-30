// Design-only: the top of a listing page (gallery, title, price, description). Sky Builder may regenerate this
// file for each site. It reads everything from `data` and renders `children` (the purchase controls) once.
// No hooks that fetch, no API calls, no navigation here: that logic lives in ListingDetailPage.
import { Star } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import type { ListingHeroProps } from './listingHero.types'

export default function ListingHero({ data, children }: ListingHeroProps) {
  const [mainImage, ...otherImages] = data.images

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-coffee-secondary/20 mb-3">
          {mainImage ? (
            <img src={mainImage} alt={data.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {data.labels.noImage}
            </div>
          )}
        </div>
        {otherImages.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {otherImages.slice(0, 4).map((image, index) => (
              <div key={index} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-border">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
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

        {data.descriptionHtml && (
          <>
            <Separator />
            <div>
              <h3 className="font-display text-base font-bold text-foreground mb-3">{data.labels.aboutThisListing}</h3>
              <div
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.descriptionHtml }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
