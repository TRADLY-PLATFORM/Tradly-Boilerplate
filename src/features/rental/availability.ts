/**
 * Tradly's GET /v1/rentals/availability answers { available, requested, price, deposit, settings }
 * (verified against a live rental listing): `available` is how many units are free for the dates, `price` the total
 * rent for the whole range. Rentable when at least the requested number of units is free.
 */
export type RentalAvailability = { available?: number; requested?: number; price?: number; deposit?: number }

export const isRentalAvailabilityConfirmed = (response: unknown, requestedUnits: number): boolean => {
  const available = Number((response as RentalAvailability | null)?.available)
  return Number.isFinite(available) && available >= Math.max(1, requestedUnits)
}

/** Total rent quoted for the dates, when the response carries one. */
export const rentalQuotedPrice = (response: unknown): number | null => {
  const price = Number((response as RentalAvailability | null)?.price)
  return Number.isFinite(price) && price > 0 ? price : null
}
