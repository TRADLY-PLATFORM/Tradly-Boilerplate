import TradlySDK from 'tradly'
import { buildAppQueryPayload, buildAppMutationPayload, buildAppDirectPayload } from '@/api/sdk-context'
import type {
  GetOrdersParams,
  GetOrdersResponse,
  GetOrderDetailResponse,
  UpdateOrderStatusInput,
  UpdateShipmentStatusInput,
  VerifyOrderInput,
  TradlyOrderSdkResponse,
} from '@/types/order.types'

// Get orders list (customer or vendor — same SDK method, filtered server-side)
// SDK expects: { bodyParam: { page, ... }, authKey, ... }
export const getOrders = (
  params: GetOrdersParams,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyOrderSdkResponse<GetOrdersResponse>> => {
  const bodyParam = params.page ? { ...params } : { ...params, page: 1 }
  return (TradlySDK as any).app.getOrders(
    buildAppQueryPayload(bodyParam as Record<string, unknown>, authKey, currency, language),
  )
}

// Get single order detail
// SDK expects: { id, authKey, ... }
export const getOrderDetail = (
  id: string | number,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyOrderSdkResponse<GetOrderDetailResponse>> =>
  (TradlySDK as any).app.getOrderDetail(
    buildAppDirectPayload({ id }, authKey, currency, language),
  )

// Update order status (vendor action — confirm, ship, cancel, etc.)
// SDK expects: { id, data: { status, reason?, cancel_reason? }, authKey, ... }
export const updateOrderStatus = (
  { id, ...statusData }: UpdateOrderStatusInput,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyOrderSdkResponse<Record<string, never>>> =>
  (TradlySDK as any).app.updateOrderStatus(
    buildAppDirectPayload({ id, data: statusData }, authKey, currency, language),
  )

// Update shipment status (tracking number, label url, etc.)
// SDK expects: { id, shipment_id, data: { status, tracking_number, ... }, authKey, ... }
export const updateShipmentStatus = (
  { order_id, shipment_id, ...shipmentData }: UpdateShipmentStatusInput,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyOrderSdkResponse<Record<string, never>>> =>
  (TradlySDK as any).app.updateShipmentStatus(
    buildAppDirectPayload({ id: order_id, shipment_id, data: shipmentData }, authKey, currency, language),
  )

// Verify order — for guest order lookup or security check
// SDK expects: { data: { id?, email?, phone?, code? }, authKey, ... }
export const verifyOrderDetails = (
  input: VerifyOrderInput,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyOrderSdkResponse<GetOrderDetailResponse>> =>
  (TradlySDK as any).app.verifyOrderDetails(
    buildAppMutationPayload(input, authKey, currency, language),
  )
