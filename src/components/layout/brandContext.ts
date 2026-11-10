import { createContext, useContext } from 'react'

/** The store's name, provided by Layout, so pages inside a Layout can say it (policy pages, confirmations). */
export const BrandContext = createContext('')
export const useBrandName = () => useContext(BrandContext)
