import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetFormDetailQuery, useSubmitFormMutation } from '@/state/forms/api'
import { locale } from '@/src/components/layout/locale'

type Field = Record<string, unknown>
const asRecord = (value: unknown): Field => value && typeof value === 'object' ? value as Field : {}
const getText = (record: Field, keys: string[], fallback = ''): string => {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key])
  return fallback
}
const getFields = (data: Field | undefined): Field[] => {
  if (!data) return []
  const form = asRecord(data.form ?? data)
  const raw = form.attributes ?? form.fields
  return Array.isArray(raw) ? raw.map(asRecord).map(field => ({ ...field, ...asRecord(field.attribute ?? field) })) : []
}
const getChoices = (field: Field): Array<{ label: string; value: string }> => {
  const raw = field.values ?? field.choices ?? field.options
  if (!Array.isArray(raw)) return []
  return raw.map(value => {
    const choice = asRecord(value)
    const label = getText(choice, ['name', 'label', 'value', 'title'], typeof value === 'string' || typeof value === 'number' ? String(value) : '')
    const id = getText(choice, ['id', 'value'], label)
    return { label, value: id }
  }).filter(choice => choice.label)
}
const fieldId = (field: Field) => field.id ?? field.attribute_id

export default function DynamicTradlyForm({ formId }: { formId: number | string }) {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const { data, isLoading, isError } = useGetFormDetailQuery(formId)
  const [submitForm, submitState] = useSubmitFormMutation()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const form = asRecord(data?.form ?? data)
  const fields = useMemo(() => getFields(data), [data])
  const submissionId = (form.id ?? form.form_id ?? formId) as number | string

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice(''); setNeedsSignIn(false)
    const formElement = event.currentTarget
    const values = new FormData(event.currentTarget)
    const attribute_values = fields.flatMap(field => {
      const id = fieldId(field)
      if (id == null) return []
      const name = `attribute-${String(id)}`
      const submitted = values.getAll(name)
      return [{ attribute_id: id as string | number, values: submitted.length > 1 ? submitted : (submitted[0] ?? '') }]
    })
    const result = await submitForm({ formId: submissionId, input: { attribute_values } })
    if ('error' in result) {
      const failure = result.error as { status?: string | number; error?: string }
      const authFailure = String(failure.status) === '401' || /401|unauthori[sz]ed/i.test(failure.error ?? '')
      setNeedsSignIn(authFailure)
      setError(authFailure ? locale.labels.formSignInRequired : locale.labels.formSubmitError)
      return
    }
    formElement.reset()
    setNotice(locale.labels.formSubmitSuccess)
  }

  if (isLoading) return <p className="py-10 text-sm text-muted-foreground">{locale.labels.formLoading}</p>
  if (isError || !data) return <p role="alert" className="py-10 text-sm text-destructive">{locale.labels.formLoadError}</p>

  return <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8">
    <h1 className="font-display text-2xl font-bold text-foreground">{getText(form, ['title', 'name'], locale.labels.formFallbackTitle)}</h1>
    {getText(form, ['description', 'subtitle']) && <p className="mt-2 text-sm text-muted-foreground">{getText(form, ['description', 'subtitle'])}</p>}
    {!fields.length ? <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">{locale.labels.formNoFields}</p> : <form onSubmit={event => void submit(event)} className="mt-6 space-y-4">
      {fields.map((field, index) => {
        const id = fieldId(field)
        if (id == null) return null
        const name = `attribute-${String(id)}`
        const label = getText(field, ['name', 'title', 'label'], `${locale.labels.formField} ${index + 1}`)
        const rawType = getText(field, ['input_type', 'type', 'field_type'], 'text').toLowerCase()
        // Tradly stores the kind as a number (3 = text, 6 = long text); the label tells email and phone fields apart.
        const type = rawType === '6' ? 'textarea' : /e-?mail/i.test(label) ? 'email' : /phone|mobile|whatsapp/i.test(label) && rawType === '3' ? 'tel' : rawType
        const required = field.required === true || field.required === 1 || field.is_required === true || field.is_required === 1 || field.mandatory === true
        const choices = getChoices(field)
        const shared = { id: name, name, required, className: 'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground' }
        return <label key={String(id)} htmlFor={name} className="block text-sm font-medium text-foreground">{label}{required && <span aria-hidden="true"> *</span>}
          {choices.length ? <select {...shared} multiple={type.includes('multi')} defaultValue={type.includes('multi') ? [] : ''}><option value="" disabled>{locale.labels.formChoose}</option>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
            : type.includes('textarea') || type.includes('long') ? <textarea {...shared} rows={4} />
              : <input {...shared} type={['email', 'number', 'tel', 'date', 'url'].includes(type) ? type : 'text'} />}
        </label>
      })}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}{needsSignIn && !isAuthenticated && <> <Link className="underline" to={`/sign-in?next=${encodeURIComponent(window.location.pathname)}`}>{locale.labels.signIn}</Link></>}</p>}
      {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm text-foreground">{notice}</p>}
      <button disabled={submitState.isLoading} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitState.isLoading ? locale.labels.formSubmitting : locale.labels.formSubmit}</button>
    </form>}
  </section>
}
