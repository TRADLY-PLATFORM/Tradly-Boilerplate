import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'
import type { GetFormsParams, SubmitFormInput } from '@/types/prompt-apis.types'

const call = (path: string, Method: string, authKey: string, currency: string, language: string, data?: unknown, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(data !== undefined ? { data } : {}), ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getForms = (params: GetFormsParams, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/forms', 'GET', authKey, currency, language, undefined, { page: 1, ...params })

export const getFormDetail = (formId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/forms/${encodeURIComponent(String(formId))}`, 'GET', authKey, currency, language)

export const submitForm = (formId: number | string, input: SubmitFormInput, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/forms/${encodeURIComponent(String(formId))}/submissions`, 'POST', authKey, currency, language, input)
