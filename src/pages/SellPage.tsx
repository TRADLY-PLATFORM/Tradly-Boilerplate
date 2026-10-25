import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { useAuthSelector } from '@/state/auth/selectors'
import { useGetCategoriesQuery } from '@/state/categories/api'
import { useGetAttributesQuery } from '@/state/attributes/api'
import { useGetMyAccountsQuery, useCreateAccountMutation } from '@/state/accounts/api'
import { useCreateListingMutation } from '@/state/listing/api'
import { useCreateScheduleMutation } from '@/state/schedules/api'
import { useUploadImagesMutation } from '@/state/uploads/api'
import type { Category } from '@/types/category.types'
import type { SellerAccount } from '@/api/accounts'

const ORDER_TYPES = [
  { value: 'listings', label: 'Product or free item' },
  { value: 'donation', label: 'Donation' },
  { value: 'events', label: 'Event' },
  { value: 'appointments', label: 'Appointment or booking' },
  { value: 'digital', label: 'Digital product' },
  { value: 'information_listing', label: 'Information listing' },
  { value: 'video_listing', label: 'Video listing' },
  { value: 'requests', label: 'Request' },
]

function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = []
  const visit = (items: Category[]) => items.forEach(item => {
    result.push(item)
    if (item.sub_category?.length) visit(item.sub_category)
  })
  visit(categories)
  return result
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) return String((error as { error: unknown }).error || fallback)
  return fallback
}

function attributeOptions(attribute: CategoryAttribute): Array<{ label: string; value: string }> {
  return attribute.values.map((raw, index) => {
    if (typeof raw === 'string' || typeof raw === 'number') return { label: String(raw), value: String(raw) }
    if (raw && typeof raw === 'object') {
      const item = raw as Record<string, unknown>
      const label = String(item.name ?? item.label ?? item.value ?? item.title ?? `Option ${index + 1}`)
      return { label, value: String(item.id ?? item.value_id ?? item.value ?? label) }
    }
    return { label: `Option ${index + 1}`, value: String(index) }
  })
}

function selectedAttributeValues(attribute: CategoryAttribute, storedValue: string | undefined): string[] {
  if (!storedValue) return []
  if (attribute.field_type !== 2) return storedValue.trim() ? [storedValue.trim()] : []
  try {
    const parsed: unknown = JSON.parse(storedValue)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

type CategoryAttribute = import('@/types/listing.types').ListingAttribute

export default function SellPage() {
  const navigate = useNavigate()
  const userId = useAuthSelector(state => state.userId)
  const { data: accountsData, isLoading: accountsLoading, error: accountsError } = useGetMyAccountsQuery(userId, { skip: !userId })
  const { data: listingCategoriesData, isLoading: listingCategoriesLoading } = useGetCategoriesQuery({ type: 'listing' })
  const { data: accountCategoriesData, isLoading: accountCategoriesLoading } = useGetCategoriesQuery({ type: 'account' })
  const [categoryId, setCategoryId] = useState('')
  const { data: attributesData, isLoading: attributesLoading, error: attributesError } = useGetAttributesQuery(
    { type: 'listings', ...(categoryId ? { category_id: Number(categoryId) } : {}) },
    { skip: !categoryId },
  )
  const [createAccount, accountState] = useCreateAccountMutation()
  const [createListing, listingState] = useCreateListingMutation()
  const [uploadImages, uploadState] = useUploadImagesMutation()
  const [createSchedule, scheduleState] = useCreateScheduleMutation()

  const accounts = accountsData?.accounts ?? []
  const listingCategories = useMemo(() => flattenCategories(listingCategoriesData?.categories ?? []), [listingCategoriesData])
  const accountCategories = useMemo(() => flattenCategories(accountCategoriesData?.categories ?? []), [accountCategoriesData])
  const [accountId, setAccountId] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopCategoryId, setShopCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [goalPrice, setGoalPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [maxQuantity, setMaxQuantity] = useState('')
  const [offerPercent, setOfferPercent] = useState('')
  const [shippingCharges, setShippingCharges] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [gtin, setGtin] = useState('')
  const [mpn, setMpn] = useState('')
  const [weightValue, setWeightValue] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [volumeValue, setVolumeValue] = useState('')
  const [volumeUnit, setVolumeUnit] = useState('l')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [sizeUnit, setSizeUnit] = useState('cm')
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  const [orderType, setOrderType] = useState('listings')
  const [files, setFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scheduleStartDate, setScheduleStartDate] = useState('')
  const [scheduleEndDate, setScheduleEndDate] = useState('')
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00')
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00')
  const [scheduleCapacity, setScheduleCapacity] = useState('1')
  const [scheduleRepeat, setScheduleRepeat] = useState(false)
  const [publishedListing, setPublishedListing] = useState<{ slug: string; id: number } | null>(null)

  useEffect(() => {
    if (!accountId && accounts.length) setAccountId(String(accounts[0].id))
  }, [accountId, accounts])

  const selectedAccount = accounts.find(account => String(account.id) === accountId)
  const attributes = (attributesData?.attributes ?? []).filter(attribute => attribute.active !== false && !attribute.private && attribute.field_type !== 6)
  const showShopSetup = !accountsLoading && accounts.length === 0 && !accountState.data?.account
  const needsSchedule = orderType === 'events' || orderType === 'appointments'

  const handleCreateShop = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!shopCategoryId) {
      setError('Choose a seller category to create your shop.')
      return
    }
    const result = await createAccount({ name: shopName.trim(), type: 'accounts', category_id: [Number(shopCategoryId)] })
    if ('error' in result) {
      setError(errorMessage(result.error, 'Could not create seller account.'))
      return
    }
    const created = result.data.account
    setAccountId(String(created.id))
    setSuccess(`Seller account “${created.name}” is ready.`)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!selected.length) return
    setError('')
    const room = Math.max(0, 8 - imageUrls.length - files.length)
    const accepted = selected.slice(0, room)
    if (!accepted.length) {
      setError('You can add up to 8 photos per listing.')
      return
    }
    setFiles(current => [...current, ...accepted])
    const result = await uploadImages(accepted)
    setFiles(current => current.filter(file => !accepted.includes(file)))
    if ('error' in result) {
      setError(errorMessage(result.error, 'Could not upload photos.'))
      return
    }
    setImageUrls(current => [...current, ...result.data])
  }

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedAccount && !accountState.data?.account) {
      setError('Create or choose a seller account before publishing.')
      return
    }
    if (!categoryId) {
      setError('Choose a listing category.')
      return
    }
    const missingRequired = attributes.find(attribute => attribute.optional === false && selectedAttributeValues(attribute, attributeValues[String(attribute.id)]).length === 0)
    if (missingRequired) {
      setError(`Enter ${missingRequired.name}.`)
      return
    }
    if (!imageUrls.length) {
      setError('Add at least one photo to publish your listing.')
      return
    }
    if (needsSchedule && (!scheduleStartDate || !scheduleEndDate || scheduleEndDate < scheduleStartDate || scheduleEndTime <= scheduleStartTime)) {
      setError('Enter a valid availability date range and end time after the start time.')
      return
    }
    const owner = selectedAccount ?? accountState.data!.account
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      type: orderType,
      order_type: orderType,
      account_id: Number(owner.id),
      category_id: [Number(categoryId)],
      images: imageUrls,
      stock: Math.max(1, Number(stock) || 1),
      list_price: Number(price) || 0,
    }
    if (maxQuantity) payload.max_quantity = Math.max(1, Number(maxQuantity) || 1)
    if (offerPercent) payload.offer_percent = Math.min(100, Math.max(0, Number(offerPercent) || 0))
    if (shippingCharges !== '') payload.shipping_charges = Number(shippingCharges)
    if (sku.trim()) payload.sku = sku.trim()
    if (barcode.trim()) payload.barcode = barcode.trim()
    if (gtin.trim()) payload.gtin = gtin.trim()
    if (mpn.trim()) payload.mpn = mpn.trim()
    if (weightValue) {
      payload.weight_value = Number(weightValue)
      payload.weight_uom = weightUnit
    }
    if (length) payload.length = Number(length)
    if (width) payload.width = Number(width)
    if (height) payload.height = Number(height)
    if (length || width || height) payload.size_uom = sizeUnit
    if (volumeValue) {
      payload.volume_value = Number(volumeValue)
      payload.volume_uom = volumeUnit
    }
    const selectedAttributes = attributes.flatMap(attribute => {
      const values = selectedAttributeValues(attribute, attributeValues[String(attribute.id)])
      return values.length ? [{ id: attribute.id, values }] : []
    })
    if (selectedAttributes.length) payload.attributes = selectedAttributes
    if (orderType === 'donation') payload.goal_price = Number(goalPrice) || 0
    const result = await createListing(payload)
    if ('error' in result) {
      setError(errorMessage(result.error, 'Could not publish listing.'))
      return
    }
    setSuccess('Your listing is live.')
    const listing = result.data.listing
    if (needsSchedule && listing?.id) {
      setPublishedListing({ id: listing.id, slug: listing.slug ?? String(listing.id) })
      const scheduleResult = await createSchedule({
        listingId: listing.id,
        schedules: [{
          start_date: scheduleStartDate,
          end_date: scheduleEndDate,
          start_time: scheduleStartTime,
          end_time: scheduleEndTime,
          schedule_type: scheduleRepeat ? 2 : 1,
          ...(scheduleRepeat ? { repeat_days: [1, 2, 3, 4, 5, 6, 7] } : {}),
          active: true,
          total_stocks: Math.max(1, Number(scheduleCapacity) || 1),
        }],
      })
      if ('error' in scheduleResult) {
        setError(`Your listing was created, but its booking availability could not be saved: ${errorMessage(scheduleResult.error, 'Please try again later.')}`)
        return
      }
      navigate(`/booking/${listing.slug ?? listing.id}`)
      return
    }
    if (listing?.slug) navigate(`/listing/${listing.slug}`)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm">
          <Link to="/" className="text-coffee-accent hover:underline">Home</Link>
          <span className="text-muted-foreground">›</span>
          <span className="font-medium text-foreground">Sell</span>
        </nav>
        <header className="mb-7">
          <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Sell or share an item</h1>
          <p className="text-sm text-muted-foreground">Create a listing for your marketplace.</p>
        </header>

        {(error || accountsError) && <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error || errorMessage(accountsError, 'Could not load seller accounts.')}</div>}
        {success && <div role="status" className="mb-6 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-foreground">{success}</div>}

        {accountsLoading || listingCategoriesLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading seller details…</div>
        ) : showShopSetup ? (
          <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold">Set up your seller account</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">Your items will appear under this account.</p>
            <form onSubmit={handleCreateShop} className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="shop-name">Seller or shop name</Label><Input id="shop-name" value={shopName} onChange={event => setShopName(event.target.value)} required maxLength={100} placeholder="e.g. Jane’s Finds" /></div>
              <div className="space-y-1.5"><Label htmlFor="shop-category">Seller category</Label><select id="shop-category" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={shopCategoryId} onChange={event => setShopCategoryId(event.target.value)} required disabled={accountCategoriesLoading}><option value="">Choose a category</option>{accountCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{!accountCategoriesLoading && !accountCategories.length && <p className="text-xs text-destructive">No seller categories are configured. Add account categories in Tradly Dashboard to continue.</p>}</div>
              <Button type="submit" disabled={accountState.isLoading || !accountCategories.length} className="btn-hero">{accountState.isLoading ? 'Creating seller account…' : 'Create seller account'}</Button>
            </form>
          </section>
        ) : accounts.length > 1 ? (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm"><Label htmlFor="seller-account">Publish under</Label><select id="seller-account" className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
        ) : null}

        {(selectedAccount || accountState.data?.account) && (
          <form onSubmit={handlePublish} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="font-display text-xl font-semibold">Listing details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Selling something used? Set the price to 0 to share it for free.</p>
            </div>
            <div className="space-y-1.5"><Label htmlFor="listing-title">Title</Label><Input id="listing-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={150} placeholder="What are you offering?" /></div>
            <div className="space-y-1.5"><Label htmlFor="listing-description">Description</Label><textarea id="listing-description" value={description} onChange={event => setDescription(event.target.value)} required rows={5} maxLength={5000} placeholder="Add details that help people understand your listing." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="listing-type">Listing type</Label><select id="listing-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={orderType} onChange={event => setOrderType(event.target.value)}>{ORDER_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            {needsSchedule && <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <div><h3 className="font-semibold">Booking availability</h3><p className="text-xs text-muted-foreground">Set the date range, daily time window, and number of bookings available per slot.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="schedule-start-date">First date</Label><Input id="schedule-start-date" type="date" value={scheduleStartDate} onChange={event => setScheduleStartDate(event.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="schedule-end-date">Last date</Label><Input id="schedule-end-date" type="date" min={scheduleStartDate || undefined} value={scheduleEndDate} onChange={event => setScheduleEndDate(event.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="schedule-start-time">Start time</Label><Input id="schedule-start-time" type="time" value={scheduleStartTime} onChange={event => setScheduleStartTime(event.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="schedule-end-time">End time</Label><Input id="schedule-end-time" type="time" value={scheduleEndTime} onChange={event => setScheduleEndTime(event.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="schedule-capacity">Capacity per slot</Label><Input id="schedule-capacity" type="number" min="1" step="1" value={scheduleCapacity} onChange={event => setScheduleCapacity(event.target.value)} required /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scheduleRepeat} onChange={event => setScheduleRepeat(event.target.checked)} /> Repeat every day in this date range</label>
            </section>}
              <div className="space-y-1.5"><Label htmlFor="listing-category">Category</Label><select id="listing-category" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={categoryId} onChange={event => setCategoryId(event.target.value)} required><option value="">Choose a category</option>{listingCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
              <div className="space-y-1.5"><Label htmlFor="listing-price">{orderType === 'donation' ? 'Suggested amount' : 'Price'}</Label><Input id="listing-price" type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} placeholder="0.00" required /></div>
              <div className="space-y-1.5"><Label htmlFor="listing-stock">Available quantity</Label><Input id="listing-stock" type="number" min="1" step="1" value={stock} onChange={event => setStock(event.target.value)} required /></div>
              {orderType === 'donation' && <div className="space-y-1.5"><Label htmlFor="goal-price">Fundraising goal</Label><Input id="goal-price" type="number" min="0" step="0.01" value={goalPrice} onChange={event => setGoalPrice(event.target.value)} placeholder="Optional" /></div>}
            </div>
            {needsSchedule && <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">After publishing, add available dates and time slots for this listing in the Tradly Dashboard.</p>}
            <section className="space-y-4 rounded-xl border border-border p-4 sm:p-5">
              <div><h3 className="font-medium">Listing attributes</h3><p className="mt-1 text-xs text-muted-foreground">These fields come from your Tradly category setup.</p></div>
              {!categoryId ? <p className="text-sm text-muted-foreground">Choose a category to load its attributes.</p> : attributesLoading ? <p className="text-sm text-muted-foreground">Loading category attributes…</p> : attributesError ? <p role="alert" className="text-sm text-destructive">Could not load attributes for this category.</p> : attributes.length === 0 ? <p className="text-sm text-muted-foreground">No additional attributes are configured for this category.</p> : <div className="grid gap-4 sm:grid-cols-2">{attributes.map(attribute => {
                const key = String(attribute.id)
                const required = attribute.optional === false
                const options = attributeOptions(attribute)
                const selected = selectedAttributeValues(attribute, attributeValues[key])
                if (attribute.field_type === 2 && options.length) return <fieldset key={key} className="space-y-2"><legend className="text-sm font-medium">{attribute.name}{required ? ' *' : ''}</legend>{options.map(option => <label key={option.value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(option.value)} onChange={event => setAttributeValues(current => ({ ...current, [key]: JSON.stringify(event.target.checked ? [...selected, option.value] : selected.filter(value => value !== option.value)) }))} />{option.label}</label>)}</fieldset>
                return <div key={key} className="space-y-1.5"><Label htmlFor={`attribute-${key}`}>{attribute.name}{required ? ' *' : ''}</Label>{attribute.field_type === 1 && options.length ? <select id={`attribute-${key}`} required={required} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={attributeValues[key] ?? ''} onChange={event => setAttributeValues(current => ({ ...current, [key]: event.target.value }))}><option value="">Choose {attribute.name.toLowerCase()}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input id={`attribute-${key}`} type={attribute.field_type === 3 && /number|weight|length|width|height|price/i.test(attribute.name) ? 'number' : 'text'} required={required} value={attributeValues[key] ?? ''} onChange={event => setAttributeValues(current => ({ ...current, [key]: event.target.value }))} placeholder={attribute.tooltip || `Enter ${attribute.name.toLowerCase()}`} />}</div>
              })}</div>}
            </section>
            <details className="rounded-xl border border-border">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">Inventory, shipping and product details</summary>
              <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="max-quantity">Maximum per order</Label><Input id="max-quantity" type="number" min="1" step="1" value={maxQuantity} onChange={event => setMaxQuantity(event.target.value)} placeholder="No limit" /></div>
                <div className="space-y-1.5"><Label htmlFor="offer-percent">Discount (%)</Label><Input id="offer-percent" type="number" min="0" max="100" step="0.1" value={offerPercent} onChange={event => setOfferPercent(event.target.value)} placeholder="Optional" /></div>
                {orderType === 'listings' && <div className="space-y-1.5"><Label htmlFor="shipping-charges">Shipping charge</Label><Input id="shipping-charges" type="number" min="0" step="0.01" value={shippingCharges} onChange={event => setShippingCharges(event.target.value)} placeholder="0.00" /></div>}
                <div className="space-y-1.5"><Label htmlFor="listing-sku">SKU</Label><Input id="listing-sku" value={sku} onChange={event => setSku(event.target.value)} maxLength={100} placeholder="Optional product code" /></div>
                <div className="space-y-1.5"><Label htmlFor="listing-barcode">Barcode</Label><Input id="listing-barcode" value={barcode} onChange={event => setBarcode(event.target.value)} maxLength={100} placeholder="Optional barcode" /></div>
                <div className="space-y-1.5"><Label htmlFor="listing-gtin">GTIN</Label><Input id="listing-gtin" value={gtin} onChange={event => setGtin(event.target.value)} maxLength={100} placeholder="Optional global trade number" /></div>
                <div className="space-y-1.5"><Label htmlFor="listing-mpn">MPN</Label><Input id="listing-mpn" value={mpn} onChange={event => setMpn(event.target.value)} maxLength={100} placeholder="Optional manufacturer part number" /></div>
                <div className="space-y-1.5"><Label htmlFor="weight-value">Weight</Label><div className="flex gap-2"><Input id="weight-value" type="number" min="0" step="0.001" value={weightValue} onChange={event => setWeightValue(event.target.value)} placeholder="Optional" /><select aria-label="Weight unit" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={weightUnit} onChange={event => setWeightUnit(event.target.value)}><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option><option value="oz">oz</option></select></div></div>
                <div className="space-y-1.5"><Label>Dimensions</Label><div className="flex gap-2"><Input aria-label="Length" type="number" min="0" step="0.1" value={length} onChange={event => setLength(event.target.value)} placeholder="L" /><Input aria-label="Width" type="number" min="0" step="0.1" value={width} onChange={event => setWidth(event.target.value)} placeholder="W" /><Input aria-label="Height" type="number" min="0" step="0.1" value={height} onChange={event => setHeight(event.target.value)} placeholder="H" /><select aria-label="Dimension unit" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={sizeUnit} onChange={event => setSizeUnit(event.target.value)}><option value="cm">cm</option><option value="m">m</option><option value="in">in</option></select></div></div>
                <div className="space-y-1.5"><Label htmlFor="volume-value">Volume</Label><div className="flex gap-2"><Input id="volume-value" type="number" min="0" step="0.001" value={volumeValue} onChange={event => setVolumeValue(event.target.value)} placeholder="Optional" /><select aria-label="Volume unit" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={volumeUnit} onChange={event => setVolumeUnit(event.target.value)}><option value="l">L</option><option value="ml">mL</option><option value="m3">m³</option><option value="ft3">ft³</option></select></div></div>
              </div>
            </details>
            <div className="space-y-2">
              <Label htmlFor="listing-images">Photos</Label>
              <div className="flex flex-wrap gap-3">{imageUrls.map((url, index) => <div key={`${url}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border"><img src={url} alt={`Listing photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setImageUrls(current => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">Uploading…</div>)}</div>
              {imageUrls.length + files.length < 8 && <label htmlFor="listing-images" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="h-4 w-4" /> Add photos<input id="listing-images" type="file" accept="image/*" multiple onChange={handleUpload} className="sr-only" /></label>}
              <p className="text-xs text-muted-foreground">Add at least one photo, up to 8. Photos upload securely as you select them.</p>
              {uploadState.isLoading && <p className="text-xs text-muted-foreground">Uploading photos…</p>}
            </div>
            <Button type="submit" disabled={listingState.isLoading || scheduleState.isLoading || !!publishedListing || uploadState.isLoading || files.length > 0} className="btn-hero w-full sm:w-auto">{listingState.isLoading ? 'Publishing…' : scheduleState.isLoading ? 'Saving availability…' : 'Publish listing'}</Button>
            {publishedListing && <p className="text-sm text-muted-foreground">Listing created. <Link className="text-coffee-accent underline" to={`/listing/${publishedListing.slug}`}>View listing</Link> or <Link className="text-coffee-accent underline" to={`/booking/${publishedListing.slug}`}>open booking page</Link>.</p>}
          </form>
        )}
      </div>
    </Layout>
  )
}
