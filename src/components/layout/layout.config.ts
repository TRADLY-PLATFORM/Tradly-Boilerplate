// Which shell features this site has. Sky Builder rewrites this file when a site
// plan removes pages, so the header and footer never link to missing routes.
export const layoutConfig = {
  tagline: 'Your trusted marketplace for quality products.',
  // https URL of the customer's logo; empty means show the brand name only. Sky Builder fills it in.
  logoUrl: '',
  /* @sky:slot style — how the header and footer look. Header: 'classic' (logo left, links, account), 'split' (links left, logo centred, account right), plus '-dark' for a solid brand-colour bar ('dark', 'split-dark'). Footer: 'columns' (brand colour, columns), 'centered' (light, brand and links in the middle), 'light' (columns on a light background). */
  headerStyle: 'classic' as 'classic' | 'split' | 'dark' | 'split-dark',
  footerStyle: 'columns' as 'columns' | 'centered' | 'light',
  /* @sky:slot-end */
  cart: true,
  orders: true,
  signIn: true,
  signUp: true,
  features: {
    // Forms and Support a cause are for sites that need them (Sky Builder turns donations on for fundraisers).
    manageListings: true,
    sellerInsights: true,
    rental: true,
    visitorForms: false,
    donations: false,
    savedListings: true,
    sellerAccounts: true,
    // Appointment checkout asks for an address (pickup and delivery services such as laundry). Off for salons and clinics.
    /* @sky:slot features-extra */
    pickupAddress: false,
    /* @sky:slot-end */
  },
}
