import type { Money } from './listing.types'

// ─── Shared ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'

// ─── Address ──────────────────────────────────────────────────────────────────

export interface OrderAddress {
  id: number
  name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  country: string
  zip: string
  country_obj?: { id: number; name: string; code: string }
}

// ─── Shipment ─────────────────────────────────────────────────────────────────

export interface Shipment {
  id: number
  status: string
  tracking_number?: string
  tracking_url?: string
  label_url?: string
  shipping_method_name: string
  estimated_delivery?: string
  ship_from?: OrderAddress
  ship_to?: OrderAddress
}

// ─── Order item ───────────────────────────────────────────────────────────────

export interface OrderItemListing {
  id: number
  title: string
  slug: string
  images: string[]
}

export interface OrderItemVariant {
  id: number
  name: string
}

export interface OrderItem {
  id: number
  listing_id: number
  quantity: number
  price: Money
  listing: OrderItemListing
  variant?: OrderItemVariant | null
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  profile_pic?: string
}

export interface OrderAccount {
  id: number
  name: string
  slug?: string
  images?: string[]
}

export interface OrderCoupon {
  id: number
  code: string
  discount: Money
}

export interface OrderPaymentMethod {
  id: number
  name: string
  type: string   // 'stripe' | 'mangopay' | 'wallet'
}

export interface Order {
  id: string
  order_reference: string    // public reference used in URLs and thank-you page
  status: OrderStatus
  created_at: number
  updated_at: number

  user: OrderUser
  account: OrderAccount

  // Pricing
  subtotal: Money
  total_discount: Money
  total_shipping: Money
  total_tax: Money
  total: Money

  // Content
  order_items: OrderItem[]
  shipments: Shipment[]

  // Optional
  address?: OrderAddress
  payment_method?: OrderPaymentMethod
  coupon?: OrderCoupon
  metadata?: Record<string, unknown>
}

// ─── Checkout input ───────────────────────────────────────────────────────────

export interface CheckoutCartRef {
  id?: number       // authenticated cart id
  uuid?: string     // guest uuid — injected automatically in api/checkout.ts
}

export interface CheckoutShippingMethod {
  id: number
  account_id?: number
}

export interface CheckoutAddress {
  id: number
}

export interface CheckoutPaymentMethod {
  id: number
}

export interface CheckoutInput {
  cart?: CheckoutCartRef
  shipping_method?: CheckoutShippingMethod
  address?: CheckoutAddress
  payment_method?: CheckoutPaymentMethod
  coupon_code?: string
  // Guest checkout — only when user is not authenticated
  guest_email?: string
  guest_name?: string
  guest_phone?: string
}

// Direct checkout — buy a listing without adding to cart first
export interface DirectCheckoutListingRef {
  id: number
  variant_id?: number
  quantity: number
  custom_price?: number   // donations
}

export interface DirectCheckoutInput {
  listing: DirectCheckoutListingRef
  shipping_method?: CheckoutShippingMethod
  address?: CheckoutAddress
  payment_method?: CheckoutPaymentMethod
  guest_email?: string
  guest_name?: string
  guest_phone?: string
}

// ─── Checkout response ────────────────────────────────────────────────────────

export interface CheckoutResponse {
  order_reference: string   // navigate to /thank-you/[order_reference]
}

// ─── Orders query params ──────────────────────────────────────────────────────

export interface GetOrdersParams {
  page?: number
  limit?: number
  status?: OrderStatus | string
  search?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  [key: string]: unknown
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface GetOrdersResponse {
  orders: Order[]
  page: number
  total_records: number
}

export interface GetOrderDetailResponse {
  order: Order
}

// ─── Status / shipment update inputs ─────────────────────────────────────────

export interface UpdateOrderStatusInput {
  id: string | number
  status: OrderStatus | string
  reason?: string
  cancel_reason?: string
}

export interface UpdateShipmentStatusInput {
  order_id: string | number
  shipment_id: string | number
  status: string
  tracking_number?: string
  tracking_url?: string
  label_url?: string
}

export interface VerifyOrderInput {
  id?: string
  email?: string
  phone?: string
  code?: string
}

// ─── SDK raw response ─────────────────────────────────────────────────────────

export interface TradlyOrderError {
  code: number
  message: string
}

export interface TradlyOrderSdkResponse<T> {
  status?: boolean
  data?: T
  error?: TradlyOrderError
}
