import type { SupabaseSyncConfig, Order, Product } from "../types";
import { DEFAULT_SUPABASE_SYNC_CONFIG } from "../types";
import { db } from "../db/database";

export interface SyncStatusResult {
  connected: boolean;
  message: string;
  timestamp: string;
}

export interface SyncSummary {
  success: boolean;
  pushedOrders: number;
  pulledOrders: number;
  pushedProducts: number;
  pulledProducts: number;
  message: string;
  timestamp: string;
}

export function getActiveSupabaseConfig(): SupabaseSyncConfig {
  try {
    const saved = localStorage.getItem("tt_supabaseConfig");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
        return { ...DEFAULT_SUPABASE_SYNC_CONFIG, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_SUPABASE_SYNC_CONFIG;
}

function getHeaders(config: SupabaseSyncConfig) {
  return {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

export async function testSupabaseConnection(config: SupabaseSyncConfig): Promise<SyncStatusResult> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      connected: false,
      message: "Chưa điền Supabase URL hoặc Anon Key.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const cleanUrl = config.supabaseUrl.replace(/\/+$/, "");
    const response = await fetch(`${cleanUrl}/rest/v1/orders?limit=1`, {
      headers: getHeaders(config),
    });

    if (response.ok || response.status === 200) {
      return {
        connected: true,
        message: "Kết nối máy chủ đám mây Supabase PostgreSQL thành công! (200 OK)",
        timestamp: new Date().toISOString(),
      };
    } else {
      const errorText = await response.text();
      return {
        connected: false,
        message: `Lỗi kết nối Supabase (${response.status}): ${errorText.slice(0, 150)}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      message: `Không thể kết nối đến Supabase: ${err?.message || "Lỗi mạng"}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export function mapOrderToSupabase(o: Order) {
  return {
    id: o.id,
    tiktok_order_id: o.tiktokOrderId || null,
    customer_name: o.customerName,
    customer_phone: o.customerPhone || null,
    customer_address: o.shippingAddress || null,
    items: o.items || [],
    status: o.status || "pending",
    order_date: o.orderDate || new Date().toISOString(),
    total: o.total || 0,
    subtotal: o.subtotal || 0,
    shipping_fee: o.shippingFee || 0,
    tiktok_discount: o.tiktokDiscount || 0,
    seller_discount: o.sellerDiscount || 0,
    tiktok_fee_rate: o.tiktokFeeRate ?? 1.8,
    carrier_tracking_code: o.trackingNumber || null,
    carrier_name: o.carrier || null,
    carrier_service_id: o.carrierServiceId || null,
    carrier_dispatch_status: o.carrierDispatchStatus || null,
    payment_method: o.paymentMethod || "cod",
    payment_proof_tx_id: o.paymentProofTxId || null,
    is_suspicious: Boolean(o.isSuspicious),
    suspicious_reason: o.suspiciousReason || null,
    idempotency_key: o.idempotencyKey || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapSupabaseToOrder(row: any): Order {
  return {
    id: row.id,
    tiktokOrderId: row.tiktok_order_id || undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || "",
    shippingAddress: row.customer_address || "",
    items: Array.isArray(row.items) ? row.items : [],
    status: row.status || "pending",
    orderDate: row.order_date || new Date().toISOString(),
    total: Number(row.total) || 0,
    subtotal: Number(row.subtotal) || 0,
    shippingFee: Number(row.shipping_fee) || 0,
    tiktokDiscount: Number(row.tiktok_discount) || 0,
    sellerDiscount: Number(row.seller_discount) || 0,
    tiktokFeeRate: Number(row.tiktok_fee_rate) || 1.8,
    trackingNumber: row.carrier_tracking_code || undefined,
    carrier: row.carrier_name || undefined,
    carrierServiceId: row.carrier_service_id || undefined,
    carrierDispatchStatus: row.carrier_dispatch_status || undefined,
    paymentMethod: row.payment_method || "cod",
    paymentProofTxId: row.payment_proof_tx_id || undefined,
    isSuspicious: Boolean(row.is_suspicious),
    suspiciousReason: row.suspicious_reason || undefined,
    idempotencyKey: row.idempotency_key || undefined,
    createdAt: row.created_at || undefined,
  };
}

export function mapProductToSupabase(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description || "",
    image_url: p.images?.[0] || "",
    cost_price: p.costPrice || 0,
    selling_price: p.sellingPrice || 0,
    low_stock_threshold: p.lowStockThreshold || 10,
    is_active: p.isActive ?? true,
    variants: p.variants || [],
    updated_at: new Date().toISOString(),
  };
}

export function mapSupabaseToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.id,
    name: row.name,
    category: row.category,
    description: row.description || "",
    images: row.image_url ? [row.image_url] : [],
    costPrice: Number(row.cost_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    lowStockThreshold: Number(row.low_stock_threshold) || 10,
    isActive: row.is_active ?? true,
    variants: Array.isArray(row.variants) ? row.variants : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function pushOrderToSupabase(order: Order, customConfig?: SupabaseSyncConfig): Promise<boolean> {
  const cfg = customConfig || getActiveSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return false;

  try {
    const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, "");
    const mapped = mapOrderToSupabase(order);
    const res = await fetch(`${cleanUrl}/rest/v1/orders`, {
      method: "POST",
      headers: {
        ...getHeaders(cfg),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(mapped),
    });
    return res.ok;
  } catch (e) {
    console.warn("Supabase pushOrder error (offline fallback):", e);
    return false;
  }
}

export async function pushOrdersBatch(orders: Order[], customConfig?: SupabaseSyncConfig): Promise<number> {
  const cfg = customConfig || getActiveSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || orders.length === 0) return 0;

  const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, "");
  const mapped = orders.map(mapOrderToSupabase);
  const CHUNK_SIZE = 50;
  let totalPushed = 0;

  for (let i = 0; i < mapped.length; i += CHUNK_SIZE) {
    const chunk = mapped.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(`${cleanUrl}/rest/v1/orders`, {
        method: "POST",
        headers: {
          ...getHeaders(cfg),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) {
        totalPushed += chunk.length;
      }
    } catch (err) {
      console.warn("Batch push error:", err);
    }
  }

  return totalPushed;
}

export async function fetchOrdersFromSupabase(customConfig?: SupabaseSyncConfig): Promise<Order[]> {
  const cfg = customConfig || getActiveSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return [];

  try {
    const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/rest/v1/orders?order=order_date.desc&limit=1000`, {
      headers: getHeaders(cfg),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(mapSupabaseToOrder) : [];
  } catch (err) {
    console.warn("Fetch orders error:", err);
    return [];
  }
}

export async function pushProductsBatch(products: Product[], customConfig?: SupabaseSyncConfig): Promise<number> {
  const cfg = customConfig || getActiveSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || products.length === 0) return 0;

  const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, "");
  const mapped = products.map(mapProductToSupabase);

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/products`, {
      method: "POST",
      headers: {
        ...getHeaders(cfg),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(mapped),
    });
    return res.ok ? mapped.length : 0;
  } catch (err) {
    console.warn("Push products error:", err);
    return 0;
  }
}

export async function fetchProductsFromSupabase(customConfig?: SupabaseSyncConfig): Promise<Product[]> {
  const cfg = customConfig || getActiveSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return [];

  try {
    const cleanUrl = cfg.supabaseUrl.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/rest/v1/products?limit=500`, {
      headers: getHeaders(cfg),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(mapSupabaseToProduct) : [];
  } catch (err) {
    console.warn("Fetch products error:", err);
    return [];
  }
}

export async function performFullTwoWaySync(customConfig?: SupabaseSyncConfig): Promise<SyncSummary> {
  const cfg = customConfig || getActiveSupabaseConfig();
  const test = await testSupabaseConnection(cfg);
  if (!test.connected) {
    return {
      success: false,
      pushedOrders: 0,
      pulledOrders: 0,
      pushedProducts: 0,
      pulledProducts: 0,
      message: test.message,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // 1. Load local Dexie data
    const localOrders = await db.orders.toArray();
    const localProducts = await db.products.toArray();

    // 2. Push local data to Supabase
    const pushedOrders = await pushOrdersBatch(localOrders, cfg);
    const pushedProducts = await pushProductsBatch(localProducts, cfg);

    // 3. Pull remote data from Supabase
    const remoteOrders = await fetchOrdersFromSupabase(cfg);
    const remoteProducts = await fetchProductsFromSupabase(cfg);

    // 4. Merge remote data into local Dexie
    if (remoteOrders.length > 0) {
      await db.orders.bulkPut(remoteOrders);
    }
    if (remoteProducts.length > 0) {
      await db.products.bulkPut(remoteProducts);
    }

    const timestamp = new Date().toISOString();
    const updatedCfg: SupabaseSyncConfig = {
      ...cfg,
      lastSyncTime: timestamp,
    };
    localStorage.setItem("tt_supabaseConfig", JSON.stringify(updatedCfg));

    return {
      success: true,
      pushedOrders,
      pulledOrders: remoteOrders.length,
      pushedProducts,
      pulledProducts: remoteProducts.length,
      message: `Đồng bộ 2 chiều thành công: Đã đẩy ${pushedOrders} đơn / ${pushedProducts} SP lên mây, kéo ${remoteOrders.length} đơn về máy!`,
      timestamp,
    };
  } catch (err: any) {
    return {
      success: false,
      pushedOrders: 0,
      pulledOrders: 0,
      pushedProducts: 0,
      pulledProducts: 0,
      message: "Lỗi đồng bộ: " + (err?.message || "Không xác định"),
      timestamp: new Date().toISOString(),
    };
  }
}

export function generateSupabaseSQLSchema(): string {
  return `-- BẢNG DỮ LIỆU ĐỒNG BỘ CHO HENR.STUDIO & TIKTOK SHOP MANAGER
-- Chạy đoạn mã này trong Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tiktok_order_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  tiktok_discount NUMERIC DEFAULT 0,
  seller_discount NUMERIC DEFAULT 0,
  tiktok_fee_rate NUMERIC DEFAULT 1.8,
  carrier_tracking_code TEXT,
  carrier_name TEXT,
  carrier_service_id TEXT,
  carrier_dispatch_status TEXT,
  payment_method TEXT DEFAULT 'cod',
  payment_proof_tx_id TEXT,
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_history (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  exchange_date TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  items_exchanged JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_difference NUMERIC DEFAULT 0,
  shipping_fee_responsibility TEXT DEFAULT 'shop',
  note TEXT
);

GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE products TO anon, authenticated, service_role;
GRANT ALL ON TABLE exchange_history TO anon, authenticated, service_role;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access orders" ON orders;
CREATE POLICY "Public full access orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access products" ON products;
CREATE POLICY "Public full access products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access exchanges" ON exchange_history;
CREATE POLICY "Public full access exchanges" ON exchange_history FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
`;
}
