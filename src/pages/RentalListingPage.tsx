import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarDays, ShieldCheck } from 'lucide-react'
import { useGetListingDetailQuery } from '@/state/listing/api'
import { useAddToCartMutation, useClearCartMutation } from '@/state/cart/api'
import { useGetRentalAvailabilityQuery } from '@/state/rentals/api'
import { isRentalAvailabilityConfirmed } from '@/src/features/rental/availability'
import { useAuthSelector } from '@/state/auth/selectors'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Skeleton } from '@/src/components/ui/skeleton'
import ListingHero from '@/src/components/listing/ListingHero'
import type { ListingHeroData } from '@/src/components/listing/listingHero.types'
import { locale } from '@/src/components/layout/locale'
import { buildHeroExtras, useListingHeroExtras } from '@/src/features/listing-hero/useListingHeroExtras'

const money = (amount: number, currency: string) => new Intl.NumberFormat(locale.language, {
  style: 'currency', currency: currency || 'USD',
}).format(amount)

export default function RentalListingPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const authenticated = useAuthSelector(state => state.isAuthenticated)
  const { data, isLoading, isError } = useGetListingDetailQuery({ slug })
  const listing = data?.listing
  const heroState = useListingHeroExtras(listing)
  const settings = listing?.listing_rental_settings
  const [startDate, setStartDate] = useState(() => searchParams.get('start_at') ?? '')
  const [endDate, setEndDate] = useState(() => searchParams.get('end_at') ?? '')
  const [units, setUnits] = useState(() => Math.max(1, Number(searchParams.get('units')) || 1))
  const [error, setError] = useState('')
  const [addToCart, { isLoading: adding }] = useAddToCartMutation()
  const [clearCart] = useClearCartMutation()
  const isHourly = settings?.rate_unit === 'hour'
  const startMoment = startDate && dayjs(startDate).isValid() ? dayjs(startDate) : null
  const endMoment = endDate && dayjs(endDate).isValid() ? dayjs(endDate) : null
  const duration = startMoment && endMoment
    ? isHourly
      ? endMoment.diff(startMoment, 'hour', true)
      : endMoment.diff(startMoment, 'day') / (settings?.rate_unit === 'week' ? 7 : 1)
    : 0
  const rangeIsWholeUnits = Number.isInteger(duration)
  const isoStartAt = startMoment ? (isHourly ? startMoment : startMoment.startOf('day')).toISOString() : ''
  const isoEndAt = endMoment ? (isHourly ? endMoment : endMoment.startOf('day')).toISOString() : ''
  const rentalParams = useMemo(() => ({
    listing_id: listing?.id ?? 0,
    start_at: isoStartAt,
    end_at: isoEndAt,
    units,
  }), [listing?.id, isoStartAt, isoEndAt, units])
  const validDates = !!settings && !!startMoment && !!endMoment && endMoment.isAfter(startMoment) && rangeIsWholeUnits && duration >= settings.min_duration && duration <= settings.max_duration && units > 0 && units <= settings.max_units
  const { data: availabilityData, isFetching: checkingAvailability, isSuccess: availabilityChecked, isError: availabilityError } = useGetRentalAvailabilityQuery(
    rentalParams,
    { skip: !validDates },
  )
  const availabilityConfirmed = availabilityChecked && isRentalAvailabilityConfirmed(availabilityData, units)

  const continueToCheckout = async () => {
    if (!listing || !settings || !validDates || !availabilityConfirmed) return
    const next = `/rental/${slug}?start_at=${encodeURIComponent(startDate)}&end_at=${encodeURIComponent(endDate)}&units=${units}`
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
    const added = await addToCart({ listing_id: listing.id, quantity: units })
    if ('error' in added) {
      setError((added.error as any)?.error ?? 'Could not add this rental to your cart.')
      return
    }
    const params = new URLSearchParams({ rental_start_at: isoStartAt, rental_end_at: isoEndAt, rental_units: String(units) })
    navigate(`/checkout?${params.toString()}`)
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
    priceLabel: settings ? `${money(settings.rate_amount, listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD')} / ${settings.rate_unit}` : listing.offer_price?.formatted ?? listing.list_price?.formatted ?? null,
    comparePriceLabel: null,
    discountLabel: null,
    stockNote: null,
    donation: null,
    descriptionHtml: listing.description ?? '',
  }

  return <Layout>
    <div className="mb-5 flex items-center gap-2 text-sm"><Link to={`/listing/${slug}?view=standard`} className="text-coffee-accent hover:underline">{locale.labels.aboutThisListing}</Link><span className="text-muted-foreground">/</span><span>{locale.labels.rental}</span></div>
    <ListingHero data={heroData}>
      {!settings ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{locale.labels.rentalSettingsMissing}</p> : <>
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><CalendarDays className="h-5 w-5 text-coffee-accent" />{locale.labels.rental}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalStartDate}<Input type={isHourly ? 'datetime-local' : 'date'} min={isHourly ? dayjs().format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DD')} value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
            <label className="space-y-1.5 text-sm font-medium">{locale.labels.rentalEndDate}<Input type={isHourly ? 'datetime-local' : 'date'} min={startDate || (isHourly ? dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm') : dayjs().add(1, 'day').format('YYYY-MM-DD'))} value={endDate} onChange={event => setEndDate(event.target.value)} /></label>
          </div>
          <label className="block max-w-40 space-y-1.5 text-sm font-medium">{locale.labels.rentalUnits}<Input type="number" min={1} max={settings.max_units} step={1} value={units} onChange={event => setUnits(Math.max(1, Math.min(settings.max_units, Number(event.target.value) || 1)))} /></label>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
            <span>{locale.labels.rentalDuration}: {settings.min_duration}–{settings.max_duration} {settings.rate_unit}{settings.max_duration === 1 ? '' : 's'}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />{locale.labels.rentalDeposit}: {money(settings.deposit_amount, listing.offer_price?.currency ?? listing.list_price?.currency ?? 'USD')}</span>
          </div>
          {validDates && <p role={availabilityError ? 'alert' : 'status'} className={`text-sm ${availabilityError ? 'text-destructive' : 'text-muted-foreground'}`}>{checkingAvailability ? locale.labels.rentalAvailabilityChecking : availabilityError ? locale.labels.rentalAvailabilityError : availabilityChecked && !availabilityConfirmed ? locale.labels.rentalAvailabilityUnverified : ''}</p>}
          {!validDates && (startDate || endDate) && <p role="alert" className="text-sm text-destructive">{locale.labels.rentalInvalidDates}</p>}
        </section>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button onClick={continueToCheckout} disabled={!validDates || !availabilityConfirmed || checkingAvailability || adding} className="btn-hero w-full">{adding ? locale.labels.rentalPreparing : checkingAvailability ? locale.labels.rentalAvailabilityChecking : locale.labels.rentalContinue}</Button>
      </>}
    </ListingHero>
  </Layout>
}
