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

// Read a single cookie value by name — returns '' if not found
const readCookie = (name: string): string => {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

const PROFILE_STORAGE_KEY = key('user_profile')

const saveProfile = (user: User) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
      dial_code: user.dial_code,
      profile_pic: user.profile_pic ?? '',
      email_verified: user.email_verified,
      otp_enabled: user.otp_enabled,
    }))
  } catch { /* storage unavailable */ }
}

const clearProfile = () => {
  try { localStorage.removeItem(PROFILE_STORAGE_KEY) } catch { /* noop */ }
}

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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

// Hydrate from cookies + localStorage on startup so page reloads keep the user logged in.
// tokenSetAt is null to force a fresh token refresh on first AppInitializer run.
const storedAuthKey = readCookie(key('auth_key'))
const storedRefreshKey = readCookie(key('refresh_key'))
const storedLoginFlag = readCookie(key('login')) === 'true'
const storedFirebaseToken = readCookie(key('firebase_token'))
const storedProfile = loadProfile()

const initialState: AuthSliceState = {
  isAuthenticated: storedLoginFlag && !!storedRefreshKey,
  userId: storedProfile?.id ?? readCookie(key('logged_in_user_id')),
  email: storedProfile?.email ?? '',
  firstName: storedProfile?.first_name ?? '',
  lastName: storedProfile?.last_name ?? '',
  profilePic: storedProfile?.profile_pic ?? '',
  mobile: storedProfile?.mobile ?? '',
  dialCode: storedProfile?.dial_code ?? '',
  emailVerified: storedProfile?.email_verified ?? false,
  otpEnabled: storedProfile?.otp_enabled ?? false,
  authKey: storedAuthKey,
  refreshKey: storedRefreshKey,
  firebaseToken: storedFirebaseToken,
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
      saveProfile(user)
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
      Object.assign(state, {
        isAuthenticated: false,
        userId: '', email: '', firstName: '', lastName: '',
        profilePic: '', mobile: '', dialCode: '',
        emailVerified: false, otpEnabled: false,
        authKey: '', refreshKey: '', firebaseToken: '',
        tokenSetAt: null, verifyId: null,
      })
      clearAuthCookies()
      clearProfile()
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
