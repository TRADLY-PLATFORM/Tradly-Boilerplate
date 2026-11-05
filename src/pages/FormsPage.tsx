import { Link, useParams } from 'react-router-dom'
import Layout from '@/src/components/Layout'
import DynamicTradlyForm from '@/src/features/forms/DynamicTradlyForm'
import { useGetFormsQuery } from '@/state/forms/api'
import { locale } from '@/src/components/layout/locale'

type FormRecord = Record<string, unknown>
const text = (record: FormRecord, keys: string[]) => {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key])
  return ''
}
const formsFrom = (data: FormRecord | undefined): FormRecord[] => {
  if (!data) return []
  const nested = data.forms ?? (data.data as FormRecord | undefined)?.forms
  return Array.isArray(nested) ? nested as FormRecord[] : []
}

export default function FormsPage() {
  const { formId } = useParams<{ formId?: string }>()
  const { data, isLoading, isError } = useGetFormsQuery({ page: 1, per_page: 100, status: 'active' }, { skip: Boolean(formId) })
  return <Layout><div className="mx-auto max-w-4xl">
    {formId ? <DynamicTradlyForm formId={formId} /> : <>
      <h1 className="font-display text-3xl font-bold text-foreground">{locale.labels.formsTitle}</h1>
      <p className="mt-2 text-muted-foreground">{locale.labels.formsDescription}</p>
      {isLoading && <p className="py-8 text-sm text-muted-foreground">{locale.labels.formLoading}</p>}
      {isError && <p role="alert" className="py-8 text-sm text-destructive">{locale.labels.formsLoadError}</p>}
      {!isLoading && !isError && <div className="mt-6 grid gap-4 sm:grid-cols-2">{formsFrom(data).map((form, index) => {
        const id = text(form, ['slug', 'id', 'form_id'])
        const title = text(form, ['title', 'name']) || `${locale.labels.formFallbackTitle} ${index + 1}`
        return id ? <Link key={id} to={`/forms/${encodeURIComponent(id)}`} className="rounded-xl border border-border bg-card p-5 hover:border-primary"><h2 className="font-semibold text-foreground">{title}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{text(form, ['description'])}</p></Link> : null
      })}</div>}
      {!isLoading && !isError && formsFrom(data).length === 0 && <p className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{locale.labels.formsEmpty}</p>}
    </>}
  </div></Layout>
}
