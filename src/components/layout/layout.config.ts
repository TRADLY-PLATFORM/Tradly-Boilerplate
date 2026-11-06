// Which shell features this site has. Sky Builder rewrites this file when a site
// plan removes pages, so the header and footer never link to missing routes.
export const layoutConfig = {
  tagline: 'Your trusted marketplace for quality products.',
  // https URL of the customer's logo; empty means show the brand name only. Sky Builder fills it in.
  logoUrl: '',
  cart: true,
  orders: true,
  signIn: true,
  signUp: true,
  features: {
    manageListings: true,
    sellerInsights: true,
    rental: true,
    visitorForms: true,
    donations: true,
    savedListings: true,
    sellerAccounts: true,
    // Appointment checkout asks for an address (pickup and delivery services such as laundry). Off for salons and clinics.
    /* @sky:slot features-extra */
    pickupAddress: false,
    /* @sky:slot-end */
  },
}
