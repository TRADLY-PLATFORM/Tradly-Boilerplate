import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	useGetListingDetailQuery,
	useLikeListingMutation,
	useUnlikeListingMutation,
} from "@/state/listing/api";
import { useAddToCartMutation, useClearCartMutation } from "@/state/cart/api";
import { useGetListingVariantsQuery } from "@/state/variants/api";
import { useGetBundleItemsQuery, useGetBundlePoolQuery, useLazyGetBundleStockQuery, useSubmitBundleSelectionMutation } from "@/state/bundles/api";
import { useCreateMembershipMutation } from "@/state/memberships/api";
import ListingSocialPanel from "@/src/features/listing-social/ListingSocialPanel";
import { useAuthSelector } from "@/state/auth/selectors";
import Layout from "../components/Layout";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Separator } from "@/src/components/ui/separator";
import ListingHero from "@/src/components/listing/ListingHero";
import type { ListingHeroData } from "@/src/components/listing/listingHero.types";
import { locale } from "@/src/components/layout/locale";
import { Heart, ShoppingCart, Minus, Plus } from "lucide-react";
import type { AddToCartInput } from "@/types/cart.types";

// @sky:token-only — this page is data/logic-bound (branches on orderType, listing.*, handlers).
// Personalization re-skins it via design tokens only; it has no @sky:design zone. DO NOT rewrite structurally.

function Toast({ msg }: { msg: string }) {
	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium shadow-xl z-50">
			{msg}
		</div>
	);
}

function formatVariantPrice(value: number | { amount: number; formatted?: string } | undefined, currency: string) {
	if (value == null) return undefined;
	if (typeof value === "object" && value.formatted) return value.formatted;
	const amount = typeof value === "number" ? value : value.amount;
	try {
		return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
	} catch {
		return `${currency} ${amount}`;
	}
}

export default function ListingDetailPage() {
	const { slug = "" } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const isAuthenticated = useAuthSelector((s) => s.isAuthenticated);

	const { data, isLoading, isError } = useGetListingDetailQuery({ slug });
	const listingId = data?.listing.id;
	const isBundle = data?.listing.type === "bundle";
	const isMembership = data?.listing.type === "membership" || data?.listing.order_type === "membership";
	const { data: variants = [], isLoading: variantsLoading } = useGetListingVariantsQuery(listingId!, { skip: !listingId || !data || data.listing.order_type !== "listings" || isBundle || isMembership });
	const { data: bundleItems, isLoading: bundleItemsLoading, isError: bundleItemsError } = useGetBundleItemsQuery(listingId!, { skip: !listingId || !isBundle || data?.listing.metadata?.bundle_mode === "mix_match" });
	const { data: bundlePool, isLoading: bundlePoolLoading, isError: bundlePoolError } = useGetBundlePoolQuery(listingId!, { skip: !listingId || !isBundle || data?.listing.metadata?.bundle_mode !== "mix_match" });
	const [checkBundleStock] = useLazyGetBundleStockQuery();
	const resolvedOrderType = data?.listing.order_type;
	const shouldRedirectToBooking =
		(resolvedOrderType === "events" || resolvedOrderType === "appointments") &&
		searchParams.get("view") !== "standard";
	useEffect(() => {
		if (shouldRedirectToBooking) navigate(`/booking/${slug}`, { replace: true });
	}, [navigate, shouldRedirectToBooking, slug]);
	const [likeListing, { isLoading: isLiking }] = useLikeListingMutation();
	const [unlikeListing, { isLoading: isUnliking }] =
		useUnlikeListingMutation();
	const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
	const [clearCart] = useClearCartMutation();
	const [createMembership, { isLoading: isJoining }] = useCreateMembershipMutation();
	const [submitBundleSelection, { isLoading: isSelectingBundle }] = useSubmitBundleSelectionMutation();

	const [selectedQty, setSelectedQty] = useState(1);
	const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
	const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([]);
	const [donationAmount, setDonationAmount] = useState(0);
	const [toast, setToast] = useState("");
	const [clearModal, setClearModal] = useState(false);
	const [pendingInput, setPendingInput] = useState<AddToCartInput | null>(
		null,
	);

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(""), 3000);
	};
	useEffect(() => {
		setSelectedVariantId(null);
		setSelectedBundleIds([]);
		setSelectedQty(1);
	}, [listingId]);

	if (isLoading) {
		return (
			<Layout>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					<Skeleton className="aspect-square w-full rounded-xl" />
					<div className="space-y-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-1/2" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			</Layout>
		);
	}
	if (isError || !data)
		return (
			<Layout>
				<div className="text-center py-20 text-destructive text-sm">
					Listing not found.
				</div>
			</Layout>
		);
	if (shouldRedirectToBooking)
		return <Layout><div className="py-20 text-center text-sm text-muted-foreground">Opening booking…</div></Layout>;

	const { listing } = data;
	const orderType = listing.type === "membership" ? "membership" : listing.order_type;
	const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
	const selectedVariantOffer = selectedVariant?.offer_price ?? selectedVariant?.list_price;
	const selectedVariantList = selectedVariant?.list_price;

	const handleLikeToggle = async () => {
		if (!isAuthenticated) {
			navigate("/sign-in");
			return;
		}
		if (isLiking || isUnliking) return;
		if (listing.liked) {
			const result = await unlikeListing({ id: listing.id });
			if ("error" in result)
				showToast("Could not unlike — please try again");
		} else {
			const result = await likeListing({ id: listing.id });
			if ("error" in result)
				showToast("Could not like — please try again");
		}
	};

	const doAddToCart = async (input: AddToCartInput): Promise<boolean> => {
		const result = await addToCart(input);
		if ("error" in result) {
			const e = result.error as {
				status: string;
				error: string;
				data?: { code: number };
			};
			if (e.data?.code === 480) {
				setPendingInput(input);
				setClearModal(true);
				return false;
			}
			if (e.data?.code === 489) {
				const cr = await clearCart();
				// 471 = cart already empty — treat as success, proceed to add
				if (
					"error" in cr &&
					(cr.error as any)?.code !== 471
				) {
					showToast(
						(cr.error as { error: string }).error,
					);
					return false;
				}
				const r2 = await addToCart(input);
				if ("error" in r2) {
					showToast(
						(r2.error as { error: string }).error,
					);
					return false;
				}
				showToast("Added to cart");
				return true;
			}
			showToast(e.error);
			return false;
		}
		showToast("Added to cart");
		return true;
	};

	const handleAddToCart = async (): Promise<boolean> => {
		if (!isAuthenticated) {
			navigate("/sign-in");
			return false;
		}
		if (variantsLoading) {
			showToast("Product options are still loading");
			return false;
		}
		if (isBundle && listing.metadata?.bundle_mode === "mix_match" && (!bundlePool || bundlePoolLoading || bundlePoolError)) {
			showToast(bundlePoolError ? "Could not load bundle choices" : "Bundle choices are still loading");
			return false;
		}
		if (isBundle && listing.metadata?.bundle_mode !== "mix_match" && (!bundleItems || bundleItemsLoading || bundleItemsError)) {
			showToast(bundleItemsError ? "Could not load bundle contents" : "Bundle contents are still loading");
			return false;
		}
		if (listing.stock === 0 || listing.sold) {
			showToast("Item not available");
			return false;
		}
		if (selectedVariant && selectedQty > selectedVariant.stock) {
			showToast(`Only ${selectedVariant.stock} of this option are available`);
			return false;
		}
		if (variants.length > 0 && !selectedVariantId) {
			showToast("Choose an option first");
			return false;
		}
		if (isBundle) {
			const mode = listing.metadata?.bundle_mode;
			if (mode === "mix_match") {
				const min = Number(listing.metadata?.min_quantity) || bundlePool?.min_quantity || 1;
				const max = Number(listing.metadata?.max_quantity) || bundlePool?.max_quantity || undefined;
				if (selectedBundleIds.length < min) {
					showToast(`Choose at least ${min} bundle items`);
					return false;
				}
				if (max && selectedBundleIds.length > max) {
					showToast(`Choose no more than ${max} bundle items`);
					return false;
				}
				const selection = await submitBundleSelection({ listingId: listing.id, selectedListingIds: selectedBundleIds, quantity: selectedQty });
				if ("error" in selection) {
					showToast("Could not save your bundle choices");
					return false;
				}
			} else {
				try {
					const stockCheck = await checkBundleStock({ listingId: listing.id, quantity: selectedQty }).unwrap();
					if (stockCheck?.ok === false) {
						showToast("Some bundle items are out of stock");
						return false;
					}
				} catch {
					showToast("Could not check bundle stock");
					return false;
				}
			}
		}
		return doAddToCart({
			listing_id: listing.id,
			quantity: selectedQty,
			...(selectedVariantId
				? { variant_id: selectedVariantId }
				: {}),
		});
	};

	const handleJoinMembership = async () => {
		if (!isAuthenticated) { navigate(`/sign-in?next=${encodeURIComponent(`/listing/${slug}`)}`); return; }
		const cleared = await clearCart();
		if ("error" in cleared && (cleared.error as any)?.code !== 471) {
			showToast("Could not prepare membership checkout"); return;
		}
		const added = await addToCart({ listing_id: listing.id, quantity: 1 });
		if ("error" in added) { showToast((added.error as any)?.error ?? "Could not add membership"); return; }
		const duration = Number(listing.metadata?.membership_duration_months) || undefined;
		const membershipId = globalThis.crypto?.randomUUID?.() ?? `member-${listing.id}-${Date.now()}`;
		const joined = await createMembership({ listing_id: listing.id, membership_id: membershipId, ...(duration ? { duration_months: duration } : {}) });
		if ("error" in joined) {
			await clearCart();
			showToast((joined.error as any)?.error ?? "Could not start membership"); return;
		}
		navigate("/checkout");
	};

	const handleFundNow = async () => {
		if (!isAuthenticated) {
			navigate("/sign-in");
			return;
		}
		if (donationAmount <= 0) {
			showToast("Enter a valid amount");
			return;
		}
		const cr = await clearCart();
		// 471 = cart already empty — still proceed
		if ("error" in cr && (cr.error as any)?.code !== 471) {
			showToast((cr.error as { error: string }).error);
			return;
		}
		const result = await addToCart({
			listing_id: listing.id,
			quantity: 1,
			custom_price: donationAmount,
		});
		if ("error" in result) {
			showToast((result.error as { error: string }).error);
			return;
		}
		navigate("/cart");
	};

	const handleConfirmClear = async () => {
		setClearModal(false);
		if (!pendingInput) return;
		const cr = await clearCart();
		// 471 = cart already empty — still proceed to add
		if ("error" in cr && (cr.error as any)?.code !== 471) {
			showToast("Failed to clear cart");
			return;
		}
		const r2 = await addToCart(pendingInput);
		if ("error" in r2) {
			showToast((r2.error as { error: string }).error);
			return;
		}
		setPendingInput(null);
		showToast("Cart updated");
	};

	const mainImage = listing.images[0];
	const raisedPercent =
		listing.goal_price.amount > 0
			? Math.min(
					(((listing as any).raised_amount?.amount ??
						0) /
						listing.goal_price.amount) *
						100,
					100,
				)
			: 0;

	const showPrice = !["information_listing", "video_listing", "requests"].includes(orderType);
	const offerAmount = (value: unknown) => Number(typeof value === "object" && value ? (value as { amount: number }).amount : value);
	const onSale = selectedVariant
		? offerAmount(selectedVariantList) > offerAmount(selectedVariantOffer)
		: listing.offer_percent > 0;
	const heroData: ListingHeroData = {
		title: listing.title,
		sellerName: listing.account?.name ?? locale.labels.unknownSeller,
		images: listing.images,
		rating:
			listing.rating_data.rating_count > 0
				? { average: listing.rating_data.rating_average, count: listing.rating_data.rating_count }
				: null,
		priceLabel: showPrice
			? selectedVariant
				? (formatVariantPrice(selectedVariantOffer, listing.offer_price.currency) ?? null)
				: listing.offer_price.formatted
			: null,
		comparePriceLabel:
			showPrice && onSale
				? selectedVariant
					? (formatVariantPrice(selectedVariantList, listing.list_price.currency) ?? null)
					: listing.list_price.formatted
				: null,
		discountLabel: showPrice && !selectedVariant && listing.offer_percent > 0 ? `${listing.offer_percent}% ${locale.labels.off}` : null,
		stockNote:
			listing.stock === 0
				? { tone: "out", text: locale.labels.outOfStock }
				: listing.stock <= 5
					? { tone: "low", text: locale.labels.onlyLeft.replace("{count}", String(listing.stock)) }
					: null,
		donation:
			orderType === "donation" && listing.goal_price.amount > 0
				? { percent: raisedPercent, goalLabel: `${locale.labels.goal}: ${listing.goal_price.formatted}` }
				: null,
		descriptionHtml: listing.description ?? "",
		labels: { noImage: locale.labels.noImage, reviews: locale.labels.reviews, aboutThisListing: locale.labels.aboutThisListing },
	};

	return (
		<Layout>
			{toast && <Toast msg={toast} />}

			{/* Clear cart modal */}
			{clearModal && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
					<div className="bg-card rounded-2xl p-7 max-w-sm w-full shadow-2xl">
						<p className="text-sm text-foreground mb-5 leading-relaxed">
							Your cart has items from
							another seller. Clear cart and
							add this item?
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								className="btn-secondary"
								onClick={() =>
									setClearModal(
										false,
									)
								}
							>
								Cancel
							</Button>
							<Button
								className="btn-hero"
								onClick={
									handleConfirmClear
								}
							>
								Clear & Add
							</Button>
						</div>
					</div>
				</div>
			)}

			<ListingHero data={heroData}>
				{variantsLoading && <p className="text-sm text-muted-foreground">Loading options…</p>}
					{variants.length > 0 && (
						<section aria-label="Product options" className="space-y-2">
							<p className="text-sm font-medium">Choose an option</p>
							<div className="flex flex-wrap gap-2">
								{variants.map((variant) => {
									const price = formatVariantPrice(variant.offer_price ?? variant.list_price, listing.offer_price.currency);
									return <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={`rounded-lg border px-3 py-2 text-sm ${selectedVariantId === variant.id ? "border-coffee-accent bg-coffee-secondary/20" : "border-border"}`}>
										{variant.title}{price != null ? ` · ${price}` : ""} · {variant.stock} left
									</button>;
								})}
							</div>
						</section>
					)}

					{isBundle && listing.metadata?.bundle_mode === "mix_match" && bundlePool && (
						<section className="space-y-2">
							<p className="text-sm font-medium">Choose bundle items (minimum {Number(listing.metadata?.min_quantity) || bundlePool.min_quantity})</p>
							<div className="space-y-2">
								{bundlePool.pool.map((entry: any) => {
									const component = entry.listing ?? entry.component_listing ?? entry;
									const id = Number(entry.component_listing_id ?? component.id);
									if (!id) return null;
									const max = Number(listing.metadata?.max_quantity) || bundlePool.max_quantity || undefined;
									return <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedBundleIds.includes(id)} disabled={Boolean(max && selectedBundleIds.length >= max && !selectedBundleIds.includes(id))} onChange={(event) => setSelectedBundleIds((current) => event.target.checked ? [...current, id] : current.filter((value) => value !== id))} />{component.title ?? `Item ${id}`}</label>;
								})}
							</div>
						</section>
					)}

					{isBundle && listing.metadata?.bundle_mode !== "mix_match" && bundleItems && (
						<section className="space-y-1">
							<p className="text-sm font-medium">Included in this bundle</p>
							{bundleItems.items.map((entry: any, index) => {
								const component = entry.listing ?? entry.component_listing ?? entry;
								return <p key={entry.id ?? index} className="text-sm text-muted-foreground">{component.title ?? `Item ${entry.component_listing_id ?? ""}`} × {entry.quantity ?? 1}</p>;
							})}
							{bundleItems.saving > 0 && <p className="text-sm text-green-700">Save {bundleItems.saving} with this bundle</p>}
						</section>
					)}

					{/* Qty selector */}
					{["listings", "digital"].includes(
						orderType,
					) &&
						listing.stock > 0 && (
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground">
									Quantity
								</span>
								<div className="flex items-center gap-3 border border-border rounded-lg p-1">
									<button
										className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
										onClick={() =>
											setSelectedQty(
												(
													q,
												) =>
													Math.max(
														1,
														q -
															1,
													),
											)
										}
									>
										<Minus className="h-4 w-4" />
									</button>
									<span className="text-sm font-semibold w-6 text-center">
										{
											selectedQty
										}
									</span>
									<button
										className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
										onClick={() =>
											setSelectedQty(
												(
													q,
												) =>
														Math.min(
														selectedVariantId ? (variants.find((variant) => variant.id === selectedVariantId)?.stock ?? listing.stock) : listing.stock,
														listing.max_quantity ||
															listing.stock,
														q +
															1,
													),
											)
										}
									>
										<Plus className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}

					{/* Donation input */}
					{orderType === "donation" && (
						<div>
							<label className="text-sm font-medium text-foreground block mb-1.5">
								Your contribution (
								{
									listing
										.offer_price
										.currency
								}
								)
							</label>
							<input
								className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								type="number"
								min={1}
								value={
									donationAmount ||
									""
								}
								onChange={(e) =>
									setDonationAmount(
										Number(
											e
												.target
												.value,
										),
									)
								}
								placeholder="Enter amount"
							/>
						</div>
					)}

					{/* CTAs */}
					<div className="flex gap-3 flex-wrap">
						{orderType === "membership" && (
							<Button className="btn-hero flex-1" disabled={isAdding || isJoining} onClick={handleJoinMembership}>
								{isJoining || isAdding ? "Joining…" : "Join now"}
							</Button>
						)}
						{orderType === "listings" && (
							<>
								<Button
									className="btn-hero flex-1"
									disabled={
									isAdding ||
									isSelectingBundle ||
									variantsLoading ||
										listing.stock ===
											0
									}
									onClick={
										handleAddToCart
									}
								>
									<ShoppingCart className="h-4 w-4 mr-1.5" />
									{isSelectingBundle ? "Saving choices…" : listing.in_cart
										? "Add more"
										: "Add to cart"}
								</Button>
								<Button
									variant="outline"
									className="btn-secondary flex-1"
									onClick={async () => {
										const ok =
											await handleAddToCart();
										if (ok)
											navigate(
												"/cart",
											);
									}}
								>
									Buy now
								</Button>
							</>
						)}
						{orderType === "digital" && (
							<Button
								className="btn-hero flex-1"
								disabled={isAdding}
								onClick={async () => {
									const ok =
										await handleAddToCart();
									if (ok)
										navigate(
											"/cart",
										);
								}}
							>
								Buy now
							</Button>
						)}
						{(orderType === "events" ||
							orderType ===
								"appointments") && (
							<Button
								className="btn-hero flex-1"
								onClick={() => navigate(`/booking/${slug}`)}
							>
								{orderType === "events"
									? "Book now"
									: "Book appointment"}
							</Button>
						)}
						{orderType === "donation" && (
							<Button
								className="btn-hero flex-1"
								onClick={handleFundNow}
							>
								Fund now
							</Button>
						)}
						{orderType ===
							"information_listing" && (
							<Button
								className="btn-hero flex-1"
								onClick={() =>
									navigate(
										`/contact?listing=${listing.id}`,
									)
								}
							>
								Enquire
							</Button>
						)}
						{orderType === "video_listing" && (
							<Button
								className="btn-hero flex-1"
								onClick={() =>
									navigate(
										`/watch/${listing.slug}`,
									)
								}
							>
								Watch
							</Button>
						)}
						{orderType === "requests" && (
							<Button
								className="btn-hero flex-1"
								onClick={() => {
									if (
										!isAuthenticated
									)
										navigate(
											"/sign-in",
										);
									else
										navigate(
											"/requests/new",
										);
								}}
							>
								Submit request
							</Button>
						)}
					</div>

					{/* Like */}
					<Button
						variant="outline"
						size="sm"
						className="self-start btn-secondary gap-2"
						onClick={handleLikeToggle}
						disabled={isLiking || isUnliking}
					>
						<Heart
							className={`h-4 w-4 ${listing.liked ? "fill-current text-destructive" : ""}`}
						/>
						{listing.liked ? "Liked" : "Like"}
						{listing.likes > 0 && (
							<span className="text-muted-foreground">
								({listing.likes})
							</span>
						)}
					</Button>
			</ListingHero>
			<ListingSocialPanel listingId={listing.id} />
		</Layout>
	);
}

