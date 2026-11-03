// Platform logic for the listing page hero (never regenerated): which picture is selected, the related listings,
// and the facts and seller shown around the purchase controls. ListingHero.tsx only draws them.
import { useEffect, useState } from 'react'
import { useGetListingsQuery } from '@/state/listing/api'
import { locale } from '@/src/components/layout/locale'
import type { Listing } from '@/types/listing.types'
import type { ListingHeroData } from '@/src/components/listing/listingHero.types'

type Extras = Pick<
  ListingHeroData,
  'activeImageIndex' | 'onSelectImage' | 'facts' | 'seller' | 'related' | 'labels'
>

export function useListingHeroExtras(listing?: Listing) {
  const [imageIndex, setImageIndex] = useState(0)
  useEffect(() => setImageIndex(0), [listing?.id])
  const categoryId = Number(listing?.categories?.[0]?.id) || undefined
  const { data } = useGetListingsQuery(
    { page: 1, limit: 9, ...(categoryId ? { category_id: categoryId } : {}) },
    { skip: !listing?.id },
  )
  return { imageIndex, setImageIndex, relatedListings: data?.listings ?? [] }
}

export function buildHeroExtras(
  listing: Listing,
  orderType: string,
  showPrice: boolean,
  state: { imageIndex: number; setImageIndex: (index: number) => void; relatedListings: Listing[] },
): Extras {
  const t = locale.labels as Record<string, string>
  const attributeFacts = (listing.attributes ?? [])
    .filter((attribute) => attribute.visible !== false && Array.isArray(attribute.values) && attribute.values.length > 0)
    .slice(0, 6)
    .map((attribute) => ({
      label: attribute.name,
      value: attribute.values
        .map((value) =>
          typeof value === 'string' ? value : String((value as { value?: unknown })?.value ?? (value as { name?: unknown })?.name ?? ''),
        )
        .filter(Boolean)
        .join(', '),
    }))
    .filter((fact) => fact.value)
  const sellsStock = ['listings', 'digital'].includes(orderType)
  const facts = [
    ...(listing.categories?.length ? [{ label: t.factCategory, value: listing.categories.map((category) => category.name).join(', ') }] : []),
    ...(listing.sku ? [{ label: t.factReference, value: listing.sku }] : []),
    ...(sellsStock ? [{ label: t.factAvailability, value: listing.stock > 0 ? t.factInStock : t.outOfStock }] : []),
    ...attributeFacts,
  ]
  return {
    activeImageIndex: Math.min(state.imageIndex, Math.max(0, (listing.images?.length ?? 1) - 1)),
    onSelectImage: state.setImageIndex,
    facts,
    seller: listing.account
      ? { name: listing.account.name, avatar: listing.account.images?.[0] ?? '', listingCount: listing.account.total_listings ?? 0 }
      : null,
    related: state.relatedListings
      .filter((item) => item.id !== listing.id)
      .slice(0, 4)
      .map((item) => ({ title: item.title, href: `/listing/${item.slug}`, image: item.images?.[0] ?? '', priceLabel: item.offer_price?.formatted ?? '' })),
    labels: {
      noImage: t.noImage,
      reviews: t.reviews,
      aboutThisListing: t.aboutThisListing,
      details: t.details,
      soldBy: t.soldBy,
      relatedTitle: t.relatedTitle,
      listingsCount: t.listingsCount,
    },
  }
}
