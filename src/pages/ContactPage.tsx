import { Link, useSearchParams } from 'react-router-dom'
import Layout from '@/src/components/Layout'
import DynamicTradlyForm from '@/src/features/forms/DynamicTradlyForm'
import { useGetFormsQuery } from '@/state/forms/api'
import { useGetListingDetailQuery } from '@/state/listing/api'
import { locale } from '@/src/components/layout/locale'

type FormRecord = Record<string, unknown>
const formsFrom = (data: FormRecord | undefined): FormRecord[] => {
  const nested = data?.forms ?? (data?.data as FormRecord | undefined)?.forms
  return Array.isArray(nested) ? (nested as FormRecord[]) : []
}
const idOf = (form: FormRecord) => String(form.slug ?? form.id ?? form.form_id ?? '')
const titleOf = (form: FormRecord) => String(form.title ?? form.name ?? '')

/**
 * Where the "Enquire" button of an information listing lands (`/contact?listing=<id>`).
 * It shows the store's enquiry form: the active form whose title says enquiry or contact, otherwise the first
 * active form. The store owner creates it once in Tradly (Forms); no form means a plain "no form yet" message.
 */
export default function ContactPage() {
  const [params] = useSearchParams()
  const listingParam = params.get('listing') || ''
  const forms = useGetFormsQuery({ page: 1, per_page: 100, status: 'active' })
  const listing = useGetListingDetailQuery({ slug: listingParam, id: /^\d+$/.test(listingParam) }, { skip: !listingParam })
  const list = formsFrom(forms.data)
  const form = list.find((f) => /enquir|inquir|contact/i.test(titleOf(f))) ?? list[0]
  const listingTitle = listing.data?.listing?.title
  const listingHref = listing.data?.listing ? `/l/${listing.data.listing.slug || listing.data.listing.id}` : ''

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        {listingTitle && (
          <p className="mb-4 text-sm text-muted-foreground">
            {locale.labels.enquiryAbout}{' '}
            <Link to={listingHref} className="font-medium text-foreground underline">{listingTitle}</Link>
          </p>
        )}
        {forms.isLoading && <p className="py-10 text-sm text-muted-foreground">{locale.labels.formLoading}</p>}
        {forms.isError && <p role="alert" className="py-10 text-sm text-destructive">{locale.labels.formsLoadError}</p>}
        {!forms.isLoading && !forms.isError && !form && (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{locale.labels.enquiryNoForm}</p>
        )}
        {form && idOf(form) && <DynamicTradlyForm formId={idOf(form)} />}
      </div>
    </Layout>
  )
}
