import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
	useGetCartQuery,
	useGetCartWithCommissionsQuery,
	useApplyCouponMutation,
	useRemoveCouponMutation,
	cartApi,
} from "@/state/cart/api";
import {
	useCheckoutMutation,
	usePaymentIntentMutation,
} from "@/state/orders/api";
import {
	useGetAddressesQuery,
	useGetStorageHubAddressesQuery,
	useAddAddressMutation,
} from "@/state/addresses/api";
import {
	useGetShippingMethodsQuery,
	useGetSendCloudShipmentMethodsQuery,
	useGetExternalShipmentMethodsQuery,
} from "@/state/shipping-methods/api";
import { useGetPaymentMethodsQuery } from "@/state/payment-methods/api";
import {
	useGetCartCommissionsQuery,
	useGetDemandCommissionsQuery,
} from "@/state/commissions/api";
import { useGetSchedulesQuery } from "@/state/schedules/api";
import { useAuthSelector } from "@/state/auth/selectors";
import { AppConfig } from "@/config/app.config";
import {
	buildPaymentIntentUrl,
	buildExternalCheckoutUrl,
	PAYMENT_INTENT_TYPES,
	EXTERNAL_CHECKOUT_TYPES,
} from "@/api/checkout";
import Layout from "../components/Layout";
import type {
	FullCheckoutPayload,
	Address,
	StorageHubAddress,
	ShippingMethod,
	ShipmentMethod,
	PaymentMethod,
	Commission,
	CartCommissionEntry,
} from "@/types/checkout.types";
import type { SchedulesPerDay, ScheduleSlot } from "@/api/schedules";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIAL_TYPES = ["events", "appointments", "donation"];
const SCHEDULE_TYPES = ["events", "appointments"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RadioCard({
	checked,
	onChange,
	children,
	extra,
}: {
	checked: boolean;
	onChange: () => void;
	children: React.ReactNode;
	extra?: React.ReactNode;
}) {
	return (
		<label
			style={{
				...s.optionCard,
				...(checked ? s.optionCardActive : {}),
			}}
		>
			<input
				type="radio"
				style={s.radio}
				checked={checked}
				onChange={onChange}
			/>
			<div style={{ flex: 1 }}>{children}</div>
			{extra}
		</label>
	);
}

function SectionBox({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div style={s.section}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<h2 style={{ ...s.sectionTitle, margin: 0 }}>
					{title}
				</h2>
				{action}
			</div>
			{children}
		</div>
	);
}

// ─── Add address inline form ──────────────────────────────────────────────────

function AddAddressForm({
	onSaved,
	onCancel,
}: {
	onSaved: (addr: Address) => void;
	onCancel: () => void;
}) {
	const [addAddress, { isLoading }] = useAddAddressMutation();
	const [form, setForm] = useState({
		name: "",
		phone_number: "",
		address_line_1: "",
		address_line_2: "",
		city: "",
		state: "",
		country: "",
		post_code: "",
		type: "shipping",
	});
	const [err, setErr] = useState("");
	const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((v) => ({ ...v, [f]: e.target.value }));
	const req = [
		"name",
		"address_line_1",
		"city",
		"country",
	] as const;

	const handleSave = async () => {
		if (req.some((k) => !form[k])) {
			setErr("Fill in all required fields.");
			return;
		}
		const result = await addAddress(form);
		if ("error" in result) {
			setErr("Failed to save address.");
			return;
		}
		onSaved((result as any).data?.address);
	};

	const fields: [string, string][] = [
		["name", "Full name *"],
		["phone_number", "Phone"],
		["address_line_1", "Address line 1 *"],
		["address_line_2", "Address line 2"],
		["city", "City *"],
		["state", "State / Province"],
		["post_code", "Postal code"],
		["country", "Country *"],
	];

	return (
		<div style={af.wrap}>
			<h3 style={af.title}>Add new address</h3>
			{err && <p style={af.err}>{err}</p>}
			<div style={af.grid}>
				{fields.map(([key, label]) => (
					<div
						key={key}
						style={af.field}
					>
						<label style={af.label}>
							{label}
						</label>
						<input
							style={af.input}
							value={(form as any)[key]}
							onChange={set(key)}
							placeholder={label.replace(
								" *",
								"",
							)}
						/>
					</div>
				))}
			</div>
			<div style={af.actions}>
				<button
					onClick={handleSave}
					disabled={isLoading}
					style={af.saveBtn}
				>
					{isLoading ? "Saving…" : "Save address"}
				</button>
				<button
					onClick={onCancel}
					style={af.cancelBtn}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ─── Cart commission row ──────────────────────────────────────────────────────

function CartCommissionRow({
	commission,
	applied,
	onApply,
}: {
	commission: Commission;
	applied?: CartCommissionEntry;
	onApply: (entry: CartCommissionEntry) => void;
}) {
	const [amount, setAmount] = useState(
		applied?.amount ?? commission.commission_data.min_amount,
	);
	const [err, setErr] = useState("");
	const { min_amount, max_amount } = commission.commission_data;

	const handleApply = () => {
		if (amount < min_amount || amount > max_amount) {
			setErr(
				`Enter an amount between ${min_amount} and ${max_amount}`,
			);
			return;
		}
		setErr("");
		onApply({ id: commission.id, amount });
	};

	return (
		<div style={cr.row}>
			<div>
				<p style={cr.title}>
					{commission.title}
					{!commission.commission_data.optional && (
						<span style={cr.required}>*</span>
					)}
				</p>
				{commission.description && (
					<p style={cr.desc}>
						{commission.description}
					</p>
				)}
				<p style={cr.range}>
					Min: {min_amount} · Max: {max_amount}
				</p>
			</div>
			<div style={cr.inputWrap}>
				<input
					type="number"
					style={cr.input}
					value={amount}
					onChange={(e) =>
						setAmount(Number(e.target.value))
					}
					placeholder="Amount"
				/>
				<button
					onClick={handleApply}
					style={cr.applyBtn}
				>
					Apply
				</button>
			</div>
			{err && <p style={{ ...af.err, marginTop: 4 }}>{err}</p>}
			{applied && (
				<span style={cr.applied}>
					✓ Applied ({applied.amount})
				</span>
			)}
		</div>
	);
}

// ─── Demand commission toggle ─────────────────────────────────────────────────

function DemandCommissionRow({
	commission,
	enabled,
	onToggle,
}: {
	commission: Commission;
	enabled: boolean;
	onToggle: (id: number) => void;
}) {
	return (
		<div style={cr.demandRow}>
			<div>
				<p style={cr.title}>{commission.title}</p>
				{commission.description && (
					<p style={cr.desc}>
						{commission.description}
					</p>
				)}
			</div>
			<button
				onClick={() => onToggle(commission.id)}
				style={{
					...cr.toggleBtn,
					...(enabled ? cr.toggleBtnOn : {}),
				}}
			>
				{enabled ? "On" : "Off"}
			</button>
		</div>
	);
}

// ─── Schedule selector ────────────────────────────────────────────────────────

function ScheduleSelector({
	dates,
	schedulesPerDay,
	selectedDateIdx,
	onSelectDate,
	selectedSlotIdx,
	onSelectSlot,
}: {
	dates: string[];
	schedulesPerDay: SchedulesPerDay[];
	selectedDateIdx: number;
	onSelectDate: (i: number) => void;
	selectedSlotIdx: number | null;
	onSelectSlot: (i: number) => void;
}) {
	const today = schedulesPerDay[selectedDateIdx];
	return (
		<div>
			{/* Date row */}
			<div style={sch.dateRow}>
				{dates.map((d, i) => (
					<button
						key={d}
						onClick={() => onSelectDate(i)}
						style={{
							...sch.dateBtn,
							...(i === selectedDateIdx
								? sch.dateBtnActive
								: {}),
						}}
					>
						<span style={sch.dateWeekday}>
							{dayjs(d).format("ddd")}
						</span>
						<span style={sch.dateDay}>
							{dayjs(d).format("D")}
						</span>
						<span style={sch.dateMon}>
							{dayjs(d).format("MMM")}
						</span>
					</button>
				))}
			</div>

			{/* Time slots */}
			{today ? (
				<div style={sch.slotGrid}>
					{today.schedules.map((slot, i) => {
						const isUnavailable = !slot.available || (slot.stocks_left !== undefined && slot.stocks_left <= 0);
						return (
						<button
							key={i}
							disabled={isUnavailable}
							onClick={() =>
								!isUnavailable &&
								onSelectSlot(i)
							}
							style={{
								...sch.slot,
								...(i ===
								selectedSlotIdx
									? sch.slotActive
									: {}),
								...(isUnavailable
									? sch.slotDisabled
									: {}),
							}}
						>
							<span style={sch.slotTime}>
								{slot.start_time} –{" "}
								{slot.end_time}
							</span>
							{slot.stocks_left !==
								undefined && (
								<span
									style={
										sch.slotStock
									}
								>
									{
										slot.stocks_left
									}{" "}
									left
								</span>
							)}
						</button>
					);})}
				</div>
			) : (
				<p style={s.placeholder}>
					No available slots for this date.
				</p>
			)}
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const isAuthenticated = useAuthSelector((st) => st.isAuthenticated);
	const authKey = useAuthSelector((st) => st.authKey ?? "");
	const useAccountShipping = AppConfig.enableShippingMethodsPreference;

	// Declared early so useGetCartWithCommissionsQuery can use it as arg
	const [cartCommEntries, setCartCommEntries] = useState<CartCommissionEntry[]>([]);

	// ── Cart ──
	const { data: cartData, isLoading: cartLoading } = useGetCartQuery();
	const { data: commCartData } = useGetCartWithCommissionsQuery(
		cartCommEntries,
		{ skip: cartCommEntries.length === 0 },
	);
	// When commissions are active, use the commission-priced cart for display
	const activeCartData = cartCommEntries.length > 0 && commCartData ? commCartData : cartData;
	const items = activeCartData?.cart_details ?? [];
	const summary = activeCartData?.cart ?? null;

	const checkoutType =
		(items[0] as any)?.listing?.order_type ?? "listings";
	const isSpecialType = SPECIAL_TYPES.includes(checkoutType);
	const isScheduleType = SCHEDULE_TYPES.includes(checkoutType);
	const isDonation = checkoutType === "donation";
	const isDigital = checkoutType === "digital";
	const needsShipping = !isSpecialType && !isDigital;
	const sellerAccountId = (items[0] as any)?.listing?.account?.id;

	// ── Shipping methods — two patterns ──
	const { data: tenantShipping, isLoading: tenantShippingLoading } =
		useGetShippingMethodsQuery(
			{ type: "tenant" },
			{ skip: !needsShipping || useAccountShipping },
		);
	const { data: accountShipping, isLoading: accountShippingLoading } =
		useGetShippingMethodsQuery(
			{ type: "account", account_id: sellerAccountId },
			{
				skip:
					!needsShipping ||
					!useAccountShipping ||
					!sellerAccountId,
			},
		);
	const shippingData = useAccountShipping
		? accountShipping
		: tenantShipping;
	const shippingMethods =
		shippingData?.shipping_methods?.filter((m: any) => m.active) ??
		[];
	const shippingLoading = useAccountShipping
		? accountShippingLoading
		: tenantShippingLoading;

	// ── Addresses ──
	const { data: addressData } = useGetAddressesQuery(undefined, {
		skip: !isAuthenticated,
	});
	const { data: hubData } = useGetStorageHubAddressesQuery();
	const addresses = addressData?.addresses ?? [];
	const storageHubAddresses = (hubData as any)?.addresses ?? [];

	// ── Payment ──
	const { data: paymentData, isLoading: paymentLoading } =
		useGetPaymentMethodsQuery();
	const paymentMethods =
		paymentData?.payment_methods?.filter((m: any) => m.active) ?? [];

	// ── Commissions ──
	const { data: cartCommData } = useGetCartCommissionsQuery();
	const { data: demandCommData } = useGetDemandCommissionsQuery(
		undefined,
		{ skip: !isAuthenticated },
	);
	const cartCommissions = cartCommData?.commissions ?? [];
	const demandCommissions = demandCommData?.commissions ?? [];

	// ── Mutations ──
	const [applyCoupon, { isLoading: isApplyingCoupon }] =
		useApplyCouponMutation();
	const [removeCoupon, { isLoading: isRemovingCoupon }] =
		useRemoveCouponMutation();
	const [checkout, { isLoading: isPlacing }] = useCheckoutMutation();
	const [paymentIntent, { isLoading: isCreatingIntent }] =
		usePaymentIntentMutation();

	// ── Selections ──
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(
		null,
	);
	const [selectedHub, setSelectedHub] = useState<StorageHubAddress | null>(
		null,
	);
	const [selectedShipping, setSelectedShipping] =
		useState<ShippingMethod | null>(null);
	const [selectedShipment, setSelectedShipment] =
		useState<ShipmentMethod | null>(null);
	const [selectedPayment, setSelectedPayment] =
		useState<PaymentMethod | null>(null);
	const [demandCommIds, setDemandCommIds] = useState<number[]>([]);

	// ── Schedule ──
	const startDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
	const [selectedDateIdx, setSelectedDateIdx] = useState(0);
	const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(
		null,
	);

	const { data: scheduleData } = useGetSchedulesQuery(
		{
			listingId: (items[0] as any)?.listing?.id,
			startAt: startDate,
			days: 30,
		},
		{ skip: !isScheduleType || !items[0] },
	);
	// Filter out days with no available slots so the date picker only shows bookable days
	const schedulesPerDay: SchedulesPerDay[] = (
		scheduleData?.schedules_per_day ?? []
	).filter((s) => s.schedules.length > 0);
	const dates = schedulesPerDay.map((s) => s.day);

	// Reset slot when date changes
	useEffect(() => {
		setSelectedSlotIdx(null);
	}, [selectedDateIdx]);

	// ── Guest ──
	const [guestEmail, setGuestEmail] = useState("");
	const [guestName, setGuestName] = useState("");
	const [guestPhone, setGuestPhone] = useState("");
	const [guestAddress1, setGuestAddress1] = useState("");
	const [guestAddress2, setGuestAddress2] = useState("");
	const [guestCity, setGuestCity] = useState("");
	const [guestState, setGuestState] = useState("");
	const [guestCountry, setGuestCountry] = useState("");
	const [guestPostCode, setGuestPostCode] = useState("");

	// ── Coupon ──
	const [couponInput, setCouponInput] = useState("");
	const [couponMsg, setCouponMsg] = useState("");

	// ── Misc ──
	const [showAddForm, setShowAddForm] = useState(false);
	const [isDonateAnon, setIsDonateAnon] = useState(false);
	const [error, setError] = useState("");
	const [isRedirecting, setIsRedirecting] = useState(false);

	// ── Sub-shipment (SendCloud / external) ──
	const isSendCloud = selectedShipping?.channel === "sendcloud";
	const isExternal = !!(
		selectedShipping?.metadata?.extension_id &&
		selectedShipping?.metadata?.price_list !== false
	);

	const { data: sendCloudData } = useGetSendCloudShipmentMethodsQuery(
		{
			shipping_method_id: selectedShipping!?.id,
			country: (selectedAddress as any)?.country_code ?? "",
		},
		{ skip: !isSendCloud || !selectedAddress },
	);
	const { data: externalData } = useGetExternalShipmentMethodsQuery(
		{
			shipping_method_id: selectedShipping!?.id,
			shipping_address_id: selectedAddress!?.id,
		},
		{ skip: !isExternal || !selectedAddress?.id },
	);
	const subMethods = isSendCloud
		? (sendCloudData?.shipment_methods ?? [])
		: isExternal
			? (externalData?.shipment_methods ?? [])
			: [];

	useEffect(() => {
		setSelectedShipment(null);
	}, [selectedShipping?.id, selectedAddress?.id]);

	// ── Auto-selects ──
	useEffect(() => {
		if (selectedAddress || !addresses.length) return;
		setSelectedAddress(
			addresses.find((a: any) => a.default) ?? addresses[0],
		);
	}, [addresses.length]);

	useEffect(() => {
		if (selectedShipping?.type !== "storage_hub") return;
		if (selectedHub || !storageHubAddresses.length) return;
		setSelectedHub(storageHubAddresses[0]);
	}, [selectedShipping?.type, storageHubAddresses.length]);

	useEffect(() => {
		if (selectedShipping || !shippingMethods.length) return;
		setSelectedShipping(shippingMethods[0]);
	}, [shippingMethods.length]);

	useEffect(() => {
		if (selectedPayment || !paymentMethods.length) return;
		setSelectedPayment(paymentMethods[0]);
	}, [paymentMethods.length]);

	// Redirect on empty cart
	useEffect(() => {
		if (!cartLoading && items.length === 0)
			navigate("/cart", { replace: true });
	}, [cartLoading, items.length]);

	// ── Coupon ──
	const handleApplyCoupon = async () => {
		if (!couponInput.trim() || !summary?.id) return;
		const result = await applyCoupon({
			cartId: summary.id,
			code: couponInput.trim(),
		});
		if ("error" in result) setCouponMsg("Invalid coupon code.");
		else {
			setCouponMsg("Coupon applied!");
			setCouponInput("");
		}
	};
	const handleRemoveCoupon = async () => {
		if (!summary?.id) return;
		await removeCoupon({ cartId: summary.id });
		setCouponMsg("");
	};

	// ── Validation (11 steps from the analysis) ──
	const validate = (): string | null => {
		// 1. Schedule (events / appointments)
		if (isScheduleType && selectedSlotIdx === null)
			return "Please select a date and time for your booking.";
		// 2. Shipping method
		if (needsShipping && !selectedShipping)
			return "Select a shipping method.";
		// 3. Delivery address — authenticated
		if (
			needsShipping &&
			selectedShipping?.type === "delivery" &&
			isAuthenticated &&
			!selectedAddress
		)
			return "Select a delivery address.";
		// 4. Delivery address — guest
		if (
			needsShipping &&
			selectedShipping?.type === "delivery" &&
			!isAuthenticated &&
			(!guestName || !guestAddress1 || !guestCity || !guestCountry)
		)
			return "Enter your full delivery address (name, address, city, country).";
		// 5. SendCloud sub-method
		if (isSendCloud && !selectedShipment)
			return "Select a shipment method.";
		// 6. External sub-method
		if (isExternal && !selectedShipment)
			return "Select a shipment method.";
		// 7. Storage hub address
		if (selectedShipping?.type === "storage_hub" && !selectedHub)
			return "Select a storage hub pick-up location.";
		// 8. Payment method
		if (!selectedPayment) return "Select a payment method.";
		// 9. Required cart commissions
		const missing = cartCommissions.find(
			(c: Commission) =>
				!c.commission_data.optional &&
				!cartCommEntries.find((e) => e.id === c.id),
		);
		if (missing) return `Apply required commission: ${missing.title}`;
		// 10. Guest email
		if (!isAuthenticated && !guestEmail.includes("@"))
			return "Enter a valid email for guest checkout.";
		// 11. Cart attributes — validated server-side
		return null;
	};

	// ── Place order — with payment channel routing ──
	const handlePlaceOrder = async () => {
		setError("");
		const validErr = validate();
		if (validErr) {
			setError(validErr);
			return;
		}

		const isDelivery = selectedShipping?.type === "delivery";
		const isStorageHub = selectedShipping?.type === "storage_hub";

		// Build schedule timestamps
		let scheduleId: number | undefined;
		let scheduleStartAt: string | undefined;
		let scheduleEndAt: string | undefined;
		if (
			isScheduleType &&
			selectedSlotIdx !== null &&
			schedulesPerDay[selectedDateIdx]
		) {
			const slot =
				schedulesPerDay[selectedDateIdx].schedules[
					selectedSlotIdx
				];
			const day = schedulesPerDay[selectedDateIdx].day;
			scheduleId = (slot as any).id;
			scheduleStartAt = `${day} ${slot.start_time}:00`;
			scheduleEndAt = `${day} ${slot.end_time}:00`;
		}

		const payload: FullCheckoutPayload = {
			...(summary?.id ? { cart: { id: summary.id } } : {}),
			type: checkoutType,

			// Shipping
			...(needsShipping && selectedShipping
				? { shipping_method_id: selectedShipping.id }
				: {}),

			// Address — delivery: auth uses ID, guest uses object; storage hub uses hub ID
			...(isAuthenticated && isDelivery && selectedAddress
				? { shipping_address_id: selectedAddress.id }
				: {}),
			...(!isAuthenticated && isDelivery && guestName
				? {
						shipping_address: {
							name: guestName,
							email: guestEmail,
							phone_number: guestPhone || undefined,
							address_line_1: guestAddress1,
							...(guestAddress2 ? { address_line_2: guestAddress2 } : {}),
							city: guestCity,
							...(guestState ? { state: guestState } : {}),
							country: guestCountry,
							...(guestPostCode ? { post_code: guestPostCode } : {}),
						},
					}
				: {}),
			...(isStorageHub && selectedHub
				? { shipping_address_id: selectedHub.id }
				: {}),

			// Sub-shipment (SendCloud or external)
			...(selectedShipment
				? {
						external_shipping_method_id:
							selectedShipment.id,
					}
				: {}),

			// Payment
			...(selectedPayment
				? { payment_method_id: selectedPayment.id }
				: {}),

			// Coupon — source of truth is the cart API response
			...(summary?.coupon?.code
				? { coupon_code: summary.coupon.code }
				: {}),

			// Commissions
			...(cartCommEntries.length > 0
				? { cart_commission: cartCommEntries }
				: {}),
			...(demandCommIds.length > 0
				? { demand_commission: demandCommIds }
				: {}),

			// Schedule (events / appointments)
			...(scheduleId !== undefined ? { schedule_id: scheduleId } : {}),
			...(scheduleStartAt ? { schedule_start_at: scheduleStartAt } : {}),
			...(scheduleEndAt ? { schedule_end_at: scheduleEndAt } : {}),

			// Donation
			...(isDonation && isDonateAnon
				? { anonymous_donation: true }
				: {}),

			// Guest
			...(!isAuthenticated
				? { guest: true, guest_email: guestEmail }
				: {}),
			...(!isAuthenticated && guestName
				? { guest_name: guestName }
				: {}),
			...(!isAuthenticated && guestPhone
				? { guest_phone: guestPhone }
				: {}),
		};

		const result = await checkout(payload);

		if ("error" in result) {
			const e = result.error as any;
			if (e?.data?.code === 127)
				setError(
					"Wallet amount not eligible for this payment method. Choose another.",
				);
			else
				setError(
					e?.error ??
						"Checkout failed. Please try again.",
				);
			return;
		}

		const ref = result.data.order_reference;
		const pm = selectedPayment!;

		// Invalidate cart cache — order placed, cart is now empty on the server
		dispatch(cartApi.util.invalidateTags(['Cart'] as any));

		// ── Payment channel routing ──────────────────────────────────────────────

		// Stripe SDK — create payment intent then navigate to /payment page
		if (pm.type === "stripe") {
			const intentResult = await paymentIntent(ref);
			if ("error" in intentResult) {
				setError("Order placed but payment setup failed. Check your orders for status.");
				return;
			}
			navigate("/payment", {
				state: {
					client_secret: intentResult.data.client_secret,
					order_reference: ref,
				},
			});
			return;
		}

		// Pattern A — paymentIntent window.open (stripe_web / razorpay / billplz etc.)
		// Opens payment page in a new tab; this tab goes to thank-you immediately.
		if (PAYMENT_INTENT_TYPES.includes(pm.type as any)) {
			const url = buildPaymentIntentUrl(
				ref,
				pm.id,
				isAuthenticated ? authKey : "",
				!isAuthenticated ? guestEmail : undefined,
			);
			window.open(url);
			navigate(`/thank-you/${ref}`, { replace: true });
			return;
		}

		// Pattern B — external_checkout full-tab redirect (pawapay / paystack / flutterwave etc.)
		// Stores order ref, shows redirecting screen, then leaves the app.
		// /payment-return handles verification on return.
		if (EXTERNAL_CHECKOUT_TYPES.includes(pm.type as any) || pm.channel === "web") {
			const url = buildExternalCheckoutUrl(
				ref,
				isAuthenticated ? authKey : "",
				!isAuthenticated ? guestEmail : undefined,
			);
			localStorage.setItem("pending_order_reference", ref);
			setIsRedirecting(true);
			setTimeout(() => { window.location.href = url; }, 150);
			return;
		}

		// Wallet, cash, COD, or any unrecognised channel — direct success
		navigate(`/thank-you/${ref}`, { replace: true });
	};

	// Redirecting to external payment page
	if (isRedirecting)
		return (
			<Layout>
				<div style={s.center}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
					<h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>
						Redirecting to payment…
					</h2>
					<p style={{ fontSize: 14, color: "#888" }}>
						Please wait while we redirect you to the secure payment page.
					</p>
				</div>
			</Layout>
		);

	const isPageLoading = cartLoading || shippingLoading || paymentLoading;
	if (isPageLoading)
		return (
			<Layout>
				<div style={s.center}>Loading checkout…</div>
			</Layout>
		);

	const priceRows =
		(summary as any)?.pricing_items?.filter((p: any) => p.display) ??
		[];
	const hasCoupon = !!(summary as any)?.coupon?.code;

	return (
		<Layout>
			<h1 style={s.pageTitle}>Checkout</h1>

			<div style={s.layout}>
				{/* ── Left column ── */}
				<div style={s.mainCol}>
					{/* 1. Guest contact info */}
					{!isAuthenticated && (
						<SectionBox title="Contact information">
							<div style={s.formGrid}>
								<div style={s.field}>
									<label
										style={
											s.label
										}
									>
										Email *
									</label>
									<input
										style={
											s.input
										}
										type="email"
										value={
											guestEmail
										}
										onChange={(
											e,
										) =>
											setGuestEmail(
												e
													.target
													.value,
											)
										}
										placeholder="your@email.com"
									/>
								</div>
								<div style={s.field}>
									<label
										style={
											s.label
										}
									>
										Name
									</label>
									<input
										style={
											s.input
										}
										value={
											guestName
										}
										onChange={(
											e,
										) =>
											setGuestName(
												e
													.target
													.value,
											)
										}
										placeholder="Full name"
									/>
								</div>
								<div style={s.field}>
									<label
										style={
											s.label
										}
									>
										Phone
									</label>
									<input
										style={
											s.input
										}
										value={
											guestPhone
										}
										onChange={(
											e,
										) =>
											setGuestPhone(
												e
													.target
													.value,
											)
										}
										placeholder="+1 555 000 0000"
									/>
								</div>
								{/* Guest delivery address — only shown when shipping type is delivery */}
								{needsShipping && selectedShipping?.type === "delivery" && (
									<>
										<div style={s.field}>
											<label style={s.label}>Address line 1 *</label>
											<input style={s.input} value={guestAddress1} onChange={e => setGuestAddress1(e.target.value)} placeholder="Street address" />
										</div>
										<div style={s.field}>
											<label style={s.label}>Address line 2</label>
											<input style={s.input} value={guestAddress2} onChange={e => setGuestAddress2(e.target.value)} placeholder="Apt, suite, etc." />
										</div>
										<div style={s.field}>
											<label style={s.label}>City *</label>
											<input style={s.input} value={guestCity} onChange={e => setGuestCity(e.target.value)} placeholder="City" />
										</div>
										<div style={s.field}>
											<label style={s.label}>State / Region</label>
											<input style={s.input} value={guestState} onChange={e => setGuestState(e.target.value)} placeholder="State or region" />
										</div>
										<div style={s.field}>
											<label style={s.label}>Country *</label>
											<input style={s.input} value={guestCountry} onChange={e => setGuestCountry(e.target.value)} placeholder="Country" />
										</div>
										<div style={s.field}>
											<label style={s.label}>Post code</label>
											<input style={s.input} value={guestPostCode} onChange={e => setGuestPostCode(e.target.value)} placeholder="Post / ZIP code" />
										</div>
									</>
								)}
							</div>
						</SectionBox>
					)}

					{/* 2. Schedule — events / appointments */}
					{isScheduleType &&
						schedulesPerDay.length > 0 && (
							<SectionBox title="Select date & time">
								<ScheduleSelector
									dates={dates}
									schedulesPerDay={
										schedulesPerDay
									}
									selectedDateIdx={
										selectedDateIdx
									}
									onSelectDate={(
										i,
									) =>
										setSelectedDateIdx(
											i,
										)
									}
									selectedSlotIdx={
										selectedSlotIdx
									}
									onSelectSlot={(
										i,
									) =>
										setSelectedSlotIdx(
											i,
										)
									}
								/>
								{selectedSlotIdx !==
									null &&
									schedulesPerDay[
										selectedDateIdx
									] && (
										<p
											style={
												s.selectedHint
											}
										>
											✓{" "}
											{
												schedulesPerDay[
													selectedDateIdx
												]
													.day
											}{" "}
											{
												schedulesPerDay[
													selectedDateIdx
												]
													.schedules[
													selectedSlotIdx
												]
													.start_time
											}
											{
												" – "
											}
											{
												schedulesPerDay[
													selectedDateIdx
												]
													.schedules[
													selectedSlotIdx
												]
													.end_time
											}
										</p>
									)}
							</SectionBox>
						)}

					{/* 3. Shipping method */}
					{needsShipping &&
						shippingMethods.length > 0 && (
							<SectionBox title="Shipping method">
								<div
									style={
										s.optionList
									}
								>
									{shippingMethods.map(
										(
											method: ShippingMethod,
										) => (
											<RadioCard
												key={
													method.id
												}
												checked={
													selectedShipping?.id ===
													method.id
												}
												onChange={() => {
													setSelectedShipping(
														method,
													);
													setSelectedAddress(
														null,
													);
													setSelectedHub(
														null,
													);
												}}
												extra={
													method.price ? (
														<span
															style={
																s.optionPrice
															}
														>
															{
																method
																	.price
																	.formatted
															}
														</span>
													) : undefined
												}
											>
												<p
													style={
														s.optionTitle
													}
												>
													{
														method.name
													}
												</p>
												{method.description && (
													<p
														style={
															s.optionSub
														}
													>
														{
															method.description
														}
													</p>
												)}
												<p
													style={
														s.optionSub
													}
												>
													{
														method.type
													}
												</p>
											</RadioCard>
										),
									)}
								</div>
							</SectionBox>
						)}

					{/* 4. Delivery address (authenticated) */}
					{isAuthenticated &&
						selectedShipping?.type ===
							"delivery" && (
							<SectionBox
								title="Delivery address"
								action={
									!showAddForm ? (
										<button
											onClick={() =>
												setShowAddForm(
													true,
												)
											}
											style={
												s.addBtn
											}
										>
											+
											Add
										</button>
									) : undefined
								}
							>
								{showAddForm ? (
									<AddAddressForm
										onSaved={(
											addr,
										) => {
											setShowAddForm(
												false,
											);
											if (
												addr
											)
												setSelectedAddress(
													addr,
												);
										}}
										onCancel={() =>
											setShowAddForm(
												false,
											)
										}
									/>
								) : addresses.length ===
								  0 ? (
									<p
										style={
											s.placeholder
										}
									>
										No saved
										addresses
										yet.
									</p>
								) : (
									<div
										style={
											s.optionList
										}
									>
										{addresses.map(
											(
												addr: Address,
											) => (
												<RadioCard
													key={
														addr.id
													}
													checked={
														selectedAddress?.id ===
														addr.id
													}
													onChange={() =>
														setSelectedAddress(
															addr,
														)
													}
												>
													<p
														style={
															s.optionTitle
														}
													>
														{
															addr.name
														}
														{(
															addr as any
														)
															.default && (
															<span
																style={
																	s.defaultBadge
																}
															>
																Default
															</span>
														)}
													</p>
													<p
														style={
															s.optionSub
														}
													>
														{
															addr.address_line_1
														}
														{addr.address_line_2
															? `, ${addr.address_line_2}`
															: ""}
													</p>
													<p
														style={
															s.optionSub
														}
													>
														{
															addr.city
														}

														,{" "}
														{
															(
																addr as any
															)
																.state
														}{" "}
														{
															(
																addr as any
															)
																.post_code
														}

														,{" "}
														{
															addr.country
														}
													</p>
													{addr.phone_number && (
														<p
															style={
																s.optionSub
															}
														>
															{
																addr.phone_number
															}
														</p>
													)}
												</RadioCard>
											),
										)}
									</div>
								)}
							</SectionBox>
						)}

					{/* 5. Storage hub — only when storage_hub shipping method is selected */}
					{selectedShipping?.type === "storage_hub" &&
						storageHubAddresses.length > 0 && (
							<SectionBox title="Pick-up location">
								<div
									style={
										s.optionList
									}
								>
									{storageHubAddresses.map(
										(
											hub: StorageHubAddress,
										) => (
											<RadioCard
												key={
													hub.id
												}
												checked={
													selectedHub?.id ===
													hub.id
												}
												onChange={() => {
													setSelectedHub(
														hub,
													);
													// Auto-select the matching storage_hub shipping method
													const hubMethod =
														shippingMethods.find(
															(
																m: ShippingMethod,
															) =>
																m.type ===
																"storage_hub",
														);
													if (
														hubMethod
													)
														setSelectedShipping(
															hubMethod,
														);
												}}
											>
												<p
													style={
														s.optionTitle
													}
												>
													{
														hub.name
													}
												</p>
												{hub.formatted_address && (
													<p
														style={
															s.optionSub
														}
													>
														{
															hub.formatted_address
														}
													</p>
												)}
											</RadioCard>
										),
									)}
								</div>
							</SectionBox>
						)}

					{/* 6. SendCloud / External sub-shipment */}
					{(isSendCloud || isExternal) &&
						selectedAddress &&
						subMethods.length > 0 && (
							<SectionBox title="Shipment method">
								<div
									style={
										s.optionList
									}
								>
									{subMethods.map(
										(
											sm: ShipmentMethod,
										) => (
											<RadioCard
												key={
													sm.id
												}
												checked={
													selectedShipment?.id ===
													sm.id
												}
												onChange={() =>
													setSelectedShipment(
														sm,
													)
												}
												extra={
													sm.price ? (
														<span
															style={
																s.optionPrice
															}
														>
															{
																sm
																	.price
																	.formatted
															}
														</span>
													) : undefined
												}
											>
												<p
													style={
														s.optionTitle
													}
												>
													{
														sm.name
													}
												</p>
												{sm.carrier && (
													<p
														style={
															s.optionSub
														}
													>
														{
															sm.carrier
														}
													</p>
												)}
												{(
													sm as any
												)
													.delivery_days && (
													<p
														style={
															s.optionSub
														}
													>
														Est.{" "}
														{
															(
																sm as any
															)
																.delivery_days
														}{" "}
														days
													</p>
												)}
											</RadioCard>
										),
									)}
								</div>
							</SectionBox>
						)}

					{/* 7. Payment method */}
					{paymentMethods.length > 0 && (
						<SectionBox title="Payment method">
							<div style={s.optionList}>
								{paymentMethods.map(
									(
										pm: PaymentMethod,
									) => (
										<RadioCard
											key={
												pm.id
											}
											checked={
												selectedPayment?.id ===
												pm.id
											}
											onChange={() =>
												setSelectedPayment(
													pm,
												)
											}
										>
											<div
												style={{
													display: "flex",
													alignItems:
														"center",
													gap: 10,
												}}
											>
												{pm.logo && (
													<img
														src={
															pm.logo
														}
														alt={
															pm.name
														}
														style={{
															width: 36,
															height: 22,
															objectFit: "contain",
														}}
													/>
												)}
												<p
													style={
														s.optionTitle
													}
												>
													{
														pm.name
													}
												</p>
											</div>
											<p
												style={
													s.optionSub
												}
											>
												{
													pm.type
												}
											</p>
										</RadioCard>
									),
								)}
							</div>
						</SectionBox>
					)}

					{/* 8. Cart commissions */}
					{cartCommissions.length > 0 && (
						<SectionBox title="Commission">
							<div
								style={{
									display: "flex",
									flexDirection:
										"column",
									gap: 14,
								}}
							>
								{cartCommissions.map(
									(
										c: Commission,
									) => (
										<CartCommissionRow
											key={
												c.id
											}
											commission={
												c
											}
											applied={cartCommEntries.find(
												(
													e,
												) =>
													e.id ===
													c.id,
											)}
											onApply={(
												entry,
											) =>
												setCartCommEntries(
													(
														prev,
													) => [
														...prev.filter(
															(
																e,
															) =>
																e.id !==
																entry.id,
														),
														entry,
													],
												)
											}
										/>
									),
								)}
							</div>
						</SectionBox>
					)}

					{/* 9. Demand commissions (auth only) */}
					{isAuthenticated &&
						demandCommissions.length > 0 && (
							<SectionBox title="Optional add-ons">
								<div
									style={{
										display: "flex",
										flexDirection:
											"column",
										gap: 10,
									}}
								>
									{demandCommissions.map(
										(
											c: Commission,
										) => (
											<DemandCommissionRow
												key={
													c.id
												}
												commission={
													c
												}
												enabled={demandCommIds.includes(
													c.id,
												)}
												onToggle={(
													id,
												) =>
													setDemandCommIds(
														(
															prev,
														) =>
															prev.includes(
																id,
															)
																? prev.filter(
																		(
																			x,
																		) =>
																			x !==
																			id,
																	)
																: [
																		...prev,
																		id,
																	],
													)
												}
											/>
										),
									)}
								</div>
							</SectionBox>
						)}

					{/* 10. Anonymous donation */}
					{isDonation && (
						<SectionBox title="Donation options">
							<label
								style={{
									display: "flex",
									alignItems:
										"center",
									gap: 10,
									cursor: "pointer",
								}}
							>
								<input
									type="checkbox"
									checked={
										isDonateAnon
									}
									onChange={(e) =>
										setIsDonateAnon(
											e
												.target
												.checked,
										)
									}
								/>
								<span
									style={{
										fontSize: 14,
										color: "#333",
									}}
								>
									Donate
									anonymously
								</span>
							</label>
						</SectionBox>
					)}

					{/* 11. Coupon */}
					<SectionBox title="Coupon code">
						{hasCoupon ? (
							<div
								style={{
									display: "flex",
									alignItems:
										"center",
									gap: 10,
								}}
							>
								<span
									style={
										s.couponApplied
									}
								>
									✓{" "}
									{
										(
											summary as any
										).coupon
											.code
									}{" "}
									applied
								</span>
								<button
									onClick={
										handleRemoveCoupon
									}
									disabled={
										isRemovingCoupon
									}
									style={
										s.couponRemoveBtn
									}
								>
									{isRemovingCoupon
										? "…"
										: "Remove"}
								</button>
							</div>
						) : (
							<div
								style={{
									display: "flex",
									gap: 8,
								}}
							>
								<input
									style={{
										...s.input,
										flex: 1,
									}}
									value={
										couponInput
									}
									onChange={(e) =>
										setCouponInput(
											e
												.target
												.value,
										)
									}
									placeholder="Enter coupon code"
									onKeyDown={(e) =>
										e.key ===
											"Enter" &&
										handleApplyCoupon()
									}
								/>
								<button
									onClick={
										handleApplyCoupon
									}
									disabled={
										isApplyingCoupon ||
										!couponInput
									}
									style={
										s.couponApplyBtn
									}
								>
									{isApplyingCoupon
										? "…"
										: "Apply"}
								</button>
							</div>
						)}
						{couponMsg && (
							<p
								style={{
									fontSize: 12,
									color: hasCoupon
										? "#16a34a"
										: "#b91c1c",
									marginTop: 6,
								}}
							>
								{couponMsg}
							</p>
						)}
					</SectionBox>

					{/* 12. Cart items review */}
					<SectionBox
						title={`Order items (${items.length})`}
					>
						<div style={s.itemList}>
							{items.map((item: any) => (
								<div
									key={item.id}
									style={s.itemRow}
								>
									<div
										style={
											s.itemImgWrap
										}
									>
										{item
											.listing
											?.images?.[0] ? (
											<img
												src={
													item
														.listing
														.images[0]
												}
												alt={
													item
														.listing
														.title
												}
												style={
													s.itemImg
												}
											/>
										) : (
											<div
												style={
													s.imgPlaceholder
												}
											/>
										)}
									</div>
									<div
										style={
											s.itemInfo
										}
									>
										<p
											style={
												s.itemSeller
											}
										>
											{
												item
													.listing
													?.account
													?.name
											}
										</p>
										<p
											style={
												s.itemTitle
											}
										>
											{
												item
													.listing
													?.title
											}
										</p>
										{item.variant && (
											<p
												style={
													s.itemVariant
												}
											>
												{
													item
														.variant
														.name
												}
											</p>
										)}
										<p
											style={
												s.itemMeta
											}
										>
											{
												item
													.listing
													?.offer_price
													?.formatted
											}{" "}
											×{" "}
											{
												item.quantity
											}
											{
												" = "
											}
											<strong>
												{
													item
														.quantity_total_offer_price
														?.formatted
												}
											</strong>
										</p>
									</div>
								</div>
							))}
						</div>
					</SectionBox>
				</div>

				{/* ── Right column — summary ── */}
				<div style={s.sideCol}>
					<div style={s.summaryCard}>
						<h2
							style={{
								...s.sectionTitle,
								margin: "0 0 16px",
							}}
						>
							Order summary
						</h2>

						{priceRows.map(
							(row: any, i: number) => (
								<div
									key={i}
									style={
										s.priceRow
									}
								>
									<span
										style={
											s.priceLabel
										}
									>
										{row.name}
									</span>
									<span
										style={
											s.priceValue
										}
									>
										{
											row
												.buying
												?.formatted
										}
									</span>
								</div>
							),
						)}

						{hasCoupon && (
							<div style={s.priceRow}>
								<span
									style={{
										...s.priceLabel,
										color: "#16a34a",
									}}
								>
									Coupon (
									{
										(
											summary as any
										).coupon
											.code
									}
									)
								</span>
								<span
									style={{
										...s.priceValue,
										color: "#16a34a",
									}}
								>
									−
									{(summary as any)
										.coupon
										.discount
										?.formatted ??
										""}
								</span>
							</div>
						)}

						<div style={s.divider} />

						<div
							style={{
								...s.priceRow,
								fontWeight: 700,
							}}
						>
							<span style={{ fontSize: 16 }}>
								Total
							</span>
							<span
								style={{
									fontSize: 18,
									color: "#111",
								}}
							>
								{(summary as any)
									?.grand_total
									?.formatted ??
									"—"}
							</span>
						</div>

						{/* Selection summary */}
						{selectedShipping && (
							<>
								<div
									style={s.divider}
								/>
								<div style={s.priceRow}>
									<span
										style={
											s.priceLabel
										}
									>
										Shipping
									</span>
									<span
										style={
											s.priceValue
										}
									>
										{
											selectedShipping.name
										}
									</span>
								</div>
								{selectedShipment && (
									<div
										style={
											s.priceRow
										}
									>
										<span
											style={
												s.priceLabel
											}
										>
											Method
										</span>
										<span
											style={
												s.priceValue
											}
										>
											{
												selectedShipment.name
											}
										</span>
									</div>
								)}
							</>
						)}
						{selectedHub && (
							<>
								<div
									style={s.divider}
								/>
								<div style={s.priceRow}>
									<span
										style={
											s.priceLabel
										}
									>
										Pick-up
									</span>
									<span
										style={
											s.priceValue
										}
									>
										{
											selectedHub.name
										}
									</span>
								</div>
							</>
						)}
						{selectedPayment && (
							<>
								<div
									style={s.divider}
								/>
								<div style={s.priceRow}>
									<span
										style={
											s.priceLabel
										}
									>
										Payment
									</span>
									<span
										style={
											s.priceValue
										}
									>
										{
											selectedPayment.name
										}
									</span>
								</div>
							</>
						)}

						{error && (
							<p style={s.errorMsg}>
								{error}
							</p>
						)}

						<button
							style={{
								...s.placeBtn,
								opacity:
									isPlacing ||
									isCreatingIntent
										? 0.7
										: 1,
							}}
							onClick={handlePlaceOrder}
							disabled={
								isPlacing ||
								isCreatingIntent
							}
						>
							{isPlacing
								? "Placing order…"
								: isCreatingIntent
									? "Preparing payment…"
									: "Place order"}
						</button>
						<button
							style={s.backBtn}
							onClick={() =>
								navigate("/cart")
							}
						>
							← Back to cart
						</button>
					</div>
				</div>
			</div>
		</Layout>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
	center: {
		textAlign: "center",
		padding: 80,
		color: "#888",
		fontSize: 15,
	},
	pageTitle: {
		fontSize: 26,
		fontWeight: 700,
		color: "#111",
		marginBottom: 28,
	},
	layout: {
		display: "grid",
		gridTemplateColumns: "1fr 320px",
		gap: 28,
		alignItems: "start",
	},
	mainCol: { display: "flex", flexDirection: "column", gap: 16 },
	sideCol: {},
	section: {
		background: "#fff",
		borderRadius: 12,
		padding: 24,
		boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
	},
	sectionTitle: { fontSize: 15, fontWeight: 700, color: "#111" },
	addBtn: {
		background: "none",
		border: "1px solid #2563eb",
		color: "#2563eb",
		borderRadius: 6,
		padding: "4px 12px",
		cursor: "pointer",
		fontSize: 13,
	},
	optionList: { display: "flex", flexDirection: "column", gap: 10 },
	optionCard: {
		display: "flex",
		alignItems: "flex-start",
		gap: 12,
		padding: "12px 14px",
		border: "1px solid #e5e5e5",
		borderRadius: 8,
		cursor: "pointer",
	},
	optionCardActive: {
		border: "1.5px solid #2563eb",
		background: "#f0f7ff",
	},
	optionTitle: {
		margin: "0 0 2px",
		fontSize: 14,
		fontWeight: 600,
		color: "#111",
	},
	optionSub: { margin: "0 0 1px", fontSize: 12, color: "#777" },
	optionPrice: {
		fontSize: 13,
		fontWeight: 600,
		color: "#111",
		whiteSpace: "nowrap",
		marginLeft: "auto",
		alignSelf: "center",
	},
	radio: { marginTop: 2, flexShrink: 0 },
	defaultBadge: {
		fontSize: 10,
		background: "#dcfce7",
		color: "#15803d",
		borderRadius: 4,
		padding: "1px 6px",
		marginLeft: 6,
		fontWeight: 600,
	},
	placeholder: {
		fontSize: 13,
		color: "#aaa",
		fontStyle: "italic",
		margin: 0,
	},
	formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
	field: { display: "flex", flexDirection: "column", gap: 4 },
	label: { fontSize: 12, color: "#555", fontWeight: 500 },
	input: {
		padding: "9px 12px",
		border: "1px solid #ddd",
		borderRadius: 7,
		fontSize: 14,
		color: "#111",
		outline: "none",
	},
	selectedHint: {
		marginTop: 12,
		fontSize: 13,
		color: "#16a34a",
		fontWeight: 600,
	},
	couponApplied: { fontSize: 13, color: "#16a34a", fontWeight: 600 },
	couponApplyBtn: {
		padding: "9px 16px",
		background: "#2563eb",
		color: "#fff",
		border: "none",
		borderRadius: 7,
		fontSize: 14,
		cursor: "pointer",
		whiteSpace: "nowrap",
	},
	couponRemoveBtn: {
		background: "none",
		border: "1px solid #fecaca",
		color: "#ef4444",
		borderRadius: 6,
		padding: "4px 12px",
		cursor: "pointer",
		fontSize: 13,
	},
	itemList: { display: "flex", flexDirection: "column", gap: 14 },
	itemRow: { display: "flex", gap: 14, alignItems: "flex-start" },
	itemImgWrap: {
		width: 60,
		height: 60,
		borderRadius: 8,
		overflow: "hidden",
		flexShrink: 0,
		background: "#f0f0f0",
	},
	itemImg: { width: "100%", height: "100%", objectFit: "cover" },
	imgPlaceholder: { width: "100%", height: "100%", background: "#e5e5e5" },
	itemInfo: { flex: 1 },
	itemSeller: { margin: "0 0 2px", fontSize: 11, color: "#999" },
	itemTitle: {
		margin: "0 0 3px",
		fontSize: 13,
		fontWeight: 600,
		color: "#111",
	},
	itemVariant: { margin: "0 0 3px", fontSize: 11, color: "#888" },
	itemMeta: { margin: 0, fontSize: 12, color: "#666" },
	summaryCard: {
		background: "#fff",
		borderRadius: 12,
		padding: 24,
		boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
		position: "sticky",
		top: 80,
	},
	priceRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	priceLabel: { fontSize: 14, color: "#555" },
	priceValue: { fontSize: 14, color: "#111" },
	divider: { height: 1, background: "#e5e5e5", margin: "14px 0" },
	errorMsg: {
		fontSize: 13,
		color: "#b91c1c",
		marginTop: 12,
		padding: "8px 12px",
		background: "#fef2f2",
		borderRadius: 6,
	},
	placeBtn: {
		width: "100%",
		marginTop: 18,
		padding: 14,
		background: "#2563eb",
		color: "#fff",
		border: "none",
		borderRadius: 8,
		fontSize: 15,
		fontWeight: 700,
		cursor: "pointer",
	},
	backBtn: {
		width: "100%",
		marginTop: 10,
		padding: 11,
		background: "#fff",
		color: "#555",
		border: "1px solid #ddd",
		borderRadius: 8,
		fontSize: 14,
		cursor: "pointer",
	},
};

const af: Record<string, React.CSSProperties> = {
	wrap: {
		background: "#f9fafb",
		border: "1px solid #e5e5e5",
		borderRadius: 10,
		padding: 20,
		marginTop: 12,
	},
	title: {
		fontSize: 14,
		fontWeight: 700,
		color: "#111",
		margin: "0 0 14px",
	},
	err: { fontSize: 13, color: "#b91c1c", margin: "0 0 10px" },
	grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
	field: { display: "flex", flexDirection: "column", gap: 3 },
	label: { fontSize: 12, color: "#555" },
	input: {
		padding: "8px 10px",
		border: "1px solid #ddd",
		borderRadius: 6,
		fontSize: 13,
	},
	actions: { display: "flex", gap: 10, marginTop: 14 },
	saveBtn: {
		padding: "9px 20px",
		background: "#2563eb",
		color: "#fff",
		border: "none",
		borderRadius: 7,
		fontSize: 13,
		fontWeight: 600,
		cursor: "pointer",
	},
	cancelBtn: {
		padding: "9px 16px",
		background: "#fff",
		color: "#555",
		border: "1px solid #ddd",
		borderRadius: 7,
		fontSize: 13,
		cursor: "pointer",
	},
};

const cr: Record<string, React.CSSProperties> = {
	row: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		paddingBottom: 14,
		borderBottom: "1px solid #f0f0f0",
	},
	demandRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	title: { margin: 0, fontSize: 14, fontWeight: 600, color: "#111" },
	desc: { margin: "2px 0 0", fontSize: 12, color: "#777" },
	range: { margin: "2px 0 0", fontSize: 11, color: "#aaa" },
	required: { color: "#ef4444", marginLeft: 2 },
	inputWrap: { display: "flex", gap: 8, alignItems: "center" },
	input: {
		padding: "7px 10px",
		border: "1px solid #ddd",
		borderRadius: 6,
		fontSize: 13,
		width: 100,
	},
	applyBtn: {
		padding: "7px 14px",
		background: "#111",
		color: "#fff",
		border: "none",
		borderRadius: 6,
		fontSize: 13,
		cursor: "pointer",
	},
	applied: { fontSize: 12, color: "#16a34a", fontWeight: 600 },
	toggleBtn: {
		padding: "5px 14px",
		border: "1px solid #e5e5e5",
		borderRadius: 20,
		background: "#fff",
		color: "#666",
		cursor: "pointer",
		fontSize: 13,
		fontWeight: 600,
	},
	toggleBtnOn: {
		background: "#2563eb",
		color: "#fff",
		border: "1px solid #2563eb",
	},
};

const sch: Record<string, React.CSSProperties> = {
	dateRow: {
		display: "flex",
		gap: 8,
		overflowX: "auto",
		paddingBottom: 12,
	},
	dateBtn: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "8px 12px",
		border: "1px solid #e5e5e5",
		borderRadius: 8,
		cursor: "pointer",
		background: "#fff",
		minWidth: 52,
		gap: 2,
	},
	dateBtnActive: { border: "1.5px solid #2563eb", background: "#f0f7ff" },
	dateWeekday: { fontSize: 10, color: "#888", textTransform: "uppercase" },
	dateDay: { fontSize: 17, fontWeight: 700, color: "#111" },
	dateMon: { fontSize: 10, color: "#888" },
	slotGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
		gap: 8,
		marginTop: 12,
	},
	slot: {
		padding: "9px 12px",
		border: "1px solid #e5e5e5",
		borderRadius: 8,
		background: "#fff",
		cursor: "pointer",
		textAlign: "center",
	},
	slotActive: { border: "1.5px solid #2563eb", background: "#f0f7ff" },
	slotDisabled: {
		opacity: 0.4,
		cursor: "not-allowed",
		background: "#f5f5f5",
	},
	slotTime: {
		fontSize: 13,
		fontWeight: 600,
		color: "#111",
		display: "block",
	},
	slotStock: {
		fontSize: 11,
		color: "#888",
		marginTop: 2,
		display: "block",
	},
};

