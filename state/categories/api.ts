import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as categoriesAPI from '@/api/categories'
import type {
  Category,
  GetCategoriesParams,
  GetCategoriesResponse,
  GetCategoryDetailResponse,
  GetCategoryListingsParams,
} from '@/types/category.types'
import type { Listing } from '@/types/listing.types'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const getContext = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Category'],
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({

    // ── Category list ─────────────────────────────────────────────────────────

    // result.data → { categories: Category[] }
    // Pass type: 'listing' (default) or 'account' to get different category sets
    getCategories: builder.query<GetCategoriesResponse, GetCategoriesParams>({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await categoriesAPI.getCategories(params, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch categories' } }
          return { data: { categories: res.data!.categories } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: (result, _err, params) =>
        result
          ? [
              ...result.categories.map((c) => ({ type: 'Category' as const, id: String(c.id) })),
              { type: 'Category', id: `LIST-${params.type ?? 'listing'}` },
            ]
          : [{ type: 'Category', id: `LIST-${params.type ?? 'listing'}` }],
    }),

    // ── Category detail by slug ────────────────────────────────────────────────

    // result.data → { category: Category }
    // Falls back to getCategoryById if slug lookup fails (slug may contain id prefix e.g. "123-electronics")
    getCategoryBySlug: builder.query<GetCategoryDetailResponse, string>({
      queryFn: async (slug, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await categoriesAPI.getCategoryBySlug(slug, authKey, currency, language)
          if (!res?.error && res.data?.category) {
            return { data: { category: res.data.category } }
          }

          // Fallback: extract numeric ID from slug prefix ("123-name" → 123)
          const idFromSlug = slug.split('-')[0]
          const fallback = await categoriesAPI.getCategoryById(idFromSlug, authKey, currency, language)
          if (!fallback?.error && fallback.data?.category) {
            return { data: { category: fallback.data.category } }
          }

          return { error: { status: 'CUSTOM_ERROR', error: 'Category not found' } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: (_result, _err, slug) => [{ type: 'Category', id: slug }],
    }),

    // ── Category detail by ID ──────────────────────────────────────────────────

    getCategoryById: builder.query<GetCategoryDetailResponse, string | number>({
      queryFn: async (id, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await categoriesAPI.getCategoryById(id, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Category not found' } }
          return { data: { category: res.data!.category } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: (_result, _err, id) => [{ type: 'Category', id: String(id) }],
    }),

    // ── Category listings ─────────────────────────────────────────────────────

    // result.data → { listings: Listing[], page: number, total_records: number }
    // category_id is required; pass page, limit, and any other filter params
    getCategoryListings: builder.query<
      { listings: Listing[]; page: number; total_records: number },
      GetCategoryListingsParams
    >({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await categoriesAPI.getCategoryListings(params, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch listings' } }
          return {
            data: {
              listings: res.data!.listings,
              page: res.data!.page,
              total_records: res.data!.total_records,
            },
          }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      // Tag per category so invalidating one category's listings is possible
      providesTags: (_result, _err, params) => [
        { type: 'Category', id: `LISTINGS-${params.category_id}` },
      ],
    }),

  }),
})

export const {
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useGetCategoryByIdQuery,
  useGetCategoryListingsQuery,
} = categoriesApi
