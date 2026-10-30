import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface TransactionQuery {
  super_type?: 1 | 2
  account_id?: number
  page?: number
  per_page?: number
  start_date?: string
  end_date?: string
  [key: string]: unknown
}

const get = (path: string, params: TransactionQuery, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method: 'GET', bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language })

export const getTransactions = (params: TransactionQuery, authKey: string, currency: string, language: string): Promise<any> =>
  get('/v1/transactions', params, authKey, currency, language)

export const getEarnings = (params: TransactionQuery, authKey: string, currency: string, language: string): Promise<any> =>
  get('/v1/earnings', params, authKey, currency, language)
