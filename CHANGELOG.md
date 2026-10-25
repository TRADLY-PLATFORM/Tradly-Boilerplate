# Changelog

All notable changes to the Tradly Boilerplate. Newest first.

New APIs are announced first at [developer.tradly.app](https://developer.tradly.app), before the SDK and this boilerplate are updated.

Each entry says which folders changed and whether you need to act:

- **Platform code** (`api/`, `state/`, `types/`, `config/`, `flows/`): pull these from upstream (see the README section "Getting Up to Date with New Tradly APIs").
- **Site code** (`src/pages/`, `src/components/`, `src/index.css`): these are yours. Entries here are optional starting points.
- **SDK**: the `tradly` npm package. Run `pnpm up tradly` to get new endpoints.

## Unreleased

### Changed
- `src/components/Layout.tsx` is now a thin shell. Header and footer logic (auth, cart count, nav links, sign-out, mobile menu) moved to `src/components/layout/useLayoutData.ts`; `layout/Header.tsx` and `layout/Footer.tsx` are design-only and read everything from a `data: LayoutData` prop. Which links appear is set in `layout/layout.config.ts`. Action: none for new projects. If you edited `Layout.tsx`, move your markup into `layout/Header.tsx` / `layout/Footer.tsx`.

### Added
- Platform code: `api/schedules.ts` and `state/schedules/` now include `createSchedule` for seller event/appointment availability. Site code adds `/booking/:slug` for buyer slot selection and `/booking/orders/:id` for the booked-date calendar; standard listing and order routes remain available. No SDK update is needed because `tradly@1.2.15` already exposes `createSchedule`.
- `HomePage.tsx`: helper components `CategoryCard`, `TrustBadge`, `SectionHeader`, `StatCard` (site code, optional).
- `index.css`: utilities `.bg-surface`, `.section-accent`, `.scroll-row`, `.badge-category` (site code, optional).
- Exhaustive endpoint contract tests (`pnpm test:e2e`, `pnpm test:api`).

### Fixed
- `.scroll-row` no longer uses the `scrollbar-hide` Tailwind plugin class, which is not installed. It uses native CSS instead. If you copied the earlier `.scroll-row` rule, replace it with the version in `src/index.css`.

## Earlier changes (before versioning)

- Environment compatibility fixes and Vite `allowedHosts` for the haifa.my proxy.
- Cart coupon management and the commissions API.
- Cart and checkout pages, improved OTP verification page.
- Build and env documentation fixes.

---

## How to read an entry

When a new Tradly endpoint is released, the entry will look like this:

```
## 1.3.0
### Added
- SDK: `tradly@1.3.0` adds `TradlySDK.app.getReviews`. Run `pnpm up tradly`.
- Platform code: `api/reviews.ts`, `state/reviews/` (new files, no conflicts).
### Action needed
- None. Existing code keeps working.
```
