// ─── Category ─────────────────────────────────────────────────────────────────

export interface CategoryHierarchy {
  id: string | number
  name: string
  slug?: string
}

export interface Category {
  id: string | number
  name: string
  slug?: string
  description?: string
  image?: string
  parent_id?: string | number | null
  sub_category?: Category[]
  hierarchy?: CategoryHierarchy[]
  type?: 'listing' | 'account'
  [key: string]: unknown
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface GetCategoriesParams {
  page?: number
  type?: 'listing' | 'account'
  [key: string]: unknown
}

export interface GetCategoryListingsParams {
  category_id: number | string
  page?: number
  limit?: number
  [key: string]: unknown
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface GetCategoriesResponse {
  categories: Category[]
}

export interface GetCategoryDetailResponse {
  category: Category
}

// ─── SDK response wrapper ─────────────────────────────────────────────────────

export interface TraldyCategoryError {
  code: number
  message: string
}

export interface TraldyCategorySdkResponse<T> {
  status?: boolean
  data?: T
  error?: TraldyCategoryError
}
