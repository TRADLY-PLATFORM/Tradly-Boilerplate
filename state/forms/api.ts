import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as formsAPI from '@/api/forms'
import type { GetFormsParams, SubmitFormInput, TradlyId, TradlyRecord } from '@/types/prompt-apis.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })
const error = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)
const payload = async (request: Promise<unknown>, fallback: string): Promise<{ data: TradlyRecord } | { error: ReturnType<typeof error> }> => {
  try {
    const result: any = normalizeTradlyResponse(await request, fallback)
    if (result.error) return { error: error(result.error.message ?? fallback) }
    return { data: (result.data ?? {}) as TradlyRecord }
  } catch (cause) { return { error: error(cause instanceof Error ? cause.message : fallback) } }
}

export const formsApi = createApi({
  reducerPath: 'formsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Form', 'FormSubmission'],
  endpoints: builder => ({
    getForms: builder.query<TradlyRecord, GetFormsParams>({
      queryFn: (params, { getState }) => { const ctx = context(getState() as LocalState); return payload(formsAPI.getForms(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load forms') },
      providesTags: ['Form'],
    }),
    getFormDetail: builder.query<TradlyRecord, TradlyId>({
      queryFn: (id, { getState }) => { const ctx = context(getState() as LocalState); return payload(formsAPI.getFormDetail(id, ctx.authKey, ctx.currency, ctx.language), 'Could not load form') },
      providesTags: (_result, _error, id) => [{ type: 'Form', id: String(id) }],
    }),
    submitForm: builder.mutation<TradlyRecord, { formId: TradlyId; input: SubmitFormInput }>({
      queryFn: ({ formId, input }, { getState }) => { const ctx = context(getState() as LocalState); return payload(formsAPI.submitForm(formId, input, ctx.authKey, ctx.currency, ctx.language), 'Could not submit form') },
      invalidatesTags: ['FormSubmission'],
    }),
  }),
})

export const { useGetFormsQuery, useGetFormDetailQuery, useSubmitFormMutation } = formsApi
