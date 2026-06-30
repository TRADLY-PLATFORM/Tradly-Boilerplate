// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: number
  name: string
  phone_number?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state?: string
  country: string
  post_code?: string
  country_code?: string
  formatted_address?: string
  country_obj?: { id: number; name: string; code: string }
  default?: boolean
}

export interface AddAddressInput {
  name: string
  phone_number?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state?: string
  country: string
  post_code?: string
  type?: string
}

export interface GetAddressesResponse {
  addresses: Address[]
}

// ─── Shipping method ──────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: number
  name: string
  description?: string
  type: string         // "pickup" | "delivery" | "storage_hub"
  channel?: string     // "sendcloud" | "" — drives sub-shipment logic
  active: boolean
  default: boolean
  order_by: number
  account_id?: number
  price?: {
    amount: number
    currency: string
    formatted: string
  }
  metadata?: {
    extension_id?: string
    price_list?: boolean
    [key: string]: unknown
  }
}

export interface GetShippingMethodsResponse {
  shipping_methods: ShippingMethod[]
}

// ─── Payment method ───────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: number
  name: string
  type: string     // "stripe" | "stripe_web" | "razorpay" | "pawapay" | "wallet" | "cash" | "cod" | ...
  channel: string  // "web" | "inline" | "api" | "cod" | ""
  active: boolean
  default: boolean
  logo_path?: string
  logo?: string
}

export interface GetPaymentMethodsResponse {
  payment_methods: PaymentMethod[]
}

// ─── SDK response wrapper ─────────────────────────────────────────────────────

export interface TradlyCheckoutSdkError {
  code: number
  message: string
}

export interface TradlyCheckoutSdkResponse<T> {
  status?: boolean
  data?: T
  error?: TradlyCheckoutSdkError
}

// ─── Commission ───────────────────────────────────────────────────────────────

export interface CommissionData {
  min_amount: number
  max_amount: number
  optional: boolean
}

export interface Commission {
  id: number
  title: string
  description?: string
  type: string              // "cart" | "demand"
  commission_data: CommissionData
}

export interface CartCommissionEntry {
  id: number
  amount: number
}

export interface GetCommissionsResponse {
  commissions: Commission[]
}

// ─── Storage hub address ──────────────────────────────────────────────────────

export interface StorageHubAddress {
  id: number
  name: string
  formatted_address?: string
  address_line_1?: string
  city?: string
  state?: string
  country?: string
  zip?: string
}

export interface GetStorageHubAddressesResponse {
  addresses: StorageHubAddress[]
}

// ─── Shipment methods (SendCloud / External) ──────────────────────────────────

export interface ShipmentMethod {
  id: number | string
  name: string
  description?: string
  carrier?: string
  price?: { amount: number; currency: string; formatted: string }
  min_weight?: number
  max_weight?: number
  delivery_days?: string
}

export interface GetShipmentMethodsResponse {
  shipment_methods: ShipmentMethod[]
}

// ─── Extended checkout input (with all fields the SDK accepts) ────────────────

export interface FullCheckoutPayload {
  // Cart / guest cart
  cart?: { id?: number; uuid?: string }

  // Order type — matches listing.order_type
  type?: string

  // Shipping
  shipping_method_id?: number
  shipping_address_id?: number
  shipping_address?: Record<string, string>   // guest delivery address (raw object)

  // External shipment (SendCloud / external extension)
  external_shipping_method_id?: number | string

  // Payment
  payment_method_id?: number

  // Coupon
  coupon_code?: string

  // Commissions
  cart_commission?: CartCommissionEntry[]
  demand_commission?: number[]              // array of commission ids

  // Events / appointments
  schedule_id?: number                     // slot id from schedules_per_day response
  schedule_start_at?: string               // "YYYY-MM-DD HH:MM:00"
  schedule_end_at?: string

  // Donation
  anonymous_donation?: boolean

  // Guest
  guest?: boolean
  guest_email?: string
  guest_name?: string
  guest_phone?: string
}
