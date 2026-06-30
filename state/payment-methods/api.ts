import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as paymentAPI from '@/api/payment-methods'
import type { GetPaymentMethodsResponse } from '@/types/checkout.types'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const ctx = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const paymentMethodsApi = createApi({
  reducerPath: 'paymentMethodsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['PaymentMethod'],
  keepUnusedDataFor: 600,
  endpoints: (builder) => ({

    // result.data → { payment_methods: PaymentMethod[] }
    getPaymentMethods: builder.query<GetPaymentMethodsResponse, void>({
      queryFn: async (_arg, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await paymentAPI.getPaymentMethods(authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch payment methods' } }
          return { data: { payment_methods: res.data!.payment_methods } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['PaymentMethod'],
    }),

  }),
})

export const { useGetPaymentMethodsQuery } = paymentMethodsApi
