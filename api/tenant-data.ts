import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

const call = (path: string, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method: 'GET', pkKey: AppConfig.pkKey, authKey, currency, language })

export const getTenantLanguages = (authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/tenants/languages', authKey, currency, language)

export const getCurrencies = (authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/currencies', authKey, currency, language)

export const getCurrencyDetail = (currencyId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/currencies/${currencyId}`, authKey, currency, language)

export const getTenantCountries = (authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/tenants/countries', authKey, currency, language)
