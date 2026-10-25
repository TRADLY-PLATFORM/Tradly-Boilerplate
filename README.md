# Tradly Boilerplate

A production-ready foundation for building marketplace apps powered by the [Tradly](https://tradly.app) platform. Handles auth, listings, and cart out of the box — with full caching, state sync, and SDK wiring already done.

**Duplicate this repo for each new project. Do not modify it in place.**

---

## What's included

| Domain | Capabilities |
|---|---|
| **Auth** | Sign in (email + phone), sign up, OTP verify, resend OTP, forgot password, set password, social sign-in (Google/Facebook/Apple), token refresh, logout |
| **Listings** | List with filters/pagination, listing detail, like/unlike (optimistic), `in_cart` sync |
| **Cart** | Get cart, add to cart, delete item, clear cart, guest cart (UUID), multi-seller conflict (error 480/489) |
| **Order types** | `listings`, `events`, `appointments`, `donation`, `digital`, `information_listing`, `video_listing`, `requests` — each with the correct cart flow |
| **Booking** | Seller schedule creation, buyer date/time selection, checkout schedule selection, and a booking calendar in the order view |

### Booking page routes

Booking screens are separate routes, so generated storefronts can choose the booking-specific pages while keeping the standard pages available:

- `/listing/:slug` — standard listing details; event and appointment actions open the booking flow.
- `/booking/:slug` — booking details with available dates and time slots before checkout.
- `/orders/:id` — standard order route; scheduled orders open the booking calendar based on their order type. Add `?view=standard` to force standard details.
- `/booking/orders/:id` — order details with the booked date highlighted on a calendar.

Change the route elements in `src/app/App.tsx` or point generated links at the route that matches the storefront design. The standard listing and order pages remain available.

---

## Stack

- **RTK Query** — data fetching, caching, and cache invalidation
- **Redux Toolkit** — global state (auth + app settings)
- **redux-persist** — auth and app slices persisted to localStorage
- **Tradly JS SDK** — all marketplace API calls

---

## Quick Start

### 1. Install dependencies

```bash
npm install @reduxjs/toolkit react-redux redux-persist tradly
npm install -D typescript @types/react @types/react-dom
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Tradly workspace values:

```bash
cp .env.example .env.local
```

```env
VITE_TRADLY_DOMAIN=your-workspace.tradly.co
VITE_TRADLY_PK_KEY=your-public-key
VITE_TRADLY_PUBLISHABLE_KEY=your-public-key
VITE_TRADLY_BASE_URL=https://api.tradly.app
VITE_TRADLY_ENV=production
VITE_DEFAULT_CURRENCY=USD
VITE_DEFAULT_LANGUAGE=en
```

Get your domain and public key from the [Tradly Dashboard](https://tradly.app/dashboard).

## End-to-end checks

This repo uses [TesterArmy e2e](https://github.com/tester-army/e2e). The contract suite covers every exported API wrapper, both payment URL routes, and every RTK Query endpoint, checking the SDK HTTP method and path each operation dispatches. It also scans the source for newly added wrappers or RTK endpoints, so the coverage check fails if one is added without a test mapping. Browser flows cover listing publishing, booking slot selection and checkout handoff, the booking calendar order view, storefront requests, and protected order redirects.

```bash
pnpm install
pnpm exec e2e-web install chromium
pnpm test:e2e
pnpm test:api
```

`pnpm test:api` runs the SDK response and error handling checks without launching a browser. Set `APP_URL` to test a running preview or deployed site instead of starting the local Vite server. The E2E suite uses no AI model; it checks browser responses and page navigation directly.

To probe every SDK route against a real Tradly workspace, configure `.env` with a dedicated sandbox domain, public key, and `VITE_TRADLY_ENV=sandbox`, then run:

```bash
E2E_RUN_LIVE_API_ENDPOINTS=1 pnpm test:e2e
```

The live probes use synthetic IDs, invalid credentials, and invalid payloads to avoid creating or changing commerce records. They check that each SDK route receives an HTTP response below 500. The contract suite is the check for exact method and path; a successful live business operation needs valid test account and record fixtures, which those probes intentionally do not supply.

### 3. Wrap your app with the store

```tsx
// app/layout.tsx (Next.js) or main.tsx (Vite)
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/state/store'

export default function RootLayout({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
```

### 4. Add the app initializer

Run token refresh on every page load so the auth session stays valid:

```tsx
// components/AppInitializer.tsx
import { useEffect, useState } from 'react'
import { useRefreshAuthMutation } from '@/state/auth/api'
import { useAuthSelector } from '@/state/auth/selectors'

export function AppInitializer({ children }) {
  const [ready, setReady] = useState(false)
  const [refreshAuth] = useRefreshAuthMutation()
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) await refreshAuth()
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return <SplashScreen />
  return <>{children}</>
}
```

---

## Project Structure

```
tradly-boilerplate/
│
├── api/                        # Raw SDK wrappers — no state, no side effects
│   ├── sdk-context.ts          # Four payload builders for the Tradly SDK
│   ├── auth.ts                 # TradlySDK.user.* wrappers
│   ├── listing.ts              # getListings / getListingDetail / like / unlike
│   └── cart.ts                 # getCarts / addToCart / deleteFromCart / clearCart
│
├── state/                      # RTK Query APIs + Redux slices
│   ├── store.ts                # configureStore — all reducers + middleware
│   ├── auth/
│   │   ├── api.ts              # All auth mutations
│   │   ├── slice.ts            # isAuthenticated, authKey, tokens, cookies
│   │   └── selectors.ts        # useAuthSelector
│   ├── listing/
│   │   ├── api.ts              # getListings, getListingDetail, like, unlike
│   │   └── selectors.ts        # Cache-only reads — no extra fetches
│   ├── cart/
│   │   ├── api.ts              # getCart, addToCart, deleteCartItem, clearCart
│   │   └── selectors.ts        # useCartItems, useCartSummary, useCartItemCount
│   └── app/
│       └── slice.ts            # currency, language (persisted)
│
├── config/
│   ├── app.config.ts           # Domain, pkKey, env, defaults
│   └── uuid.ts                 # Guest cart UUID (persisted to localStorage)
│
├── types/
│   ├── auth.types.ts           # All auth input/response/state types
│   ├── listing.types.ts        # Listing, Category, Money, RatingData, etc.
│   ├── cart.types.ts           # CartItem, CartSummary, AddToCartInput, etc.
│   └── index.ts                # Re-exports all types
│
└── flows/                      # AI-assisted implementation guides (.mdc)
    ├── project-setup.mdc       # Architecture, wiring, anti-patterns
    ├── auth-flows.mdc          # Every auth screen with full code examples
    ├── listing-flows.mdc       # List, detail, like/unlike, order_type branching
    └── cart-flows.mdc          # All 8 order types — add, delete, clear
```

---

## Architecture

Three layers — components never call the SDK directly:

```
Component
  → RTK Query hooks  (state/*/api.ts)
      → SDK wrappers  (api/*.ts)
          → TradlySDK
```

**Four SDK payload builders** (`api/sdk-context.ts`):

| Builder | Used for |
|---|---|
| `buildSdkPayload` | Auth — `TradlySDK.user.*` |
| `buildAppQueryPayload` | Listing/cart reads — adds `bodyParam` |
| `buildAppMutationPayload` | Cart writes — wraps in `data: {}` |
| `buildAppDirectPayload` | Flat params — like/unlike, listing detail |

---

## Caching

| Cache | Lifetime | Invalidated by |
|---|---|---|
| Listing list | 5 min | addToCart, deleteCartItem, clearCart, sign-in, logout |
| Listing detail | 5 min | Same as above |
| Like / unlike | Optimistic — instant, no re-fetch | Rolled back on API error |
| Cart | Until mutation | addToCart, deleteCartItem, clearCart |

Sign-in and logout automatically flush both listing and cart caches so guest/user data never bleeds across sessions.

---

## Order Types

Every listing has an `order_type` field that determines the CTA and cart flow:

| `order_type` | CTA | Auth required | Cart behaviour |
|---|---|---|---|
| `listings` | Add to Cart / Buy Now | No | Multi-item ok |
| `digital` | Buy Now | No | Multi-item ok |
| `events` | Book Now | Yes | Clear cart first |
| `appointments` | Book Appointment | Yes | Clear cart first |
| `donation` | Fund Now | No | Clear cart first + `custom_price` |
| `information_listing` | Contact / Enquire | No | No cart |
| `video_listing` | Watch / Subscribe | No | No cart |
| `requests` | Submit Request | Yes | No cart — reverse marketplace |

---

## Flow Guides

The `flows/` directory contains `.mdc` guides for Cursor and AI-assisted editors. Open them for copy-paste-ready component code for every supported flow.

| File | Covers |
|---|---|
| `project-setup.mdc` | Full setup, wiring, path aliases, new domain checklist |
| `auth-flows.mdc` | Sign in, sign up → OTP, forgot password, social, token refresh, logout |
| `listing-flows.mdc` | List page, detail page, like/unlike, all 8 order types |
| `cart-flows.mdc` | Add to cart (all order types), delete, clear, guest cart, error 480/489 |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_TRADLY_DOMAIN` | Yes | Your workspace domain e.g. `beauty.tradly.co` |
| `VITE_TRADLY_PK_KEY` | Yes | Public key from Tradly dashboard |
| `VITE_TRADLY_PUBLISHABLE_KEY` | No | Compatibility alias for deployments that use this env name |
| `VITE_TRADLY_BASE_URL` | No | API base URL, defaults to `https://api.tradly.app` |
| `VITE_TRADLY_ENV` | Yes | `production` / `development` / `sandbox` |
| `VITE_DEFAULT_CURRENCY` | No | Fallback currency code (default: `USD`) |
| `VITE_DEFAULT_LANGUAGE` | No | Fallback language code (default: `en`) |

---

## Starting a New Project

1. Duplicate (don't fork) this repo
2. Run `npm install`
3. Copy `.env.example` → `.env.local` and fill in your workspace values
4. Wrap your app with `<Provider>` + `<PersistGate>` (see Quick Start above)
5. Add `AppInitializer` at the root
6. Build your screens using the flow guides in `flows/`

For adding a new API domain (e.g. reviews, accounts), follow the new domain checklist in `flows/project-setup.mdc`.

---

## Getting Up to Date with New Tradly APIs

Your project is a copy of this boilerplate, so it does not update automatically. New Tradly APIs reach you in two ways.

**Check [developer.tradly.app](https://developer.tradly.app) first.** It is always the first place new APIs are announced, before the SDK or this boilerplate are updated.

### 1. New API endpoints: update the SDK

New Tradly endpoints ship as new methods in the [`tradly`](https://www.npmjs.com/package/tradly) SDK. Existing methods are never changed or removed, so upgrading is safe:

```bash
pnpm up tradly
```

Then import the new method and use it.

### 2. Boilerplate code (wrappers, state, types): pull from upstream

Platform code and your own code live in separate folders, so merges rarely conflict.

| Platform code (we update it, avoid editing it) | Your code (we never touch it) |
|---|---|
| `api/`, `state/`, `types/`, `config/`, `flows/` | `src/pages/`, `src/components/`, `src/index.css`, `tailwind.config.ts` |

Add this repo as a remote once:

```bash
git remote add upstream https://github.com/TRADLY-PLATFORM/Tradly-Boilerplate.git
```

Then, whenever you want the latest:

```bash
git fetch upstream
git merge upstream/main
```

On GitHub, if your project is a fork, you can use **Sync fork** instead. If you started from a plain copy with no shared git history, run `git merge upstream/main --allow-unrelated-histories` once, or have your AI agent apply the changes (see below).

Read `CHANGELOG.md` first to see what changed and whether anything needs action. Pin to a tagged release (for example `git merge v1.3.0`) if you do not want to follow `main`.

### 3. Let your AI agent do it

Give your agent this prompt:

> Compare `api/`, `state/`, `types/` and `config/` in my repo with the latest `main` of https://github.com/TRADLY-PLATFORM/Tradly-Boilerplate. Read `CHANGELOG.md` for what changed, apply the differences, keep my local edits, and do not touch `src/pages/` or `src/components/`.

---

## License

MIT
