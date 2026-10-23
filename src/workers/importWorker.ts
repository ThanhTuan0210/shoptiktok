import * as XLSX from "xlsx";
import type { Order, OrderItem, OrderStatus } from "../types";

function mapShopeeStatus(rawStatus: string): OrderStatus {
  const s = (rawStatus || "").toLowerCase().trim();
  if (!s) return "pending";

  if (s.includes("chờ xác nhận") || s.includes("chờ thanh toán") || s.includes("unpaid")) {
    return "pending";
  }
  if (s.includes("chờ lấy hàng") || s.includes("đang xử lý") || s.includes("ready_to_ship") || s.includes("processed")) {
    return "processing";
  }
  if (s.includes("đang giao") || s.includes("đã giao cho đvvc") || s.includes("đang vận chuyển") || s.includes("shipped")) {
    return "shipping";
  }
  if (s.includes("đã giao") || s.includes("hoàn thành") || s.includes("delivered") || s.includes("completed")) {
    return "delivered";
  }
  if (s.includes("hủy") || s.includes("đã hủy") || s.includes("cancelled") || s.includes("canceled")) {
    return "cancelled";
  }
  if (s.includes("hoàn") || s.includes("trả hàng") || s.includes("return") || s.includes("refund")) {
    return "returned";
  }
  return "pending";
}

export function parseExcelRowsToOrders(rows: Record<string, any>[]): Partial<Order>[] {
  const orderMap = new Map<string, Partial<Order>>();

  for (const row of rows) {
    // 1. Detect Shopee
    const isShopee = Boolean(
      row["Mã đơn Shopee"] ||
      row["Shopee Order ID"] ||
      (row["Mã đơn hàng"] && !row["Mã đơn TikTok"]) ||
      String(row["Đơn vị vận chuyển"] || "").toLowerCase().includes("spx") ||
      String(row["Đơn vị vận chuyển"] || "").toLowerCase().includes("shopee") ||
      row["Tên phân loại hàng"] !== undefined ||
      row["Shopee Xu"] !== undefined ||
      row["Được Shopee trợ giá"] !== undefined ||
      row["Phí cố định"] !== undefined ||
      row["Phí dịch vụ"] !== undefined
    );

    const rawId = String(
      row["Mã đơn hàng"] ||
      row["Mã đơn Shopee"] ||
      row["Mã đơn TikTok"] ||
      row["Order ID"] ||
      row["order_id"] ||
      ""
    ).trim();

    if (!rawId) continue;

    const shopeeOrderId = isShopee ? rawId : undefined;
    const tiktokOrderId = isShopee ? `SHOPEE-${rawId}` : rawId;
    const key = isShopee ? `shopee_${shopeeOrderId}` : `tiktok_${tiktokOrderId}`;

    // 2. Extract item information
    const productName = String(
      row["Tên sản phẩm"] ||
      row["Product Name"] ||
      row["Tên Mặt Hàng"] ||
      (isShopee ? "Sản phẩm Shopee" : "Sản phẩm TikTok Shop")
    ).trim();

    const variantInfo = String(
      row["Tên phân loại hàng"] ||
      row["Phân loại hàng"] ||
      row["Phân loại"] ||
      row["Variation Name"] ||
      row["Mẫu/Màu"] ||
      ""
    ).trim();

    const quantity = Math.max(
      1,
      parseInt(String(row["Số lượng"] || row["Quantity"] || row["SL"] || 1), 10) || 1
    );

    const unitPrice =
      parseFloat(
        String(
          row["Giá gốc"] ||
          row["Đơn giá"] ||
          row["Deal Price"] ||
          row["Original Price"] ||
          row["Giá bán"] ||
          0
        )
      ) || 0;

    const sku = String(
      row["SKU phân loại hàng"] ||
      row["Mã SKU"] ||
      row["SKU Reference No."] ||
      row["SKU sản phẩm"] ||
      ""
    ).trim();

    const item: OrderItem = {
      productId: "",
      variantId: "",
      productName,
      variantInfo: variantInfo || "Tiêu chuẩn",
      sku,
      quantity,
      unitPrice,
      unitCost: Math.round(unitPrice * 0.45), // Giá vốn ước tính thực tế ngành may mặc ~45%
    };

    if (orderMap.has(key)) {
      // Order already encountered, append this item
      const existing = orderMap.get(key)!;
      existing.items = [...(existing.items || []), item];
      continue;
    }

    // 3. Status mapping
    const rawStatus = String(
      row["Trạng thái Đơn hàng"] ||
      row["Trạng thái"] ||
      row["Order Status"] ||
      row["status"] ||
      ""
    );
    const status = mapShopeeStatus(rawStatus);

    // 4. Carrier & Tracking
    const carrier = String(
      row["Đơn vị vận chuyển"] ||
      row["Shipping Carrier"] ||
      (isShopee ? "SPX Express" : "GHTK")
    ).trim();

    const tracking = String(
      row["Mã vận đơn"] ||
      row["Tracking Number"] ||
      row["tracking_number"] ||
      ""
    ).trim();

    // 5. Financials
    const total =
      parseFloat(
        String(
          row["Tổng giá trị đơn hàng (VND)"] ||
          row["Tổng thanh toán"] ||
          row["Tổng tiền"] ||
          row["Total"] ||
          row["order_amount"] ||
          row["Tiền người mua trả"] ||
          0
        )
      ) || (unitPrice * quantity);

    const subtotal =
      parseFloat(
        String(
          row["Tổng số tiền"] ||
          row["Tiền hàng"] ||
          row["Subtotal"] ||
          total
        )
      ) || total;

    const shippingFee =
      parseFloat(
        String(
          row["Phí vận chuyển người mua trả"] ||
          row["Phí ship"] ||
          row["Phí vận chuyển"] ||
          row["Shipping"] ||
          0
        )
      ) || 0;

    // Real Shopee fee extraction if columns exist
    const feeCoDinh = parseFloat(String(row["Phí cố định"] || 0)) || 0;
    const feeDichVu = parseFloat(String(row["Phí dịch vụ"] || 0)) || 0;
    const feeThanhToan = parseFloat(String(row["Phí thanh toán"] || 0)) || 0;
    const sumShopeeFee = feeCoDinh + feeDichVu + feeThanhToan;

    let shopeeFeeRate = isShopee ? 9.5 : 0;
    let shopeeFeeAmount = 0;
    if (isShopee) {
      if (sumShopeeFee > 0) {
        shopeeFeeAmount = Math.round(sumShopeeFee);
        shopeeFeeRate = total > 0 ? parseFloat(((sumShopeeFee / total) * 100).toFixed(1)) : 9.5;
      } else {
        shopeeFeeAmount = Math.round(total * (shopeeFeeRate / 100));
      }
    }

    const tiktokFeeRate = !isShopee ? 1.8 : 0;
    const tiktokFeeAmount = !isShopee ? Math.round(total * (tiktokFeeRate / 100)) : 0;

    // 6. Address combination
    const street = String(row["Địa chỉ nhận hàng"] || row["Địa chỉ"] || row["Address"] || "").trim();
    const ward = String(row["Phường/Xã"] || row["Phường / Xã"] || "").trim();
    const district = String(row["Quận/Huyện"] || row["Quận / Huyện"] || "").trim();
    const city = String(row["Tỉnh/Thành phố"] || row["Tỉnh / Thành phố"] || "").trim();
    const fullAddress = [street, ward, district, city].filter(Boolean).join(", ") || street;

    // 7. Order Date
    const orderDateRaw = String(
      row["Thời gian đặt hàng"] ||
      row["Ngày đặt"] ||
      row["Order Date"] ||
      row["create_time"] ||
      new Date().toISOString().split("T")[0]
    );
    const orderDate = orderDateRaw.slice(0, 10);

    const cancelReason = String(row["Lý do hủy"] || row["Cancel Reason"] || "").trim();
    const note = String(
      row["Ghi chú từ người mua"] ||
      row["Ghi chú của người bán"] ||
      row["Ghi chú"] ||
      (isShopee ? "Đồng bộ Shopee Seller Centre" : "Đồng bộ TikTok Shop")
    ).trim();

    orderMap.set(key, {
      channel: isShopee ? "shopee" : "tiktok",
      shopeeOrderId,
      tiktokOrderId,
      customerName: String(
        row["Tên người nhận"] ||
        row["Tên khách"] ||
        row["Customer Name"] ||
        row["buyer_username"] ||
        "Khách hàng Shopee"
      ).trim(),
      customerPhone: String(
        row["Số điện thoại"] ||
        row["SĐT"] ||
        row["Phone"] ||
        row["recipient_phone"] ||
        ""
      ).trim(),
      customerAddress: fullAddress,
      total,
      subtotal,
      shippingFee,
      shippingCarrier: carrier,
      trackingNumber: tracking,
      shopeeCarrier: isShopee ? carrier : undefined,
      shopeeFeeRate,
      shopeeFeeAmount,
      tiktokFeeRate,
      tiktokFeeAmount,
      orderDate,
      status,
      cancelReason: cancelReason || undefined,
      note,
      items: [item],
    });
  }

  return Array.from(orderMap.values());
}

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const { buffer } = e.data;
    const data = new Uint8Array(buffer);
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

    const orders = parseExcelRowsToOrders(rows);
    self.postMessage({ success: true, orders });
  } catch (error: any) {
    self.postMessage({ success: false, error: error?.message || "Lỗi xử lý file Excel" });
  }
};
