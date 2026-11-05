import dayjs from 'dayjs'

type OrderItemLike = Record<string, any>

export function getItemOrderType(item: OrderItemLike, fallback = ''): string {
  const listing = item?.listing ?? {}
  if (listing.order_type) return String(listing.order_type)
  if (['rental', 'rentals', 'events', 'appointments', 'donation', 'digital'].includes(String(listing.type))) return String(listing.type)
  if (listing.type === 'membership') return 'membership'
  return fallback
}

export function isRentalItem(item: OrderItemLike, fallback = ''): boolean {
  return ['rental', 'rentals'].includes(getItemOrderType(item, fallback))
}

export function isBookingOrderType(type: string): boolean {
  return type === 'events' || type === 'appointments'
}

export function formatOrderDate(value: unknown, format = 'ddd, MMM D, YYYY'): string {
  if (value == null || value === '') return ''
  const normalized = typeof value === 'number' && Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value
  const date = dayjs(normalized as string | number)
  return date.isValid() ? date.format(format) : ''
}

export function normalizeOrderDate(value: unknown): string | number {
  return typeof value === 'number' && Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value as string | number
}

export function formatOrderDateTimeRange(start: unknown, end?: unknown): string {
  const startDate = formatOrderDate(start, 'ddd, MMM D, YYYY · h:mm A')
  if (!startDate) return ''
  const endTime = end == null ? '' : formatOrderDate(end, 'h:mm A')
  return endTime ? `${startDate} – ${endTime}` : startDate
}

export function formatOrderDateRange(start: unknown, end?: unknown): string {
  const startDate = formatOrderDate(start, 'MMM D, YYYY · h:mm A')
  if (!startDate) return ''
  const endDate = end == null ? '' : formatOrderDate(end, 'MMM D, YYYY · h:mm A')
  return endDate ? `${startDate} – ${endDate}` : startDate
}
