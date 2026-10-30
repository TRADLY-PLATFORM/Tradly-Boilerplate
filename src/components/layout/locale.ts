// Language, text direction and the fixed UI words for this site. Sky Builder rewrites this
// file when a site's language is not English. Everything else reads it, so don't inline words.
export const locale = {
  language: 'en',
  dir: 'ltr' as 'ltr' | 'rtl',
  labels: {
    home: 'Home',
    sell: 'Sell',
    myOrders: 'My Orders',
    myAccount: 'My Account',
    manageListings: 'Manage listings',
    sellerInsights: 'Seller insights',
    profile: 'Profile',
    email: 'Email',
    phone: 'Phone',
    notProvided: 'Not provided',
    categories: 'Categories',
    cart: 'Cart',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    account: 'Account',
    quickLinks: 'Quick Links',
    createAccount: 'Create Account',
    menu: 'Menu',
    allRightsReserved: 'All rights reserved.',
  },
}

export type LocaleLabels = typeof locale.labels
