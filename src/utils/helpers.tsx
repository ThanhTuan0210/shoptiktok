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
    pending: "Chá» xÃ¡c nháº­n",
    processing: "Äang chuáº©n bá»‹",
    shipping: "Äang giao hÃ ng",
    delivered: "ÄÃ£ giao hÃ ng",
    returned: "ÄÃ£ hoÃ n tráº£",
    cancelled: "ÄÃ£ huá»· Ä‘Æ¡n",
    return_requested: "YÃªu cáº§u hoÃ n tráº£",
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
    wrong_size: "Sai kÃ­ch thÆ°á»›c / size",
    wrong_color: "Sai mÃ u sáº¯c",
    wrong_product: "Giao nháº§m sáº£n pháº©m",
    defective: "HÃ ng lá»—i / rÃ¡ch chá»‰",
    not_as_described: "KhÃ´ng giá»‘ng mÃ´ táº£ áº£nh",
    changed_mind: "Äá»•i Ã½ khÃ´ng muá»‘n mua",
    damaged_shipping: "HÆ° há»ng do váº­n chuyá»ƒn",
    other: "LÃ½ do khÃ¡c",
  };
  return map[reason] || reason;
};

export const getReturnStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Chá» xá»­ lÃ½",
    received: "ÄÃ£ nháº­n hÃ ng vá»",
    restocked: "ÄÃ£ nháº­p láº¡i kho",
    disposed: "ÄÃ£ tiÃªu huá»· / thanh lÃ½",
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
    manufacturing: "Lá»—i sáº£n xuáº¥t / may máº·c",
    storage: "HÆ° háº¡i trong kho lÆ°u",
    shipping: "HÆ° há»ng do váº­n chuyá»ƒn",
    customer_use: "KhÃ¡ch thá»­ lÃ m rÃ¡ch/báº©n",
    other: "Lá»—i khÃ¡c",
  };
  return map[type] || type;
};

export const getExpenseCategoryLabel = (cat: string): string => {
  const map: Record<string, string> = {
    cogs: "GiÃ¡ vá»‘n hÃ ng bÃ¡n (COGS)",
    tiktok_fee: "PhÃ­ sÃ n TikTok Shop",
    shopee_fee: "PhÃ­ sÃ n Shopee (Cá»‘ Ä‘á»‹nh & Thanh toÃ¡n)",
    advertising: "Quáº£ng cÃ¡o Ads",
    shipping: "CÆ°á»›c phÃ­ váº­n chuyá»ƒn",
    labor: "LÆ°Æ¡ng & NhÃ¢n cÃ´ng",
    warehouse: "ThuÃª máº·t báº±ng kho",
    packaging: "Bao bÃ¬ & ÄÃ³ng gÃ³i",
    livestream: "Chi phÃ­ Livestream / KOC",
    other: "Chi phÃ­ váº­n hÃ nh khÃ¡c",
  };
  return map[cat] || cat;
};

export const getChannelLabel = (channel?: string, order?: { tiktokOrderId?: string; shopeeOrderId?: string; liveSessionId?: string }): string => {
  if (channel === "shopee" || (order?.shopeeOrderId && !order?.tiktokOrderId)) return "Shopee";
  if (channel === "website" || (order?.tiktokOrderId && order.tiktokOrderId.startsWith("WEB-"))) return "Website";
  if (channel === "live" || order?.liveSessionId) return "Live";
  return "TikTok Shop";
};

export const getChannelBadge = (channel?: string, order?: { tiktokOrderId?: string; shopeeOrderId?: string; liveSessionId?: string }) => {
  const ch = getChannelLabel(channel, order);
  if (ch === "Shopee") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-[#EE4D2D] border border-orange-500/30">
        🛍️ Shopee
      </span>
    );
  }
  if (ch === "Website") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
        🌐 Website
      </span>
    );
  }
  if (ch === "Live") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
        🔴 Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
      🎵 TikTok
    </span>
  );
};

export const getStockMovementLabel = (type: string): string => {
  const map: Record<string, string> = {
    purchase: "Nháº­p thÃªm hÃ ng",
    sale: "Xuáº¥t bÃ¡n Ä‘Æ¡n hÃ ng",
    return_in: "KhÃ¡ch tráº£ hÃ ng vá» kho",
    defective: "Xuáº¥t huá»· hÃ ng lá»—i",
    adjustment: "Kiá»ƒm kÃª Ä‘iá»u chá»‰nh kho",
    gift: "QuÃ  táº·ng kÃ¨m / Tri Ã¢n",
    loss: "Tháº¥t thoÃ¡t / Hao há»¥t",
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

