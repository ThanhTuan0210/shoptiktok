import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant } from "../types";
import { ShoppingBag, X, CheckCircle, ArrowRight, Star, Truck, ShieldCheck, Heart } from "lucide-react";
import { formatCurrency, generateId, now, today } from "../utils/helpers";

interface CartItem {
  variantId: string;
  productId: string;
  qty: number;
  product: Product;
  variant: ProductVariant;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    document.title = "Henr.Studio | Cửa hàng đồ ngủ cao cấp";
    async function load() {
      const allProds = await db.products.filter(p => p.isActive).toArray();
      // Fix broken images dynamically with reliable high-quality fashion images
      const fallbackImages = [
        "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=80",
        "https://images.unsplash.com/photo-1601614051010-8dc0244400e9?w=600&q=80",
        "https://images.unsplash.com/photo-1591522967160-c976938d21db?w=600&q=80",
        "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=600&q=80",
        "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&q=80",
        "https://images.unsplash.com/photo-1520108990525-4c014798c5ee?w=600&q=80",
        "https://images.unsplash.com/photo-1563178229-30790d93f7e1?w=600&q=80",
        "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=80",
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80"
      ];
      const fixedProds = allProds.map((p, idx) => {
        p.imageUrl = fallbackImages[idx % fallbackImages.length];
        return p;
      });
      setProducts(fixedProds);
      setVariants(await db.productVariants.toArray());
    }
    load();
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.qty, 0);

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id);
      if (existing) {
        return prev.map(i => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { variantId: variant.id, productId: product.id, qty: 1, product, variant }];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const placeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) return;
    const newOrder = {
      id: generateId(),
      tiktokOrderId: "WEB-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      status: "pending" as const,
      orderDate: today(),
      subtotal: cartTotal,
      shippingFee: 30000,
      total: cartTotal + 30000,
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
        id: generateId(),
        productId: item.productId,
        variantId: item.variantId,
        type: "sale",
        quantity: -item.qty,
        note: "Đơn web " + newOrder.tiktokOrderId,
        date: today(),
        createdAt: now(),
      });
      const v = await db.productVariants.get(item.variantId);
      if (v) await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.qty) });
    }
    setCart([]);
    setCheckoutSuccess(true);
  };

  return (
    <div className="min-h-screen bg-rose-50 text-gray-900 font-sans">
      {/* Top Banner */}
      <div className="bg-rose-950 text-rose-100 text-xs md:text-sm py-2 px-4 text-center tracking-wide">
        ✨ MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 500K ✨
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-rose-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <span className="text-white font-bold text-xl italic" style={{ fontFamily: 'Georgia, serif' }}>H</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Henr.Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 font-medium text-gray-600">
              <a href="#" className="hover:text-rose-600 transition-colors">Trang chủ</a>
              <a href="#products" className="text-rose-600 font-semibold">Sản phẩm</a>
              <a href="#" className="hover:text-rose-600 transition-colors">Về chúng tôi</a>
            </nav>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-rose-50 text-rose-900 hover:bg-rose-100 rounded-full transition-all hover:scale-105 active:scale-95">
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Modern */}
      <section className="relative overflow-hidden bg-rose-100">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/90 to-rose-900/40 z-10"></div>
        <img src="https://images.unsplash.com/photo-1520108990525-4c014798c5ee?w=1600&q=80" className="absolute inset-0 w-full h-full object-cover" alt="Hero background" />
        
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 relative z-20">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-rose-500/20 text-rose-100 border border-rose-400/30 text-sm font-semibold tracking-wider mb-6 backdrop-blur-md">
              BỘ SƯU TẬP XUÂN HÈ 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Nâng Niu Giấc Ngủ<br/>Phái Đẹp.
            </h1>
            <p className="text-lg md:text-xl text-rose-50 mb-10 opacity-90 max-w-lg leading-relaxed">
              Trải nghiệm sự mềm mại tuyệt đối với chất liệu lụa satin cao cấp từ Henr.Studio. Tự tin, quyến rũ ngay cả khi ở nhà.
            </p>
            <a href="#products" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-950 font-bold rounded-full hover:bg-rose-50 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Mua Sắm Ngay <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-white py-12 border-b border-rose-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0"><Truck size={24} /></div>
            <div>
              <h4 className="font-bold text-gray-900">Giao hàng toàn quốc</h4>
              <p className="text-sm text-gray-500">Miễn phí ship đơn từ 500k</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div>
            <div>
              <h4 className="font-bold text-gray-900">Cam kết chất lượng</h4>
              <p className="text-sm text-gray-500">Đổi trả trong vòng 7 ngày</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0"><Heart size={24} /></div>
            <div>
              <h4 className="font-bold text-gray-900">Chất liệu cao cấp</h4>
              <p className="text-sm text-gray-500">Lụa Satin siêu mềm mịn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main id="products" className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Sản phẩm nổi bật</h2>
            <p className="text-gray-500 mt-2">Những thiết kế được yêu thích nhất</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product, idx) => (
            <div key={product.id} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden rounded-2xl mb-4">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                {idx < 3 && <div className="absolute top-3 left-3 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">Bán Chạy</div>}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button className="w-full bg-white/90 backdrop-blur text-gray-900 font-bold py-3 rounded-xl shadow-lg hover:bg-white transition-colors">
                    Xem chi tiết
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-1">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs text-gray-400 ml-1">(4.9)</span>
                </div>
                <h3 className="font-medium text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">{product.name}</h3>
                <p className="font-bold text-rose-600 text-lg">{formatCurrency(product.sellingPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white italic mb-4" style={{ fontFamily: 'Georgia, serif' }}>Henr.Studio</h2>
          <p className="mb-6">Cửa hàng Pyjama cao cấp - Mang đến giấc ngủ êm ái cho bạn.</p>
          <div className="text-sm">© 2026 Henr.Studio. All rights reserved.</div>
        </div>
      </footer>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/2 bg-gray-100 relative">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover absolute inset-0" />
            </div>
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col max-h-[85vh] overflow-y-auto bg-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-rose-500 font-bold text-xs uppercase tracking-widest mb-2">{selectedProduct.category}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{selectedProduct.name}</h2>
                </div>
                <button onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }} className="text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2"><X size={20} /></button>
              </div>
              <p className="text-3xl font-bold text-rose-600 mb-8">{formatCurrency(selectedProduct.sellingPrice)}</p>
              
              <div className="mb-8 flex-1">
                <p className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Phân loại sản phẩm:</p>
                <div className="grid grid-cols-2 gap-3">
                  {variants.filter(v => v.productId === selectedProduct.id).map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-3 border-2 rounded-xl text-left transition-all ${selectedVariant?.id === v.id ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-100 hover:border-rose-300 hover:bg-gray-50'}`}
                    >
                      <span className="block font-bold text-gray-900">{v.color}</span>
                      <span className="text-xs text-gray-500 mt-1 block">Size: {v.size} {v.stock < 5 && <span className="text-rose-500 font-medium">(Còn {v.stock})</span>}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                disabled={!selectedVariant}
                onClick={() => selectedVariant && addToCart(selectedProduct, selectedVariant)}
                className="w-full py-4 bg-rose-950 hover:bg-rose-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-rose-900/20"
              >
                <ShoppingBag size={22} /> {selectedVariant ? 'Thêm vào giỏ hàng' : 'Vui lòng chọn phân loại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Giỏ Hàng</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {checkoutSuccess ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Đặt hàng thành công!</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">Đơn hàng của bạn đã được chuyển đến hệ thống của Henr.Studio. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                  <button onClick={() => { setIsCartOpen(false); setCheckoutSuccess(false); }} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Tiếp tục mua sắm</button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-32 text-gray-400">
                  <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
                  <p className="text-lg">Giỏ hàng của bạn đang trống</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6 mb-8">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img src={item.product.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 py-1">
                          <h4 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{item.product.name}</h4>
                          <p className="text-xs text-gray-500 mb-3">{item.variant.color} / Size {item.variant.size}</p>
                          <div className="flex items-end justify-between">
                            <p className="font-bold text-rose-600">{formatCurrency(item.product.sellingPrice)}</p>
                            <span className="text-sm font-bold bg-gray-50 text-gray-600 px-3 py-1 rounded-lg border border-gray-100">SL: {item.qty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Thông tin giao hàng</h3>
                    <input className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow" placeholder="Họ và tên người nhận" value={checkoutForm.name} onChange={e => setCheckoutForm(p => ({ ...p, name: e.target.value }))} />
                    <input type="tel" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow" placeholder="Số điện thoại liên hệ" value={checkoutForm.phone} onChange={e => setCheckoutForm(p => ({ ...p, phone: e.target.value }))} />
                    <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow resize-none h-24" placeholder="Địa chỉ giao hàng chi tiết (Số nhà, đường, phường/xã...)" value={checkoutForm.address} onChange={e => setCheckoutForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-500"><span>Tạm tính</span> <span className="font-medium text-gray-900">{formatCurrency(cartTotal)}</span></div>
                  <div className="flex justify-between text-sm text-gray-500"><span>Phí vận chuyển</span> <span className="font-medium text-gray-900">30.000 đ</span></div>
                  <div className="flex justify-between font-bold text-xl text-gray-900 pt-3 border-t border-gray-100"><span>Tổng thanh toán</span> <span>{formatCurrency(cartTotal + 30000)}</span></div>
                </div>
                
                <button
                  onClick={placeOrder}
                  disabled={!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 shadow-xl shadow-gray-900/20"
                >
                  Hoàn tất đặt hàng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
