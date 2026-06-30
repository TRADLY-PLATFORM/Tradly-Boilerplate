import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as addressesAPI from "@/api/addresses";
import type {
	Address,
	AddAddressInput,
	GetAddressesResponse,
	GetStorageHubAddressesResponse,
} from "@/types/checkout.types";

interface LocalState {
	auth: { authKey: string };
	app: { currency: string; language: string };
}

const ctx = (state: LocalState) => ({
	authKey: state.auth.authKey,
	currency: state.app.currency,
	language: state.app.language,
});

export const addressesApi = createApi({
	reducerPath: "addressesApi",
	baseQuery: fetchBaseQuery({ baseUrl: "/" }),
	tagTypes: ["Address"],
	keepUnusedDataFor: 300,
	endpoints: (builder) => ({
		// Shipping addresses (type: 'shipping')
		// result.data → { addresses: Address[] }
		getAddresses: builder.query<GetAddressesResponse, void>({
			queryFn: async (_arg, { getState }) => {
				const { authKey, currency, language } = ctx(
					getState() as LocalState,
				);
				try {
					const res = await addressesAPI.getAddresses(
						authKey,
						currency,
						language,
					);
					if (res?.error)
						return {
							error: {
								status: "CUSTOM_ERROR",
								error:
									res.error
										.message ??
									"Failed to fetch addresses",
							},
						};
					return {
						data: {
							addresses: res.data!.addresses,
						},
					};
				} catch (err) {
					return {
						error: {
							status: "CUSTOM_ERROR",
							error: (err as Error).message,
						},
					};
				}
			},
			providesTags: (result) =>
				result
					? [
							...result.addresses.map(
								(a) => ({
									type: "Address" as const,
									id: a.id,
								}),
							),
							{
								type: "Address",
								id: "LIST",
							},
						]
					: [{ type: "Address", id: "LIST" }],
		}),

		// Storage hub pick-up locations (type: 'storage_hub')
		// result.data → { addresses: StorageHubAddress[] }
		getStorageHubAddresses: builder.query<
			GetStorageHubAddressesResponse,
			void
		>({
			queryFn: async (_arg, { getState }) => {
				const { authKey, currency, language } = ctx(
					getState() as LocalState,
				);
				try {
					const res =
						await addressesAPI.getStorageHubAddresses(
							authKey,
							currency,
							language,
						);
					if (res?.error)
						return {
							error: {
								status: "CUSTOM_ERROR",
								error:
									res.error
										.message ??
									"Failed to fetch storage hubs",
							},
						};
					return {
						data: {
							addresses: res.data!.addresses,
						},
					};
				} catch (err) {
					return {
						error: {
							status: "CUSTOM_ERROR",
							error: (err as Error).message,
						},
					};
				}
			},
		}),

		addAddress: builder.mutation<
			{ address: Address },
			AddAddressInput
		>({
			queryFn: async (input, { getState }) => {
				const { authKey, currency, language } = ctx(
					getState() as LocalState,
				);
				try {
					const res = await addressesAPI.addAddress(
						input,
						authKey,
						currency,
						language,
					);
					if (res?.error)
						return {
							error: {
								status: "CUSTOM_ERROR",
								error:
									res.error
										.message ??
									"Failed to add address",
							},
						};
					return {
						data: { address: res.data!.address },
					};
				} catch (err) {
					return {
						error: {
							status: "CUSTOM_ERROR",
							error: (err as Error).message,
						},
					};
				}
			},
			invalidatesTags: [{ type: "Address", id: "LIST" }],
		}),

		deleteAddress: builder.mutation<void, number>({
			queryFn: async (id, { getState }) => {
				const { authKey, currency, language } = ctx(
					getState() as LocalState,
				);
				try {
					const res = await addressesAPI.deleteAddress(
						id,
						authKey,
						currency,
						language,
					);
					if (res?.error)
						return {
							error: {
								status: "CUSTOM_ERROR",
								error:
									res.error
										.message ??
									"Failed to delete address",
							},
						};
					return { data: undefined };
				} catch (err) {
					return {
						error: {
							status: "CUSTOM_ERROR",
							error: (err as Error).message,
						},
					};
				}
			},
			invalidatesTags: (_result, _err, id) => [
				{ type: "Address", id },
			],
		}),
	}),
});

export const {
	useGetAddressesQuery,
	useGetStorageHubAddressesQuery,
	useAddAddressMutation,
	useDeleteAddressMutation,
} = addressesApi;

