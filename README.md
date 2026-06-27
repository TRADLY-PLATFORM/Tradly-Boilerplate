# Tradly Master Boilerplate — Pilot

Auth domain across all three layers. Pilot scope only.

---

## Folder structure

```
tradly-boilerplate/
├── types/
│   └── auth.types.ts         ← all auth TypeScript types
│
├── config/
│   └── app.config.ts         ← env vars, typed and centralised
│
├── api/
│   └── auth/
│       └── index.ts          ← raw Tradly JS SDK calls
│
├── state/
│   ├── store.ts              ← RTK store + redux-persist
│   └── auth/
│       ├── slice.ts          ← user, tokens, isAuthenticated (persisted)
│       └── api.ts            ← RTK Query endpoints + mutation hooks
│
└── flows/
    └── auth/
        └── index.ts          ← signInFlow, signUpFlow, verifyTokenFlow,
                                 forgotPasswordFlow, refreshAuthFlow, logoutFlow
```

---

## Architecture

```
UI component
 ├── hook path   → state/auth/api.ts (useSignInMutation)
 └── flow path   → flows/auth/ → state/auth/api.ts → api/auth/ → SDK
```

Three hard layers. Never mix them.

---

## Setup

```bash
npm install @reduxjs/toolkit react-redux redux-persist @tradly/js-sdk
```

`.env.local`:
```env
NEXT_PUBLIC_TRADLY_UUID=your-uuid
NEXT_PUBLIC_TRADLY_PK_KEY=your-pk-key
NEXT_PUBLIC_DEFAULT_CURRENCY=USD
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

Wrap your app root:
```tsx
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/state/store'

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

---

## Two ways to use auth

### Hook — inside a component
```typescript
import { useSignInMutation } from '@/state/auth/api'

const [signIn, { isLoading, error }] = useSignInMutation()
await signIn({ email, password })
```

### Flow — business logic with navigation
```typescript
import { signInFlow } from '@/flows/auth'

await signInFlow({ email, password }, (path) => router.push(path))
```

Use hooks when you only need loading/error state in a component.
Use flows when you need multi-step logic or post-auth navigation.

---

## Cherry-picking

Copy only what you need. Each layer is independent — you can use `state/auth/api.ts` hooks without flows, or use flows without touching hooks directly.

---

## Scaling to more domains

When pilot passes, each new domain follows the same pattern:

```
api/<domain>/index.ts
state/<domain>/slice.ts
state/<domain>/api.ts
flows/<domain>/index.ts
```

Register the new reducer + middleware in `state/store.ts`.
