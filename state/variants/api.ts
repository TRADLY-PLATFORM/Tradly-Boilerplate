import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as variantsAPI from '@/api/variants'
import type { CreateListingVariantInput, ListingVariant, TradlyVariantType, TradlyVariantTypeValue } from '@/types/variant.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })

export const variantsApi = createApi({
  reducerPath: 'variantsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['ListingVariant'],
  endpoints: builder => ({
    getVariantTypes: builder.query<TradlyVariantType[], void>({
      queryFn: async (_arg, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await variantsAPI.getVariantTypes(ctx.authKey, ctx.currency, ctx.language), 'Could not load variant types')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not load variant types' } }
          const raw: any = result.data
          const types = Array.isArray(raw?.variant_types) ? raw.variant_types : Array.isArray(raw) ? raw : undefined
          if (!types) return { error: { status: 'CUSTOM_ERROR', error: 'Tradly returned incomplete variant type data.' } }
          return { data: types }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
    }),
    getVariantTypeValues: builder.query<TradlyVariantTypeValue[], number | string>({
      queryFn: async (id, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await variantsAPI.getVariantTypeValues(id, ctx.authKey, ctx.currency, ctx.language), 'Could not load variant choices')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not load variant choices' } }
          const raw: any = result.data
          const values = Array.isArray(raw?.variant_type_values) ? raw.variant_type_values : Array.isArray(raw?.values) ? raw.values : Array.isArray(raw) ? raw : undefined
          if (!values) return { error: { status: 'CUSTOM_ERROR', error: 'Tradly returned incomplete variant choices.' } }
          return { data: values }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
    }),
    getListingVariants: builder.query<ListingVariant[], number | string>({
      queryFn: async (listingId, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await variantsAPI.getListingVariants(listingId, ctx.authKey, ctx.currency, ctx.language), 'Could not load product variants')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not load product variants' } }
          const raw: any = result.data
          const variants = Array.isArray(raw?.variants) ? raw.variants : Array.isArray(raw) ? raw : undefined
          if (!variants) return { error: { status: 'CUSTOM_ERROR', error: 'Tradly returned incomplete product variant data.' } }
          return { data: variants.filter((variant: ListingVariant) => variant.active !== false && Number(variant.stock) !== 0) }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: (_result, _error, id) => [{ type: 'ListingVariant', id: String(id) }],
    }),
    createListingVariant: builder.mutation<void, { listingId: number | string; variant: CreateListingVariantInput }>({
      queryFn: async ({ listingId, variant }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await variantsAPI.createListingVariant(listingId, variant, ctx.authKey, ctx.currency, ctx.language), 'Could not save product variant')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not save product variant' } }
          return { data: undefined }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: (_result, _error, { listingId }) => [{ type: 'ListingVariant', id: String(listingId) }],
    }),
    deleteListingVariant: builder.mutation<void, { listingId: number | string; variantId: number | string }>({
      queryFn: async ({ listingId, variantId }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(await variantsAPI.deleteListingVariant(listingId, variantId, ctx.authKey, ctx.currency, ctx.language), 'Could not delete product variant')
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not delete product variant' } }
          return { data: undefined }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: (_result, _error, { listingId }) => [{ type: 'ListingVariant', id: String(listingId) }],
    }),
  }),
})

export const { useGetVariantTypesQuery, useGetVariantTypeValuesQuery, useGetListingVariantsQuery, useCreateListingVariantMutation, useDeleteListingVariantMutation } = variantsApi
