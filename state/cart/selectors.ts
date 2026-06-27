import { cartApi } from './api'

// Read cached cart without triggering a fetch — use in deep child components
export const useCartResult = () =>
  cartApi.endpoints.getCart.useQueryState()

// Total quantity across all cart items
export const useCartItemCount = () => {
  const { data } = cartApi.endpoints.getCart.useQueryState()
  return data?.cart_details?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}

// Cart items list
export const useCartItems = () => {
  const { data } = cartApi.endpoints.getCart.useQueryState()
  return data?.cart_details ?? []
}

// Cart summary (totals)
export const useCartSummary = () => {
  const { data } = cartApi.endpoints.getCart.useQueryState()
  return data?.cart ?? null
}
