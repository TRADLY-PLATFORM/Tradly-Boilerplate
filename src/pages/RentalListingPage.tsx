import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarDays, ShieldCheck } from 'lucide-react'
import { useGetListingDetailQuery } from '@/state/listing/api'
import { useAddToCartMutation, useClearCartMutation } from '@/state/cart/api'
import { useGetRentalAvailabilityQuery, useGetRentalSettingsQuery } from '@/state/rentals/api'
import { isRentalAvailabilityConfirmed, rentalQuotedPrice } from '@/src/features/rental/availability'
import { useGetListingVariantsQuery } from '@/state/variants/api'
import { useAuthSelector } from '@/state/auth/selectors'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Skeleton } from '@/src/components/ui/skeleton'
import ListingHero from '@/src/components/listing/ListingHero'
import type { ListingHeroData } from '@/src/components/listing/listingHero.types'
import { locale } from '@/src/components/layout/locale'
import { buildHeroExtras, useListingHeroExtras } from '@/src/features/listing-hero/useListingHeroExtras'
import type { ListingVariant } from '@/types/variant.types'

const money = (amount: number, currency: string) => new Intl.NumberFormat(locale.language, {
  style: 'currency', currency: currency || 'USD',
}).format(amount)

const amount = (value: ListingVariant['list_price'] | ListingVariant['offer_price']): number | undefined => {
  const result = typeof value === 'number' ? value : Number(value?.amount)
  return Number.isFinite(result) ? result : undefined
}

export default function RentalListingPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const authenticated = useAuthSelector(state => state.isAuthenticated)
  const { data, isLoading, isError } = useGetListingDetailQuery({ slug, id: /^\d+$/.test(slug) })
  const listing = data?.listing
  const heroState = useListingHeroExtras(listing)
  // Listing detail does not include the rental settings, so read them separately when they are missing.
  const isRentalListing = ['rental', 'rentals'].includes(String(listing?.order_type))
  const { data: fetchedSettings, isLoading: settingsLoading, isFetching: settingsFetching } = useGetRentalSettingsQuery(listing?.id ?? 0, { skip: !listing?.id || !isRentalListing || !!listing?.listing_rental_settings })
  const settings = listing?.listing_rental_settings ?? fetchedSettings ?? undefined
  const settingsPending = !settings && (settingsLoading || settingsFetching)
  const { data: variants = [], isLoading: variantsLoading, isError: variantsError } = useGetListingVariantsQuery(listing?.id ?? '', { skip: !listing?.id })
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(() => {
    const parsed = Number(searchParams.get('variant_id'))
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  })
  const [startDate, setStartDate] = useState(() => searchParams.get('start_at') ?? '')
  const [endDate, setEndDate] = useState(() => searchParams.get('end_at') ?? '')
  const [units, setUnits] = useState(() => Math.max(1, Number(searchParams.get('units')) || 1))
  const [adults, setAdults] = useState(() => Math.max(1, Number(searchParams.get('adults')) || 1))
  const [children, setChildren] = useState(() => Math.max(0, Number(searchParams.get('children')) || 0))
  const [specialRequests, setSpecialRequests] = useState('')
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [error, setError] = useState('')
  const [addToCart, { isLoading: adding }] = useAddToCartMutation()
  const [clearCart] = useClearCartMutation()
  const isHourly = settings?.rate_unit === 'hour'
  const selectedVariant = variants.find(variant => variant.id === selectedVariantId) ?? (selectedVariantId === null ? variants[0] : undefined)
  const maxUnits = Math.max(0, Math.min(settings?.max_units ?? 1, selectedVariant?.stock ?? settings?.max_units ?? 1))
  const startMoment = startDate && dayjs(startDate).isValid() ? dayjs(startDate) : null
  const endMoment = endDate && dayjs(endDate).isValid() ? dayjs(endDate) : null
  const duration = startMoment && endMoment
    ? isHourly
      ? endMoment.diff(startMoment, 'hour', true)
      : endMoment.diff(startMoment, 'day') / (settings?.rate_unit === 'week' ? 7 : 1)
    : 0
  const rangeIsWholeUnits = Number.isInteger(duration)
  const nights = !isHourly && startMoment && endMoment ? endMoment.diff(startMoment, 'day') : 0
  const roomRate = amount(selectedVariant?.offer_price) ?? amount(selectedVariant?.list_price) ?? settings?.rate_amount
  const currency = listing?.offer_price?.currency ?? listing?.list_price?.currency ?? 'USD'
  const staySubtotal = roomRate !== undefined && duration > 0 ? roomRate * duration * units : undefined
  const isoStartAt = startMoment ? (isHourly ? startMoment : startMoment.startOf('day')).toISOString() : ''
  const isoEndAt = endMoment ? (isHourly ? endMoment : endMoment.startOf('day')).toISOString() : ''
  const rentalParams = useMemo(() => ({
    listing_id: listing?.id ?? 0,
    start_at: isoStartAt,
    end_at: isoEndAt,
    units,
  }), [listing?.id, isoStartAt, isoEndAt, units])
  const validDates = !!settings && !!startMoment && !!endMoment && endMoment.isAfter(startMoment) && rangeIsWholeUnits && duration >= settings.min_duration && duration <= settings.max_duration && units > 0 && units <= maxUnits && (!variants.length || (!!selectedVariant && selectedVariant.stock >= units))
  const { data: availabilityData, isFetching: checkingAvailability, isSuccess: availabilityChecked, isError: availabilityError } = useGetRentalAvailabilityQuery(
    rentalParams,
    { skip: !validDates },
  )
  const availabilityConfirmed = availabilityChecked && isRentalAvailabilityConfirmed(availabilityData, units)

  const continueToCheckout = async () => {
    if (!listing || !settings || !validDates || !availabilityConfirmed) return
    const next = `/rental/${slug}?start_at=${encodeURIComponent(startDate)}&end_at=${encodeURIComponent(endDate)}&units=${units}${selectedVariant ? `&variant_id=${selectedVariant.id}` : ''}`
    if (!authenticated) {
      navigate(`/sign-in?next=${encodeURIComponent(next)}`)
      return
    }
    setError('')
    const cleared = await clearCart()
    if ('error' in cleared && (cleared.error as any)?.code !== 471) {
      setError((cleared.error as any)?.error ?? 'Could not prepare your rental cart.')
      return
    }
    const added = await addToCart({ listing_id: listing.id, quantity: units, ...(selectedVariant ? { variant_id: selectedVariant.id } : {}) })
    if ('error' in added) {
      setError((added.error as any)?.error ?? 'Could not add this rental to your cart.')
      return
    }
    const params = new URLSearchParams({ rental_start_at: isoStartAt, rental_end_at: isoEndAt, rental_units: String(units), rental_adults: String(adults), rental_children: String(children), ...(selectedVariant ? { rental_variant_id: String(selectedVariant.id) } : {}) })
    navigate(`/cart?${params.toString()}`)
  }

  if (isLoading) return <Layout><div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div></Layout>
  if (isError || !listing) return <Layout><div className="py-20 text-center text-destructive">Listing not found.</div></Layout>
  if (!['rental', 'rentals'].includes(listing.order_type)) return <Layout><div className="py-20 text-center">{locale.labels.rentalTypeMismatch} <Link className="text-coffee-accent underline" to={`/listing/${slug}?view=standard`}>{locale.labels.aboutThisListing}</Link>.</div></Layout>

  const heroData: ListingHeroData = {
    title: listing.title,
    sellerName: listing.account?.name ?? locale.labels.unknownSeller,
    images: listing.images ?? [],
    ...buildHeroExtras(listing, 'rental', true, heroState),
    rating: listing.rating_data?.rating_count > 0 ? { average: listing.rating_data.rating_average, count: listing.rating_data.rating_count } : null,
    priceLabel: settings ? `${money(roomRate ?? settings.rate_amount, currency)} / ${settings.rate_unit}` : listing.offer_price?.formatted ?? listing.list_price?.formatted ?? null,
    comparePriceLabel: null,
    discountLabel: null,
    stockNote: null,
    donation: null,
    descriptionHtml: listing.description ?? '',
  }

  return <Layout>
    <div className="mb-5 flex items-center gap-2 text-sm"><Link to={`/listing/${slug}?view=standard`} className="text-coffee-accent hover:underline">{locale.labels.aboutThisListing}</Link><span className="text-muted-foreground">/</span><span>{locale.labels.rental}</span></div>
    <ListingHero data={heroData}>
      {!settings ? settingsPending ? <Skeleton className="h-40 w-full rounded-xl" /> : <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{locale.labels.rentalSettingsMissing}</p> : <>
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><CalendarDays className="h-5 w-5 text-coffee-accent" />{locale.labels.rental}</h2>
          {variantsLoading && <p role="status" className="text-sm text-muted-foreground">{locale.labels.loadingOptions}</p>}
          {variantsError && <p role="alert" className="text-sm text-destructive">{locale.labels.rentalRoomCategoriesLoadError}</p>}
          {variants.length > 0 && <fieldset className="space-y-2"><legend className="text-sm font-medium">{locale.labels.rentalChooseRoomCategory}</legend><div className="grid gap-2 sm:grid-cols-2">{variants.map(variant => {
            const variantRate = amount(variant.offer_price) ?? amount(variant.list_price) ?? settings.rate_amount
            const active = (selectedVariant?.id ?? null) === variant.id
            return <label key={variant.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${active ? 'border-coffee-accent ring-1 ring-coffee-accent' : 'border-border'}`}><input type="radio" name="rental-room-category" checked={active} onChange={() => { setSelectedVariantId(variant.id); setUnits(current => Math.min(current, Math.max(1, variant.stock))) }} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{variant.title}</span><span className="block text-xs text-muted-foreground">{money(variantRate, currency)} / {settings.rate_unit} · {variant.stock} {locale.labels.rentalRoomsAvailable}</span></span></label>
          })}</div></fieldset>}
          {!variantsLoading && !variantsError && variants.length === 0 && <p className="text-xs text-muted-foreground">{locale.labels.rentalNoRoomCategories}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalStartDate}<Input type={isHourly ? 'datetime-local' : 'date'} min={isHourly ? dayjs().add(1, 'minute').format('YYYY-MM-DDTHH:mm') : dayjs().add(1, 'day').format('YYYY-MM-DD')} value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
            <label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalEndDate}<Input type={isHourly ? 'datetime-local' : 'date'} min={startDate || (isHourly ? dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm') : dayjs().add(2, 'day').format('YYYY-MM-DD'))} value={endDate} onChange={event => setEndDate(event.target.value)} /></label>
          </div>
          <label className="block max-w-40 space-y-1.5 text-sm font-medium">{locale.labels.rentalUnits}<Input type="number" min={1} max={maxUnits || 1} step={1} value={units} onChange={event => setUnits(Math.max(1, Math.min(maxUnits || 1, Number(event.target.value) || 1)))} /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalAdults}<Input type="number" min={1} step={1} value={adults} onChange={event => setAdults(Math.max(1, Number(event.target.value) || 1))} /></label><label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalChildren}<Input type="number" min={0} step={1} value={children} onChange={event => setChildren(Math.max(0, Number(event.target.value) || 0))} /></label></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
            <span>{locale.labels.rentalDuration}: {settings.min_duration}–{settings.max_duration} {settings.rate_unit}{settings.max_duration === 1 ? '' : 's'}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />{locale.labels.rentalDeposit}: {money(settings.deposit_amount, listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD')}</span>
          </div>
          {validDates && <p role={availabilityError || (availabilityChecked && !availabilityConfirmed) ? 'alert' : 'status'} className={`text-sm ${availabilityError || (availabilityChecked && !availabilityConfirmed) ? 'text-destructive' : 'text-muted-foreground'}`}>{checkingAvailability ? locale.labels.rentalAvailabilityChecking : availabilityError ? locale.labels.rentalAvailabilityError : availabilityChecked && !availabilityConfirmed ? locale.labels.rentalAvailabilityUnverified : availabilityConfirmed ? `${locale.labels.rentalAvailable}${rentalQuotedPrice(availabilityData) ? ` ${locale.labels.rentalQuote}: ${money(rentalQuotedPrice(availabilityData)!, listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD')}` : ''}` : ''}</p>}
          {validDates && <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm"><p className="font-semibold">{locale.labels.rentalPriceEstimate}</p>{!isHourly && <div className="flex justify-between text-muted-foreground"><span>{locale.labels.rentalNightCount}</span><span>{nights}</span></div>}<div className="flex justify-between text-muted-foreground"><span>{locale.labels.rentalAccommodation} ({duration} {settings.rate_unit}{duration === 1 ? '' : 's'} × {units})</span><span>{staySubtotal === undefined ? '—' : money(staySubtotal, currency)}</span></div><div className="flex justify-between text-muted-foreground"><span>{locale.labels.rentalDeposit}</span><span>{money(settings.deposit_amount, currency)}</span></div><p className="text-xs text-muted-foreground">{locale.labels.rentalTaxesAtCheckout}</p></div>}
          {!!listing.metadata?.cancellation_policy && <div className="space-y-2 rounded-lg border border-border p-3"><p className="text-sm font-semibold">{locale.labels.rentalCancellationPolicy}</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{String(listing.metadata.cancellation_policy)}</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={policyAccepted} onChange={event => setPolicyAccepted(event.target.checked)} className="mt-1" /><span>{locale.labels.rentalAcceptCancellationPolicy}</span></label></div>}
          {validDates && <p role={availabilityError || (availabilityChecked && !availabilityConfirmed) ? 'alert' : 'status'} className={`text-sm ${availabilityError || (availabilityChecked && !availabilityConfirmed) ? 'text-destructive' : 'text-muted-foreground'}`}>{checkingAvailability ? locale.labels.rentalAvailabilityChecking : availabilityError ? locale.labels.rentalAvailabilityError : availabilityChecked && !availabilityConfirmed ? locale.labels.rentalAvailabilityUnverified : availabilityConfirmed ? `${locale.labels.rentalAvailable}${rentalQuotedPrice(availabilityData) ? ` ${locale.labels.rentalQuote}: ${money(rentalQuotedPrice(availabilityData)!, listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD')}` : ''}` : ''}</p>}
          {!validDates && (startDate || endDate) && <p role="alert" className="text-sm text-destructive">{locale.labels.rentalInvalidDates}</p>}
        </section>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button onClick={continueToCheckout} disabled={!validDates || !availabilityConfirmed || checkingAvailability || adding || variantsLoading || variantsError || (!!listing.metadata?.cancellation_policy && !policyAccepted)} className="btn-hero w-full">{adding ? locale.labels.rentalPreparing : checkingAvailability ? locale.labels.rentalAvailabilityChecking : locale.labels.rentalContinue}</Button>
        <p className="text-xs text-muted-foreground">{locale.labels.singleBookingCartNotice}</p>
      </>}
    </ListingHero>
  </Layout>
}
