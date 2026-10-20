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
  year: number
  isAuthenticated: boolean
  firstName: string
  /** Primary navigation, already filtered for auth state and enabled pages. */
  navLinks: NavLink[]
  /** Top-level categories for the nav dropdown (empty while loading). */
  categories: Category[]
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
  const cartCount = useCartItemCount()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: categoriesData } = useGetCategoriesQuery({ page: 1, limit: 12 })
  const categories = categoriesData?.categories ?? []

  const navLinks: NavLink[] = [{ label: 'Home', to: '/' }]
  if (!isAuthenticated && layoutConfig.signUp) navLinks.push({ label: 'Sell', to: '/sign-up' })
  if (isAuthenticated && layoutConfig.orders) navLinks.push({ label: 'My Orders', to: '/orders' })

  const quickLinks: NavLink[] = [{ label: 'Home', to: '/' }]
  if (layoutConfig.orders) quickLinks.push({ label: 'My Orders', to: '/orders' })
  if (layoutConfig.cart) quickLinks.push({ label: 'Cart', to: '/cart' })

  const accountLinks: NavLink[] = []
  if (layoutConfig.signIn) accountLinks.push({ label: 'Sign In', to: '/sign-in' })
  if (layoutConfig.signUp) accountLinks.push({ label: 'Create Account', to: '/sign-up' })

  const footerLinkGroups: FooterLinkGroup[] = [{ title: 'Quick Links', links: quickLinks }]
  if (accountLinks.length > 0) footerLinkGroups.push({ title: 'Account', links: accountLinks })

  return {
    brandName,
    tagline: layoutConfig.tagline,
    year: new Date().getFullYear(),
    isAuthenticated,
    firstName: firstName || '',
    navLinks,
    categories,
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
