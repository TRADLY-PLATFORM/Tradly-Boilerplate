import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetOrderDetailQuery } from "@/state/orders/api";
import Layout from "../components/Layout";

// order_status is a numeric code; map to labels
const STATUS_LABEL: Record<number, string> = {
	1: "Pending",
	2: "Confirmed",
	3: "Processing",
	4: "Ready to ship",
	5: "Shipped",
	6: "Delivered",
	7: "Completed",
	8: "Cancelled",
	9: "Refunded",
	10: "Failed",
};
const STATUS_STYLE: Record<number, { bg: string; color: string }> = {
	1: { bg: "#fef9c3", color: "#854d0e" },
	2: { bg: "#dbeafe", color: "#1e40af" },
	3: { bg: "#e0f2fe", color: "#0369a1" },
	4: { bg: "#ede9fe", color: "#6d28d9" },
	5: { bg: "#ede9fe", color: "#6d28d9" },
	6: { bg: "#dcfce7", color: "#15803d" },
	7: { bg: "#dcfce7", color: "#15803d" },
	8: { bg: "#fee2e2", color: "#b91c1c" },
	9: { bg: "#f3f4f6", color: "#374151" },
	10: { bg: "#fee2e2", color: "#b91c1c" },
};

// shipment status is also numeric
const SHIPMENT_STATUS: Record<number, string> = {
	1: "Pending",
	2: "Picked up",
	3: "In transit",
	4: "Delivered",
	5: "Returned",
};

function StatusBadge({ status }: { status: number }) {
	const style = STATUS_STYLE[status] ?? {
		bg: "#f3f4f6",
		color: "#374151",
	};
	return (
		<span
			style={{
				...s.badge,
				background: style.bg,
				color: style.color,
			}}
		>
			{STATUS_LABEL[status] ?? `Status ${status}`}
		</span>
	);
}

export default function OrderDetailPage() {
	const { id = "" } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const { data, isLoading, isError } = useGetOrderDetailQuery(id, {
		skip: !id,
	});

	if (isLoading)
		return (
			<Layout>
				<div style={s.center}>Loading order…</div>
			</Layout>
		);
	if (isError || !data)
		return (
			<Layout>
				<div style={s.errMsg}>Order not found.</div>
			</Layout>
		);

	const { order } = data;
	const items: any[] = (order as any).order_details ?? [];
	const shipments: any[] = (order as any).shipments ?? [];
	const shippingAddress = (order as any).shipping_address;
	const grandTotal = (order as any).customer_pricing?.grand_total;
	const offerTotal = (order as any).offer_total;
	const shippingTotal = (order as any).shipping_total;
	const taxTotal = (order as any).tax_total;
	const paymentMethod = (order as any).payment_method;
	const customerPricing: any[] =
		(order as any).customer_pricing?.items ?? [];

	return (
		<Layout>
			{/* Header */}
			<div style={s.header}>
				<button
					onClick={() => navigate("/orders")}
					style={s.backBtn}
				>
					← Orders
				</button>
				<div style={s.headerRight}>
					<span style={s.refLabel}>
						#{(order as any).order_reference}
					</span>
					<StatusBadge
						status={(order as any).order_status}
					/>
				</div>
			</div>

			<div style={s.layout}>
				{/* Main column */}
				<div style={s.mainCol}>
					{/* Items */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Items</h2>
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
											{item
												.offer_price
												?.formatted ??
												item
													.list_price
													?.formatted}{" "}
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
									<span
										style={
											s.itemLineTotal
										}
									>
										{item
											.offer_price
											?.formatted ??
											item
												.list_price
												?.formatted}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Shipments */}
					{shipments.length > 0 && (
						<div style={s.section}>
							<h2 style={s.sectionTitle}>
								Shipments
							</h2>
							{shipments.map(
								(shipment: any) => (
									<div
										key={
											shipment.id
										}
										style={
											s.shipmentBox
										}
									>
										<div
											style={
												s.shipRow
											}
										>
											<span
												style={
													s.shipLabel
												}
											>
												Seller
											</span>
											<span
												style={
													s.shipValue
												}
											>
												{
													shipment
														.account
														?.name
												}
											</span>
										</div>
										<div
											style={
												s.shipRow
											}
										>
											<span
												style={
													s.shipLabel
												}
											>
												Status
											</span>
											<span
												style={
													s.shipValue
												}
											>
												{SHIPMENT_STATUS[
													shipment
														.status
												] ??
													`Status ${shipment.status}`}
											</span>
										</div>
										<div
											style={
												s.shipRow
											}
										>
											<span
												style={
													s.shipLabel
												}
											>
												Method
											</span>
											<span
												style={
													s.shipValue
												}
											>
												{shipment
													.shipping_method
													?.name ??
													"—"}
											</span>
										</div>
										{shipment
											.tracking
											?.tracking_number && (
											<div
												style={
													s.shipRow
												}
											>
												<span
													style={
														s.shipLabel
													}
												>
													Tracking
												</span>
												<span
													style={{
														...s.shipValue,
														fontFamily:
															"monospace",
														fontWeight: 600,
													}}
												>
													{
														shipment
															.tracking
															.tracking_number
													}
												</span>
											</div>
										)}
									</div>
								),
							)}
						</div>
					)}

					{/* Delivery address */}
					{shippingAddress?.address_line_1 && (
						<div style={s.section}>
							<h2 style={s.sectionTitle}>
								Delivery address
							</h2>
							<div style={s.addressBox}>
								{shippingAddress.name && (
									<p
										style={
											s.addressLine
										}
									>
										{
											shippingAddress.name
										}
									</p>
								)}
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
								{shippingAddress.phone_number && (
									<p
										style={
											s.addressLine
										}
									>
										{
											shippingAddress.phone_number
										}
									</p>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Side — order summary */}
				<div style={s.sideCol}>
					<div style={s.summaryCard}>
						<h2 style={s.sectionTitle}>
							Summary
						</h2>

						{/* Use customer_pricing breakdown if available */}
						{customerPricing.length > 0 ? (
							customerPricing.map(
								(line: any) => (
									<div
										key={
											line.type
										}
										style={
											s.sumRow
										}
									>
										<span
											style={
												s.sumLabel
											}
										>
											{
												line.name
											}
										</span>
										<span
											style={
												s.sumValue
											}
										>
											{
												line
													.amount
													?.formatted
											}
										</span>
									</div>
								),
							)
						) : (
							<>
								<div style={s.sumRow}>
									<span
										style={
											s.sumLabel
										}
									>
										Subtotal
									</span>
									<span
										style={
											s.sumValue
										}
									>
										{
											offerTotal?.formatted
										}
									</span>
								</div>
								{shippingTotal?.amount >
									0 && (
									<div
										style={
											s.sumRow
										}
									>
										<span
											style={
												s.sumLabel
											}
										>
											Shipping
										</span>
										<span
											style={
												s.sumValue
											}
										>
											{
												shippingTotal.formatted
											}
										</span>
									</div>
								)}
								{taxTotal?.amount >
									0 && (
									<div
										style={
											s.sumRow
										}
									>
										<span
											style={
												s.sumLabel
											}
										>
											Tax
										</span>
										<span
											style={
												s.sumValue
											}
										>
											{
												taxTotal.formatted
											}
										</span>
									</div>
								)}
							</>
						)}

						<div style={s.divider} />

						<div
							style={{
								...s.sumRow,
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
								{grandTotal?.formatted}
							</span>
						</div>

						{/* Seller info */}
						{(order as any).account && (
							<>
								<div
									style={s.divider}
								/>
								<p style={s.metaLabel}>
									Seller
								</p>
								<p style={s.metaValue}>
									{
										(
											order as any
										).account
											.name
									}
								</p>
							</>
						)}

						{/* Order date */}
						<div style={s.divider} />
						<p style={s.metaLabel}>Ordered on</p>
						<p style={s.metaValue}>
							{new Date(
								(order as any)
									.created_at *
									1000,
							).toLocaleDateString(
								undefined,
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
						</p>

						{/* Payment method */}
						{paymentMethod && (
							<>
								<div
									style={s.divider}
								/>
								<p style={s.metaLabel}>
									Payment
								</p>
								<p style={s.metaValue}>
									{
										paymentMethod.name
									}
								</p>
							</>
						)}
					</div>
				</div>
			</div>
		</Layout>
	);
}

const s: Record<string, React.CSSProperties> = {
	center: {
		textAlign: "center",
		padding: 80,
		color: "#888",
		fontSize: 15,
	},
	errMsg: {
		textAlign: "center",
		padding: 80,
		color: "#b91c1c",
		fontSize: 14,
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 28,
	},
	backBtn: {
		background: "none",
		border: "none",
		cursor: "pointer",
		fontSize: 14,
		color: "#2563eb",
		padding: 0,
	},
	headerRight: { display: "flex", alignItems: "center", gap: 12 },
	refLabel: { fontSize: 15, fontWeight: 700, color: "#111" },
	badge: {
		display: "inline-block",
		padding: "4px 12px",
		borderRadius: 20,
		fontSize: 12,
		fontWeight: 600,
	},
	layout: {
		display: "grid",
		gridTemplateColumns: "1fr 300px",
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
	sectionTitle: {
		fontSize: 15,
		fontWeight: 700,
		color: "#111",
		margin: "0 0 16px",
	},
	itemList: { display: "flex", flexDirection: "column", gap: 16 },
	itemRow: { display: "flex", gap: 14, alignItems: "flex-start" },
	itemImgWrap: {
		width: 64,
		height: 64,
		borderRadius: 8,
		overflow: "hidden",
		flexShrink: 0,
		background: "#f0f0f0",
	},
	itemImg: { width: "100%", height: "100%", objectFit: "cover" },
	imgPlaceholder: { width: "100%", height: "100%", background: "#e5e5e5" },
	itemInfo: { flex: 1 },
	itemTitle: {
		margin: "0 0 3px",
		fontSize: 14,
		fontWeight: 600,
		color: "#111",
	},
	itemMeta: { margin: 0, fontSize: 13, color: "#666" },
	scheduleTag: { margin: '3px 0 0', fontSize: 12, color: '#2563eb', fontWeight: 500 },
	itemLineTotal: {
		fontSize: 14,
		fontWeight: 700,
		color: "#111",
		whiteSpace: "nowrap",
		flexShrink: 0,
	},
	shipmentBox: {
		display: "flex",
		flexDirection: "column",
		gap: 8,
		marginBottom: 16,
	},
	shipRow: { display: "flex", justifyContent: "space-between" },
	shipLabel: { fontSize: 13, color: "#888" },
	shipValue: { fontSize: 13, color: "#111" },
	addressBox: { display: "flex", flexDirection: "column", gap: 2 },
	addressLine: { margin: 0, fontSize: 14, color: "#333" },
	summaryCard: {
		background: "#fff",
		borderRadius: 12,
		padding: 24,
		boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
		position: "sticky",
		top: 24,
	},
	sumRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	sumLabel: { fontSize: 14, color: "#555" },
	sumValue: { fontSize: 14, color: "#111" },
	divider: { height: 1, background: "#e5e5e5", margin: "14px 0" },
	metaLabel: {
		margin: "0 0 4px",
		fontSize: 11,
		color: "#999",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	metaValue: { margin: 0, fontSize: 14, color: "#111", fontWeight: 500 },
};

