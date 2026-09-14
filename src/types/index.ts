// =====================
// ENUMS / TYPES
// =====================

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "returned"
  | "cancelled"
  | "return_requested";

export type ReturnReason =
  | "wrong_size"
  | "wrong_color"
  | "wrong_product"
  | "defective"
  | "not_as_described"
  | "changed_mind"
  | "damaged_shipping"
  | "other";

export type ReturnStatus =
  | "pending"
  | "received"
  | "restocked"
  | "disposed";

export type DefectiveType =
  | "manufacturing"
  | "storage"
  | "shipping"
  | "customer_use"
  | "other";

export type StockMovementType =
  | "purchase"
  | "sale"
  | "return_in"
  | "defective"
  | "adjustment"
  | "gift"
  | "loss";

export type ExpenseCategory =
  | "cogs"
  | "tiktok_fee"
  | "advertising"
  | "shipping"
  | "labor"
  | "warehouse"
  | "packaging"
  | "livestream"
  | "other";

// =====================
// CORE MODELS
// =====================

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  imageUrl?: string;
  additionalImages?: string[];
  tiktokVideoUrl?: string;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  size: string;
  sku: string;
  costPrice?: number;
  sellingPrice?: number;
  stock: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  variantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceId?: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt: string;
}

// =====================
// ORDERS
// =====================

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantInfo: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Order {
  id: string;
  tiktokOrderId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  status: OrderStatus;
  orderDate: string;
  shippingDate?: string;
  deliveredDate?: string;
  subtotal: number;
  shippingFee: number;
  tiktokDiscount?: number;
  sellerDiscount?: number;
  total: number;
  shippingCarrier?: string;
  trackingNumber?: string;
  carrierTrackingCode?: string;
  carrierName?: string;
  carrierFee?: number;
  carrierStatus?: string;
  paymentProofTxId?: string;
  exchanges?: OrderExchangeRecord[];
  isSuspicious?: boolean;
  suspiciousReason?: string;
  idempotencyKey?: string;
  paymentMethod?: string;
  liveSessionId?: string;
  cancelReason?: string;
  returnReason?: string;
  note?: string;
  tiktokFeeRate?: number;
  tiktokFeeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// =====================
// RETURNS
// =====================

export interface Return {
  id: string;
  orderId: string;
  tiktokOrderId?: string;
  customerName: string;
  items: OrderItem[];
  reason: ReturnReason;
  reasonDetail?: string;
  status: ReturnStatus;
  returnDate: string;
  receivedDate?: string;
  refundAmount: number;
  shippingBack?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================
// DEFECTIVE
// =====================

export interface DefectiveItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  type: DefectiveType;
  description: string;
  costValue: number;
  returnId?: string;
  date: string;
  note?: string;
  createdAt: string;
}

// =====================
// FINANCE
// =====================

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  referenceId?: string;
  note?: string;
  createdAt: string;
}

// =====================
// SETTINGS
// =====================

export interface AppSettings {
  id?: number;
  shopName: string;
  currency: string;
  tiktokFeeRate: number;
  lowStockDefault: number;
  shippingCostPerOrder?: number;
}

// =====================
// UI HELPERS
// =====================

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterState {
  search: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}

// =====================
// TIKTOK LIVE SESSION
// =====================

export type LiveSessionStatus = "scheduled" | "active" | "ended";

export interface LivePinnedProduct {
  pinNumber: number;
  productId: string;
  productName: string;
  productSku: string;
  imageUrl?: string;
  originalPrice: number;
  livePrice: number;
  allocatedStock: number;
  soldCount: number;
}

export interface LiveSession {
  id: string;
  title: string;
  hostName: string;
  status: LiveSessionStatus;
  scheduledStartTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  targetRevenue: number;
  pinnedProducts: LivePinnedProduct[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}


export interface PromoSettings {
  enableLuckyWheel: boolean;
  enableVoucher: boolean;
  enableUpsell: boolean;
  enableComboDiscount: boolean;
  enableSocialProof: boolean;
}

export const DEFAULT_PROMO_SETTINGS: PromoSettings = {
  enableLuckyWheel: false,
  enableVoucher: false,
  enableUpsell: false,
  enableComboDiscount: false,
  enableSocialProof: true,
};

// =====================
// WEBSHIELD (ANTI-COPY & INTELLECTUAL PROPERTY)
// =====================

export interface WebShieldSettings {
  enableAntiCopy: boolean;
  showToast: boolean;
  blockShortcuts: boolean;
}

export const DEFAULT_WEBSHIELD_SETTINGS: WebShieldSettings = {
  enableAntiCopy: true,
  showToast: true,
  blockShortcuts: true,
};



// =====================
// ENTERPRISE SUITE: REAL BANKING, CARRIER, CLOUD & EXCHANGE
// =====================

export interface PaymentGatewayConfig {
  provider: "sepay" | "payos";
  apiToken: string;
  accountNumber: string;
  bankName: string;
  isAutoVerifyEnabled: boolean;
  webhookUrl?: string;
}

export const DEFAULT_PAYMENT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  provider: "sepay",
  apiToken: "",
  accountNumber: "1234567890",
  bankName: "Vietcombank",
  isAutoVerifyEnabled: true,
};

export interface CourierConfig {
  provider: "ghn" | "viettelpost" | "ghtk";
  apiToken: string;
  shopId: string;
  defaultWeightGram: number;
  requiredNote: string;
  isSandbox: boolean;
}

export const DEFAULT_COURIER_CONFIG: CourierConfig = {
  provider: "ghn",
  apiToken: "",
  shopId: "192841",
  defaultWeightGram: 350,
  requiredNote: "CHOXEMHANGKHONGTHU",
  isSandbox: true,
};

export interface SupabaseSyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSync: boolean;
  lastSyncTime?: string;
}

export const DEFAULT_SUPABASE_SYNC_CONFIG: SupabaseSyncConfig = {
  supabaseUrl: "https://btlzbzlcfmesccnqbqic.supabase.co",
  supabaseAnonKey: "sb_publishable_p7BLEF5uPTofb6YotWRTww_xVbFMp8e",
  autoSync: true,
};

export interface TikTokBridgeConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher: string;
  safetyBufferStock: number;
  autoLockLiveStock: boolean;
}

export const DEFAULT_TIKTOK_BRIDGE_CONFIG: TikTokBridgeConfig = {
  appKey: "",
  appSecret: "",
  accessToken: "",
  shopCipher: "",
  safetyBufferStock: 3,
  autoLockLiveStock: true,
};

export interface OrderExchangeRecord {
  id: string;
  orderId: string;
  originalVariantId: string;
  originalProductName: string;
  originalSku: string;
  newVariantId: string;
  newProductName: string;
  newSku: string;
  qty: number;
  reason: string;
  priceDifference: number;
  shippingFeePayer: "shop" | "customer" | "split";
  status: "pending_pickup" | "in_transit" | "completed";
  createdAt: string;
}

// =====================
// SECURITY & ANTI-FRAUD
// =====================

export interface SecurityConfig {
  enableRateLimit: boolean;
  maxOrdersPerWindow: number;
  rateLimitWindowMinutes: number;
  highValueCodThreshold: number;
  enableStockMasking: boolean;
  enableWatermark: boolean;
  watermarkText: string;
  phoneBlacklist: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableRateLimit: true,
  maxOrdersPerWindow: 2,
  rateLimitWindowMinutes: 15,
  highValueCodThreshold: 500000,
  enableStockMasking: true,
  enableWatermark: true,
  watermarkText: "Henr.Studio • Thiết Kế Độc Quyền",
  phoneBlacklist: ["0912345678", "0987654321"],
};
