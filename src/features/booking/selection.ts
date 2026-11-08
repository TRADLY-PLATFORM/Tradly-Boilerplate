// The time a customer picked on a booking page. The cart and checkout read it from the URL, but the URL is lost
// when the customer opens the cart from the header or refreshes it, so the pick is also kept for the session.
const KEY = 'sky_booking_selection'

export type BookingSelection = { listingId: number; scheduleId: number; day: string; start: string; end: string }

export function saveBookingSelection(selection: BookingSelection) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(selection))
  } catch {
    // storage can be blocked; the URL still carries the pick for the next page
  }
}

export function loadBookingSelection(listingId: number | undefined): BookingSelection | null {
  if (!listingId) return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookingSelection
    return parsed && Number(parsed.listingId) === Number(listingId) && parsed.scheduleId && parsed.day && parsed.start ? parsed : null
  } catch {
    return null
  }
}
