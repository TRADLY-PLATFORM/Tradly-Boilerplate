import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGetOrderDetailQuery } from "@/state/orders/api";
import Layout from "../components/Layout";

export default function ThankYouPage() {
	const { reference = "" } = useParams<{ reference: string }>();
	const navigate = useNavigate();

	const { data, isLoading } = useGetOrderDetailQuery(reference, {
		skip: !reference,
	});
	const order = (data as any)?.order;

	const items: any[] = order?.order_details ?? [];
	const grandTotal =
		order?.customer_pricing?.grand_total ?? order?.grand_total;
	const shippingAddress = order?.shipping_address;
	const paymentMethod = order?.payment_method;

	return (
		<Layout>
			<div style={s.wrap}>
				<div style={s.card}>
					{/* Success icon */}
					<div style={s.iconWrap}>
						<svg
							width="56"
							height="56"
							viewBox="0 0 56 56"
							fill="none"
						>
							<circle
								cx="28"
								cy="28"
								r="28"
								fill="#dcfce7"
							/>
							<path
								d="M17 28l8 8 15-16"
								stroke="#16a34a"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>

					<h1 style={s.title}>Order placed!</h1>
					<p style={s.subtitle}>
						Thank you for your order. We'll send
						you a confirmation soon.
					</p>

					{reference && (
						<div style={s.refBox}>
							<span style={s.refLabel}>
								Order reference
							</span>
							<span style={s.refValue}>
								{reference}
							</span>
						</div>
					)}

					{/* Order summary (loads after data arrives) */}
					{!isLoading && items.length > 0 && (
						<div style={s.summaryBox}>
							<h3 style={s.summaryTitle}>
								Your items
							</h3>
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
														?.title
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
												s.itemTitle
											}
										>
											{item
												.listing
												?.title ??
												`Item #${item.listing_id}`}
										</p>
										<p
											style={
												s.itemMeta
											}
										>
											{
												item
													.offer_price
													?.formatted
											}{" "}
											×{" "}
											{
												item.quantity
											}
										</p>
										{item.schedule_start_at && (
											<p style={s.scheduleTag}>
												📅{" "}
												{new Date(item.schedule_start_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
												{" · "}
												{new Date(item.schedule_start_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
												{item.schedule_end_at && (
													<> – {new Date(item.schedule_end_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</>
												)}
											</p>
										)}
									</div>
								</div>
							))}

							{grandTotal && (
								<div style={s.totalRow}>
									<span
										style={
											s.totalLabel
										}
									>
										Total paid
									</span>
									<span
										style={
											s.totalValue
										}
									>
										{
											grandTotal.formatted
										}
									</span>
								</div>
							)}

							{shippingAddress?.address_line_1 && (
								<div
									style={
										s.addressBox
									}
								>
									<p
										style={
											s.addressLabel
										}
									>
										Delivering
										to
									</p>
									<p
										style={
											s.addressLine
										}
									>
										{
											shippingAddress.name
										}
									</p>
									<p
										style={
											s.addressLine
										}
									>
										{
											shippingAddress.address_line_1
										}
									</p>
									{shippingAddress.address_line_2 && (
										<p
											style={
												s.addressLine
											}
										>
											{
												shippingAddress.address_line_2
											}
										</p>
									)}
									<p
										style={
											s.addressLine
										}
									>
										{[
											shippingAddress.city,
											shippingAddress.state,
											shippingAddress.post_code,
										]
											.filter(
												Boolean,
											)
											.join(
												", ",
											)}
									</p>
									<p
										style={
											s.addressLine
										}
									>
										{
											shippingAddress.country
										}
									</p>
								</div>
							)}

							{paymentMethod && (
								<div style={s.payRow}>
									<span
										style={
											s.payLabel
										}
									>
										Paid via
									</span>
									<span
										style={
											s.payValue
										}
									>
										{
											paymentMethod.name
										}
									</span>
								</div>
							)}
						</div>
					)}

					<div style={s.actions}>
						<Link
							to={`/orders/${reference}`}
							style={s.viewOrderBtn}
						>
							View order details
						</Link>
						<button
							onClick={() => navigate("/")}
							style={s.homeBtn}
						>
							Continue shopping
						</button>
					</div>
				</div>
			</div>
		</Layout>
	);
}

const s: Record<string, React.CSSProperties> = {
	wrap: {
		display: "flex",
		justifyContent: "center",
		paddingTop: 32,
		paddingBottom: 48,
	},
	card: {
		background: "#fff",
		borderRadius: 16,
		padding: "40px 36px",
		maxWidth: 520,
		width: "100%",
		boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
		textAlign: "center",
	},
	iconWrap: {
		display: "flex",
		justifyContent: "center",
		marginBottom: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: 700,
		color: "#111",
		margin: "0 0 10px",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		margin: "0 0 24px",
		lineHeight: 1.5,
	},
	refBox: {
		background: "#f5f5f5",
		borderRadius: 8,
		padding: "12px 18px",
		marginBottom: 20,
		display: "flex",
		flexDirection: "column",
		gap: 2,
	},
	refLabel: {
		fontSize: 10,
		color: "#999",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	refValue: {
		fontSize: 15,
		fontWeight: 700,
		color: "#111",
		fontFamily: "monospace",
	},
	summaryBox: {
		background: "#fafafa",
		borderRadius: 10,
		padding: "16px 18px",
		marginBottom: 24,
		textAlign: "left",
	},
	summaryTitle: {
		fontSize: 13,
		fontWeight: 700,
		color: "#444",
		margin: "0 0 12px",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	itemRow: {
		display: "flex",
		gap: 12,
		alignItems: "center",
		marginBottom: 10,
	},
	itemImgWrap: {
		width: 48,
		height: 48,
		borderRadius: 6,
		overflow: "hidden",
		flexShrink: 0,
		background: "#eee",
	},
	itemImg: { width: "100%", height: "100%", objectFit: "cover" },
	imgPlaceholder: { width: "100%", height: "100%", background: "#e0e0e0" },
	itemInfo: { flex: 1 },
	itemTitle: {
		margin: "0 0 2px",
		fontSize: 13,
		fontWeight: 600,
		color: "#111",
	},
	itemMeta: { margin: 0, fontSize: 12, color: "#888" },
	scheduleTag: { margin: '3px 0 0', fontSize: 12, color: '#2563eb', fontWeight: 500 },
	totalRow: {
		display: "flex",
		justifyContent: "space-between",
		borderTop: "1px solid #eee",
		paddingTop: 10,
		marginTop: 8,
	},
	totalLabel: { fontSize: 13, fontWeight: 600, color: "#555" },
	totalValue: { fontSize: 15, fontWeight: 700, color: "#111" },
	addressBox: {
		borderTop: "1px solid #eee",
		paddingTop: 10,
		marginTop: 10,
	},
	addressLabel: {
		margin: "0 0 4px",
		fontSize: 10,
		color: "#999",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	addressLine: { margin: 0, fontSize: 13, color: "#444", lineHeight: 1.5 },
	payRow: {
		display: "flex",
		justifyContent: "space-between",
		borderTop: "1px solid #eee",
		paddingTop: 10,
		marginTop: 10,
	},
	payLabel: { fontSize: 12, color: "#888" },
	payValue: { fontSize: 13, fontWeight: 600, color: "#111" },
	actions: { display: "flex", flexDirection: "column", gap: 10 },
	viewOrderBtn: {
		display: "block",
		padding: "13px",
		background: "#2563eb",
		color: "#fff",
		borderRadius: 8,
		fontSize: 15,
		fontWeight: 600,
		textDecoration: "none",
	},
	homeBtn: {
		padding: "11px",
		background: "#fff",
		color: "#555",
		border: "1px solid #ddd",
		borderRadius: 8,
		fontSize: 14,
		cursor: "pointer",
		width: "100%",
	},
};

