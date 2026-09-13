import type { SupabaseSyncConfig, Order, Product } from "../types";

export interface SyncStatusResult {
  connected: boolean;
  message: string;
  timestamp: string;
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
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
    });

    if (response.ok || response.status === 200) {
      return {
        connected: true,
        message: "Kết nối máy chủ đám mây Supabase PostgreSQL thành công!",
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        connected: false,
        message: `Máy chủ phản hồi mã lỗi: ${response.status}`,
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
  status TEXT NOT NULL,
  order_date TIMESTAMPTZ NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  carrier_tracking_code TEXT,
  carrier_name TEXT,
  payment_method TEXT DEFAULT 'cod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Realtime cho bảng orders:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
`;
}
