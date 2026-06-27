export type TradlyEnv = "production" | "development" | "sandbox";

export const AppConfig = {
	// Your Tradly workspace domain e.g. "beauty.tradly.co"
	domain: import.meta.env.VITE_TRADLY_DOMAIN ?? "",

	// Public key for this workspace — set in .env, never commit the real value
	pkKey: import.meta.env.VITE_TRADLY_PK_KEY ?? "",

	// Deployment environment
	env: (import.meta.env.VITE_TRADLY_ENV ?? "production") as TradlyEnv,

	// Default currency — hardcoded fallback, can be swapped at runtime via state/app.slice.ts
	defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY ?? "USD",

	// Default language — hardcoded fallback, can be swapped at runtime via state/app.slice.ts
	defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? "en",
} as const;

export type AppConfigType = typeof AppConfig;

