const UUID_STORAGE_KEY = 'tradly_device_uuid'

// Generates a UUID v4 string
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Returns the device UUID — generates and persists one on first call.
// Works in browser (localStorage) and falls back to an in-memory value
// for server-side or React Native environments.
let _memoryUUID: string | null = null

export const getDeviceUUID = (): string => {
  // Server-side or React Native: use in-memory UUID for this session
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    if (!_memoryUUID) _memoryUUID = generateUUID()
    return _memoryUUID
  }

  // Browser: persist across sessions
  const stored = localStorage.getItem(UUID_STORAGE_KEY)
  if (stored) return stored

  const fresh = generateUUID()
  localStorage.setItem(UUID_STORAGE_KEY, fresh)
  return fresh
}
