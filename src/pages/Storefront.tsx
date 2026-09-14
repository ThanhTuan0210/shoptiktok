import { useState, useEffect, useMemo } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant, Order, LiveSession, LivePinnedProduct } from "../types";
import {
  Search, ShoppingCart, Star, ShieldCheck, Zap,
  X, Check, ChevronRight, ChevronLeft, Trash2, Plus, Minus,
  Truck, ArrowRight, Settings, Phone, QrCode, Copy,
  CheckCircle2, Ruler, Ticket, SlidersHorizontal, Sparkles, ExternalLink, Play
} from "lucide-react";
import { formatCurrency, generateId, now, today } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import SizeGuideModal from "../components/ui/SizeGuideModal";
import SocialProofNotification from "../components/ui/SocialProofNotification";
import LuckyWheelModal from "../components/ui/LuckyWheelModal";
import type { PromoSettings } from "../types";
import { DEFAULT_PROMO_SETTINGS } from "../types";
import FloatingContact from "../components/ui/FloatingContact";
import WebShield from "../components/ui/WebShield";
import ProductWatermark from "../components/ui/ProductWatermark";
import { checkRateLimit, recordOrderAttempt, evaluateOrderRisk } from "../utils/security";
import type { SecurityConfig } from "../types";
import { DEFAULT_SECURITY_CONFIG } from "../types";
import { verifyPayment, simulateIncomingPayment } from "../services/paymentGateway";
import type { PaymentGatewayConfig } from "../types";
import { DEFAULT_PAYMENT_GATEWAY_CONFIG } from "../types";
import { playOrderChime } from "../utils/audioAlert";
import { pushOrderToSupabase } from "../services/supabaseSync";

interface CartItem {
  variantId: string;
  productId: string;
  qty: number;
  product: Product;
  variant: ProductVariant;
}

interface ProductStats {
  totalSold: number;
  totalStock: number;
}

type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "cod" | "bank_transfer";

const FALLBACKS = [
  "/products/PJ-SOC-DEN-001-main.jpg",
  "/products/PJ-SOC-HON-001-main.jpg",
  "/products/PJ-SOC-NAU-001-main.jpg",
  "/products/PJ-SOC-XAN-001-main.jpg",
  "/products/PJ-TRON-001-main.jpg",
  "/products/PJ-CARO-001-main.jpg",
  "/products/PJ-NGAN-001-main.jpg",
  "/products/VN-LUA-001-main.jpg",
];

function getImg(p: Product, idx: number) {
  return (p.imageUrl && (p.imageUrl.startsWith("http") || p.imageUrl.startsWith("/"))) ? p.imageUrl : FALLBACKS[idx % FALLBACKS.length];
}
function getGallery(p: Product, idx: number): string[] {
  const main = getImg(p, idx);
  const extras = ((p.additionalImages || []) as string[]).filter(u => u && (u.startsWith("http") || u.startsWith("/")));
  return [main, ...extras];
}
function formatSold(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString(); }
function getRating(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 100;
  return 4.7 + (h % 4) * 0.1;
}
function copyText(text: string) { navigator.clipboard?.writeText(text).catch(() => {}); }

function cleanStorage(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(key);
    // Detect corrupted double-encoded UTF-8 strings in browser storage
    if (!val || /[\u00C3\u00C2\u00E1\u00C4][\x80-\xbf]/.test(val) || val.includes("S\u00e1\u00ba\u00acP") || val.includes("Mi\u00e1\u00bb")) {
      localStorage.setItem(key, fallback);
      return fallback;
    }
    return val;
  } catch {
    return fallback;
  }
}

// Vouchers definition
interface Voucher {
  code: string;
  label: string;
  desc: string;
  discount: number;
  type: "fixed" | "percent";
  minOrder: number;
}

const AVAILABLE_VOUCHERS: Voucher[] = [
  { code: "HENR30K", label: "Giảm 30K", desc: "Giảm 30.000đ cho đơn từ 299k", discount: 30000, type: "fixed", minOrder: 299000 },
  { code: "FREESHIP", label: "Freeship", desc: "Miễn phí vận chuyển 25.000đ", discount: 25000, type: "fixed", minOrder: 0 },
  { code: "HENR50K", label: "Giảm 50K", desc: "Giảm 50.000đ cho đơn từ 599k", discount: 50000, type: "fixed", minOrder: 599000 },
  { code: "VIP10", label: "Giảm 10%", desc: "Giảm 10% tổng hóa đơn", discount: 0.1, type: "percent", minOrder: 0 },
  { code: "GIAM20K", label: "Giảm 20K May Mắn", desc: "Giảm 20.000đ từ vòng quay may mắn", discount: 20000, type: "fixed", minOrder: 0 },
  { code: "GIAM10%", label: "Giảm 10% May Mắn", desc: "Giảm 10% từ vòng quay may mắn", discount: 0.1, type: "percent", minOrder: 0 },
  { code: "GIAM50K", label: "Giảm 50K May Mắn", desc: "Giảm 50.000đ từ vòng quay may mắn", discount: 50000, type: "fixed", minOrder: 499000 },
  { code: "GIAM30K", label: "Giảm 30K May Mắn", desc: "Giảm 30.000đ từ vòng quay may mắn", discount: 30000, type: "fixed", minOrder: 349000 },
  { code: "FREESHIP50", label: "Giảm 50% Ship", desc: "Giảm 15.000đ phí vận chuyển", discount: 15000, type: "fixed", minOrder: 0 },
  { code: "PHUKIEN1K", label: "Băng Đô Lụa 1K", desc: "Giảm 44.000đ quà tặng băng đô", discount: 44000, type: "fixed", minOrder: 199000 },
  { code: "VIP20K", label: "Tri Ân 20K", desc: "Voucher tri ân khách hàng thân thiết", discount: 20000, type: "fixed", minOrder: 0 },
];

const FILTER_TABS = [
  { id: "all", label: "Tất Cả" },
  { id: "Pyjama Sọc Kẻ", label: "Pyjama Sọc Kẻ" },
  { id: "Lụa Satin", label: "Lụa Satin Trơn" },
  { id: "Cotton", label: "Cotton Thoáng Mát" },
  { id: "Đồ Ngắn", label: "Cộc Tay / Quần Ngắn" },
  { id: "Váy Ngủ", label: "Váy Ngủ Lụa" },
];

const PRODUCT_REVIEWS = [
  {
    author: "Nguyễn Thị Mai",
    date: "Hôm qua",
    variant: "Size M • Đen Sọc Trắng",
    comment: "Vải lụa satin cực kỳ mịn mát, rủ mềm không dính da. Đóng hộp thắt nơ rất sang xịn mịn. Mình 1m58 50kg mặc size M vừa in chuẩn dáng. 10 điểm cho Henr.Studio!"
  },
  {
    author: "Trần Phương Thảo",
    date: "3 ngày trước",
    variant: "Size L • Hồng Pastel",
    comment: "Màu hồng pastel xinh xỉu, mặc tôn da dã man. Form suông rộng rãi thoải mái ngủ không bị gò bó. Giao hàng GHTK 2 ngày là nhận được rồi."
  },
  {
    author: "Lê Bích Ngọc",
    date: "5 ngày trước",
    variant: "Size S • Xanh Navy",
    comment: "Chất vải sờ vào mát rượi, giặt máy không nhăn nhúm hay xù lông. Đường kim mũi chỉ rất cẩn thận, không có chỉ thừa. Rất đáng tiền!"
  },
  {
    author: "Vũ Hoàng Yến",
    date: "1 tuần trước",
    variant: "Size XL • Caro Flannel",
    comment: "Mua tặng sinh nhật chị gái, chị khen tấm tắc. Tư vấn size qua Zalo rất nhiệt tình và chuẩn xác. Chúc shop buôn may bán đắt!"
  }
];

export default function Storefront() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Promo & Marketing Toggles (Demo Mode)
  const [promoSettings] = useState<PromoSettings>(() => {
    try {
      const savedV2 = localStorage.getItem("tt_promoSettings_v2");
      if (savedV2) return { ...DEFAULT_PROMO_SETTINGS, ...JSON.parse(savedV2) };
      const oldSaved = localStorage.getItem("tt_promoSettings");
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        parsed.enableSocialProof = true;
        localStorage.setItem("tt_promoSettings_v2", JSON.stringify(parsed));
        return { ...DEFAULT_PROMO_SETTINGS, ...parsed, enableSocialProof: true };
      }
    } catch {}
    return DEFAULT_PROMO_SETTINGS;
  });

  // Filtering & Sorting
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  // Product modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [botTrap, setBotTrap] = useState("");
  const [selectedUpsells, setSelectedUpsells] = useState<Record<string, boolean>>({
    bang_do: false,
    tui_giat: false,
  });

  // Vouchers
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState("");

  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [securityConfig] = useState<SecurityConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_securityConfig");
      if (saved) return { ...DEFAULT_SECURITY_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SECURITY_CONFIG;
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bankPaymentVerified, setBankPaymentVerified] = useState<boolean>(false);
  const [paymentTxId, setPaymentTxId] = useState<string>("");
  const [paymentCountdown, setPaymentCountdown] = useState<number>(600); // 10 minutes
  const [paymentConfig] = useState<PaymentGatewayConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_paymentGateway");
      if (saved) return { ...DEFAULT_PAYMENT_GATEWAY_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PAYMENT_GATEWAY_CONFIG;
  });
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    province: "Hà Nội",
    district: "",
    streetAddress: "",
    note: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placedOrder, setPlacedOrder] = useState<{ orderId: string; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Shop settings
  const [shopName, setShopName] = useState(() => cleanStorage("tt_shopName", "Henr.Studio"));
  const [shopPhone, setShopPhone] = useState(() => cleanStorage("tt_shopPhone", "0988 234 567"));
  const [bannerTitle, setBannerTitle] = useState(() => cleanStorage("tt_bannerTitle", "SALE SẬP SÀN"));
  const [bannerSub, setBannerSub] = useState(() => cleanStorage("tt_bannerSub", "Miễn phí vận chuyển toàn quốc"));
  const [bankName, setBankName] = useState(() => cleanStorage("tt_bankName", "Vietcombank"));
  const [bankAccount, setBankAccount] = useState(() => cleanStorage("tt_bankAccount", "1234567890"));
  const [bankOwner, setBankOwner] = useState(() => cleanStorage("tt_bankOwner", "NGUYEN VAN A"));
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeLiveSession, setActiveLiveSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    document.title = `${shopName} | Cửa Hàng Đồ Ngủ & Pyjama Cao Cấp`;
    Promise.all([
      db.products.filter(p => p.isActive).toArray(),
      db.productVariants.toArray(),
      db.orders.toArray(),
      db.liveSessions ? db.liveSessions.filter(s => s.status === "active").first() : Promise.resolve(undefined),
    ]).then(([prods, vars, ords, live]) => {
      setProducts(prods);
      setVariants(vars);
      setOrders(ords);
      if (live) setActiveLiveSession(live);
    });
  }, [shopName]);

  useEffect(() => { setActiveImageIdx(0); setSelectedVariant(null); }, [selectedProduct]);
  useEffect(() => { if (!isCheckoutOpen) { setCheckoutStep("cart"); } }, [isCheckoutOpen]);

  // Network Connectivity Auto-Recovery
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // VietQR Real-Time Polling Verification & Countdown
  useEffect(() => {
    if (checkoutStep !== "success" || !placedOrder || paymentMethod !== "bank_transfer" || bankPaymentVerified) {
      return;
    }

    const timer = setInterval(() => {
      setPaymentCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const poller = setInterval(async () => {
      try {
        const result = await verifyPayment(placedOrder.orderId, placedOrder.total, paymentConfig);
        if (result.verified) {
          setBankPaymentVerified(true);
          setPaymentTxId(result.transactionId || "");
          try { playOrderChime(); } catch {}
          await db.orders.update(placedOrder.orderId, {
            status: "processing",
            paymentProofTxId: result.transactionId,
            updatedAt: now(),
          });
        }
      } catch (e) {
        console.warn("[VietQR Polling] Check failed:", e);
      }
    }, 1500);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [checkoutStep, placedOrder, paymentMethod, bankPaymentVerified, paymentConfig]);

  const productStats = useMemo<Record<string, ProductStats>>(() => {
    const s: Record<string, ProductStats> = {};
    for (const o of orders) {
      if (o.status !== "cancelled") {
        for (const item of (o.items || [])) {
          if (!s[item.productId]) s[item.productId] = { totalSold: 0, totalStock: 0 };
          s[item.productId].totalSold += item.quantity || 1;
        }
      }
    }
    for (const v of variants) {
      if (!s[v.productId]) s[v.productId] = { totalSold: 0, totalStock: 0 };
      s[v.productId].totalStock += v.stock || 0;
    }
    return s;
  }, [orders, variants]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    // Category / Material filter
    if (selectedCategory !== "all") {
      list = list.filter(p => p.category.includes(selectedCategory) || p.name.includes(selectedCategory));
    }

    // Sort order
    if (sortBy === "popular") {
      list.sort((a, b) => (productStats[b.id]?.totalSold || 0) - (productStats[a.id]?.totalSold || 0));
    } else if (sortBy === "price_asc") {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === "rating") {
      list.sort((a, b) => getRating(b.id) - getRating(a.id));
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    return list;
  }, [products, search, selectedCategory, sortBy, productStats]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tt_shopName", shopName);
    localStorage.setItem("tt_shopPhone", shopPhone);
    localStorage.setItem("tt_bannerTitle", bannerTitle);
    localStorage.setItem("tt_bannerSub", bannerSub);
    localStorage.setItem("tt_bankName", bankName);
    localStorage.setItem("tt_bankAccount", bankAccount);
    localStorage.setItem("tt_bankOwner", bankOwner);
    setIsAdminOpen(false);
  };

  const pinnedMap = useMemo(() => {
    const map = new Map<string, LivePinnedProduct>();
    if (activeLiveSession && activeLiveSession.status === "active") {
      activeLiveSession.pinnedProducts.forEach(p => {
        map.set(p.productId, p);
      });
    }
    return map;
  }, [activeLiveSession]);

  const cartTotal = cart.reduce((s, i) => {
    const isPinned = pinnedMap.has(i.productId);
    const price = isPinned ? pinnedMap.get(i.productId)!.livePrice : i.product.sellingPrice;
    return s + price * i.qty;
  }, 0);
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  // Voucher discount calculation
  // Combo discount: If cart has >= 2 items, extra 5% off!
  const comboDiscount = useMemo(() => {
    const totalQty = cart.reduce((q, i) => q + i.quantity, 0);
    if (totalQty >= 2) {
      return Math.round(cartTotal * 0.05);
    }
    return 0;
  }, [cart, cartTotal, promoSettings.enableComboDiscount]);

  const discountAmount = useMemo(() => {
    let amt = 0;
    if (appliedVoucher) {
      if (cartTotal >= appliedVoucher.minOrder) {
        if (appliedVoucher.type === "percent") {
          amt += Math.round(cartTotal * appliedVoucher.discount);
        } else {
          amt += appliedVoucher.discount;
        }
      }
    }
    amt += comboDiscount;
    return amt;
  }, [appliedVoucher, cartTotal, comboDiscount]);

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleApplyVoucher = (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    const found = AVAILABLE_VOUCHERS.find(v => v.code === code);
    if (!found) {
      setVoucherError("Mã giảm giá không tồn tại hoặc đã hết hạn!");
      return;
    }
    if (cartTotal < found.minOrder) {
      setVoucherError(`Đơn hàng tối thiểu ${formatCurrency(found.minOrder)} để áp dụng mã này!`);
      return;
    }
    setAppliedVoucher(found);
    setVoucherError("");
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    if (variant.stock <= 0) {
      alert("Phân loại màu/size này hiện đang tạm hết hàng!");
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.variantId === variant.id);
      if (ex) {
        if (ex.qty >= variant.stock) {
          alert(`Mẫu này trong kho chỉ còn ${variant.stock} bộ!`);
          return prev;
        }
        return prev.map(i => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { variantId: variant.id, productId: product.id, qty: 1, product, variant }];
    });
  };
  const updateQty = (variantId: string, delta: number) =>
    setCart(prev => prev.map(i => {
      if (i.variantId === variantId) {
        const nextQty = i.qty + delta;
        if (delta > 0 && i.variant && nextQty > i.variant.stock) {
          alert(`Mẫu này trong kho chỉ còn ${i.variant.stock} bộ!`);
          return i;
        }
        return { ...i, qty: nextQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  const removeItem = (variantId: string) => setCart(prev => prev.filter(i => i.variantId !== variantId));

  const isValidPhone = (p: string) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 11;
  };

  const fullCustomerAddress = `${checkoutForm.streetAddress}${checkoutForm.district ? ", " + checkoutForm.district : ""}, ${checkoutForm.province}`;
  const canProceedToPayment = checkoutForm.name.trim() && isValidPhone(checkoutForm.phone) && checkoutForm.streetAddress.trim();

  const placeOrder = async () => {
    if (!canProceedToPayment || placing) return;

    // 1. Honeypot Anti-Bot check (Tầng 3)
    if (botTrap) {
      console.warn("Spam bot detected via honeypot trap.");
      setPlacedOrder({ orderId: "WEB-PROCESSED", total: finalTotal });
      setCart([]);
      return;
    }

    // Rate Limiting Engine (Anti-Flood / Anti-Bot)
    const rateCheck = checkRateLimit(securityConfig);
    if (!rateCheck.allowed) {
      alert(`⚠️ Nhằm bảo vệ hệ thống khỏi spam đơn ảo, bạn vui lòng chờ ${rateCheck.waitMinutes} phút trước khi đặt đơn tiếp theo hoặc liên hệ hotline ${shopPhone}!`);
      return;
    }
    const orderRisk = evaluateOrderRisk(checkoutForm.phone, finalTotal, paymentMethod, securityConfig);

    // 2. Rate Limiting: 20 seconds between orders from same browser
    const lastOrderTs = parseInt(localStorage.getItem("tt_last_order_ts") || "0", 10);
    const nowTs = Date.now();
    if (nowTs - lastOrderTs < 20000) {
      const waitSec = Math.ceil((20000 - (nowTs - lastOrderTs)) / 1000);
      alert(`⚠️ Bạn vừa đặt đơn hàng cách đây ít giây. Vui lòng chờ ${waitSec} giây trước khi đặt đơn tiếp theo để tránh bị trùng lặp đơn!`);
      return;
    }

    setPlacing(true);

    // Kiểm tra tồn kho thời gian thực trước khi chốt đơn
    for (const item of cart) {
      const v = await db.productVariants.get(item.variantId);
      if (!v || v.stock < item.qty) {
        alert(`Sản phẩm "${item.product.name} (${item.variant.color} - ${item.variant.size})" chỉ còn ${v ? v.stock : 0} bộ trong kho, không đủ số lượng để đặt hàng!`);
        setPlacing(false);
        return;
      }
    }
    const orderId = "WEB-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    const newOrder: any = {
      id: generateId(),
      tiktokOrderId: orderId,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: fullCustomerAddress,
      status: "pending",
      orderDate: today(),
      subtotal: cartTotal,
      sellerDiscount: discountAmount,
      shippingFee: 0,
      total: finalTotal,
      shippingCarrier: "GHTK",
      trackingNumber: "",
      liveSessionId: activeLiveSession ? activeLiveSession.id : undefined,
      note: `Đặt qua Website${activeLiveSession ? ` (Phiên Live: ${activeLiveSession.title})` : ""} | Thanh toán: ${paymentMethod === "cod" ? "COD khi nhận" : "Chuyển khoản"}${appliedVoucher ? ` | Voucher: ${appliedVoucher.code} (-${formatCurrency(discountAmount)})` : ""}${checkoutForm.note ? ` | Ghi chú: ${checkoutForm.note}` : ""}`,
      isSuspicious: orderRisk.isSuspicious,
      suspiciousReason: orderRisk.reason,
      idempotencyKey: `IDEM-${orderId}-${Date.now()}`,
      tiktokFeeRate: 0,
      tiktokFeeAmount: 0,
      paymentMethod,
      createdAt: now(),
      updatedAt: now(),
      items: cart.map(item => {
        const isPinned = pinnedMap.has(item.productId);
        const effectivePrice = isPinned ? pinnedMap.get(item.productId)!.livePrice : item.product.sellingPrice;
        return {
          id: generateId(),
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          variantInfo: `${item.variant.color} - ${item.variant.size}`,
          variantName: `${item.variant.color} - ${item.variant.size}`,
          sku: item.variant.sku,
          quantity: item.qty,
          unitPrice: effectivePrice,
          unitCost: item.product.costPrice || 0,
        };
      })
    };
    await db.orders.add(newOrder);
    pushOrderToSupabase(newOrder);
    recordOrderAttempt();
    for (const item of cart) {
      await db.stockMovements.add({
        id: generateId(),
        productId: item.productId,
        variantId: item.variantId,
        type: "sale",
        quantity: -item.qty,
        note: "Đơn Web " + orderId,
        date: today(),
        createdAt: now(),
      });
      const v = await db.productVariants.get(item.variantId);
      if (v) await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.qty) });
    }

    // Play upbeat order chime
    playOrderChime();

    localStorage.setItem("tt_last_order_ts", Date.now().toString());
    setPlacedOrder({ orderId, total: finalTotal });
    setCart([]);
    setAppliedVoucher(null);
    setCheckoutStep("success");
    setPlacing(false);
  };

  const gallery = selectedProduct ? getGallery(selectedProduct, products.indexOf(selectedProduct)) : [];
  const selVariants = selectedProduct ? variants.filter(v => v.productId === selectedProduct.id) : [];
  const selStats = selectedProduct ? (productStats[selectedProduct.id] || { totalSold: 0, totalStock: 0 }) : null;

  // VietQR URL
  const BANK_CODES: Record<string, string> = {
    "Vietcombank": "VCB", "Techcombank": "TCB", "MB Bank": "MB", "VPBank": "VPB",
    "ACB": "ACB", "BIDV": "BIDV", "Agribank": "AGR", "Sacombank": "STB",
    "TPBank": "TPB", "VietinBank": "ICB",
  };
  const bankBin = BANK_CODES[bankName] || "VCB";
  const qrUrl = placedOrder
    ? `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${placedOrder.total}&addInfo=DH%20${placedOrder.orderId}&accountName=${encodeURIComponent(bankOwner)}`
    : "";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#161823] flex flex-col font-sans">
      {/* Anti-Copy & WebShield Protection */}
      <WebShield shopName={shopName} />

      {/* Admin Quick Edit Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Settings size={20} className="text-[#fe2c55]"/> Cấu Hình Nhanh Cửa Hàng
              </h3>
              <button onClick={() => setIsAdminOpen(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            <form onSubmit={saveSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên Shop hiển thị</label>
                <input required value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại Hotline</label>
                <input required value={shopPhone} onChange={e => setShopPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề Banner</label>
                <input required value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả phụ Banner</label>
                <input required value={bannerSub} onChange={e => setBannerSub(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div className="pt-2 flex justify-between gap-3">
                <button type="button" onClick={() => navigate("/dashboard")} className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-sm">
                  Vào Trang Quản Trị
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold text-sm shadow-md">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Banner Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => { setSearch(""); setSelectedCategory("all"); navigate("/shop"); }}>
            <div className="w-9 h-9 bg-gradient-to-tr from-[#fe2c55] to-rose-400 text-white font-black text-xl italic flex items-center justify-center rounded-xl shadow-md shadow-rose-500/20">
              {shopName.charAt(0)}
            </div>
            <div>
              <span className="font-extrabold text-lg text-gray-950 tracking-tight block leading-tight">{shopName}</span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Pyjama & Homewear</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm pyjama, lụa satin..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-100 text-sm text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-full border border-transparent focus:border-[#fe2c55] focus:bg-white outline-none transition-all"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button onClick={() => navigate("/track")} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:border-[#fe2c55] hover:text-[#fe2c55] transition-all">
              <Truck size={14} className="text-[#fe2c55]"/> Tra cứu đơn
            </button>
            <button onClick={() => setIsAdminOpen(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title="Cài đặt shop">
              <Settings size={18}/>
            </button>
            <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep("cart"); }} className="relative p-2 bg-rose-50 hover:bg-rose-100 text-[#fe2c55] rounded-full transition-colors flex items-center justify-center">
              <ShoppingCart size={20}/>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fe2c55] text-white font-bold text-[11px] min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm pyjama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-100 text-xs text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2 rounded-full border border-transparent focus:border-[#fe2c55] focus:bg-white outline-none"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          </div>
        </div>
      </header>

      {/* Active TikTok Live Session Bar */}
      {activeLiveSession && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs md:text-sm font-medium animate-pulse border-b border-red-500">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="font-black tracking-wider uppercase text-[10px] md:text-[11px] bg-black/40 px-2 py-0.5 rounded shrink-0">
                TIKTOK LIVE ĐANG DIỄN RA
              </span>
              <span className="font-bold truncate">{activeLiveSession.title}</span>
              <span className="text-rose-100 hidden lg:inline text-xs">
                (Host: {activeLiveSession.hostName} • Giá giảm sốc chỉ có trong phiên live!)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-white text-rose-600 px-3 py-1 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                {pinnedMap.size} Sản phẩm ghim Deal Sốc
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-[#fe2c55] to-red-600 text-white py-8 md:py-12 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} className="text-amber-300" /> Henr.Studio Official
            </div>
            <h2 className="font-extrabold text-3xl md:text-5xl italic tracking-tight">{bannerTitle}</h2>
            <p className="text-sm md:text-base text-rose-100 font-medium">{bannerSub}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-amber-300">100%</span>
              <span className="text-[11px] text-rose-100 font-medium">Lụa & Cotton Chuẩn</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-white">0 đ</span>
              <span className="text-[11px] text-rose-100 font-medium">Đổi Size Miễn Phí</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-red-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#fe2c55] flex items-center justify-center shrink-0"><Zap size={20}/></div>
            <div><h3 className="font-bold text-sm text-gray-900">Flash Sale Hàng Ngày</h3><p className="text-xs text-gray-500">Ưu đãi độc quyền từ {shopName}</p></div>
          </div>
          <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-red-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><ShieldCheck size={20}/></div>
            <div><h3 className="font-bold text-sm text-gray-900">Chính Hãng & Kiểm Tra Hàng</h3><p className="text-xs text-gray-500">Được xem hàng trước khi thanh toán</p></div>
          </div>
        </div>

        {/* Filter Tabs & Sorting Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? "bg-[#fe2c55] text-white shadow-md shadow-rose-500/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-[#fe2c55]"
              >
                <option value="popular">Bán chạy nhất 🔥</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất ⭐</option>
                <option value="newest">Mới nhất ✨</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {search ? `Kết quả cho "${search}" (${filteredProducts.length})` : selectedCategory !== "all" ? `${selectedCategory} (${filteredProducts.length})` : "Gợi ý hôm nay"}
          </h2>
          <button onClick={() => navigate("/track")} className="md:hidden text-xs font-bold text-[#fe2c55] flex items-center gap-1">
            <Search size={12}/> Tra cứu đơn
          </button>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8">
            <Search size={48} className="mx-auto mb-4 text-gray-300"/>
            <p className="font-bold text-gray-700">Không tìm thấy sản phẩm phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
            <button onClick={() => { setSearch(""); setSelectedCategory("all"); }} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors">
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product, idx) => {
              const stats = productStats[product.id] || { totalSold: 0, totalStock: 0 };
              const rating = getRating(product.id);
              const img = getImg(product, idx);
              const pinned = pinnedMap.get(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-rose-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
                >
                  <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {securityConfig.enableWatermark && <ProductWatermark text={securityConfig.watermarkText} className="z-10" />}
                    <img
                      src={img}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}
                    />
                    <div className="absolute top-2 left-2 bg-[#fe2c55] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                      MALL
                    </div>
                    {product.tiktokVideoUrl && (
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
                        <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                        </svg>
                        <span>Video Review</span>
                      </div>
                    )}
                    {pinned && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        Ghim #{pinned.pinNumber}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#fe2c55] transition-colors mb-1.5">
                      {product.name}
                    </h3>
                    <div className="mt-auto pt-1">
                      {pinned ? (
                        <div>
                          <div className="text-sm md:text-base font-black text-rose-600 leading-tight flex items-center gap-1.5 flex-wrap">
                            <span>{formatCurrency(pinned.livePrice)}</span>
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">Giá Live</span>
                          </div>
                          <div className="text-[11px] text-gray-400 line-through">
                            {formatCurrency(product.sellingPrice)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm md:text-base font-black text-[#fe2c55] leading-tight">
                          {formatCurrency(product.sellingPrice)}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] md:text-[11px] text-gray-500 mt-1.5">
                        <div className="flex items-center text-amber-500 font-semibold">
                          <Star size={11} fill="currentColor" className="mr-0.5" />
                          <span>{rating.toFixed(1)}</span>
                        </div>
                        <span>Đã bán {formatSold(stats.totalSold)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white md:rounded-3xl shadow-2xl w-full h-full md:h-auto md:max-h-[92vh] md:max-w-4xl flex flex-col md:flex-row overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
            {/* Gallery Left */}
            <div className="w-full md:w-[46%] shrink-0 bg-gray-50 flex flex-col border-r border-gray-100">
              <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {securityConfig.enableWatermark && <ProductWatermark text={securityConfig.watermarkText} className="z-10" />}
                <img
                  key={activeImageIdx}
                  src={gallery[activeImageIdx]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}
                />
                {gallery.length > 1 && (
                  <>
                    <button onClick={() => setActiveImageIdx(i => (i - 1 + gallery.length) % gallery.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center">
                      <ChevronLeft size={18}/>
                    </button>
                    <button onClick={() => setActiveImageIdx(i => (i + 1) % gallery.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center">
                      <ChevronRight size={18}/>
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                      {activeImageIdx + 1}/{gallery.length}
                    </div>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImageIdx === idx ? 'border-[#fe2c55] scale-95 shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Right */}
            <div className="flex-1 p-5 md:p-8 flex flex-col overflow-y-auto relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700">
                <X size={18}/>
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#fe2c55] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">MALL</span>
                <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{shopName.toUpperCase()} OFFICIAL</span>
              </div>

              <h2 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug mb-2">{selectedProduct.name}</h2>

              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100 flex-wrap">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor"/>)}
                  <span className="ml-1 font-bold text-gray-900">{getRating(selectedProduct.id).toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                {selStats && selStats.totalSold > 0 && <><span>Đã bán <strong>{formatSold(selStats.totalSold)}</strong></span><span className="text-gray-300">|</span></>}
                <span className={selStats && selStats.totalStock > 0 ? "text-emerald-600 font-bold":"text-red-500 font-bold"}>
                  {selStats && selStats.totalStock > 0
                  ? (securityConfig.enableStockMasking
                      ? (selStats.totalStock <= 5 ? `🔥 Chỉ còn ${selStats.totalStock} bộ cuối` : "✓ Còn hàng sẵn sàng giao")
                      : `Còn hàng (${selStats.totalStock})`)
                  : "Tạm hết hàng"}
                </span>
              </div>

              <div className="text-2xl md:text-3xl font-black text-[#fe2c55] mb-4">
                {formatCurrency(selectedProduct.sellingPrice)}
              </div>

              {/* Product Description & TikTok Video Link */}
              <div className="mb-5 bg-gradient-to-br from-gray-50 to-rose-50/20 rounded-2xl p-4 border border-gray-100 text-xs text-gray-700 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                    <Sparkles size={13} className="text-[#fe2c55]" /> Mô tả sản phẩm
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium font-mono">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>
                
                <p className="text-gray-600 leading-relaxed text-xs">
                  {selectedProduct.description || "Bộ đồ ngủ pyjama thiết kế độc quyền từ Henr.Studio, chất liệu lụa satin cao cấp mềm mại, thoáng mát, đường may sắc nét và tôn dáng."}
                </p>

                {/* TikTok Video Review Link Below Description */}
                {(selectedProduct.tiktokVideoUrl || true) && (
                  <div className="pt-3 border-t border-gray-200/60">
                    <a
                      href={selectedProduct.tiktokVideoUrl || `https://www.tiktok.com/search?q=${encodeURIComponent(selectedProduct.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 bg-gradient-to-r from-gray-950 via-gray-900 to-black hover:from-rose-950 hover:via-black hover:to-rose-950 text-white rounded-xl border border-gray-800 hover:border-rose-500/80 shadow-md hover:shadow-rose-950/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* TikTok Icon Badge */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] p-0.5 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-white group-hover:text-rose-400 transition-colors">
                              Xem Video Review Trên TikTok
                            </span>
                            <span className="text-[9px] bg-[#fe2c55] text-white px-1.5 py-0.2 rounded font-black tracking-wider uppercase animate-pulse">
                              LIVE CLIP
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate group-hover:text-gray-300">
                            Mặc thử thực tế • Cận cảnh chất vải • Phối đồ
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform shrink-0 pl-2">
                        <span className="hidden sm:inline">Xem video</span>
                        <ExternalLink size={13} />
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Variant Selector & Size Guide Button */}
              <div className="mb-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Chọn phân loại (Màu sắc & Size):</p>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-bold text-[#fe2c55] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler size={13} /> Bảng chọn size chuẩn
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selVariants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => v.stock > 0 && setSelectedVariant(v)}
                      disabled={v.stock === 0}
                      className={`px-3.5 py-2 text-xs rounded-xl border transition-all ${
                        v.stock === 0
                          ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                          : selectedVariant?.id === v.id
                          ? 'border-[#fe2c55] text-[#fe2c55] bg-rose-50 font-bold ring-2 ring-[#fe2c55]/20 shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-[#fe2c55]'
                      }`}
                    >
                      {v.color} - Size {v.size}{v.stock === 0 && <span className="ml-1 text-[10px]">(hết)</span>}
                    </button>
                  ))}
                </div>

                {!selectedVariant && selVariants.filter(v => v.stock > 0).length > 0 && (
                  <p className="text-[11px] text-amber-600 font-medium">⚠️ Vui lòng chọn màu & kích cỡ trước khi thêm giỏ</p>
                )}
              </div>

              {/* Upsell Deal Sốc Section */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 space-y-2.5 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
                    🎁 Deal Sốc Mua Kèm Phụ Kiện Lụa (Tiết kiệm đến 60%):
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    Ưu đãi giới hạn
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-rose-100 hover:border-rose-300 cursor-pointer transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selectedUpsells.bang_do}
                        onChange={e => setSelectedUpsells(p => ({ ...p, bang_do: e.target.checked }))}
                        className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-gray-800">Băng đô lụa Satin cao cấp</span>
                        <span className="text-[10px] text-gray-400 block">Đồng màu ton-sur-ton với đồ ngủ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 font-mono">+19.000₫</span>
                      <span className="text-[10px] text-gray-400 line-through block font-mono">45.000₫</span>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-rose-100 hover:border-rose-300 cursor-pointer transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selectedUpsells.tui_giat}
                        onChange={e => setSelectedUpsells(p => ({ ...p, tui_giat: e.target.checked }))}
                        className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-gray-800">Túi giặt đồ lụa chuyên dụng</span>
                        <span className="text-[10px] text-gray-400 block">Bảo vệ sợi vải lụa không xước xơ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 font-mono">+29.000₫</span>
                      <span className="text-[10px] text-gray-400 line-through block font-mono">60.000₫</span>
                    </div>
                  </label>
                </div>
              </div>

                            {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => { if (selectedVariant) addToCart(selectedProduct, selectedVariant); }}
                  disabled={!selectedVariant}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-40 text-xs md:text-sm border border-amber-200"
                >
                  Thêm vào giỏ
                </button>
                <button
                  onClick={() => {
                    if (selectedVariant) {
                      addToCart(selectedProduct, selectedVariant);
                      setSelectedProduct(null);
                      setIsCheckoutOpen(true);
                      setCheckoutStep("cart");
                    }
                  }}
                  disabled={!selectedVariant}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-[#fe2c55] hover:from-rose-600 hover:to-[#e62045] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 transition-all disabled:opacity-40 text-xs md:text-sm"
                >
                  Mua ngay
                </button>
              </div>

              {/* Customer Reviews Section */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    Đánh Giá Khách Hàng
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-50 text-[#fe2c55] rounded-full">
                      ⭐ 4.9/5 (128 nhận xét)
                    </span>
                  </h4>
                  <span className="text-[11px] text-emerald-600 font-semibold">98% Hài lòng</span>
                </div>

                <div className="space-y-2.5">
                  {PRODUCT_REVIEWS.map((rev, rIdx) => (
                    <div key={rIdx} className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{rev.author}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Đã mua
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, si) => <Star key={si} size={10} fill="currentColor" />)}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Phân loại: {rev.variant}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & Cart Drawer */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCheckoutOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left" onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              {checkoutStep === "payment" ? (
                <button onClick={() => setCheckoutStep("cart")} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-bold text-xs">
                  <ChevronLeft size={16}/> Quay lại giỏ hàng
                </button>
              ) : (
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#fe2c55]"/>
                  Giỏ hàng {cartCount > 0 && <span className="bg-[#fe2c55] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
                </h2>
              )}
              {checkoutStep !== "success" && (
                <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
              )}
            </div>

            {/* Step Indicators */}
            {checkoutStep !== "success" && (
              <div className="flex px-4 py-2.5 gap-2 border-b border-gray-100 shrink-0 bg-gray-50">
                {[["cart", "1. Giỏ hàng & Địa chỉ"], ["payment", "2. Chọn thanh toán"]].map(([step, label]) => (
                  <div key={step} className={`flex-1 text-center text-xs font-bold py-1.5 rounded-xl transition-all ${checkoutStep === step ? 'bg-[#fe2c55] text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-200'}`}>
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] space-y-4">

              {/* STEP 1: Cart Items + Address Form + Vouchers */}
              {checkoutStep === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3"/>
                      <p className="text-gray-600 font-bold text-sm">Giỏ hàng đang trống</p>
                      <button onClick={() => setIsCheckoutOpen(false)} className="mt-3 px-4 py-2 bg-[#fe2c55] text-white font-bold text-xs rounded-xl shadow-md">
                        Tiếp tục mua sắm
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Products List */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                          <span className="bg-[#fe2c55] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">MALL</span>
                          <span className="font-bold text-xs text-gray-900">{shopName} Official</span>
                        </div>
                        <div className="p-3.5 space-y-3 divide-y divide-gray-100">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-3 pt-3 first:pt-0">
                              <img src={getImg(item.product, idx)} loading="lazy" decoding="async" className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 line-clamp-2 mb-0.5">{item.product.name}</p>
                                <p className="text-[11px] text-gray-500 mb-2">{item.variant.color}, Size {item.variant.size}</p>
                                <div className="flex items-center justify-between">
                                  {pinnedMap.has(item.productId) ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-rose-600 text-xs">{formatCurrency(pinnedMap.get(item.productId)!.livePrice)}</p>
                                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 py-0.2 rounded">Live #{pinnedMap.get(item.productId)!.pinNumber}</span>
                                      <span className="text-[10px] text-gray-400 line-through">{formatCurrency(item.product.sellingPrice)}</span>
                                    </div>
                                  ) : (
                                    <p className="font-bold text-[#fe2c55] text-xs">{formatCurrency(item.product.sellingPrice)}</p>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => updateQty(item.variantId, -1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"><Minus size={11}/></button>
                                    <span className="font-bold text-xs w-4 text-center">{item.qty}</span>
                                    <button onClick={() => updateQty(item.variantId, 1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"><Plus size={11}/></button>
                                    <button onClick={() => removeItem(item.variantId)} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"><Trash2 size={12}/></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Voucher Card */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Ticket size={16} className="text-[#fe2c55]" />
                            <span className="font-bold text-xs text-gray-900">Mã giảm giá Shop / Voucher</span>
                          </div>
                          {appliedVoucher && (
                            <button
                              type="button"
                              onClick={() => setAppliedVoucher(null)}
                              className="text-[11px] text-red-500 hover:underline font-semibold"
                            >
                              Hủy mã
                            </button>
                          )}
                        </div>

                        {/* Input Voucher */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(""); }}
                            placeholder="Nhập mã (VD: HENR30K)"
                            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none uppercase font-mono font-bold focus:border-[#fe2c55]"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyVoucher(voucherInput)}
                            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                          >
                            Áp dụng
                          </button>
                        </div>
                        {voucherError && <p className="text-[11px] text-red-500 font-medium">{voucherError}</p>}
                        {appliedVoucher && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium">
                            <span>✓ Đã áp dụng: <strong>{appliedVoucher.code}</strong></span>
                            <span className="font-bold text-emerald-600">-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}

                        {/* Follow TikTok & Zalo for Vouchers */}
                        <div className="pt-2.5 border-t border-gray-100 space-y-2">
                          <div className="p-3 bg-gradient-to-r from-gray-900 via-[#161823] to-gray-950 rounded-2xl text-white flex items-center justify-between gap-2 shadow-sm border border-gray-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fe2c55] to-rose-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-rose-500/20">
                                🎵
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white leading-tight">Follow TikTok @{shopName} Nhận Voucher</p>
                                <p className="text-[10px] text-rose-200 mt-0.5">Nhắn tin trên TikTok hoặc Zalo để nhận mã 30K - 50K!</p>
                              </div>
                            </div>
                            <a
                              href="https://www.tiktok.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#fe2c55] hover:bg-rose-600 active:scale-95 text-white font-bold text-[11px] rounded-xl shrink-0 transition-all shadow-sm flex items-center gap-1"
                            >
                              <span>Follow</span>
                            </a>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                            <span>🎁 Nhập mã độc quyền từ Livestream TikTok</span>
                            <span className="text-[#fe2c55] font-bold">Giảm tới 10%</span>
                          </div>
                        </div>
                      </div>

                      {/* Standardized 3-tier Address Form */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                          <span>📦</span> Thông tin nhận hàng
                        </h3>
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Họ và tên người nhận *</label>
                            <input
                              className="w-full text-xs text-gray-900 placeholder-gray-400 px-3 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none"
                              placeholder="VD: Nguyễn Thị Lan"
                              value={checkoutForm.name}
                              onChange={e => setCheckoutForm(p => ({ ...p, name: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Số điện thoại liên hệ *</label>
                            <input
                              type="tel"
                              className="w-full text-xs text-gray-900 placeholder-gray-400 px-3 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none font-mono"
                              placeholder="VD: 0988 234 567"
                              value={checkoutForm.phone}
                              onChange={e => setCheckoutForm(p => ({ ...p, phone: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">Tỉnh / Thành phố *</label>
                              <select
                                className="w-full text-xs text-gray-900 px-2.5 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none bg-white"
                                value={checkoutForm.province}
                                onChange={e => setCheckoutForm(p => ({ ...p, province: e.target.value }))}
                              >
                                {[
                                  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
                                  "Bình Dương", "Đồng Nai", "Quảng Ninh", "Bắc Ninh", "Thanh Hóa",
                                  "Nghệ An", "Thừa Thiên Huế", "Khánh Hòa", "Lâm Đồng", "Hải Dương",
                                  "Nam Định", "Thái Bình", "Thái Nguyên", "Vĩnh Phúc", "An Giang",
                                  "Bà Rịa - Vũng Tàu", "Tỉnh khác"
                                ].map(prov => (
                                  <option key={prov} value={prov}>{prov}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">Quận / Huyện</label>
                              <input
                                className="w-full text-xs text-gray-900 placeholder-gray-400 px-3 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none"
                                placeholder="VD: Q. Cầu Giấy"
                                value={checkoutForm.district}
                                onChange={e => setCheckoutForm(p => ({ ...p, district: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Số nhà, ngõ ngách, tên đường *</label>
                            <input
                              className="w-full text-xs text-gray-900 placeholder-gray-400 px-3 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none"
                              placeholder="VD: Số 18 ngõ 26 Đỗ Quang, P. Trung Hòa"
                              value={checkoutForm.streetAddress}
                              onChange={e => setCheckoutForm(p => ({ ...p, streetAddress: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Ghi chú giao hàng (Tùy chọn)</label>
                            <input
                              className="w-full text-xs text-gray-900 placeholder-gray-400 px-3 py-2 border border-gray-200 focus:border-[#fe2c55] rounded-xl outline-none"
                              placeholder="VD: Giao giờ hành chính, cho xem hàng"
                              value={checkoutForm.note}
                              onChange={e => setCheckoutForm(p => ({ ...p, note: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* STEP 2: Payment Method */}
              {checkoutStep === "payment" && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">💳 Phương thức thanh toán</h3>

                    <label className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-[#fe2c55] bg-rose-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mt-1 accent-[#fe2c55]"/>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Phổ biến</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">Khách kiểm tra hàng trước, ưng ý mới thanh toán tiền mặt cho shipper.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "bank_transfer" ? "border-[#fe2c55] bg-rose-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="pay" checked={paymentMethod === "bank_transfer"} onChange={() => setPaymentMethod("bank_transfer")} className="mt-1 accent-[#fe2c55]"/>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-gray-900">Chuyển khoản Ngân hàng (VietQR)</p>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Khuyên dùng</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">Quét mã QR tự điền số tiền và nội dung, chuyển tiền nhanh 24/7.</p>
                      </div>
                    </label>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-gray-900 pb-2 border-b border-gray-100">Xác nhận thông tin đặt hàng</h4>
                    <div className="flex justify-between text-gray-600"><span>Người nhận:</span><span className="font-bold text-gray-900">{checkoutForm.name}</span></div>
                    <div className="flex justify-between text-gray-600"><span>SĐT:</span><span className="font-mono font-bold text-gray-900">{checkoutForm.phone}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Địa chỉ:</span><span className="font-medium text-gray-900 text-right max-w-[200px]">{fullCustomerAddress}</span></div>
                    <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100"><span>Tiền hàng ({cartCount} món):</span><span>{formatCurrency(cartTotal)}</span></div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium"><span>Giảm giá voucher:</span><span>-{formatCurrency(discountAmount)}</span></div>
                    )}
                    <div className="flex justify-between text-gray-600"><span>Phí vận chuyển:</span><span className="text-emerald-600 font-bold">MIỄN PHÍ</span></div>
                    <div className="flex justify-between text-sm font-black text-gray-950 pt-2 border-t border-gray-100">
                      <span>Tổng thanh toán:</span>
                      <span className="text-[#fe2c55] text-base">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Order Success */}
              {checkoutStep === "success" && placedOrder && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36}/>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Đặt Hàng Thành Công!</h3>
                    <p className="text-xs text-gray-500 mt-1">Cảm ơn bạn đã ủng hộ {shopName}!</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 text-left space-y-2 text-xs shadow-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Mã đơn hàng:</span><span className="font-mono font-bold text-gray-900">{placedOrder.orderId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Tổng thanh toán:</span><span className="font-bold text-[#fe2c55] text-sm">{formatCurrency(placedOrder.total)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Hình thức:</span><span className="font-medium text-gray-700">{paymentMethod === "cod" ? "COD khi nhận hàng" : "Chuyển khoản"}</span></div>
                  </div>

                  {paymentMethod === "bank_transfer" && qrUrl && (
                    <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 text-center space-y-3 shadow-sm">
                      {bankPaymentVerified ? (
                        <div className="py-4 space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <Check size={24} />
                          </div>
                          <p className="font-bold text-emerald-800 text-sm">ĐÃ NHẬN TIỀN THÀNH CÔNG!</p>
                          <p className="text-[11px] text-emerald-600">Mã GD ngân hàng: <strong className="font-mono">{paymentTxId}</strong></p>
                          <span className="inline-block text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                            Đơn hàng đã được duyệt tự động sang kho đóng gói
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                              <QrCode size={16}/> Quét mã VietQR thanh toán
                            </span>
                            <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ⏱️ Giữ hàng: {Math.floor(paymentCountdown / 60)}:{String(paymentCountdown % 60).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="relative inline-block">
                            <img src={qrUrl} alt="VietQR" className="mx-auto rounded-xl border border-gray-200 max-w-[210px] shadow-sm"/>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow whitespace-nowrap">
                              VietQR Tự Động Điền Số Tiền
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3 text-left space-y-1.5 text-[11px] mt-2">
                            <div className="flex justify-between"><span className="text-gray-500">Ngân hàng:</span><span className="font-bold text-gray-900">{bankName}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-500">Số tài khoản:</span><span className="font-mono font-bold text-gray-900">{bankAccount}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Chủ tài khoản:</span><span className="font-bold text-gray-900">{bankOwner}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Số tiền:</span><span className="font-bold text-[#fe2c55]">{formatCurrency(placedOrder.total)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Cú pháp CK:</span><span className="font-mono font-bold text-emerald-600">HENR {placedOrder.orderId}</span></div>
                          </div>

                          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-800">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              Đang kết nối cổng SePay đối soát...
                            </span>
                            <button
                              type="button"
                              onClick={() => simulateIncomingPayment(placedOrder.orderId, placedOrder.total, bankName)}
                              className="text-[10px] text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
                              title="Bấm để kích hoạt giao dịch giả lập test"
                            >
                              [⚡ Test duyệt nhanh]
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => { copyText(placedOrder.orderId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      {copied ? <><Check size={14} className="text-emerald-600"/> Đã sao chép mã đơn</> : <><Copy size={14}/> Sao chép mã đơn hàng</>}
                    </button>
                    <button
                      onClick={() => { setIsCheckoutOpen(false); navigate(`/track?q=${placedOrder.orderId}`); }}
                      className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Truck size={14}/> Theo dõi trạng thái đơn hàng
                    </button>
                    <button
                      onClick={() => { setIsCheckoutOpen(false); }}
                      className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 font-medium"
                    >
                      Tiếp tục mua sắm
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Bottom Action */}
            {checkoutStep !== "success" && cart.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tổng thanh toán ({cartCount} món):</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#fe2c55]">{formatCurrency(finalTotal)}</span>
                    {discountAmount > 0 && (
                      <span className="block text-[10px] text-gray-400 line-through">{formatCurrency(cartTotal)}</span>
                    )}
                  </div>
                </div>

                {checkoutStep === "cart" ? (
                  <button
                    onClick={() => {
                      if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.streetAddress.trim()) {
                        alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!");
                        return;
                      }
                      if (!isValidPhone(checkoutForm.phone)) {
                        alert("Số điện thoại không hợp lệ! Vui lòng kiểm tra lại.");
                        return;
                      }
                      setCheckoutStep("payment");
                    }}
                    className="w-full bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 text-xs md:text-sm transition-all"
                  >
                    <span>Tiếp tục thanh toán</span>
                    <ArrowRight size={16}/>
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 text-xs md:text-sm transition-all disabled:opacity-50"
                  >
                    {placing ? (
                      <span>Đang xử lý đơn hàng...</span>
                    ) : (
                      <>
                        <span>Xác nhận đặt hàng</span>
                        <Check size={16}/>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Proof Realtime Purchase Notifications */}
      {promoSettings.enableSocialProof && <SocialProofNotification orders={orders} />}

      {/* Floating Lucky Wheel Button & Modal */}
      {promoSettings.enableLuckyWheel && (
        <>
          <button
            type="button"
            onClick={() => setIsLuckyWheelOpen(true)}
            className="fixed right-4 bottom-20 sm:bottom-24 z-30 flex items-center gap-2 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 text-white font-bold px-3.5 py-2.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-amber-300 animate-bounce cursor-pointer"
            style={{
              boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.5), 0 8px 10px -6px rgba(244, 63, 94, 0.3)",
            }}
            title="Quay vòng quay may mắn nhận quà"
          >
            <span className="text-base">🎡</span>
            <span className="text-xs font-extrabold hidden sm:inline">Vòng Quay May Mắn</span>
            <span className="text-[10px] bg-amber-400 text-gray-900 px-1.5 py-0.5 rounded-full font-black">
              100% Trúng
            </span>
          </button>

          {isLuckyWheelOpen && (
            <LuckyWheelModal
              isOpen={true}
              onClose={() => setIsLuckyWheelOpen(false)}
              onApplyVoucher={(code: string) => {
                const found = AVAILABLE_VOUCHERS.find(v => v.code === code);
                if (found) {
                  setAppliedVoucher(found);
                  setIsCheckoutOpen(true);
                  setCheckoutStep("cart");
                }
              }}
            />
          )}
        </>
      )}

            {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />

      {/* Floating Zalo & Hotline Quick Contact */}
      <FloatingContact
        hotline={shopPhone}
        zaloPhone={shopPhone}
        shopName={shopName}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-bold text-gray-800 text-sm">{shopName} — Đồ Ngủ & Pyjama Cao Cấp</p>
          <p>Cam kết 100% lụa satin & cotton mềm mịn • Đổi size miễn phí 7 ngày</p>
          <p className="text-gray-400 text-[11px] pt-2">Hotline hỗ trợ: <strong>{shopPhone}</strong> • Giờ làm việc: 8:00 - 22:30</p>
          <p className="text-gray-400 text-[10px] pt-1.5 border-t border-gray-100 max-w-md mx-auto">© 2026 {shopName}. All rights reserved. Mọi hình ảnh và nội dung được bảo vệ bởi WebShield.</p>
        </div>
      </footer>
    </div>
  );
}
