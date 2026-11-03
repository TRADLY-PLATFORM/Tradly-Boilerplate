/**
 * The Tradly tool describes available units and a quote, but does not publish
 * their response field names. Keep checkout disabled until the shape has been
 * verified against a real rental listing; update this parser before enabling it.
 */
export const isRentalAvailabilityConfirmed = (_response: unknown, _requestedUnits: number): boolean => false
