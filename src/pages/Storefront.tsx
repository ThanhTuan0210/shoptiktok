import { useState, useEffect, useMemo } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant, Order } from "../types";
import {
  ShoppingCart, Search, X, CheckCircle, Zap, Star, ShieldCheck,
  Settings, ChevronLeft, ChevronRight, Trash2, Plus, Minus,
  Banknote, Truck, Copy, ExternalLink
} from "lucide-react";
import { formatCurrency, generateId, now, today } from "../utils/helpers";
import { useNavigate } from "react-router-dom";

interface CartItem {
  variantId: string;
  productId: string;
  qty: number;
  product: Product;
  variant: ProductVariant;
}

interface ProductStats { totalSold: number; totalStock: number; }

type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "cod" | "bank_transfer";

const FALLBACKS = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85",
  "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=85",
  "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=85",
  "https://images.unsplash.com/photo-1591522967160-c976938d21db?w=600&q=85",
  "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=85",
  "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=85",
  "https://images.unsplash.com/photo-1434389673259-22a466453b0e?w=600&q=85",
];

function getImg(p: Product, idx: number) {
  return (p.imageUrl && p.imageUrl.startsWith("http")) ? p.imageUrl : FALLBACKS[idx % FALLBACKS.length];
}
function getGallery(p: Product, idx: number): string[] {
  const main = getImg(p, idx);
  const extras = ((p.additionalImages || []) as string[]).filter(u => u?.startsWith("http"));
  return [main, ...extras];
}
function formatSold(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString(); }
function getRating(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 100;
  return 4.6 + (h % 5) * 0.1;
}
function copyText(text: string) { navigator.clipboard?.writeText(text).catch(() => {}); }

export default function Storefront() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placedOrder, setPlacedOrder] = useState<{ orderId: string; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Shop settings
  const [shopName, setShopName] = useState(localStorage.getItem("tt_shopName") || "Henr.Studio");
  const [bannerTitle, setBannerTitle] = useState(localStorage.getItem("tt_bannerTitle") || "SALE SẬP SÀN");
  const [bannerSub, setBannerSub] = useState(localStorage.getItem("tt_bannerSub") || "Miễn phí vận chuyển toàn quốc");
  const [bankName, setBankName] = useState(localStorage.getItem("tt_bankName") || "Vietcombank");
  const [bankAccount, setBankAccount] = useState(localStorage.getItem("tt_bankAccount") || "1234567890");
  const [bankOwner, setBankOwner] = useState(localStorage.getItem("tt_bankOwner") || "NGUYEN VAN A");
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    document.title = `${shopName} | Cửa Hàng`;
    Promise.all([
      db.products.filter(p => p.isActive).toArray(),
      db.productVariants.toArray(),
      db.orders.toArray(),
    ]).then(([prods, vars, ords]) => { setProducts(prods); setVariants(vars); setOrders(ords); });
  }, [shopName]);

  useEffect(() => { setActiveImageIdx(0); setSelectedVariant(null); }, [selectedProduct]);
  useEffect(() => { if (!isCheckoutOpen) { setCheckoutStep("cart"); } }, [isCheckoutOpen]);

  const productStats = useMemo<Record<string, ProductStats>>(() => {
    const s: Record<string, ProductStats> = {};
    for (const o of orders) {
      if (!["cancelled","returned"].includes(o.status)) {
        for (const item of o.items) {
          if (!s[item.productId]) s[item.productId] = { totalSold: 0, totalStock: 0 };
          s[item.productId].totalSold += item.quantity;
        }
      }
    }
    for (const v of variants) {
      if (!s[v.productId]) s[v.productId] = { totalSold: 0, totalStock: 0 };
      s[v.productId].totalStock += v.stock;
    }
    return s;
  }, [orders, variants]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    ["tt_shopName","tt_bannerTitle","tt_bannerSub","tt_bankName","tt_bankAccount","tt_bankOwner"].forEach(k => {
      const vals: Record<string,string> = {
        tt_shopName: shopName, tt_bannerTitle: bannerTitle, tt_bannerSub: bannerSub,
        tt_bankName: bankName, tt_bankAccount: bankAccount, tt_bankOwner: bankOwner,
      };
      localStorage.setItem(k, vals[k]);
    });
    setIsAdminOpen(false);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.qty, 0);
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart(prev => {
      const ex = prev.find(i => i.variantId === variant.id);
      if (ex) return prev.map(i => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { variantId: variant.id, productId: product.id, qty: 1, product, variant }];
    });
  };
  const updateQty = (variantId: string, delta: number) =>
    setCart(prev => prev.map(i => i.variantId === variantId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const removeItem = (variantId: string) => setCart(prev => prev.filter(i => i.variantId !== variantId));

  const canProceedToPayment = checkoutForm.name.trim() && checkoutForm.phone.trim() && checkoutForm.address.trim();

  const placeOrder = async () => {
    if (!canProceedToPayment || placing) return;
    setPlacing(true);
    const orderId = "WEB-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    const newOrder = {
      id: generateId(),
      tiktokOrderId: orderId,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      status: "pending" as const,
      orderDate: today(),
      subtotal: cartTotal,
      shippingFee: 0,
      total: cartTotal,
      shippingCarrier: "GHTK",
      trackingNumber: "",
      note: `Đặt qua Website | Thanh toán: ${paymentMethod === "cod" ? "COD" : "Chuyển khoản"}`,
      tiktokFeeRate: 0,
      tiktokFeeAmount: 0,
      paymentMethod,
      createdAt: now(),
      updatedAt: now(),
      items: cart.map(item => ({
        id: generateId(),
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant.color + " - " + item.variant.size,
        sku: item.variant.sku,
        quantity: item.qty,
        unitPrice: item.product.sellingPrice,
      }))
    };
    await db.orders.add(newOrder as any);
    for (const item of cart) {
      await db.stockMovements.add({
        id: generateId(), productId: item.productId, variantId: item.variantId,
        type: "sale", quantity: -item.qty, note: "Đơn Web " + orderId,
        date: today(), createdAt: now(),
      });
      const v = await db.productVariants.get(item.variantId);
      if (v) await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.qty) });
    }
    setPlacedOrder({ orderId, total: cartTotal });
    setCart([]);
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
  const bankCode = BANK_CODES[bankName] || "VCB";
  const vietQrUrl = placedOrder
    ? `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.jpg?amount=${placedOrder.total}&addInfo=${placedOrder.orderId}&accountName=${encodeURIComponent(bankOwner)}`
    : "";

  return (
    <div className="bg-[#f5f5f5] text-gray-900 min-h-screen font-sans pb-10 relative">

      {/* Admin Floating Button */}
      <button onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-gray-900 text-white p-3 rounded-full shadow-xl hover:bg-black transition-all group flex items-center" title="Cài đặt Shop">
        <Settings size={22} />
        <span className="w-0 overflow-hidden whitespace-nowrap group-hover:w-24 group-hover:ml-2 transition-all duration-300 text-sm font-medium">Sửa Shop</span>
      </button>

      {/* Admin Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Settings className="text-[#fe2c55]" size={20}/> Cài đặt Shop</h2>
              <button onClick={() => setIsAdminOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500"/></button>
            </div>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên cửa hàng</label>
                <input required value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề Banner</label>
                <input required value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả Banner</label>
                <input required value={bannerSub} onChange={e => setBannerSub(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none"/>
              </div>
              <hr className="border-gray-100"/>
              <p className="text-xs font-bold text-gray-400 uppercase">Tài khoản ngân hàng</p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngân hàng</label>
                <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none">
                  {Object.keys(BANK_CODES).map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số tài khoản</label>
                <input required value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none" placeholder="VD: 1234567890"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên chủ tài khoản</label>
                <input required value={bankOwner} onChange={e => setBankOwner(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none" placeholder="VD: NGUYEN VAN A"/>
              </div>
              <button type="submit" className="w-full bg-[#fe2c55] text-white font-bold py-3 rounded-xl hover:bg-[#e62045] transition-colors">Lưu thay đổi</button>
            </form>
            <div className="border-t border-gray-100 mt-5 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quản trị viên</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigate("/dashboard")} className="flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-black transition-colors text-sm">📊 Dashboard</button>
                <button onClick={() => navigate("/inventory")} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm">📦 Quản lý Kho</button>
                <button onClick={() => navigate("/orders")} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm">🧾 Đơn hàng</button>
                <button onClick={() => navigate("/finance")} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm">💰 Tài chính</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black text-white font-bold text-xl italic flex items-center justify-center rounded-lg">{shopName.charAt(0)}</div>
            <span className="font-bold text-xl text-gray-900 hidden md:block">{shopName}</span>
          </div>
          <div className="flex-1 max-w-2xl bg-[#f1f1f1] h-10 rounded-full flex items-center px-4 border border-transparent focus-within:border-[#fe2c55] focus-within:bg-white transition-colors">
            <Search size={16} className="text-gray-400 shrink-0"/>
            <input type="text" placeholder="Tìm kiếm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm text-gray-900 placeholder-gray-500 ml-2"/>
            {search && <button onClick={() => setSearch("")} className="shrink-0 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/track")} className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#fe2c55] transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
              <Search size={15}/> Tra cứu đơn
            </button>
            <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep("cart"); }} className="relative p-2 shrink-0 flex items-center gap-2 text-gray-900 hover:text-[#fe2c55] transition-colors">
              <div className="relative">
                <ShoppingCart size={24}/>
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#fe2c55] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
              </div>
              <span className="hidden md:block font-medium">Giỏ hàng</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 h-48 md:h-64 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 relative overflow-hidden shadow-sm flex items-center p-8">
            <div className="relative z-10 text-white">
              <span className="bg-black/30 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">Chương trình đặc biệt</span>
              <h2 className="font-extrabold text-3xl md:text-5xl italic mb-2">{bannerTitle}</h2>
              <p className="text-lg opacity-90">{bannerSub}</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#fe2c55] flex items-center justify-center shrink-0"><Zap size={24}/></div>
              <div><h3 className="font-bold text-gray-900">Flash Sale</h3><p className="text-sm text-gray-600">Ưu đãi hàng ngày từ {shopName}</p></div>
            </div>
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0"><ShieldCheck size={24}/></div>
              <div><h3 className="font-bold text-gray-900">Hàng Chính Hãng</h3><p className="text-sm text-gray-600">Cam kết đúng chất lượng</p></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {search ? `Kết quả cho "${search}" (${filteredProducts.length})` : "Gợi ý hôm nay"}
          </h2>
          <button onClick={() => navigate("/track")} className="md:hidden text-xs font-bold text-[#fe2c55] flex items-center gap-1">
            <Search size={12}/> Tra cứu đơn
          </button>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300"/>
            <p className="font-medium">Không tìm thấy "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-3 text-[#fe2c55] font-bold text-sm hover:underline">Xem tất cả</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product, idx) => {
              const stats = productStats[product.id] || { totalSold: 0, totalStock: 0 };
              const rating = getRating(product.id);
              return (
                <div key={product.id} onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-transparent hover:border-[#fe2c55]/30 flex flex-col">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img src={getImg(product, idx)} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[idx % FALLBACKS.length]; }}/>
                    <div className="absolute top-0 left-0 bg-[#fe2c55] text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">Mall</div>
                    {stats.totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-700 font-bold text-xs px-3 py-1 rounded-full">Hết hàng</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-[13px] md:text-sm text-gray-900 font-medium leading-tight line-clamp-2 h-10 mb-2 group-hover:text-[#fe2c55] transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="border border-[#fe2c55] text-[#fe2c55] text-[9px] px-1 font-bold rounded">FREESHIP</span>
                      <span className="bg-red-50 text-[#fe2c55] text-[9px] px-1 font-bold rounded">VOUCHER</span>
                    </div>
                    <div className="mt-auto">
                      <span className="text-[#fe2c55] font-bold text-base md:text-lg">{formatCurrency(product.sellingPrice)}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={9} className="text-amber-400 fill-amber-400"/>
                        <span className="text-[10px] text-gray-500">{rating.toFixed(1)}</span>
                        {stats.totalSold > 0 && <span className="text-[10px] text-gray-400 ml-1">Đã bán {formatSold(stats.totalSold)}</span>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl flex flex-col md:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="w-full md:w-[45%] shrink-0 bg-gray-50 flex flex-col">
              <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                <img key={activeImageIdx} src={gallery[activeImageIdx]} alt={selectedProduct.name}
                  className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}/>
                {gallery.length > 1 && (<>
                  <button onClick={() => setActiveImageIdx(i => (i-1+gallery.length)%gallery.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"><ChevronLeft size={18}/></button>
                  <button onClick={() => setActiveImageIdx(i => (i+1)%gallery.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"><ChevronRight size={18}/></button>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-bold">{activeImageIdx+1}/{gallery.length}</div>
                </>)}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                  {gallery.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeImageIdx===idx?'border-[#fe2c55]':'border-gray-200 opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}/>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 p-5 md:p-8 flex flex-col overflow-y-auto relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700"><X size={18}/></button>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#fe2c55] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Mall</span>
                <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{shopName.toUpperCase()} OFFICIAL</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">{selectedProduct.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100 flex-wrap">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_,i) => <Star key={i} size={14} fill={i<Math.floor(getRating(selectedProduct.id))?"currentColor":"none"}/>)}
                  <span className="ml-1 font-bold text-gray-900">{getRating(selectedProduct.id).toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                {selStats && selStats.totalSold > 0 && <><span>Đã bán <strong>{formatSold(selStats.totalSold)}</strong></span><span className="text-gray-300">|</span></>}
                <span className={selStats && selStats.totalStock > 0 ? "text-green-600 font-medium":"text-red-500 font-medium"}>
                  {selStats && selStats.totalStock > 0 ? `Còn hàng (${selStats.totalStock})` : "Tạm hết hàng"}
                </span>
              </div>
              <div className="text-3xl font-bold text-[#fe2c55] mb-5">{formatCurrency(selectedProduct.sellingPrice)}</div>
              <div className="mb-6 flex-1">
                <p className="text-sm font-bold text-gray-900 mb-3">Chọn phân loại:</p>
                <div className="flex flex-wrap gap-2">
                  {selVariants.map(v => (
                    <button key={v.id} onClick={() => v.stock > 0 && setSelectedVariant(v)} disabled={v.stock===0}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all ${v.stock===0?'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through':selectedVariant?.id===v.id?'border-[#fe2c55] text-[#fe2c55] bg-red-50 font-bold ring-1 ring-[#fe2c55]':'border-gray-200 text-gray-700 hover:border-[#fe2c55]'}`}>
                      {v.color} - {v.size}{v.stock===0&&<span className="ml-1 text-[10px]">(hết)</span>}
                    </button>
                  ))}
                </div>
                {!selectedVariant && selVariants.filter(v=>v.stock>0).length > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Vui lòng chọn phân loại trước khi mua</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { if(selectedVariant) addToCart(selectedProduct, selectedVariant); }} disabled={!selectedVariant}
                  className="flex-1 bg-[#ffecd8] hover:bg-[#ffe0c2] text-[#ff8000] font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40">
                  Thêm vào giỏ
                </button>
                <button onClick={() => { if(selectedVariant){ addToCart(selectedProduct, selectedVariant); setSelectedProduct(null); setIsCheckoutOpen(true); setCheckoutStep("cart"); } }} disabled={!selectedVariant}
                  className="flex-1 bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-colors disabled:opacity-40">
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sidebar */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              {checkoutStep === "payment" ? (
                <button onClick={() => setCheckoutStep("cart")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
                  <ChevronLeft size={18}/> Quay lại
                </button>
              ) : (
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={20}/>
                  Giỏ hàng {cartCount > 0 && <span className="bg-[#fe2c55] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
                </h2>
              )}
              {checkoutStep !== "success" && (
                <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={22} className="text-gray-700"/></button>
              )}
            </div>

            {/* Step indicator */}
            {checkoutStep !== "success" && (
              <div className="flex px-4 py-3 gap-2 border-b border-gray-100 shrink-0">
                {[["cart","1. Giỏ hàng & Địa chỉ"],["payment","2. Thanh toán"]].map(([step, label]) => (
                  <div key={step} className={`flex-1 text-center text-xs font-bold py-1.5 rounded-lg ${checkoutStep===step?'bg-[#fe2c55] text-white':'bg-gray-100 text-gray-400'}`}>{label}</div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f9f9f9] space-y-4">

              {/* STEP 1: Cart + Form */}
              {checkoutStep === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-20">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4"/>
                      <p className="text-gray-500 font-medium">Giỏ hàng đang trống</p>
                      <button onClick={() => setIsCheckoutOpen(false)} className="mt-3 text-[#fe2c55] font-bold text-sm hover:underline">Tiếp tục mua sắm</button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                          <span className="bg-[#fe2c55] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">Mall</span>
                          <span className="font-bold text-sm text-gray-900">{shopName} Official</span>
                        </div>
                        <div className="p-4 space-y-4 divide-y divide-gray-50">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-3 pt-4 first:pt-0">
                              <img src={getImg(item.product, idx)} className="w-[70px] h-[70px] object-cover rounded-lg border border-gray-100 shrink-0" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.product.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{item.variant.color}, Size {item.variant.size}</p>
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-[#fe2c55] text-sm">{formatCurrency(item.product.sellingPrice)}</p>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => updateQty(item.variantId,-1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Minus size={12}/></button>
                                    <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                                    <button onClick={() => updateQty(item.variantId,1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Plus size={12}/></button>
                                    <button onClick={() => removeItem(item.variantId)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"><Trash2 size={13}/></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">📦 Thông tin giao hàng</h3>
                        <input className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none" placeholder="Họ và tên người nhận *" value={checkoutForm.name} onChange={e => setCheckoutForm(p=>({...p,name:e.target.value}))}/>
                        <input type="tel" className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none" placeholder="Số điện thoại *" value={checkoutForm.phone} onChange={e => setCheckoutForm(p=>({...p,phone:e.target.value}))}/>
                        <textarea className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 border border-gray-200 focus:border-[#fe2c55] rounded-lg outline-none resize-none h-20" placeholder="Địa chỉ đầy đủ (số nhà, đường, phường/xã, quận, tỉnh) *" value={checkoutForm.address} onChange={e => setCheckoutForm(p=>({...p,address:e.target.value}))}/>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* STEP 2: Payment */}
              {checkoutStep === "payment" && (
                <>
                  {/* Summary */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tóm tắt đơn hàng</p>
                    {cart.map((item,i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="truncate mr-2">{item.product.name} ×{item.qty}</span>
                        <span className="shrink-0 font-medium">{formatCurrency(item.product.sellingPrice * item.qty)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold text-sm">
                      <span>Tổng</span><span className="text-[#fe2c55]">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">💳 Chọn hình thức thanh toán</p>
                    <div className="space-y-3">
                      <button onClick={() => setPaymentMethod("cod")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod==="cod"?'border-[#fe2c55] bg-red-50':'border-gray-200 hover:border-gray-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod==="cod"?'bg-[#fe2c55] text-white':'bg-gray-100 text-gray-500'}`}><Truck size={20}/></div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-xs text-gray-500 mt-0.5">Trả tiền mặt cho shipper khi nhận được hàng</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod==="cod"?'border-[#fe2c55] bg-[#fe2c55]':'border-gray-300'}`}>
                          {paymentMethod==="cod" && <div className="w-2 h-2 bg-white rounded-full"/>}
                        </div>
                      </button>
                      <button onClick={() => setPaymentMethod("bank_transfer")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod==="bank_transfer"?'border-[#fe2c55] bg-red-50':'border-gray-200 hover:border-gray-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod==="bank_transfer"?'bg-[#fe2c55] text-white':'bg-gray-100 text-gray-500'}`}><Banknote size={20}/></div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Chuyển khoản ngân hàng</p>
                          <p className="text-xs text-gray-500 mt-0.5">Mã QR và thông tin TK sẽ hiện sau khi đặt</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod==="bank_transfer"?'border-[#fe2c55] bg-[#fe2c55]':'border-gray-300'}`}>
                          {paymentMethod==="bank_transfer" && <div className="w-2 h-2 bg-white rounded-full"/>}
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3: Success */}
              {checkoutStep === "success" && placedOrder && (
                <div className="space-y-4">
                  <div className="text-center py-6 bg-white rounded-2xl border border-gray-200">
                    <CheckCircle size={56} className="mx-auto text-green-500 mb-3"/>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Đặt hàng thành công!</h3>
                    <p className="text-sm text-gray-500 px-4">Cảm ơn <strong>{checkoutForm.name}</strong>! Shop sẽ liên hệ <strong>{checkoutForm.phone}</strong> để xác nhận sớm nhất.</p>
                  </div>

                  {/* Order Code */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mã đơn hàng của bạn</p>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{placedOrder.orderId}</span>
                      <button onClick={() => { copyText(placedOrder.orderId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied?'bg-green-500 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Copy size={13}/> {copied ? "Đã sao chép!" : "Sao chép"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Dùng mã này để tra cứu đơn hàng của bạn</p>
                  </div>

                  {/* COD Info */}
                  {paymentMethod === "cod" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck size={18} className="text-orange-500"/>
                        <p className="font-bold text-orange-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
                      </div>
                      <p className="text-sm text-orange-700">Bạn chỉ cần <strong>trả tiền mặt cho shipper</strong> khi nhận hàng. Không cần thanh toán trước.</p>
                      <div className="mt-3 bg-white rounded-lg p-3 border border-orange-200 flex justify-between">
                        <span className="text-sm text-gray-600 font-medium">Số tiền cần trả</span>
                        <span className="font-bold text-[#fe2c55]">{formatCurrency(placedOrder.total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Info */}
                  {paymentMethod === "bank_transfer" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote size={18} className="text-blue-600"/>
                        <p className="font-bold text-blue-900 text-sm">Thông tin chuyển khoản</p>
                      </div>
                      <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-2.5 mb-3">
                        {[["Ngân hàng", bankName],["Số TK", bankAccount],["Tên TK", bankOwner],["Số tiền", formatCurrency(placedOrder.total)],["Nội dung CK", placedOrder.orderId]].map(([label, val]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{val}</span>
                              {["Số TK","Nội dung CK"].includes(label) && (
                                <button onClick={() => copyText(val)} className="text-blue-500 hover:text-blue-700"><Copy size={12}/></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* VietQR */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Quét mã QR để chuyển khoản nhanh</p>
                        <img src={vietQrUrl} alt="QR chuyển khoản" className="w-48 h-auto mx-auto rounded-xl shadow-sm border border-blue-100"
                          onError={e => { (e.target as HTMLImageElement).style.display='none'; }}/>
                      </div>
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 text-center">
                        ⚠️ Ghi đúng nội dung <strong>{placedOrder.orderId}</strong> khi chuyển khoản
                      </div>
                    </div>
                  )}

                  {/* Track Order */}
                  <button onClick={() => { setIsCheckoutOpen(false); navigate("/track"); }}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    <Search size={16}/> Tra cứu đơn hàng của tôi
                    <ExternalLink size={14} className="text-gray-400"/>
                  </button>

                  <button onClick={() => { setIsCheckoutOpen(false); setCheckoutStep("cart"); setPlacedOrder(null); setCheckoutForm({name:"",phone:"",address:""}); }}
                    className="w-full bg-[#fe2c55] text-white font-bold py-3 rounded-xl hover:bg-[#e62045] transition-colors text-sm">
                    Tiếp tục mua sắm
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {checkoutStep === "cart" && cart.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600 font-medium">Tổng ({cartCount} sản phẩm)</span>
                  <span className="font-bold text-[#fe2c55] text-base">{formatCurrency(cartTotal)}</span>
                </div>
                <button onClick={() => setCheckoutStep("payment")} disabled={!canProceedToPayment}
                  className="w-full py-3.5 bg-[#fe2c55] hover:bg-[#e62045] text-white rounded-xl font-bold text-base disabled:opacity-50 transition-colors">
                  Tiếp tục → Chọn thanh toán
                </button>
                {!canProceedToPayment && <p className="text-xs text-gray-400 text-center mt-2">Điền đầy đủ thông tin giao hàng để tiếp tục</p>}
              </div>
            )}
            {checkoutStep === "payment" && (
              <div className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <button onClick={placeOrder} disabled={placing}
                  className="w-full py-3.5 bg-[#fe2c55] hover:bg-[#e62045] text-white rounded-xl font-bold text-base disabled:opacity-50 transition-colors">
                  {placing ? "Đang xử lý..." : `✓ Đặt hàng • ${formatCurrency(cartTotal)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
