# AGENTS.md

This project is a commerce storefront (store, booking, marketplace, crowdfunding and similar)
built on the **Tradly API**. Tradly is the backend: listings, categories, accounts, cart,
checkout, orders, payments, schedules, reviews, subscriptions and more. When a user asks for a
feature, build it on Tradly's real endpoints. Never fake a backend with mock data, local JSON
or `localStorage` for data that Tradly stores.

## Stack

Vite + React + TypeScript + Tailwind. Data goes through the `tradly` SDK, wrapped in Redux
Toolkit Query. Routes live in `src/app/App.tsx`.

## Where the Tradly code lives

| Layer | Path | Role |
|---|---|---|
| SDK calls | `api/<domain>.ts` | Thin functions around `TradlySDK.app.*` / `TradlySDK.user.*` |
| Payload helpers | `api/sdk-context.ts` | `buildAppQueryPayload`, `buildAppMutationPayload`, `buildAppDirectPayload`, `buildSdkPayload` |
| Data hooks | `state/<domain>/api.ts` | RTK Query `createApi`; each `queryFn` reads `authKey` / `currency` / `language` from Redux |
| Store | `state/store.ts` | Every `createApi` must be registered (reducer + middleware) |
| Types | `types/<domain>.types.ts` | Response and param types |
| Flow guides | `flows/*.mdc` | How auth, cart, category, checkout and listing flows work. Read the matching one before changing a flow. |

Already wired: auth, listing, categories, cart, checkout, orders, addresses, payment methods,
shipping methods, schedules (bookings), commissions.

## Adding a feature that needs a new Tradly endpoint

1. **Find the endpoint** in `docs/tradly-api.md` (offline index of every documented endpoint,
   grouped by area). New APIs appear first on the live index at
   https://developer.tradly.app/llms.txt, so check there if nothing fits.
2. **Read its page**: `https://developer.tradly.app/<page>.md` (the page path is listed next to
   each endpoint) for query params, request body and response shape. Don't guess field names.
3. **Use an SDK method if one exists.** `TradlySDK.app` wraps ~190 calls beyond the ones used
   here, e.g. `getReviewList` / `addReview`, `applyCoupon` / `removeCoupon`, `getDonationsList`,
   `getSubscriptionList` / `subscribe`, `getCollection`, `getLayer`, `getTimeSlots`,
   `createSchedule`, `getVariants`, `getAccounts` / `followUnfollowAccounts`, `getWalletBalance`.
   Inspect `node_modules/tradly/Roots/App.js` for the exact name and params.
4. **Otherwise call it generically** with `TradlySDK.app.commonFuntion` (sic):
   ```ts
   (TradlySDK as any).app.commonFuntion({
     path: '/v1/reviews',          // exactly as documented
     Method: 'GET',                // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
     bodyParam: { page: 1 },       // query string, optional
     data: undefined,              // JSON body for POST/PUT/PATCH
     pkKey: AppConfig.pkKey, authKey, currency, language,
   })
   ```
   Use paths exactly as documented (e.g. `/v1/listings/{id}/schedules_per_day`). The old
   `/products/v1/...` prefix is deprecated; don't copy it from SDK internals.
5. **Add it the same way the existing modules are built**: a function in `api/<domain>.ts`, an RTK
   Query endpoint in `state/<domain>/api.ts` (new `createApi` → register it in `state/store.ts`),
   types in `types/`. Pages use the generated hooks only, never the SDK directly.

## Order types: booking, crowdfunding and the rest are already built in

Every listing has an `order_type`. It decides what the listing page and checkout do. **Booking,
event tickets and donations are not separate systems: they are listings with a different
`order_type`, and the detail page + checkout already handle them.** Read `flows/cart-flows.mdc`
(button per type) and `flows/checkout-flows.mdc` (schedule picker) before changing them.

| Site shape | `order_type` | What the user does | Already in this repo |
|---|---|---|---|
| Store / marketplace | `listings`, `digital` | Add to cart, check out | Listing page, cart, checkout |
| Booking, appointments | `appointments` | Sign in, pick a date + slot, pay | Slot picker in `CheckoutPage` (`state/schedules`), payload `schedule_start_at` / `schedule_end_at` |
| Events, tickets | `events` | Same as appointments, one event per cart | Same as above |
| Crowdfunding, donations | `donation` | Enter an amount, optionally give anonymously | Amount field + goal progress bar in `ListingDetailPage` (`listing.goal_price`, `raised_amount`), `custom_price` on add-to-cart |
| Enquiry-only listings | `information_listing` | Contact the seller, no cart | Branch exists in the flow guide |
| Reverse marketplace | `requests` | Buyer posts a need (sign-in required) | Branch exists in the flow guide |

Rules that follow from this:
- **Homepage and category pages must link into the real thing**: a booking site sends visitors to `/lc/:slug` or `/listing/:slug`, a fundraiser's CTA goes to a campaign at `/listing/:slug`. Do not add a made-up booking form or donate button on the homepage.
- A booking or donation listing only works if the listing itself has the right `order_type` (and schedules, or `goal_price`). Those are created by the seller in the Tradly dashboard, or via `POST /v1/listings`. This storefront has no listing-creation page.
- Never skip `clearCart` before adding an event, appointment or donation (see the flow guide).

### Endpoints behind these features

Checked against the live API (a protected endpoint answers 401 without a login, an unknown one 404).
"Docs" means it is in `docs/tradly-api.md`; "SDK only" means it is not in the public docs but the
SDK calls it.

| Purpose | Endpoint | Source | Wired here |
|---|---|---|---|
| Add to cart (incl. `custom_price` for donations) | `POST /v1/cart` | Docs | Yes (`api/cart.ts`) |
| Check out (incl. `schedule_start_at`, `schedule_end_at`, `anonymous_donation`) | `POST /v1/cart/checkout` | Docs | Yes (`api/checkout.ts`) |
| Available slots for a listing | `GET /v1/listings/{id}/schedules_per_day?start_at=&days=` | Docs | Yes (`api/schedules.ts`) |
| Seller sets a listing's schedule | `PUT /v1/listings/{id}/schedules` (SDK `createSchedule`) | SDK only | No |
| Time slot templates | `GET /v1/timeslots` (SDK `getTimeSlots`) | SDK only | No |
| Donations received by a listing | `GET /v1/orders/listings/donations?listing_id=` (SDK `getDonationsList`) | SDK only | No |
| My orders / order detail | `GET /v1/orders`, `GET /v1/orders/{id}` | Docs | Yes |
| Offer / bid on a listing | `POST /v1/listings/{id}/negotiations` | Docs | No |
| Reviews | `GET` / `POST /v1/reviews` | Docs | No |
| Coupons | `POST` / `DELETE /v1/cart/coupon` (SDK `applyCoupon`, `removeCoupon`) | SDK only | No |
| Subscriptions, memberships | `/v1/subscription_products`, `/v1/subscriptions/...`, Memberships section | Docs | No |

Notes for the endpoints that aren't wired: use `TradlySDK.app.commonFuntion` with the path above
if the SDK method looks broken. Two known problems in `tradly@1.2.14`: `getTimeSlots` builds a
bad URL (missing leading slash; fixed in the SDK source, not yet in a published version), and
`subscribe` issues a `GET` that the live API rejects with 405 (not fixed; use the Subscriptions
pages in the docs and `commonFuntion`).

## Who can call what

The storefront runs with the tenant's public `pkKey` plus the signed-in shopper's `authKey`.
Shopper and seller endpoints work from here. Admin-only operations (tenant settings, webhooks,
inventory operations, commission definitions and similar) belong in the Tradly dashboard, not in
the storefront UI. Tell the user that instead of building a page that will get 401/403.

## Layout rules

- `src/components/layout/Header.tsx` and `Footer.tsx` are **design-only** and may be regenerated.
  They read everything from the `data` prop (`LayoutData`). No hooks, state or API calls there.
  Header/footer logic belongs in `src/components/layout/useLayoutData.ts`.
- Links must point to routes that exist in `src/app/App.tsx`.
