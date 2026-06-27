import type { Money } from './listing.types'
export type { Money }

// ─── Cart summary ─────────────────────────────────────────────────────────────

export interface PricingItem {
  name: string
  type: string            // e.g. 'customer_sub_total', 'account_tax', 'customer_tax'
  short_code: string
  display: boolean
  amount: number
  note?: string
  account_id?: string
  buying: Money
}

export interface CartSummary {
  id: number
  total: Money
  list_total: Money
  offer_total: Money
  shipping_total: Money
  grand_total: Money
  pricing_items: PricingItem[]
}

// ─── Cart item listing (simplified — only fields used from cart context) ──────

export interface CartListingAccount {
  id: number
  name: string
  slug: string
  images: string[]
}

export interface CartListing {
  id: number
  title: string
  slug: string
  images: string[]
  list_price: Money
  offer_price: Money
  stock: number
  liked: boolean
  in_cart: boolean
  account_id: number
  account: CartListingAccount
  max_quantity: number
}

// ─── Cart item variant ────────────────────────────────────────────────────────

export interface CartVariant {
  id: number
  name: string
  list_price?: Money
  offer_price?: Money
  stock?: number
}

// ─── Cart item ────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number
  quantity: number
  custom_price: string          // "0.0000" — string from API
  schedule_start_at: number | null
  schedule_end_at: number | null
  quantity_total_price: Money
  quantity_total_offer_price: Money
  tax_total_offer_price: number
  metadata: Record<string, unknown>
  listing: CartListing
  variant?: CartVariant | null
  attributes: unknown[]
  item_attributes: unknown[]
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface AddToCartInput {
  listing_id: number
  quantity: number
  variant_id?: number
  custom_price?: number  // for donations
}

export interface DeleteCartItemInput {
  listing_id: number  // listing id from cart_details[].listing.id — sent as array: { listing_id: [id] }
}

// ─── Response types (what components receive) ─────────────────────────────────

export interface GetCartResponse {
  cart: CartSummary
  cart_details: CartItem[]
}

// ─── SDK raw response (internal) ─────────────────────────────────────────────

export interface TradlyCartError {
  code: number
  message: string
}

export interface TradlyCartSdkResponse<T> {
  status?: boolean
  data?: T
  error?: TradlyCartError
}
