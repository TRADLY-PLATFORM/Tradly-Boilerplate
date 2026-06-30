import TradlySDK from 'tradly'
import { buildAppQueryPayload, buildAppMutationPayload } from '@/api/sdk-context'
import { getDeviceUUID } from '@/config/uuid'
import type {
  TradlyCartSdkResponse,
  GetCartResponse,
} from '@/types/cart.types'

// Fetch current cart
// SDK expects: { bodyParam, authKey, currency, language }
export const getCart = (
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> => {
  const bodyParam: Record<string, unknown> = {}
  if (!authKey) bodyParam.uuid = getDeviceUUID()

  return (TradlySDK as any).app.getCarts(
    buildAppQueryPayload(bodyParam, authKey, currency, language),
  )
}

// Add item to cart
// SDK expects: { data: { cart: {...} }, authKey, currency, language }
export const addToCart = (
  input: { listing_id: number; quantity: number; variant_id?: number; custom_price?: number },
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> => {
  const cart: Record<string, unknown> = {
    listing_id: input.listing_id,
    quantity: input.quantity,
  }
  if (input.variant_id !== undefined) cart.variant_id = input.variant_id
  if (input.custom_price !== undefined) cart.custom_price = input.custom_price
  if (!authKey) cart.uuid = getDeviceUUID()

  return (TradlySDK as any).app.addToCart(
    buildAppMutationPayload({ cart }, authKey, currency, language),
  )
}

// Delete a single cart item by listing_id
// SDK expects: { data: { cart: { listing_id: [id] } }, authKey, currency, language }
export const deleteCartItem = (
  listingId: number,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<Record<string, never>>> => {
  const cart: Record<string, unknown> = { listing_id: [listingId] }
  if (!authKey) cart.uuid = getDeviceUUID()

  return (TradlySDK as any).app.deleteFromCart(
    buildAppMutationPayload({ cart }, authKey, currency, language),
  )
}

// Clear entire cart
// SDK expects: { authKey, currency, language }
export const clearCart = (
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<Record<string, never>>> =>
  (TradlySDK as any).app.deleteAllCartDetail(
    buildAppMutationPayload({}, authKey, currency, language),
  )

// Apply coupon to cart
// SDK method: app.applyCoupon — POST /products/v1/cart/coupon
// param.data goes directly as the HTTP body
export const applyCouponToCart = (
  cartId: number,
  couponCode: string,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> =>
  (TradlySDK as any).app.applyCoupon(
    buildAppMutationPayload({ cart: { id: cartId, coupon: { code: couponCode } } }, authKey, currency, language),
  )

// Remove coupon from cart
// SDK method: app.removeCoupon — DELETE /products/v1/cart/coupon
export const removeCouponFromCart = (
  cartId: number,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> =>
  (TradlySDK as any).app.removeCoupon(
    buildAppMutationPayload({ cart: { id: cartId } }, authKey, currency, language),
  )

// Get cart with commissions applied (for live price calculation in checkout)
// SDK expects: { bodyParam: { cart_commission: JSON }, authKey, ... }
export const getCartWithCommissions = (
  commissions: { id: number; amount: number }[],
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> => {
  const bodyParam: Record<string, unknown> = {
    cart_commission: JSON.stringify(commissions),
  }
  if (!authKey) bodyParam.uuid = getDeviceUUID()
  return (TradlySDK as any).app.getCarts(
    buildAppQueryPayload(bodyParam, authKey, currency, language),
  )
}

// Get cart with specific shipping method applied (for price calculation)
// SDK expects: { bodyParam: { shipping_method_id }, authKey, ... }
export const getCartWithShipping = (
  shippingMethodId: number,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCartSdkResponse<GetCartResponse>> => {
  const bodyParam: Record<string, unknown> = { shipping_method_id: shippingMethodId }
  if (!authKey) bodyParam.uuid = getDeviceUUID()
  return (TradlySDK as any).app.getCarts(
    buildAppQueryPayload(bodyParam, authKey, currency, language),
  )
}
