import type { SecurityConfig } from "../types";
import { DEFAULT_SECURITY_CONFIG } from "../types";

const SALT = "HenrStudio_Sec_Vault_v2";

/**
 * Obfuscates sensitive data with base64 + salt before saving to localStorage
 */
export function secureStore(key: string, data: any): void {
  try {
    const jsonStr = JSON.stringify(data);
    let obfuscated = "";
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
      obfuscated += String.fromCharCode(charCode);
    }
    const b64 = btoa(encodeURIComponent(obfuscated));
    localStorage.setItem(key, "enc_" + b64);
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

/**
 * Retrieves and de-obfuscates data from localStorage
 */
export function secureRetrieve<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    if (raw.startsWith("enc_")) {
      const b64 = raw.substring(4);
      const obfuscated = decodeURIComponent(atob(b64));
      let jsonStr = "";
      for (let i = 0; i < obfuscated.length; i++) {
        const charCode = obfuscated.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
        jsonStr += String.fromCharCode(charCode);
      }
      return JSON.parse(jsonStr) as T;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Checks client-side rate limiting to prevent spam order floods
 */
export function checkRateLimit(config: SecurityConfig = DEFAULT_SECURITY_CONFIG): {
  allowed: boolean;
  waitMinutes?: number;
} {
  if (!config.enableRateLimit) return { allowed: true };

  try {
    const windowMs = config.rateLimitWindowMinutes * 60 * 1000;
    const now = Date.now();
    const rawHistory = localStorage.getItem("tt_order_history_timestamps");
    let history: number[] = rawHistory ? JSON.parse(rawHistory) : [];

    // Filter to current window
    history = history.filter(t => now - t < windowMs);
    localStorage.setItem("tt_order_history_timestamps", JSON.stringify(history));

    if (history.length >= config.maxOrdersPerWindow) {
      const oldestInWindow = Math.min(...history);
      const remainingMs = windowMs - (now - oldestInWindow);
      const waitMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
      return { allowed: false, waitMinutes };
    }
  } catch {}

  return { allowed: true };
}

/**
 * Records an order creation attempt timestamp
 */
export function recordOrderAttempt(): void {
  try {
    const rawHistory = localStorage.getItem("tt_order_history_timestamps");
    const history: number[] = rawHistory ? JSON.parse(rawHistory) : [];
    history.push(Date.now());
    localStorage.setItem("tt_order_history_timestamps", JSON.stringify(history.slice(-10)));
  } catch {}
}

/**
 * Standardizes phone numbers for consistent matching
 */
export function cleanPhone(phone: string): string {
  return (phone || "").replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

/**
 * Evaluates fraud risk and blacklist status for an incoming order
 */
export function evaluateOrderRisk(
  phone: string,
  total: number,
  paymentMethod: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): { isSuspicious: boolean; reason?: string } {
  const normalizedPhone = cleanPhone(phone);

  // 1. Check Phone Blacklist
  if (config.phoneBlacklist && config.phoneBlacklist.length > 0) {
    const isBlacklisted = config.phoneBlacklist.some(b => {
      const cleanB = cleanPhone(b);
      return cleanB.length >= 8 && normalizedPhone.includes(cleanB);
    });

    if (isBlacklisted) {
      return {
        isSuspicious: true,
        reason: "SĐT nằm trong danh sách đen cảnh báo bom hàng / spam",
      };
    }
  }

  // 2. High-value COD check (> threshold, default 500,000đ)
  if (paymentMethod === "cod" && total >= config.highValueCodThreshold) {
    return {
      isSuspicious: true,
      reason: `Đơn COD giá trị cao (${total.toLocaleString("vi-VN")}đ >= ${config.highValueCodThreshold.toLocaleString("vi-VN")}đ) - Cần gọi điện xác nhận trước khi giao`,
    };
  }

  return { isSuspicious: false };
}
