# Reusable Tradly UI features

Feature modules use their registered RTK Query APIs. They can be composed into a page or a
layout when a generated marketplace needs them.

| Component | Purpose | Existing placement |
|---|---|---|
| `forms/DynamicTradlyForm` | Render fields and choices from a dashboard configured form; submit responses. | `/forms/:formId` |
| `comments/ListingComments` | List top level comments and replies; create, edit, remove, like and dislike comments. | Listing detail |
| `accounts/AccountFollowButton` | Follow or unfollow the listing's seller account. | Listing detail |
| `discovery/MarketplaceFeed` | Home, activity and authenticated following feeds. | Homepage aggregator |
| `discovery/MarketplaceDiscoverySections` | Tags, collections and active promotions from Tradly. | Homepage aggregator |
| `manage-listings/ListingOptionsEditor` | Update/remove fixed or mix-and-match bundle rows and listing variants. | Protected `/manage-listings` |
| `home/HomeMarketplaceSections` | Stable homepage composition of the feed and discovery sections. | Homepage |

`/collections/:collectionId` renders collection details and its listing data. Form definitions,
promotions, collections and tags are read from Tradly; admin authoring remains in the Tradly
dashboard. Bundle/variant changes are seller actions and remain inside the protected manager.
