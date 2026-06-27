// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "buyer" | "seller" | "admin";
export type AccountType = "customer" | "store";
export type AuthProvider = "google" | "facebook" | "apple";
export type AuthPlatform = "web" | "ios" | "android";

// 1 = email, 3 = phone — matches TYPE_CONSTANT.AUTH_TYPE from Tradly
export type AuthType = 1 | 3;

// ─── Domain entities ──────────────────────────────────────────────────────────

export interface UserTokens {
	auth_key: string;
	refresh_key: string;
	firebase_token?: string;
}

export interface UserMetadata {
	stripe_connected: boolean;
	stripe_connect_onboarding: boolean;
	mangopay_kyc_submission: boolean;
	mangopay_payouts_enabled: boolean;
}

export interface User {
	id: string;
	first_name: string;
	last_name: string;
	email: string;        // always present, may be empty string
	mobile: string;       // always present, may be empty string
	dial_code: string;    // always present, may be empty string
	profile_pic?: string;
	birth_date: string | null;
	email_verified: boolean;
	otp_enabled: boolean;
	metadata: UserMetadata;
	key: UserTokens;
}

export interface Country {
	id: number;
	name: string;
	code: string; // ISO 3-letter
	code2: string; // ISO 2-letter, used for phone flag
	dial_code?: string;
	default?: boolean;
}

// ─── Component input types ────────────────────────────────────────────────────
// These are what the component passes to the RTK mutation hook.
// uuid is never required from the component — it is added automatically by the state layer.

export interface SignInEmailInput {
	email: string;
	password: string;
	type: AccountType;
}

export interface SignInPhoneInput {
	mobile: string;
	dial_code: string;
	password: string;
	type: AccountType;
}

export type SignInInput = SignInEmailInput | SignInPhoneInput;

export interface SignUpEmailInput {
	first_name: string;
	last_name: string;
	email: string;
	password: string;
	mobile?: string;
	dial_code?: string;
	country_id?: number;
	type: AccountType;
}

export interface SignUpPhoneInput {
	first_name: string;
	last_name: string;
	mobile: string;
	dial_code: string;
	password: string;
	type: AccountType;
}

export type SignUpInput = SignUpEmailInput | SignUpPhoneInput;

export interface VerifyOtpInput {
	verify_id: string;
	code: string;
}

export interface ForgotPasswordInput {
	email?: string;
	mobile?: string;
	dial_code?: string;
}

export interface SetPasswordInput {
	verify_id: string;
	code: string;
	password: string;
}

export type ResendOtpInput = SignUpEmailInput | SignUpPhoneInput;

export interface SocialSignInInput {
	provider: AuthProvider;
	token: string;
	platform: AuthPlatform;
	type: AccountType;
}


// ─── SDK raw response (internal) ─────────────────────────────────────────────
// Full envelope from the Tradly SDK — only used inside api/auth.ts
export interface TradlyError {
	code: number;
	message: string;
}
export interface TradlySdkResponse<T> {
	status?: boolean;
	data?: T;
	error?: TradlyError;
}

// ─── Mutation result types (what components receive) ─────────────────────────
// These are the unwrapped, useful payloads — no SDK envelope, no double nesting.

export interface SignInResponse { user: User }
export interface SignUpResponse { verify_id: string }
export interface VerifyOtpResponse { user: User }
export interface ForgotPasswordResponse { verify_id: string }
export interface ResendOtpResponse { verify_id: string }

// ─── Redux slice state ────────────────────────────────────────────────────────

export interface AuthSliceState {
	isAuthenticated: boolean;

	// Identity
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	profilePic: string;
	mobile: string;
	dialCode: string;

	// Verification flags
	emailVerified: boolean;
	otpEnabled: boolean;

	// Auth tokens
	authKey: string;
	refreshKey: string;
	firebaseToken: string;

	// Timestamp (ms) when auth_key was last set — used to decide when to refresh (1 hour)
	tokenSetAt: number | null;

	// Post sign-up, before OTP verification
	verifyId: string | null;

	// Countries for phone/country pickers
	countries: Country[];
	tenantCountries: Country[];
}

