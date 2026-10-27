// Platform code: all header/footer logic lives here (auth, cart, navigation).
// Header.tsx and Footer.tsx are design-only and must read everything from LayoutData.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuthSelector } from '@/state/auth/selectors'
import { useCartItemCount } from '@/state/cart/selectors'
import { logout as logoutAction } from '@/state/auth/slice'
import { useGetCategoriesQuery } from '@/state/categories/api'
import type { Category } from '../../../types/category.types'
import type { AppDispatch } from '@/state/store'
import { layoutConfig } from './layout.config'
import { locale, type LocaleLabels } from './locale'

export interface NavLink {
  label: string
  to: string
}

export interface FooterLinkGroup {
  title: string
  links: NavLink[]
}

export interface LayoutData {
  brandName: string
  tagline: string
  /** The customer's logo image URL, or '' when they have none. Show it next to or instead of the brand name. */
  logoUrl: string
  year: number
  /** Fixed UI words (Cart, Sign in...) in the site's language. Use these instead of hard-coded text. */
  labels: LocaleLabels
  isAuthenticated: boolean
  firstName: string
  profilePic: string
  accountMenuLinks: NavLink[]
  /** Primary navigation, already filtered for auth state and enabled pages. */
  navLinks: NavLink[]
  /** Live top-level categories as /lc/:slug links; empty while loading or when the store has none. */
  categoryLinks: NavLink[]
  /** True when the cart button should be shown (cart enabled and signed in). */
  showCart: boolean
  cartCount: number
  cartLink: string
  /** Sign-in / sign-up targets, or null when that page is disabled. */
  signInLink: string | null
  signUpLink: string | null
  footerLinkGroups: FooterLinkGroup[]
  mobileOpen: boolean
  toggleMobile: () => void
  closeMobile: () => void
  logout: () => void
}

export function useLayoutData(brandName: string): LayoutData {
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)
  const firstName = useAuthSelector(s => s.firstName)
  const profilePic = useAuthSelector(s => s.profilePic)
  const cartCount = useCartItemCount()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: categoriesData } = useGetCategoriesQuery({ page: 1, limit: 12 })
  const categoryLinks: NavLink[] = (categoriesData?.categories ?? []).map((cat: Category) => ({
    label: cat.name,
    to: `/lc/${cat.slug ?? `${cat.id}-${String(cat.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}`,
  }))

  const navLinks: NavLink[] = [{ label: locale.labels.home, to: '/' }]
  navLinks.push({
    label: locale.labels.sell,
    to: isAuthenticated ? '/sell' : '/sign-in?next=%2Fsell',
  })
  if (isAuthenticated && layoutConfig.orders) navLinks.push({ label: locale.labels.myOrders, to: '/orders' })

  const accountMenuLinks: NavLink[] = isAuthenticated
    ? [
        { label: locale.labels.myAccount, to: '/account' },
        { label: locale.labels.sell, to: '/sell' },
        ...(layoutConfig.orders ? [{ label: locale.labels.myOrders, to: '/orders' }] : []),
      ]
    : []

  const quickLinks: NavLink[] = [{ label: locale.labels.home, to: '/' }]
  if (layoutConfig.orders) quickLinks.push({ label: locale.labels.myOrders, to: '/orders' })
  if (layoutConfig.cart) quickLinks.push({ label: locale.labels.cart, to: '/cart' })

  const accountLinks: NavLink[] = []
  if (layoutConfig.signIn) accountLinks.push({ label: locale.labels.signIn, to: '/sign-in' })
  if (layoutConfig.signUp) accountLinks.push({ label: locale.labels.createAccount, to: '/sign-up' })

  const footerLinkGroups: FooterLinkGroup[] = [{ title: locale.labels.quickLinks, links: quickLinks }]
  if (accountLinks.length > 0) footerLinkGroups.push({ title: locale.labels.account, links: accountLinks })

  return {
    brandName,
    tagline: layoutConfig.tagline,
    logoUrl: layoutConfig.logoUrl,
    year: new Date().getFullYear(),
    labels: locale.labels,
    isAuthenticated,
    firstName: firstName || '',
    profilePic: profilePic || '',
    accountMenuLinks,
    navLinks,
    categoryLinks,
    showCart: isAuthenticated && layoutConfig.cart,
    cartCount,
    cartLink: '/cart',
    signInLink: layoutConfig.signIn ? '/sign-in' : null,
    signUpLink: layoutConfig.signUp ? '/sign-up' : null,
    footerLinkGroups,
    mobileOpen,
    toggleMobile: () => setMobileOpen(open => !open),
    closeMobile: () => setMobileOpen(false),
    logout: () => {
      setMobileOpen(false)
      dispatch(logoutAction())
      navigate(layoutConfig.signIn ? '/sign-in' : '/')
    },
  }
}
