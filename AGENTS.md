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
shipping methods, schedules (bookings), commissions, membership listings, bundles and product
variants.

## Adding a feature that needs a new Tradly endpoint

1. **Find the endpoint** in `docs/tradly-api.md` (offline index of every documented endpoint,
   grouped by area). New APIs appear first on the live index at
   https://developer.tradly.app/llms.txt, so check there if nothing fits.
2. **Read its page**: `https://developer.tradly.app/<page>.md` (the page path is listed next to
   each endpoint) for query params, request body and response shape. Don't guess field names.
3. **Prefer the documented API over the SDK.** The docs index is the source of truth; parts of the SDK are old (for example its feedback calls, `createFeedback` / `getFeedbackCategories` on `/v1/utils/feedback`, are superseded by Forms, below). If the docs have a newer endpoint for the job, use that, even when an SDK method exists for the old one. Otherwise **use an SDK method if one exists.** `TradlySDK.app` wraps ~190 calls beyond the ones used
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
| Product with variants | `listings` + Tradly variants | Choose an option, then add the selected variant to cart | Seller variant creation, buyer selection and variant stock/price |
| Membership program | `membership` | Join, then pay through checkout | Membership record and shipping-free checkout; this is not automatic recurring billing |
| Fixed or mix-and-match bundle | `listings` + listing `type: bundle` | Inspect bundle contents or choose from its pool, then add to cart | Seller composition, buyer selection and bundle stock check |
| Booking, appointments | `appointments` | Sign in, pick a date + slot, pay | Booking page `/booking/:slug` (`BookingListingPage`), slot picker + payload `schedule_start_at` / `schedule_end_at` carried into `CheckoutPage` (`state/schedules`) |
| Events, tickets | `events` | Same as appointments, one event per cart | Same as above; the booked date shows on `/booking/orders/:id` (`BookingOrderPage`) |
| Crowdfunding, donations | `donation` | Enter an amount, optionally give anonymously | Amount field + goal progress bar in `ListingDetailPage` (`listing.goal_price`, `raised_amount`), `custom_price` on add-to-cart |
| Enquiry-only listings | `information_listing` | Contact the seller, no cart | Branch exists in the flow guide |
| Reverse marketplace | `requests` | Buyer posts a need (sign-in required) | Branch exists in the flow guide |

Rules that follow from this:
- **Link to a listing only as `/listing/:slug`.** One site can sell products, appointments and events side by side, so never pick the route from the site type. `ListingDetailPage` checks each listing's `order_type` at runtime and sends `appointments` and `events` to `/booking/:slug`; `?view=standard` keeps the regular detail page available. Everything else (donations included) stays on `/listing/:slug`. Do not hard-code `/booking/...` links on the homepage or in cards.
- **Orders:** link to orders at `/orders/:id`. `OrderDetailPage` checks the returned order type at runtime and routes appointments/events to `/booking/orders/:id` (calendar view); `?view=standard` keeps the regular order detail available. Keep both routes.
- **Homepage and category pages must link into the real thing**: a booking site sends visitors to `/lc/:slug` or `/listing/:slug`, a fundraiser's CTA goes to a campaign at `/listing/:slug`. Do not add a made-up booking form or donate button on the homepage.
- A booking or donation listing only works if the listing itself has the right `order_type` (and schedules, or `goal_price`). Sellers create them on `/sell` (`SellPage`): the form takes the `order_type`, and for `appointments` and `events` it also takes dates, hours and slot capacity, saved through `createSchedule` (`api/schedules.ts`). Point any "Sell", "List your service" or "Host an event" link at `/sell`. Do not build a second listing form.
- Never skip `clearCart` before adding an event, appointment or donation (see the flow guide).

### Endpoints behind these features

Checked against the live API (a protected endpoint answers 401 without a login, an unknown one 404).
"Docs" means it is in `docs/tradly-api.md`; "SDK only" means it is not in the public docs but the
SDK calls it.

| Purpose | Endpoint | Source | Wired here |
|---|---|---|---|
| Add to cart (incl. `custom_price` for donations) | `POST /v1/cart` | Docs | Yes (`api/cart.ts`) |
| Listing variants | `/v1/variant_types`, `/v1/listings/{id}/variants` | Docs | Yes (`api/variants.ts`, `state/variants/`) |
| Fixed and mix-and-match bundle components, choices and stock | `/v1/bundles/{id}/items`, `/pool`, `/stock`, `/select`, `/selections/{id}` | Docs | Yes (`api/bundles.ts`, `state/bundles/`) |
| Membership list and creation | `GET` / `POST /v1/memberships` | Docs | Yes (`api/memberships.ts`, `state/memberships/`) |
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

## Forms: contact, enquiry, lead capture, applications, waitlists, surveys, feedback

Tradly has a generic **Forms API**. One mechanism covers contact forms, "request a quote", lead
capture, seller or partner applications, waitlists, event sign-ups, surveys and customer feedback.
Use it instead of inventing a backend or posting to a third-party service. **The SDK has no Forms
calls**, so go through `commonFuntion` (see above) with the documented paths.

How it works:
1. A form (title, slug, status, and its fields) is created by an admin in the Tradly dashboard
   (`POST /v1/forms`, admin only). Each field is an **attribute** (`attribute_id`, `required`,
   `order_by`), so a form's fields and choices come from the Attributes API.
2. The storefront reads the form: `GET /v1/forms/{id or slug}` returns the fields and choices. Render
   the inputs from that response, don't hard-code them, so the dashboard stays in control.
3. The visitor submits: `POST /v1/forms/{form_id}/submissions` with
   `{ attribute_values: [{ attribute_id, values: [...] }], metadata?: {...} }`.
4. The owner reads responses in the dashboard (`GET /v1/forms/{form_id}/submissions`,
   `GET /v1/forms/submissions/{submission_id}`).

Rules:
- Check `GET /v1/forms` (filter `status=active`) for an existing form before asking the user to
  create one. If none fits, tell them to create it in the dashboard and which fields to add.
- Build a reusable `FormPage` / `DynamicForm` component and an RTK Query endpoint in
  `state/forms/api.ts` (register it in `state/store.ts`). Link to it from the header, footer or
  homepage only once the route exists in `src/app/App.tsx`.
- Submitting needs the same `pkKey` + `authKey` context as everything else, so a signed-out visitor
  may be asked to sign in first. Check the response; if it is 401, show the sign-in route.
- Full page details: `https://developer.tradly.app/forms/submit-form.md` and its neighbours in the
  Forms section of `docs/tradly-api.md`.

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

## Keeping features safe from homepage regeneration

Sky Builder rewrites `src/pages/HomePage.tsx`, `src/index.css`, `src/components/layout/Header.tsx`,
`Footer.tsx`, `locale.ts` (non-English sites) and `src/brand.ts` for every new site, and may redo them
from a prompt later. Nothing else is rewritten at signup, so a feature must never depend on those files.

- **Where feature code goes.** Layers are in "Where the Tradly code lives". Put a feature's hooks and
  components in `src/features/<feature>/` and its route in `src/pages/<Feature>Page.tsx`. Split a page by
  listing type (for example `src/features/sell/`) instead of growing one file.
- **HomePage only composes.** It reads listings and categories and links out. It must not import from
  `src/features/`, call a feature's API or need new props. Keep its default export.
- **Reach the UI through `useLayoutData`.** Give a new page a `navLinks`, `accountMenuLinks` or
  `footerLinkGroups` entry there, and gate it with a flag in `layout.config.ts` (for example
  `features.rental`) so sites without it show no dead link. The regenerated header and footer render
  those lists, so they never need to know about a feature.
- **Contracts the generator relies on.** `LayoutData` may gain fields; never rename or remove one. New
  words go in `locale.labels`, never hard-coded English (new labels are translated automatically). Keep
  the routes `/listing/:slug`, `/sell` and `/account`, and send other listing types from
  `/listing/:slug` to their own route (`/booking/:slug` today, `/rental/:slug` for rentals).
- **Style with theme tokens.** Use the Tailwind theme classes and CSS variables from `index.css`, never
  fixed colors or fonts, so a restyle carries over to feature pages.
- **Tenant data may be missing.** A new tenant can have no categories, currency or rental settings.
  Show an empty state, never block a form on it, and read the currency from the tenant.
- **Mock tests with the API's real values.** Mocks keyed on invented values hide bugs: the
  `'account'` / `'accounts'` bug passed the e2e mocks.

## Language and direction

The site's language, text direction and fixed UI words live in `src/components/layout/locale.ts`
(`locale.language`, `locale.dir`, `locale.labels`). `src/main.tsx` applies `lang` and `dir` to the
document. When you add or change visible text, write it in that language, and put any new fixed word
(a button or menu label used in several places) in `locale.labels` instead of hard-coding English.
When `locale.dir` is `'rtl'`, use logical Tailwind classes (`ms-*`, `me-*`, `ps-*`, `pe-*`,
`text-start`, `text-end`, `start-*`, `end-*`), not `ml-*`, `mr-*`, `text-left`, `left-*`.

## Categories

Ask the API for categories with its own type names: `type: 'listings'` or `type: 'accounts'`. The singular
`'listing'` and `'account'` return an empty list. A category is optional when creating a seller account
or a listing, and a new tenant may have no account categories, so never block a form on one. Send
`category_id` only when the user picked one.
