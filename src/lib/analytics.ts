// Tradly analytics helpers, the same pattern as the Tradly storefront (Barrow). Every function is best effort and never
// throws: analytics must not break a page. The tracker (`TradlyAnalytics.tsx`) defines `window.ta`; until it has loaded,
// identify and track calls wait in `window.__tradlyMemoryQueue`, which the tracker drains when it starts.

type QueueEntry = { type: 'identify'; id: string } | { type: 'track'; eventName: string; properties: Record<string, unknown> }
type TradlyWindow = Window & {
  ta?: { identify?: (id: string) => void; track?: (event: string, props?: Record<string, unknown>) => void }
  __tradlyMemoryQueue?: QueueEntry[]
}

const win = (): TradlyWindow | null => (typeof window === 'undefined' ? null : (window as TradlyWindow))

/**
 * The Tradly tenant id of this store. Each tenant is its own analytics project, owned by the business, so the tracker is
 * pointed at it. It is read from the store's public key (a token that carries `tenant_id`). An empty string means it could
 * not be worked out: then no tracker is loaded, rather than sending events to the wrong project.
 */
export function tenantIdFromKey(key: string): string {
  try {
    const payload = key.split('.')[1]
    if (!payload) return ''
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='))
    const claims = JSON.parse(json) as Record<string, unknown>
    const id = claims.tenant_id ?? claims.tenantId
    return id == null ? '' : String(id).trim()
  } catch {
    return ''
  }
}

function queue(entry: QueueEntry) {
  const w = win()
  if (!w) return
  w.__tradlyMemoryQueue = w.__tradlyMemoryQueue || []
  w.__tradlyMemoryQueue.push(entry)
}

export function identifyAnalyticsUser({ tenantId, userId }: { tenantId: string; userId: string | number | null | undefined }) {
  const w = win()
  if (!w || !tenantId || !userId) return
  const id = `tenant:${tenantId}:user:${userId}`
  if (w.ta?.identify) w.ta.identify(id)
  else queue({ type: 'identify', id })
}

export function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  const w = win()
  if (!w) return
  try {
    if (w.ta?.track) w.ta.track(eventName, properties)
    else queue({ type: 'track', eventName, properties })
  } catch {
    /* analytics must never throw */
  }
}

const numeric = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const oncePerSession = (key: string) => {
  try {
    if (window.sessionStorage.getItem(key)) return false
    window.sessionStorage.setItem(key, '1')
  } catch {
    /* storage unavailable: still track */
  }
  return true
}

export function listingProperties(item: any, currency?: string) {
  const listing = item?.listing || item || {}
  const category = listing?.categories?.[0]
  const price = item?.list_price?.amount ?? item?.offer_price?.amount ?? listing?.list_price?.amount ?? listing?.offer_price?.amount
  const image = listing?.images?.[0]
  const imageUrl = typeof image === 'string' ? image : image?.url || image?.url_path || image?.image_path || ''
  return {
    listing_id: listing?.id != null ? String(listing.id) : '',
    listing_slug: listing?.slug || '',
    category_id: category?.id != null ? String(category.id) : '',
    category_slug: category?.slug || '',
    listing_title: listing?.title || '',
    listing_image_url: imageUrl,
    listing_url: listing?.slug && typeof window !== 'undefined' ? `${window.location.origin}/l/${listing.slug}` : '',
    quantity: numeric(item?.quantity) || 1,
    unit_price: numeric(price),
    currency: currency || item?.list_price?.currency || item?.offer_price?.currency || listing?.offer_price?.currency || '',
  }
}

export function trackListingView(listing: any) {
  if (!listing?.id || !oncePerSession(`tradly-listing:${listing.id}`)) return
  trackEvent('listing_view', { ...listingProperties(listing), source: 'listing_page' })
}

export function trackCheckoutStarted({ cart, cartDetails }: { cart: any; cartDetails: any[] }) {
  const cartId = cart?.id
  if (!cartId || !Array.isArray(cartDetails) || cartDetails.length === 0) return
  if (!oncePerSession(`tradly-checkout:${cartId}`)) return
  cartDetails.forEach((item) => trackEvent('checkout_started', listingProperties(item, cart?.currency?.code || cart?.currency)))
}

export function trackCompletedPurchase(order: any) {
  const reference = order?.reference_number || order?.id
  if (!reference || !oncePerSession(`tradly-purchase:${reference}`)) return
  const items: any[] = order?.shipments?.length
    ? order.shipments.flatMap((s: any) => s?.order_details || [])
    : order?.order_details || []
  items.forEach((item) => trackEvent('purchase_completed', listingProperties(item, order?.currency?.code || order?.currency)))
}
