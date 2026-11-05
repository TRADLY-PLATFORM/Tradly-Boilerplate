export type TradlyId = number | string

export type TradlyRecord = Record<string, unknown>

export interface GetFormsParams {
  page?: number
  per_page?: number
  status?: 'draft' | 'active' | 'inactive' | string
  search_key?: string
}

export interface FormAttributeValue {
  attribute_id: number | string
  values: unknown[] | unknown
}

export interface SubmitFormInput {
  attribute_values: FormAttributeValue[]
  metadata?: Record<string, unknown>
}

export interface GetCommentsParams {
  reference_id: number | string
  reference_type: string
  parent?: number | string
  page: number
  per_page?: number
}

export interface CreateCommentInput {
  reference_id: number | string
  reference_type: string
  message: string
  parent?: number | string
  account_id?: number | string
}

export interface EditCommentInput {
  message: string
}

export interface GetFeedParams extends Record<string, unknown> {
  page?: number
  per_page?: number
  type?: string
}

export interface GetPromotionsParams extends Record<string, unknown> {
  page: number
  type: string
  per_page?: number
  medium?: string
  placement?: string
}
