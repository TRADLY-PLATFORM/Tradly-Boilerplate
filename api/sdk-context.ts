import { AppConfig } from "@/config/app.config";

// For auth SDK calls: TradlySDK.user.* — wraps in data + sends pkKey
export const buildSdkPayload = <T extends object>(
	data: T,
	currency: string,
	language: string,
): { data: T; pkKey: string; currency: string; language: string } => ({
	data: { ...data },
	pkKey: AppConfig.pkKey,
	currency,
	language,
});

// For app SDK query calls: TradlySDK.app.getListings / getCarts / getListingDetail
// SDK expects: { bodyParam, pkKey, authKey, currency, language }
export const buildAppQueryPayload = (
	bodyParam: Record<string, unknown>,
	authKey: string,
	currency: string,
	language: string,
) => {
	return {
		bodyParam,
		pkKey: AppConfig.pkKey,
		authKey,
		currency,
		language,
	};
};

// For app SDK mutation calls: TradlySDK.app.addToCart / deleteFromCart
// SDK expects: { data: { cart: {...} }, pkKey, authKey, currency, language }
export const buildAppMutationPayload = <T extends object>(
	data: T,
	authKey: string,
	currency: string,
	language: string,
) => ({ data, pkKey: AppConfig.pkKey, authKey, currency, language });

// For app SDK calls where params go flat at root: likeListing, unlikeListing, getListingDetail
// SDK expects: { id, isLiked, pkKey, authKey, currency, language }
export const buildAppDirectPayload = <T extends object>(
	params: T,
	authKey: string,
	currency: string,
	language: string,
) => ({ ...params, pkKey: AppConfig.pkKey, authKey, currency, language });

