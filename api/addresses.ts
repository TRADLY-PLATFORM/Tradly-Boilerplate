import TradlySDK from "tradly";
import {
	buildAppQueryPayload,
	buildAppMutationPayload,
	buildAppDirectPayload,
} from "@/api/sdk-context";
import type {
	Address,
	AddAddressInput,
	GetAddressesResponse,
	TradlyCheckoutSdkResponse,
} from "@/types/checkout.types";

export const getAddresses = (
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<GetAddressesResponse>> =>
	(TradlySDK as any).app.getAddress(
		buildAppQueryPayload(
			{ type: "shipping" },
			authKey,
			currency,
			language,
		),
	);

export const addAddress = (
	input: AddAddressInput,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<{ address: Address }>> =>
	(TradlySDK as any).app.addEditAddress(
		buildAppMutationPayload(
			{ address: input },
			authKey,
			currency,
			language,
		),
	);

export const deleteAddress = (
	id: number,
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<Record<string, never>>> =>
	(TradlySDK as any).app.deleteAddress(
		buildAppDirectPayload({ id }, authKey, currency, language),
	);

// Get storage hub addresses (pick-up point locations)
// SDK expects type: 'storage_hub' in bodyParam
export const getStorageHubAddresses = (
	authKey: string,
	currency: string,
	language: string,
): Promise<
	import("@/types/checkout.types").TradlyCheckoutSdkResponse<
		import("@/types/checkout.types").GetStorageHubAddressesResponse
	>
> =>
	(TradlySDK as any).app.getAddress(
		buildAppQueryPayload(
			{ type: "storage_hub" },
			authKey,
			currency,
			language,
		),
	);

