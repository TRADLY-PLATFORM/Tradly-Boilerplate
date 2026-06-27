import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { authApi } from './auth/api'
import { listingApi } from './listing/api'
import { cartApi } from './cart/api'
import { authSlice } from './auth/slice'
import { appSlice } from './app/slice'

// Direct localStorage wrapper — avoids redux-persist/lib/storage CJS/ESM interop issues in Vite.
// Falls back to no-ops on the server (Next.js SSR) where window is undefined.
const storage = typeof window !== 'undefined'
  ? {
      getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem:    (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(value) },
      removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve() },
    }
  : {
      getItem:    (_key: string): Promise<string | null> => Promise.resolve(null),
      setItem:    (_key: string, value: string): Promise<string> => Promise.resolve(value),
      removeItem: (_key: string): Promise<void> => Promise.resolve(),
    }

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'app'],
}

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  app: appSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [listingApi.reducerPath]: listingApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
})

// Derive RootState from rootReducer — not from store.getState — to avoid circular dependency
export type RootState = ReturnType<typeof rootReducer>

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(authApi.middleware)
      .concat(listingApi.middleware)
      .concat(cartApi.middleware),
})

export const persistor = persistStore(store)
export type AppDispatch = typeof store.dispatch
