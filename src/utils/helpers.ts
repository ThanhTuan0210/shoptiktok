import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num || 0);
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
    processing: "Đang chuẩn bị",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    returned: "Đã hoàn trả",
    cancelled: "Đã huỷ đơn",
    return_requested: "Yêu cầu hoàn trả",
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
    wrong_size: "Sai kích thước / size",
    wrong_color: "Sai màu sắc",
    wrong_product: "Giao nhầm sản phẩm",
    defective: "Hàng lỗi / rách chỉ",
    not_as_described: "Không giống mô tả ảnh",
    changed_mind: "Đổi ý không muốn mua",
    damaged_shipping: "Hư hỏng do vận chuyển",
    other: "Lý do khác",
  };
  return map[reason] || reason;
};

export const getReturnStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Chờ xử lý",
    received: "Đã nhận hàng về",
    restocked: "Đã nhập lại kho",
    disposed: "Đã tiêu huỷ / thanh lý",
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
    manufacturing: "Lỗi sản xuất / may mặc",
    storage: "Hư hại trong kho lưu",
    shipping: "Hư hỏng do vận chuyển",
    customer_use: "Khách thử làm rách/bẩn",
    other: "Lỗi khác",
  };
  return map[type] || type;
};

export const getExpenseCategoryLabel = (cat: string): string => {
  const map: Record<string, string> = {
    cogs: "Giá vốn hàng bán (COGS)",
    tiktok_fee: "Phí sàn TikTok Shop",
    advertising: "Quảng cáo TikTok Ads",
    shipping: "Cước phí vận chuyển",
    labor: "Lương & Nhân công",
    warehouse: "Thuê mặt bằng kho",
    packaging: "Bao bì & Đóng gói",
    livestream: "Chi phí Livestream / KOC",
    other: "Chi phí vận hành khác",
  };
  return map[cat] || cat;
};

export const getStockMovementLabel = (type: string): string => {
  const map: Record<string, string> = {
    purchase: "Nhập thêm hàng",
    sale: "Xuất bán đơn hàng",
    return_in: "Khách trả hàng về kho",
    defective: "Xuất huỷ hàng lỗi",
    adjustment: "Kiểm kê điều chỉnh kho",
    gift: "Quà tặng kèm / Tri ân",
    loss: "Thất thoát / Hao hụt",
  };
  return map[type] || type;
};

export const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const truncate = (str: string, maxLen: number): string => {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
};
