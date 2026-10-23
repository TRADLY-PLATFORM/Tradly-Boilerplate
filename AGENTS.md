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
     path: '/v1/reviews',          // documented path, see prefix rule below
     Method: 'GET',                // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
     bodyParam: { page: 1 },       // query string, optional
     data: undefined,              // JSON body for POST/PUT/PATCH
     pkKey: AppConfig.pkKey, authKey, currency, language,
   })
   ```
   **Path prefix rule:** endpoints under `/v1/listings`, `/v1/cart`, `/v1/orders`, `/v1/home`,
   `/v1/feeds` and `/v1/variant_types` are served as `/products/v1/...`
   (e.g. docs `/v1/listings/{id}/schedules_per_day` → `/products/v1/listings/{id}/schedules_per_day`).
   All other paths are used exactly as documented.
5. **Add it the same way the existing modules are built**: a function in `api/<domain>.ts`, an RTK
   Query endpoint in `state/<domain>/api.ts` (new `createApi` → register it in `state/store.ts`),
   types in `types/`. Pages use the generated hooks only, never the SDK directly.

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
