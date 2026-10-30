import TradlySDK from "tradly";
import { buildAppQueryPayload, buildAppDirectPayload } from "./sdk-context.ts";
import type {
	Listing,
	GetListingsParams,
	TradlyListingSdkResponse,
} from "@/types/listing.types";
import { AppConfig } from "@/config/app.config";

// Listings list
// SDK expects: { bodyParam: { page, ... }, pkKey, authKey, currency, language }
export const getListings = (
	params: GetListingsParams,
	authKey: string,
	currency: string,
	language: string,
): Promise<
	TradlyListingSdkResponse<{
		listings: Listing[];
		page: number;
		total_records: number;
	}>
> => {
	const bodyParam = params.page ? { ...params } : { ...params, page: 1 };
	return (TradlySDK as any).app.getListings(
		buildAppQueryPayload(
			bodyParam as Record<string, unknown>,
			authKey,
			currency,
			language,
		),
	);
};

// Single listing by slug or ID
// SDK expects: { id, pkKey, authKey, currency, language }  OR  { slug, pkKey, authKey, currency, language }
export const getListingDetail = (
	slug: string,
	useId: boolean,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyListingSdkResponse<{ listing: Listing }>> => {
	const slugFirstToken = slug.split("-")[0] ?? "";
	const isNumeric = /^\d+$/.test(slugFirstToken);
	const byId = isNumeric && useId;

	const params = byId ? { id: slugFirstToken } : { slug };
	return (TradlySDK as any).app.getListingDetail(
		buildAppDirectPayload(params, authKey, currency, language),
	);
};

// Like a listing
// SDK expects: { id, isLiked, pkKey, authKey, currency, language }
export const likeListing = (
	id: number,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyListingSdkResponse<Record<string, never>>> =>
	(TradlySDK as any).app.likeListing(
		buildAppDirectPayload(
			{ id, isLiked: false },
			authKey,
			currency,
			language,
		),
	);

// Unlike a listing
// SDK expects: { id, isUnLiked, pkKey, authKey, currency, language }
export const unlikeListing = (
	id: number,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyListingSdkResponse<Record<string, never>>> =>
	(TradlySDK as any).app.unlikeListing(
		buildAppDirectPayload(
			{ id, isUnLiked: true },
			authKey,
			currency,
			language,
		),
	);

// Create a listing for a seller account. Tradly expects the listing payload nested under data.listing.
export const createListing = (
	listing: Record<string, unknown>,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyListingSdkResponse<{ listing: Listing }>> =>
	(TradlySDK as any).app.postListing({
		pkKey: AppConfig.pkKey,
		authKey,
		currency,
		language,
		data: { listing },
	});

export const updateListing = (
	id: number | string,
	listing: Record<string, unknown>,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyListingSdkResponse<{ listing: Listing }>> =>
	(TradlySDK as any).app.postListing({
		id: String(id), pkKey: AppConfig.pkKey, authKey, currency, language,
		data: { listing },
	});

export const deleteListing = (id: number | string, authKey: string, currency: string, language: string): Promise<any> =>
	(TradlySDK as any).app.deleteListing({ id: String(id), pkKey: AppConfig.pkKey, authKey, currency, language });

export const markListingSold = (id: number | string, authKey: string, currency: string, language: string): Promise<any> =>
	(TradlySDK as any).app.commonFuntion({ path: `/v1/listings/${id}/sold`, Method: 'POST', pkKey: AppConfig.pkKey, authKey, currency, language });

export const getListingSuggestions = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
	(TradlySDK as any).app.getListingsSuggestion({ bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language });

export const getListingLocations = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
	(TradlySDK as any).app.getListingsLocations({ bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language });
