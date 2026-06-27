import { useSelector } from 'react-redux'
import type { RootState } from '@/state/store'
import type { AuthSliceState } from '@/types/auth.types'

export const useAuthSelector = <T>(selector: (auth: AuthSliceState) => T): T =>
  useSelector((s: RootState) => selector(s.auth))
