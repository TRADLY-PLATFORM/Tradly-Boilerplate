import MarketplaceDiscoverySections from '@/src/features/discovery/MarketplaceDiscoverySections'
import MarketplaceFeed from '@/src/features/discovery/MarketplaceFeed'
import DonationSpotlight from '@/src/features/home/DonationSpotlight'

/** Stable homepage extension point for visitor discovery and social features. */
export default function HomeMarketplaceSections() {
  return <div className="mt-14 space-y-14"><DonationSpotlight /><MarketplaceFeed /><MarketplaceDiscoverySections /></div>
}
