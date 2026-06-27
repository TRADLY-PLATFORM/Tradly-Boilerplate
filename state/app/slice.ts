import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { AppConfig } from '@/config/app.config'

export interface AppState {
  currency: string
  language: string
}

const initialState: AppState = {
  // Starts with the hardcoded config default.
  // Can be swapped at runtime (e.g. user switches language in settings).
  currency: AppConfig.defaultCurrency,
  language: AppConfig.defaultLanguage,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
  },
})

export const { setCurrency, setLanguage } = appSlice.actions
