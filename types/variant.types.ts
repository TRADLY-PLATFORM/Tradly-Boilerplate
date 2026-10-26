export interface TradlyVariantTypeValue {
  id: number
  name: string
  value?: string
}

export interface TradlyVariantType {
  id: number
  name: string
  values?: TradlyVariantTypeValue[]
}

export interface ListingVariantValue {
  variant_type_id: number
  variant_type_value_id: number
  variant_type?: TradlyVariantType
  variant_type_value?: TradlyVariantTypeValue
}

export interface ListingVariant {
  id: number
  title: string
  list_price: number | { amount: number; formatted?: string }
  offer_price?: number | { amount: number; formatted?: string }
  stock: number
  active: boolean
  variant_values: ListingVariantValue[]
}

export interface CreateListingVariantInput {
  title: string
  description?: string
  list_price: number
  offer_percent?: number
  stock: number
  active: boolean
  variant_values: Array<{ variant_type_id: number; variant_type_value_id: number }>
}
