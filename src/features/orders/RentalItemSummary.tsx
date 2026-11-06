import { useGetListingDetailQuery } from '@/state/listing/api'
import { useGetRentalSettingsQuery } from '@/state/rentals/api'
import { getItemOrderType, formatOrderDateRange } from './order-item-display'
import { locale } from '@/src/components/layout/locale'

type Item = Record<string, any>
const amountLabel = (amount: unknown, currency: string) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return ''
  try { return new Intl.NumberFormat(locale.language, { style: 'currency', currency: currency || 'USD' }).format(value) }
  catch { return `${currency} ${value}` }
}

export default function RentalItemSummary({ item, orderType = '', startAt, endAt, units, className = '' }: {
  item: Item
  orderType?: string
  startAt?: unknown
  endAt?: unknown
  units?: number
  className?: string
}) {
  const listing = item?.listing ?? {}
  const isRental = ['rental', 'rentals'].includes(getItemOrderType(item, orderType))
  const { data } = useGetListingDetailQuery({ slug: String(listing.slug ?? '') }, { skip: !isRental || !!listing.listing_rental_settings || !listing.slug })
  const { data: fetchedSettings } = useGetRentalSettingsQuery(Number(listing.id ?? 0), { skip: !isRental || !listing.id || !!listing.listing_rental_settings })
  if (!isRental) return null
  const settings = listing.listing_rental_settings ?? data?.listing?.listing_rental_settings ?? fetchedSettings ?? undefined
  const dates = formatOrderDateRange(startAt ?? item.schedule_start_at, endAt ?? item.schedule_end_at)
  const unitCount = units ?? Number(item.quantity ?? 0)
  const currency = listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD'
  const deposit = settings?.deposit_amount

  return <div className={`mt-2 space-y-1 text-xs text-muted-foreground ${className}`}>
    {dates && <p><span className="font-medium text-foreground">{locale.labels.rentalOrderDates}:</span> {dates}</p>}
    {unitCount > 0 && <p><span className="font-medium text-foreground">{locale.labels.rentalUnits}:</span> {unitCount}</p>}
    {deposit != null && <p><span className="font-medium text-foreground">{locale.labels.rentalDeposit}:</span> {amountLabel(deposit, currency)}</p>}
  </div>
}
