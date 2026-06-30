import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { authApi } from './auth/api'
import { listingApi } from './listing/api'
import { cartApi } from './cart/api'
import { ordersApi } from './orders/api'
import { categoriesApi } from './categories/api'
import { addressesApi } from './addresses/api'
import { shippingMethodsApi } from './shipping-methods/api'
import { paymentMethodsApi } from './payment-methods/api'
import { commissionsApi } from './commissions/api'
import { schedulesApi } from './schedules/api'
import { authSlice } from './auth/slice'
import { appSlice } from './app/slice'

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
  [ordersApi.reducerPath]: ordersApi.reducer,
  [categoriesApi.reducerPath]: categoriesApi.reducer,
  [addressesApi.reducerPath]: addressesApi.reducer,
  [shippingMethodsApi.reducerPath]: shippingMethodsApi.reducer,
  [paymentMethodsApi.reducerPath]: paymentMethodsApi.reducer,
  [commissionsApi.reducerPath]: commissionsApi.reducer,
  [schedulesApi.reducerPath]: schedulesApi.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(authApi.middleware)
      .concat(listingApi.middleware)
      .concat(cartApi.middleware)
      .concat(ordersApi.middleware)
      .concat(categoriesApi.middleware)
      .concat(addressesApi.middleware)
      .concat(shippingMethodsApi.middleware)
      .concat(paymentMethodsApi.middleware)
      .concat(commissionsApi.middleware)
      .concat(schedulesApi.middleware),
})

export const persistor = persistStore(store)
export type AppDispatch = typeof store.dispatch
