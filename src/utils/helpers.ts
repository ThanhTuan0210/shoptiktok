import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return dateStr;
  }
};

export const formatDateInput = (dateStr: string): string => {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return "";
    return format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const now = (): string => new Date().toISOString();

export const today = (): string => format(new Date(), "yyyy-MM-dd");

export const getOrderStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivered: "Đã giao",
    returned: "Đã hoàn",
    cancelled: "Đã hủy",
    return_requested: "Yêu cầu hoàn",
  };
  return map[status] || status;
};

export const getOrderStatusClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: "badge-yellow",
    processing: "badge-blue",
    shipping: "badge-purple",
    delivered: "badge-green",
    returned: "badge-red",
    cancelled: "badge-gray",
    return_requested: "badge-orange",
  };
  return map[status] || "badge-gray";
};

export const getReturnReasonLabel = (reason: string): string => {
  const map: Record<string, string> = {
    wrong_size: "Sai size",
    wrong_color: "Sai màu",
    wrong_product: "Sai sản phẩm",
    defective: "Hàng lỗi",
    not_as_described: "Không đúng mô tả",
    changed_mind: "Đổi ý",
    damaged_shipping: "Hỏng khi vận chuyển",
    other: "Khác",
  };
  return map[reason] || reason;
};

export const getReturnStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Chờ xử lý",
    received: "Đã nhận về",
    restocked: "Nhập lại kho",
    disposed: "Đã hủy",
  };
  return map[status] || status;
};

export const getReturnStatusClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: "badge-yellow",
    received: "badge-blue",
    restocked: "badge-green",
    disposed: "badge-red",
  };
  return map[status] || "badge-gray";
};

export const getDefectiveTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    manufacturing: "Lỗi sản xuất",
    storage: "Hư trong kho",
    shipping: "Lỗi vận chuyển",
    customer_use: "Khách gây ra",
    other: "Khác",
  };
  return map[type] || type;
};

export const getExpenseCategoryLabel = (cat: string): string => {
  const map: Record<string, string> = {
    cogs: "Giá vốn hàng bán",
    tiktok_fee: "Phí TikTok",
    advertising: "Quảng cáo",
    shipping: "Vận chuyển",
    labor: "Nhân công",
    warehouse: "Kho bãi",
    packaging: "Đóng gói",
    livestream: "Livestream",
    other: "Chi phí khác",
  };
  return map[cat] || cat;
};

export const getStockMovementLabel = (type: string): string => {
  const map: Record<string, string> = {
    purchase: "Nhập hàng",
    sale: "Bán hàng",
    return_in: "Hàng hoàn về",
    defective: "Xuất hàng lỗi",
    adjustment: "Điều chỉnh",
    gift: "Tặng",
    loss: "Mất hàng",
  };
  return map[type] || type;
};

export const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const truncate = (str: string, maxLen: number): string => {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
};
