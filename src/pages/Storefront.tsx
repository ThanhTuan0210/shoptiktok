import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant } from "../types";
import { ShoppingCart, Search, X, CheckCircle, Zap, Star, ShieldCheck, Truck } from "lucide-react";
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
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    document.title = "Shop | Henr.Studio";
    async function load() {
      const allProds = await db.products.filter(p => p.isActive).toArray();
      const fallbackImages = [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
        "https://images.unsplash.com/photo-1434389673259-22a466453b0e?w=600&q=80",
        "https://images.unsplash.com/photo-1550614000-4b95d466f272?w=600&q=80",
        "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80",
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80",
        "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=80",
        "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=80"
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
    setIsCheckoutOpen(true);
  };

  const placeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) return;
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
        id: generateId(),
        productId: item.productId,
        variantId: item.variantId,
        type: "sale",
        quantity: -item.qty,
        note: "Đơn Web " + newOrder.tiktokOrderId,
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
    <div className="bg-[#f5f5f5] min-h-screen font-sans pb-10">
      
      {/* PC & Mobile Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer shrink-0">
            <div className="w-8 h-8 bg-black text-white font-bold text-xl italic flex items-center justify-center rounded-lg">H</div>
            <span className="font-bold text-xl text-gray-900 hidden md:block">Henr.Studio</span>
          </div>

          <div className="flex-1 max-w-2xl bg-[#f1f1f1] h-10 rounded-full flex items-center px-4 border border-transparent focus-within:border-[#fe2c55] focus-within:bg-white transition-colors">
            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="bg-transparent border-none outline-none w-full text-sm text-gray-800" />
            <button className="text-[#fe2c55] font-bold text-sm px-2">Tìm kiếm</button>
          </div>

          <button onClick={() => setIsCheckoutOpen(true)} className="relative p-2 shrink-0 flex items-center gap-2 text-gray-700 hover:text-[#fe2c55] transition-colors">
            <div className="relative">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#fe2c55] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </div>
            <span className="hidden md:block font-medium">Giỏ hàng</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Banner Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 h-48 md:h-64 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 relative overflow-hidden shadow-sm flex items-center p-8">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 text-white">
              <span className="bg-black/30 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">Chương trình đặc biệt</span>
              <h2 className="font-extrabold text-3xl md:text-5xl italic mb-2">SALE SẬP SÀN</h2>
              <p className="text-lg md:text-xl opacity-90">Miễn phí vận chuyển toàn quốc</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#fe2c55] flex items-center justify-center shrink-0"><Zap size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-900">Flash Sale</h3>
                <p className="text-sm text-gray-500">Giảm giá chớp nhoáng mỗi ngày</p>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-900">Mall Chính Hãng</h3>
                <p className="text-sm text-gray-500">Cam kết chất lượng 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid - Responsive */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Gợi ý hôm nay</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {products.map(product => (
            <div key={product.id} onClick={() => setSelectedProduct(product)} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-transparent hover:border-[#fe2c55]/30 flex flex-col">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-0 left-0 bg-[#fe2c55] text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-10 shadow-sm">
                  Mall
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-[13px] md:text-sm text-gray-800 leading-tight line-clamp-2 h-10 mb-2 group-hover:text-[#fe2c55] transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  <span className="border border-[#fe2c55] text-[#fe2c55] text-[9px] px-1 font-bold rounded">FREESHIP</span>
                  <span className="bg-red-50 text-[#fe2c55] text-[9px] px-1 font-bold rounded">VOUCHER</span>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <span className="text-[#fe2c55] font-bold text-base md:text-lg">{formatCurrency(product.sellingPrice)}</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Đã bán {Math.floor(Math.random() * 900) + 100}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Product Detail Modal (Responsive) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => {setSelectedProduct(null); setSelectedVariant(null)}}>
          <div className="bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl flex flex-col md:flex-row overflow-hidden relative" onClick={e => e.stopPropagation()}>
            
            <button onClick={() => {setSelectedProduct(null); setSelectedVariant(null)}} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-gray-800 transition-colors">
              <X size={20} />
            </button>

            {/* Image Side */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-full bg-gray-100 relative shrink-0">
              <img src={selectedProduct.imageUrl} className="w-full h-full object-cover absolute inset-0" />
            </div>

            {/* Info Side */}
            <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#fe2c55] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Mall</span>
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Henr.Studio</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-snug mb-3">
                {selectedProduct.name}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center text-[#fe2c55]">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <span className="ml-1 font-medium">4.9</span>
                </div>
                <span>|</span>
                <span>Đã bán 1.2k</span>
              </div>

              <div className="text-3xl font-bold text-[#fe2c55] mb-6">
                {formatCurrency(selectedProduct.sellingPrice)}
              </div>

              <div className="mb-6 flex-1">
                <p className="text-sm text-gray-700 font-medium mb-3">Chọn phân loại:</p>
                <div className="flex flex-wrap gap-2">
                  {variants.filter(v => v.productId === selectedProduct.id).map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all ${selectedVariant?.id === v.id ? 'border-[#fe2c55] text-[#fe2c55] bg-red-50 font-bold ring-1 ring-[#fe2c55]' : 'border-gray-200 text-gray-700 hover:border-[#fe2c55] hover:text-[#fe2c55]'}`}
                    >
                      {v.color} - {v.size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => selectedVariant && addToCart(selectedProduct, selectedVariant)}
                  className="flex-1 bg-[#ffecd8] hover:bg-[#ffe0c2] text-[#ff8000] font-bold py-3.5 rounded-xl transition-colors"
                >
                  Thêm vào giỏ
                </button>
                <button 
                  onClick={() => {
                    if(selectedVariant) {
                      addToCart(selectedProduct, selectedVariant);
                      setSelectedProduct(null);
                      setIsCheckoutOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-colors"
                >
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sidebar */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCheckoutOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={20} /> Giỏ hàng của bạn</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-[#f9f9f9]">
              {checkoutSuccess ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <CheckCircle size={64} className="mx-auto text-[#20d540] mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
                  <p className="text-sm text-gray-500 mb-6 px-4">Đơn hàng đã được ghi nhận. Vui lòng kiểm tra điện thoại thường xuyên nhé.</p>
                  <button onClick={() => { setIsCheckoutOpen(false); setCheckoutSuccess(false); }} className="px-8 py-2.5 bg-[#fe2c55] hover:bg-[#e62045] text-white rounded-full font-medium text-sm transition-colors">Tiếp tục mua sắm</button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Giỏ hàng trống</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                      <StoreBadge />
                      <span className="font-bold text-sm">Henr.Studio Official</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <img src={item.product.imageUrl} className="w-20 h-20 object-cover rounded-md border border-gray-100" />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm text-gray-900 leading-tight line-clamp-2">{item.product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">Phân loại: {item.variant.color}, {item.variant.size}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-bold text-[#fe2c55] text-sm">{formatCurrency(item.product.sellingPrice)}</p>
                              <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded">SL: {item.qty}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Thông tin giao hàng</h3>
                    <input className="w-full text-sm px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none transition-colors" placeholder="Họ và tên người nhận" value={checkoutForm.name} onChange={e => setCheckoutForm(p => ({...p, name: e.target.value}))} />
                    <input type="tel" className="w-full text-sm px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg mb-3 outline-none transition-colors" placeholder="Số điện thoại" value={checkoutForm.phone} onChange={e => setCheckoutForm(p => ({...p, phone: e.target.value}))} />
                    <textarea className="w-full text-sm px-4 py-3 bg-white border border-gray-200 focus:border-[#fe2c55] rounded-lg outline-none transition-colors resize-none h-20" placeholder="Địa chỉ chi tiết (Số nhà, đường...)" value={checkoutForm.address} onChange={e => setCheckoutForm(p => ({...p, address: e.target.value}))} />
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Tạm tính</span><span className="font-medium">{formatCurrency(cartTotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Phí vận chuyển</span><span className="font-medium text-green-600">Miễn phí</span></div>
                  </div>
                </>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">Tổng thanh toán:</span>
                  <span className="font-bold text-[#fe2c55] text-2xl">{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
                  className="w-full py-3.5 bg-[#fe2c55] hover:bg-[#e62045] text-white rounded-xl font-bold text-base shadow-lg shadow-red-200 disabled:opacity-50 transition-colors"
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

function StoreBadge() {
  return <span className="bg-[#fe2c55] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Mall</span>;
}
