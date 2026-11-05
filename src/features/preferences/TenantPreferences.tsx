import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/state/store'
import { persistor, type AppDispatch } from '@/state/store'
import { setCountryId, setCurrency, setLanguage } from '@/state/app/slice'
import { useGetCurrenciesQuery, useGetTenantCountriesQuery, useGetTenantLanguagesQuery } from '@/state/tenant-data/api'
import { locale } from '@/src/components/layout/locale'

type Choice = { value: string; label: string }
type RecordValue = Record<string, unknown>

function rows(data: RecordValue | undefined, keys: string[]): RecordValue[] {
  if (!data) return []
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) return value.filter((entry): entry is RecordValue => !!entry && typeof entry === 'object')
  }
  return []
}

function choices(input: RecordValue[], valueKeys: string[], labelKeys: string[]): Choice[] {
  return input.flatMap(row => {
    const value = valueKeys.map(key => row[key]).find(candidate => candidate != null && String(candidate).trim())
    const label = labelKeys.map(key => row[key]).find(candidate => candidate != null && String(candidate).trim())
    return value == null ? [] : [{ value: String(value), label: label == null ? String(value) : String(label) }]
  })
}

function PreferenceSelect({ id, label, value, choices, onChange, disabled }: {
  id: string; label: string; value: string; choices: Choice[]; onChange: (value: string) => void; disabled?: boolean
}) {
  return <label htmlFor={id} className="space-y-1.5 text-sm font-medium text-foreground">
    <span>{label}</span>
    <select id={id} value={value} onChange={event => onChange(event.target.value)} disabled={disabled || choices.length === 0} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60">
      {choices.length === 0 ? <option value="">{locale.labels.tenantDataUnavailable}</option> : choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select>
  </label>
}

export default function TenantPreferences() {
  const dispatch = useDispatch<AppDispatch>()
  const currency = useSelector((state: RootState) => state.app.currency)
  const language = useSelector((state: RootState) => state.app.language)
  const countryId = useSelector((state: RootState) => state.app.countryId)
  const languageQuery = useGetTenantLanguagesQuery()
  const currencyQuery = useGetCurrenciesQuery()
  const countryQuery = useGetTenantCountriesQuery()

  const languageChoices = choices(rows(languageQuery.data, ['languages', 'tenant_languages']), ['code', 'language', 'language_code', 'id'], ['name', 'native_name', 'label', 'code'])
  const currencyChoices = choices(rows(currencyQuery.data, ['currencies']), ['code', 'currency_code', 'iso_code', 'id'], ['name', 'code', 'currency_code', 'symbol'])
  const countryChoices = choices(rows(countryQuery.data, ['countries', 'tenant_countries']), ['id', 'country_id', 'code'], ['name', 'country_name', 'label', 'code'])

  const changeApiLocale = async (kind: 'language' | 'currency', value: string) => {
    if (!value || value === (kind === 'language' ? language : currency)) return
    if (kind === 'language') dispatch(setLanguage(value))
    else dispatch(setCurrency(value))
    await persistor.flush()
    window.location.reload()
  }

  const hasLookupError = languageQuery.isError || currencyQuery.isError || countryQuery.isError
  return <section className="mt-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
    <h2 className="font-display text-xl font-semibold text-foreground">{locale.labels.preferences}</h2>
    <p className="mb-5 mt-1 text-sm text-muted-foreground">{locale.labels.preferencesDescription}</p>
    {hasLookupError && <p role="status" className="mb-4 text-sm text-muted-foreground">{locale.labels.preferencesLoadError}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      <PreferenceSelect id="data-language" label={locale.labels.preferenceLanguage} value={language} choices={languageChoices} disabled={languageQuery.isLoading} onChange={value => void changeApiLocale('language', value)} />
      <PreferenceSelect id="data-currency" label={locale.labels.preferenceCurrency} value={currency} choices={currencyChoices} disabled={currencyQuery.isLoading} onChange={value => void changeApiLocale('currency', value)} />
      <PreferenceSelect id="default-country" label={locale.labels.preferenceCountry} value={countryId} choices={countryChoices} disabled={countryQuery.isLoading} onChange={value => dispatch(setCountryId(value))} />
    </div>
  </section>
}
