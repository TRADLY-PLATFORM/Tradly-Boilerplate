import TradlySDK from "tradly";
import { buildAppDirectPayload, buildAppQueryPayload } from "@/api/sdk-context";
import type {
	GetShippingMethodsResponse,
	GetShipmentMethodsResponse,
	TradlyCheckoutSdkResponse,
} from "@/types/checkout.types";

// type: 'tenant' for platform-level methods, or pass account_id for seller-specific methods
export const getShippingMethods = (
	params: { type?: string; account_id?: number } = {},
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<GetShippingMethodsResponse>> =>
	(TradlySDK as any).app.getShippingMethods(
		buildAppDirectPayload(
			params as Record<string, unknown>,
			authKey,
			currency,
			language,
		),
	);

// Get SendCloud shipment sub-methods for a given shipping method + destination country
export const getSendCloudShipmentMethods = (
	params: { shipping_method_id: number; country: string },
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<GetShipmentMethodsResponse>> =>
	(TradlySDK as any).app.getSendCloudShipments(
		buildAppQueryPayload(
			params as Record<string, unknown>,
			authKey,
			currency,
			language,
		),
	);

// Get external extension shipment sub-methods (requires address selection first)
export const getExternalShipmentMethods = (
	params: { shipping_method_id: number; shipping_address_id: number },
	authKey: string,
	currency: string,
	language: string,
): Promise<TradlyCheckoutSdkResponse<GetShipmentMethodsResponse>> =>
	(TradlySDK as any).app.getExternalShipments(
		buildAppQueryPayload(
			params as Record<string, unknown>,
			authKey,
			currency,
			language,
		),
	);

