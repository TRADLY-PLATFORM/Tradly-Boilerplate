import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { AppConfig } from '@/config/app.config'
import type { User, UserTokens, Country, AuthSliceState } from '@/types/auth.types'

const ONE_HOUR = 3600 // seconds — cookie max-age

const key = (name: string) => `${AppConfig.domain}_${name}`

const setCookie = (name: string, value: string | boolean, maxAge?: number) => {
  if (typeof document === 'undefined') return
  let cookie = `${name}=${encodeURIComponent(String(value))}; path=/; SameSite=Lax`
  if (maxAge) cookie += `; max-age=${maxAge}`
  document.cookie = cookie
}

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0`
}

const setAuthCookies = (user: User) => {
  setCookie(key('auth_key'), user.key.auth_key, ONE_HOUR)
  setCookie(key('refresh_key'), user.key.refresh_key)
  setCookie(key('login'), true)
  setCookie(key('logged_in_user_id'), user.id)
  if (user.key.firebase_token) {
    setCookie(key('firebase_token'), user.key.firebase_token)
  }
}

const clearAuthCookies = () => {
  deleteCookie(key('auth_key'))
  deleteCookie(key('refresh_key'))
  deleteCookie(key('login'))
  deleteCookie(key('logged_in_user_id'))
  deleteCookie(key('firebase_token'))
  deleteCookie(key('new_user_verify_id'))
}

const initialState: AuthSliceState = {
  isAuthenticated: false,
  userId: '',
  email: '',
  firstName: '',
  lastName: '',
  profilePic: '',
  mobile: '',
  dialCode: '',
  emailVerified: false,
  otpEnabled: false,
  authKey: '',
  refreshKey: '',
  firebaseToken: '',
  tokenSetAt: null,
  verifyId: null,
  countries: [],
  tenantCountries: [],
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      const user = action.payload
      state.isAuthenticated = true
      state.userId = user.id
      state.email = user.email
      state.firstName = user.first_name
      state.lastName = user.last_name
      state.profilePic = user.profile_pic ?? ''
      state.mobile = user.mobile
      state.dialCode = user.dial_code
      state.emailVerified = user.email_verified
      state.otpEnabled = user.otp_enabled
      state.authKey = user.key.auth_key
      state.refreshKey = user.key.refresh_key
      state.firebaseToken = user.key.firebase_token ?? ''
      state.tokenSetAt = Date.now()
      state.verifyId = null
      setAuthCookies(user)
    },

    setVerifyId: (state, action: PayloadAction<string>) => {
      state.verifyId = action.payload
      setCookie(key('new_user_verify_id'), action.payload)
    },

    updateTokens: (state, action: PayloadAction<UserTokens>) => {
      state.authKey = action.payload.auth_key
      state.refreshKey = action.payload.refresh_key
      state.firebaseToken = action.payload.firebase_token ?? ''
      state.tokenSetAt = Date.now()
      setCookie(key('auth_key'), action.payload.auth_key, ONE_HOUR)
      setCookie(key('refresh_key'), action.payload.refresh_key)
    },

    setCountries: (state, action: PayloadAction<Country[]>) => {
      state.countries = action.payload
    },

    setTenantCountries: (state, action: PayloadAction<Country[]>) => {
      state.tenantCountries = action.payload
    },

    logout: (state) => {
      Object.assign(state, initialState)
      clearAuthCookies()
    },
  },
})

export const {
  setCredentials,
  setVerifyId,
  updateTokens,
  setCountries,
  setTenantCountries,
  logout,
} = authSlice.actions
