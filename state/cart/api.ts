import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as cartAPI from '@/api/cart'
import { listingApi } from '@/state/listing/api'
import type {
  AddToCartInput,
  DeleteCartItemInput,
  GetCartResponse,
} from '@/types/cart.types'

// Minimal local type — avoids circular dependency with store.ts
interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const getContext = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Cart'],
  endpoints: (builder) => ({

    // result.data → { cart: CartSummary, cart_details: CartItem[] }
    getCart: builder.query<GetCartResponse, void>({
      queryFn: async (_arg, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await cartAPI.getCart(authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch cart' } }
          return {
            data: {
              cart: res.data!.cart,
              cart_details: res.data!.cart_details,
            },
          }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['Cart'],
    }),

    // Adds item — result.data → void
    // On 480 (multi-seller) or 489 (conflict): error.data.code carries the SDK code
    // Check: (result.error as CartError).data?.code === 480
    addToCart: builder.mutation<void, AddToCartInput>({
      queryFn: async (input, { dispatch, getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await cartAPI.addToCart(input, authKey, currency, language)
          if (res?.error) {
            return {
              error: {
                status: 'CUSTOM_ERROR' as const,
                error: res.error.message ?? 'Add to cart failed',
                data: { code: res.error.code },
              },
            }
          }
          // Invalidate listing cache so in_cart field re-fetches correctly
          dispatch(listingApi.util.invalidateTags(['Listing']))
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } }
        }
      },
      invalidatesTags: ['Cart'],
    }),

    // Deletes a single cart item — result.data → void
    deleteCartItem: builder.mutation<void, DeleteCartItemInput>({
      queryFn: async ({ listing_id }, { dispatch, getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await cartAPI.deleteCartItem(listing_id, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Delete failed' } }
          // Invalidate listing cache so in_cart field re-fetches correctly
          dispatch(listingApi.util.invalidateTags(['Listing']))
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      invalidatesTags: ['Cart'],
    }),

    // Clears entire cart — result.data → void
    clearCart: builder.mutation<void, void>({
      queryFn: async (_arg, { dispatch, getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await cartAPI.clearCart(authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Clear cart failed' } }
          // Invalidate listing cache so in_cart becomes false on all listings
          dispatch(listingApi.util.invalidateTags(['Listing']))
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      invalidatesTags: ['Cart'],
    }),

  }),
})

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useDeleteCartItemMutation,
  useClearCartMutation,
} = cartApi
