import type { Order } from "../types";
import { playOrderChime } from "./audioAlert";

const CHANNEL_NAME = "henr_order_realtime_bus";
const STORAGE_KEY = "tt_order_broadcast_event";

export interface OrderBroadcastPayload {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  totalAmount?: number;
  paymentMethod?: string;
  source?: string;
  timestamp: number;
}

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {}

/**
 * Phát tín hiệu khi có đơn hàng mới từ Storefront hoặc LiveStudio
 */
export function broadcastNewOrder(order: Partial<Order>): void {
  const payload: OrderBroadcastPayload = {
    orderId: order.tiktokOrderId || order.id || "NEW-ORDER",
    customerName: order.customerName || "Khách hàng",
    customerPhone: order.customerPhone || "",
    total: order.total || 0,
    totalAmount: order.total || 0,
    paymentMethod: order.paymentMethod || "cod",
    source: order.liveSessionId ? "TikTok Live" : "Website Storefront",
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel (tức thời giữa các tab trên cùng trình duyệt, latency ~0ms)
  try {
    if (channel) {
      channel.postMessage(payload);
    }
  } catch {}

  // 2. LocalStorage Event (cho mọi tab và fallback cơ chế cross-tab)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}

  // 3. CustomEvent trong cùng window
  try {
    window.dispatchEvent(new CustomEvent("henr:order_placed", { detail: payload }));
  } catch {}
}

/**
 * Đăng ký lắng nghe sự kiện nổ đơn hàng mới (tự động cập nhật tức thì KHÔNG CẦN BẤM F5)
 */
export function subscribeToNewOrders(callback: (payload: OrderBroadcastPayload) => void): () => void {
  const handlePayload = (payload: OrderBroadcastPayload) => {
    try {
      playOrderChime();
    } catch {}
    callback(payload);
  };

  // 1. BroadcastChannel listener
  const onChannelMessage = (event: MessageEvent) => {
    if (event.data && event.data.orderId) {
      handlePayload(event.data);
    }
  };
  if (channel) {
    channel.addEventListener("message", onChannelMessage);
  }

  // 2. Storage event listener (khi tab khác kích hoạt localStorage)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && payload.timestamp && Date.now() - payload.timestamp < 10000) {
          handlePayload(payload);
        }
      } catch {}
    }
  };
  window.addEventListener("storage", onStorage);

  // 3. CustomEvent listener (cùng tab)
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) handlePayload(detail);
  };
  window.addEventListener("henr:order_placed", onCustom);

  // 4. Tab Visibility / Focus listener (ngay khi chủ shop chuyển tab từ Shop về Dashboard)
  const onFocusOrVisible = () => {
    if (document.visibilityState === "visible") {
      callback({
        orderId: "FOCUS_SYNC",
        customerName: "",
        total: 0,
        timestamp: Date.now()
      });
    }
  };
  window.addEventListener("focus", onFocusOrVisible);
  document.addEventListener("visibilitychange", onFocusOrVisible);

  // 5. Heartbeat Poller (mỗi 3 giây tự động kiểm tra số lượng đơn trong Dexie DB)
  let lastCount = -1;
  const heartbeat = setInterval(async () => {
    try {
      const { db } = await import("../db/database");
      const currentCount = await db.orders.count();
      if (lastCount !== -1 && currentCount > lastCount) {
        // Có đơn mới được thêm trực tiếp vào DB
        const latestOrder = await db.orders.orderBy("id").last();
        handlePayload({
          orderId: latestOrder?.tiktokOrderId || "ORDER_DETECTED",
          customerName: latestOrder?.customerName || "Khách hàng",
          total: latestOrder?.total || 0,
          timestamp: Date.now()
        });
      }
      lastCount = currentCount;
    } catch {}
  }, 3000);

  return () => {
    if (channel) {
      channel.removeEventListener("message", onChannelMessage);
    }
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("henr:order_placed", onCustom);
    window.removeEventListener("focus", onFocusOrVisible);
    document.removeEventListener("visibilitychange", onFocusOrVisible);
    clearInterval(heartbeat);
  };
}
