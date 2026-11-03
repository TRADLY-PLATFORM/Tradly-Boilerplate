// Platform contract for ListingHero. ListingDetailPage builds this from the listing and owns all purchase
// logic; ListingHero.tsx is design-only and may be regenerated. Add fields, never rename or remove them.
import type { ReactNode } from 'react'

export interface ListingHeroData {
  title: string
  sellerName: string
  /** Every image URL, main image first. Empty when the listing has none. */
  images: string[]
  /** null when nobody has reviewed the listing yet. */
  rating: { average: number; count: number } | null
  /** Current price, already formatted; null for listings that have no price (enquiry, video, requests). */
  priceLabel: string | null
  /** The price before a discount, formatted; null when there is no discount. */
  comparePriceLabel: string | null
  /** For example "20% off"; null when there is none. */
  discountLabel: string | null
  /** "out" or "low" stock notice; null when stock is fine. */
  stockNote: { tone: 'out' | 'low'; text: string } | null
  /** Funding progress for donation listings. */
  donation: { percent: number; goalLabel: string } | null
  /** HTML from the seller's description editor; render it with dangerouslySetInnerHTML. */
  descriptionHtml: string
  /** Index into `images` of the picture shown large; thumbnails call `onSelectImage(index)` to change it. */
  activeImageIndex: number
  onSelectImage: (index: number) => void
  /** Specifications as label/value pairs (category, SKU, availability, attributes). Empty when there are none. */
  facts: { label: string; value: string }[]
  /** The seller; null when unknown. `avatar` is '' when they have no picture. */
  seller: { name: string; avatar: string; listingCount: number } | null
  /** Other listings from the same category, already linked: `href` is an in-app path such as /listing/slug. */
  related: { title: string; href: string; image: string; priceLabel: string }[]
  /** Fixed UI words in the site's language. */
  labels: {
    noImage: string
    reviews: string
    aboutThisListing: string
    details: string
    soldBy: string
    relatedTitle: string
    listingsCount: string
  }
}

export interface ListingHeroProps {
  data: ListingHeroData
  /** The purchase controls (options, quantity, buttons). Render them exactly once, below the price. */
  children: ReactNode
}
