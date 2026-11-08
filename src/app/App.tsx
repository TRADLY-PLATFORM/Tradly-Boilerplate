import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useRefreshAuthMutation } from '@/state/auth/api'
import { useAuthSelector } from '@/state/auth/selectors'
import SignInPage from '../pages/SignInPage'
import SignUpPage from '../pages/SignUpPage'
import VerifyOtpPage from '../pages/VerifyOtpPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import HomePage from '../pages/HomePage'
import ListingDetailPage from '../pages/ListingDetailPage'
import BookingListingPage from '../pages/BookingListingPage'
import RentalListingPage from '../pages/RentalListingPage'
import RentalOrderPage from '../pages/RentalOrderPage'
import BookingOrderPage from '../pages/BookingOrderPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import ThankYouPage from '../pages/ThankYouPage'
import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import CategoryListingsPage from '../pages/CategoryListingsPage'
import PaymentPage from '../pages/PaymentPage'
import PaymentReturnPage from '../pages/PaymentReturnPage'
import SellPage from '../pages/SellPage'
import AccountPage from '../pages/AccountPage'
import ManageListingsPage from '../pages/ManageListingsPage'
import SellerInsightsPage from '../pages/SellerInsightsPage'
import FormsPage from '../pages/FormsPage'
import CollectionPage from '../pages/CollectionPage'
import DonationsPage from '../pages/DonationsPage'
import SavedListingsPage from '../pages/SavedListingsPage'
import SellerAccountsPage from '../pages/SellerAccountsPage'
import { layoutConfig } from '@/src/components/layout/layout.config'

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [refreshAuth] = useRefreshAuthMutation()
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)

  useEffect(() => {
    const init = async () => {
      // isAuthenticated is hydrated from cookies/localStorage before first render,
      // so this correctly fires the refresh call on every page reload for logged-in users.
      if (isAuthenticated) {
        await refreshAuth()
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Loading…
    </div>
  )
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <Routes>
          {/* Auth */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:slug" element={<ListingDetailPage />} />
          <Route path="/booking/:slug" element={<BookingListingPage />} />
          {layoutConfig.features.rental && <Route path="/rental/:slug" element={<RentalListingPage />} />}
          <Route path="/lc/:slug" element={<CategoryListingsPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/:formId" element={<FormsPage />} />
          <Route path="/collections/:collectionId" element={<CollectionPage />} />
          {layoutConfig.features.donations && <Route path="/donations" element={<DonationsPage />} />}

          {/* Protected */}
          <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          {layoutConfig.features.savedListings && <Route path="/saved-listings" element={<ProtectedRoute><SavedListingsPage /></ProtectedRoute>} />}
          {layoutConfig.features.sellerAccounts && <Route path="/seller/accounts" element={<ProtectedRoute><SellerAccountsPage /></ProtectedRoute>} />}
          {layoutConfig.features.manageListings && <Route path="/manage-listings" element={<ProtectedRoute><ManageListingsPage /></ProtectedRoute>} />}
          {layoutConfig.features.sellerInsights && <Route path="/seller/insights" element={<ProtectedRoute><SellerInsightsPage /></ProtectedRoute>} />}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-return" element={<PaymentReturnPage />} />
          <Route path="/checkouts/:reference/thank-you" element={<ThankYouPage />} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/booking/orders/:id" element={<ProtectedRoute><BookingOrderPage /></ProtectedRoute>} />
          <Route path="/rental/orders/:id" element={<ProtectedRoute><RentalOrderPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  )
}
