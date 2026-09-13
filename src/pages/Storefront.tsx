import { useState, useEffect, useMemo } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant, Order } from "../types";
import { ShoppingCart, Search, X, CheckCircle, Zap, Star, ShieldCheck, Settings, ChevronLeft, ChevronRight, Trash2, Plus, Minus } from "lucide-react";
import { formatCurrency, generateId, now, today } from "../utils/helpers";
import { useNavigate } from "react-router-dom";

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

// High quality fallback images for pyjama/fashion products
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

function getImg(product: Product, fallbackIdx: number): string {
  if (product.imageUrl && product.imageUrl.startsWith("http")) return product.imageUrl;
  return FALLBACKS[fallbackIdx % FALLBACKS.length];
}

function getGallery(product: Product, fallbackIdx: number): string[] {
  const main = getImg(product, fallbackIdx);
  const extras = ((product.additionalImages || []) as string[]).filter(u => u && u.startsWith("http"));
  return [main, ...extras];
}

function formatSoldCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// Stable pseudo-random rating seeded by product ID (same every render)
function getProductRating(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) hash = (hash * 31 + productId.charCodeAt(i)) % 100;
  // Range 4.6 → 5.0, looks realistic
  return 4.6 + (hash % 5) * 0.1;
}

export default function Storefront() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [shopName, setShopName] = useState(localStorage.getItem("tt_shopName") || "Henr.Studio");
  const [bannerTitle, setBannerTitle] = useState(localStorage.getItem("tt_bannerTitle") || "SALE SẬP SÀN");
  const [bannerSub, setBannerSub] = useState(localStorage.getItem("tt_bannerSub") || "Miễn phí vận chuyển toàn quốc");
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    document.title = `${shopName} | Cửa Hàng`;
    async function load() {
      const [allProds, allVariants, allOrders] = await Promise.all([
        db.products.filter(p => p.isActive).toArray(),
        db.productVariants.toArray(),
        db.orders.toArray(),
      ]);
      setProducts(allProds);
      setVariants(allVariants);
      setOrders(allOrders);
    }
    load();
  }, [shopName]);

  useEffect(() => { setActiveImageIdx(0); setSelectedVariant(null); }, [selectedProduct]);

  // Compute real sold count & total stock per product from DB
  const productStats = useMemo<Record<string, ProductStats>>(() => {
    const stats: Record<string, ProductStats> = {};
    for (const o of orders) {
      if (o.status !== "cancelled" && o.status !== "returned") {
        for (const item of o.items) {
          if (!stats[item.productId]) stats[item.productId] = { totalSold: 0, totalStock: 0 };
          stats[item.productId].totalSold += item.quantity;
        }
      }
    }
    for (const v of variants) {
      if (!stats[v.productId]) stats[v.productId] = { totalSold: 0, totalStock: 0 };
      stats[v.productId].totalStock += v.stock;
    }
    return stats;
  }, [orders, variants]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tt_shopName", shopName);
    localStorage.setItem("tt_bannerTitle", bannerTitle);
    localStorage.setItem("tt_bannerSub", bannerSub);
    setIsAdminOpen(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.qty, 0);
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id);
      if (existing) return prev.map(i => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { variantId: variant.id, productId: product.id, qty: 1, product, variant }];
    });
  };

  const updateCartQty = (variantId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.variantId === variantId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  const removeFromCart = (variantId: string) => setCart(prev => prev.filter(i => i.variantId !== variantId));

  const placeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || placing) return;
    setPlacing(true);
    const newOrder = {
      id: generateId(),
      tiktokOrderId: "WEB-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
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
      note: "Khách đặt qua Website",
      tiktokFeeRate: 0,
      tiktokFeeAmount: 0,
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
    await db.orders.add(newOrder);
    for (const item of cart) {
      await db.stockMovements.add({
        id: generateId(), productId: item.productId, variantId: item.variantId,
        type: "sale", quantity: -item.qty, note: "Đơn Web " + newOrder.tiktokOrderId,
        date: today(), createdAt: now(),
      });
      const v = await db.productVariants.get(item.variantId);
      if (v) await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.qty) });
    }
    setCart([]);
    setCheckoutSuccess(true);
    setPlacing(false);
  };

  const gallery = selectedProduct ? getGallery(selectedProduct, products.indexOf(selectedProduct)) : [];
  const selectedProductVariants = selectedProduct ? variants.filter(v => v.productId === selectedProduct.id) : [];
  const selectedProductStats = selectedProduct ? (productStats[selectedProduct.id] || { totalSold: 0, totalStock: 0 }) : null;
  const isInStock = selectedProductStats ? selectedProductStats.totalStock > 0 : false;

  return (
    <div className="bg-[#f5f5f5] text-gray-900 min-h-screen font-sans pb-10 relative">

      {/* Floating Admin Button — hidden from casual visitors */}
      <button
        onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-gray-900 text-white p-3 rounded-full shadow-xl hover:bg-black transition-all group flex items-center"
        title="Cài đặt Shop"
      >
        <Settings size={22} />
        <span className="w-0 overflow-hidden whitespace-nowrap group-hover:w-24 group-hover:ml-2 transition-all duration-300 text-sm font-medium">
          Sửa Shop
        </span>
      </button>

      {/* Admin Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="text-[#fe2c55]" size={20} /> Cài đặt Trang Bán Hàng
              </h2>
              <button onClick={() => setIsAdminOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên cửa hàng</label>
                <input required value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề Banner</label>
                <input required value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả Banner</label>
                <input required value={bannerSub} onChange={e => setBannerSub(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-[#fe2c55] outline-none" />
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
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-gray-900 placeholder-gray-500 ml-2"
            />
            {search && <button onClick={() => setSearch("")} className="shrink-0 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          <button onClick={() => setIsCheckoutOpen(true)} className="relative p-2 shrink-0 flex items-center gap-2 text-gray-900 hover:text-[#fe2c55] transition-colors">
            <div className="relative">
              <ShoppingCart size={24} />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#fe2c55] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
            </div>
            <span className="hidden md:block font-medium">Giỏ hàng</span>
          </button>
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
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#fe2c55] flex items-center justify-center shrink-0"><Zap size={24} /></div>
              <div><h3 className="font-bold text-gray-900">Flash Sale</h3><p className="text-sm text-gray-600">Ưu đãi hàng ngày từ Henr.Studio</p></div>
            </div>
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div>
              <div><h3 className="font-bold text-gray-900">Hàng Chính Hãng</h3><p className="text-sm text-gray-600">Cam kết đúng chất lượng</p></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {search ? `Kết quả tìm kiếm "${search}" (${filteredProducts.length})` : "Gợi ý hôm nay"}
          </h2>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Không tìm thấy sản phẩm nào cho "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-3 text-[#fe2c55] font-bold text-sm hover:underline">Xem tất cả sản phẩm</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product, idx) => {
              const imgSrc = getImg(product, idx);
              const stats = productStats[product.id] || { totalSold: 0, totalStock: 0 };
              const rating = getProductRating(product.id);
              const inStock = stats.totalStock > 0;
              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-transparent hover:border-[#fe2c55]/30 flex flex-col"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[idx % FALLBACKS.length]; }}
                    />
                    <div className="absolute top-0 left-0 bg-[#fe2c55] text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">Mall</div>
                    {!inStock && (
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
                        <Star size={9} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-gray-500">{rating.toFixed(1)}</span>
                        {stats.totalSold > 0 && <span className="text-[10px] text-gray-400 ml-1">Đã bán {formatSoldCount(stats.totalSold)}</span>}
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

            {/* Image Gallery */}
            <div className="w-full md:w-[45%] shrink-0 bg-gray-50 flex flex-col">
              <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                <img
                  key={activeImageIdx}
                  src={gallery[activeImageIdx]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}
                />
                {gallery.length > 1 && (
                  <>
                    <button onClick={() => setActiveImageIdx(i => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setActiveImageIdx(i => (i + 1) % gallery.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-bold">
                      {activeImageIdx + 1}/{gallery.length}
                    </div>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                  {gallery.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImageIdx === idx ? 'border-[#fe2c55]' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Side */}
            <div className="flex-1 p-5 md:p-8 flex flex-col overflow-y-auto relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-colors">
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#fe2c55] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Mall</span>
                <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{shopName.toUpperCase()} OFFICIAL</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">{selectedProduct.name}</h2>

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100 flex-wrap">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(getProductRating(selectedProduct.id)) ? "currentColor" : "none"} />
                  ))}
                  <span className="ml-1 font-bold text-gray-900">{getProductRating(selectedProduct.id).toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                {selectedProductStats && selectedProductStats.totalSold > 0 && (
                  <>
                    <span>Đã bán <strong>{formatSoldCount(selectedProductStats.totalSold)}</strong></span>
                    <span className="text-gray-300">|</span>
                  </>
                )}
                <span className={isInStock ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {isInStock ? `Còn hàng (${selectedProductStats?.totalStock})` : "Tạm hết hàng"}
                </span>
              </div>

              <div className="text-3xl font-bold text-[#fe2c55] mb-5">{formatCurrency(selectedProduct.sellingPrice)}</div>

              <div className="mb-6 flex-1">
                <p className="text-sm font-bold text-gray-900 mb-3">Chọn phân loại:</p>
                {selectedProductVariants.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sản phẩm này chưa có phân loại</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedProductVariants.map(v => {
                      const outOfStock = v.stock === 0;
                      return (
                        <button key={v.id} onClick={() => !outOfStock && setSelectedVariant(v)}
                          disabled={outOfStock}
                          className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                            outOfStock
                              ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                              : selectedVariant?.id === v.id
                              ? 'border-[#fe2c55] text-[#fe2c55] bg-red-50 font-bold ring-1 ring-[#fe2c55]'
                              : 'border-gray-200 text-gray-700 hover:border-[#fe2c55] hover:text-[#fe2c55]'
                          }`}>
                          {v.color} - {v.size}
                          {outOfStock && <span className="ml-1 text-[10px]">(hết)</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                {!selectedVariant && selectedProductVariants.filter(v => v.stock > 0).length > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Vui lòng chọn phân loại trước khi thêm vào giỏ</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { if (selectedVariant) addToCart(selectedProduct, selectedVariant); }}
                  disabled={!selectedVariant}
                  className="flex-1 bg-[#ffecd8] hover:bg-[#ffe0c2] text-[#ff8000] font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Thêm vào giỏ
                </button>
                <button
                  onClick={() => {
                    if (selectedVariant) {
                      addToCart(selectedProduct, selectedVariant);
                      setSelectedProduct(null);
                      setIsCheckoutOpen(true);
                    }
                  }}
                  disabled={!selectedVariant}
                  className="flex-1 bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={20} /> Giỏ hàng {cartCount > 0 && <span className="bg-[#fe2c55] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
              </h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={22} className="text-gray-700" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#f9f9f9] space-y-4">
              {checkoutSuccess ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
                  <p className="text-sm text-gray-600 mb-2 px-4">Cảm ơn <strong>{checkoutForm.name}</strong> đã tin tưởng {shopName}!</p>
                  <p className="text-sm text-gray-500 mb-6 px-4">Shop sẽ liên hệ qua <strong>{checkoutForm.phone}</strong> để xác nhận đơn sớm nhất.</p>
                  <button onClick={() => { setIsCheckoutOpen(false); setCheckoutSuccess(false); setCheckoutForm({ name: "", phone: "", address: "" }); }}
                    className="px-8 py-2.5 bg-[#fe2c55] text-white rounded-full font-bold text-sm">
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Giỏ hàng đang trống</p>
                  <button onClick={() => setIsCheckoutOpen(false)} className="mt-3 text-[#fe2c55] font-bold text-sm hover:underline">Tiếp tục mua sắm</button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                      <span className="bg-[#fe2c55] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Mall</span>
                      <span className="font-bold text-sm text-gray-900">{shopName} Official</span>
                    </div>
                    <div className="p-4 space-y-4 divide-y divide-gray-50">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3 pt-4 first:pt-0">
                          <img
                            src={getImg(item.product, idx)}
                            className="w-18 h-18 w-[72px] h-[72px] object-cover rounded-lg border border-gray-100 shrink-0"
                            onError={e => { (e.target as HTMLImageElement).src = FALLBACKS[0]; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.product.name}</h4>
                            <p className="text-xs text-gray-500 mb-2">{item.variant.color}, Size {item.variant.size}</p>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-[#fe2c55] text-sm">{formatCurrency(item.product.sellingPrice)}</p>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateCartQty(item.variantId, -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                  <Minus size={12} />
                                </button>
                                <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                                <button onClick={() => updateCartQty(item.variantId, 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                  <Plus size={12} />
                                </button>
                                <button onClick={() => removeFromCart(item.variantId)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Form */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">📦 Thông tin giao hàng</h3>
                    <input
                      className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none transition-colors"
                      placeholder="Họ và tên người nhận *"
                      value={checkoutForm.name}
                      onChange={e => setCheckoutForm(p => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      type="tel"
                      className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none transition-colors"
                      placeholder="Số điện thoại *"
                      value={checkoutForm.phone}
                      onChange={e => setCheckoutForm(p => ({ ...p, phone: e.target.value }))}
                    />
                    <textarea
                      className="w-full text-sm text-gray-900 placeholder-gray-400 px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg outline-none transition-colors resize-none h-20"
                      placeholder="Địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành) *"
                      value={checkoutForm.address}
                      onChange={e => setCheckoutForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-500">
                        <span className="truncate mr-2">{item.product.name} x{item.qty}</span>
                        <span className="shrink-0 font-medium">{formatCurrency(item.product.sellingPrice * item.qty)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Phí vận chuyển</span>
                      <span className="font-bold text-green-600">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                      <span className="text-gray-900">Tổng cộng</span>
                      <span className="text-[#fe2c55]">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <button
                  onClick={placeOrder}
                  disabled={!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || placing}
                  className="w-full py-3.5 bg-[#fe2c55] hover:bg-[#e62045] text-white rounded-xl font-bold text-base shadow-lg shadow-red-200 disabled:opacity-50 transition-colors">
                  {placing ? "Đang xử lý..." : `Đặt hàng • ${formatCurrency(cartTotal)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
