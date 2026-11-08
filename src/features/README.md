# Reusable Tradly UI features

Feature modules use their registered RTK Query APIs. They can be composed into a page or a
layout when a generated marketplace needs them.

| Component | Purpose | Existing placement |
|---|---|---|
| `forms/DynamicTradlyForm` | Render fields and choices from a dashboard configured form; submit responses. | `/forms/:formId` |
| `comments/ListingComments` | List top level comments and replies; create, edit, remove, like and dislike comments. | Listing detail |
| `accounts/AccountFollowButton` | Follow or unfollow the listing's seller account. | Listing detail |
| `accounts/AccountBlockButton` | Block or unblock a seller account; loads the shopper's blocked-account feed to show the current state. | Listing detail |
| `discovery/MarketplaceFeed` | Home, activity and authenticated following feeds. | Homepage aggregator |
| `discovery/MarketplaceDiscoverySections` | Tags, collections and active promotions from Tradly. | Homepage aggregator |
| `manage-listings/ListingOptionsEditor` | Update/remove fixed or mix-and-match bundle rows and listing variants. | Protected `/manage-listings` |
| `home/HomeMarketplaceSections` | Stable homepage composition of the feed and discovery sections. | Homepage |
| `preferences/TenantPreferences` | Select tenant-supported language and currency for Tradly data requests, plus a saved default country for forms. | Account page |
| `pages/RentalOrderPage` | Dedicated rental reservation summary with order status, reference, room variant, dates, units and deposit. | Protected `/rental/orders/:id` |

## Account and saved-listing pages

| Page | Purpose | Route |
|---|---|---|
| `pages/SavedListingsPage` | View the signed-in shopper's liked listings and remove them from the saved list. | Protected `/saved-listings` |
| `pages/SellerAccountsPage` | Edit seller shop name and description, and activate or deactivate owned seller accounts. | Protected `/seller/accounts` |
| `pages/AccountPage` | Edit the shopper profile, show account shortcuts, and render `TenantPreferences`. | Protected `/account` |

`/collections/:collectionId` renders collection details and its listing data. Form definitions,
promotions, collections and tags are read from Tradly; admin authoring remains in the Tradly
dashboard. Bundle/variant changes are seller actions and remain inside the protected manager.
Routes and account-menu links are registered in `src/app/App.tsx` and
`src/components/layout/useLayoutData.ts`; `layout.config.ts` gates the saved-listing and seller
account links. Keep this file as the detailed reusable UI inventory and update it when adding or
moving feature pages or components.
