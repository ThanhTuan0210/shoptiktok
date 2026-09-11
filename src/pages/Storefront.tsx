import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant } from "../types";
import { ShoppingBag, X, CheckCircle, ChevronRight, Plus, Minus, ArrowRight } from "lucide-react";
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
      setProducts(await db.products.filter(p => p.isActive).toArray());
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
      tiktokOrderId: `WEB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
        variantName: `${item.variant.color} - ${item.variant.size}`,
        sku: item.variant.sku,
        quantity: item.qty,
        unitPrice: item.product.sellingPrice,
      }))
    };

    await db.orders.add(newOrder);
    
    // Auto-create stock movements for pending order
    for (const item of cart) {
      await db.stockMovements.add({
        id: generateId(),
        productId: item.productId,
        variantId: item.variantId,
        type: "sale",
        quantity: -item.qty,
        note: `Đơn web ${newOrder.tiktokOrderId}`,
        date: today(),
        createdAt: now(),
      });
      const v = await db.productVariants.get(item.variantId);
      if (v) {
        await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.qty) });
      }
    }

    setCart([]);
    setCheckoutSuccess(true);
  };

  return (
    <div className="min-h-screen bg-rose-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-rose-900" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Henr.Studio</span>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-rose-900 hover:bg-rose-100 rounded-full transition-colors">
            <ShoppingBag size={24} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-rose-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-rose-900 text-rose-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Bộ Sưu Tập Đồ Ngủ Cao Cấp</h1>
          <p className="text-lg md:text-xl text-rose-200 max-w-2xl mx-auto">Tận hưởng giấc ngủ trọn vẹn với những chất liệu lụa satin mềm mại, thoáng mát nhất từ Henr.Studio.</p>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-2">Sản phẩm nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-rose-600">Mới</div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{product.category}</p>
                <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                <p className="font-bold text-rose-600 text-lg">{formatCurrency(product.sellingPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-gray-100">
              {selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />}
            </div>
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-rose-600 font-semibold text-sm uppercase">{selectedProduct.category}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{selectedProduct.name}</h2>
                </div>
                <button onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-6">{formatCurrency(selectedProduct.sellingPrice)}</p>
              
              <div className="mb-6 flex-1">
                <p className="font-medium text-gray-900 mb-3">Chọn Màu sắc & Size:</p>
                <div className="grid grid-cols-2 gap-2">
                  {variants.filter(v => v.productId === selectedProduct.id).map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2 text-sm border rounded-lg text-left transition-colors ${selectedVariant?.id === v.id ? 'border-rose-600 bg-rose-50 text-rose-900 ring-1 ring-rose-600' : 'border-gray-200 hover:border-rose-300 text-gray-700'}`}
                    >
                      <span className="block font-medium">{v.color}</span>
                      <span className="text-xs text-gray-500">Size: {v.size} {v.stock < 5 && <span className="text-rose-500 font-medium">(Còn {v.stock})</span>}</span>
                    </button>
                  ))}
                </div>
                {!selectedVariant && <p className="text-sm text-amber-600 mt-3">Vui lòng chọn 1 phân loại để mua hàng</p>}
              </div>
              
              <button
                disabled={!selectedVariant}
                onClick={() => selectedVariant && addToCart(selectedProduct, selectedVariant)}
                className="w-full py-4 bg-rose-900 hover:bg-rose-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
              >
                <ShoppingBag size={20} /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in" style={{ animationDirection: 'reverse' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Giỏ hàng của bạn</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {checkoutSuccess ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
                  <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua sắm tại Henr.Studio. Đơn hàng của bạn sẽ sớm được giao.</p>
                  <button onClick={() => { setIsCartOpen(false); setCheckoutSuccess(false); }} className="px-6 py-2 bg-rose-900 text-white rounded-lg font-medium">Tiếp tục mua sắm</button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>Giỏ hàng đang trống</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <img src={item.product.imageUrl} className="w-20 h-20 object-cover rounded-lg bg-white" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.product.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.variant.color} - Size {item.variant.size}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-rose-600">{formatCurrency(item.product.sellingPrice)}</p>
                            <span className="text-sm font-medium bg-white px-2 py-1 rounded border shadow-sm">x{item.qty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h3 className="font-bold text-gray-900">Thông tin giao hàng</h3>
                    <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Họ và tên người nhận *" value={checkoutForm.name} onChange={e => setCheckoutForm(p => ({ ...p, name: e.target.value }))} />
                    <input type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Số điện thoại *" value={checkoutForm.phone} onChange={e => setCheckoutForm(p => ({ ...p, phone: e.target.value }))} />
                    <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24" placeholder="Địa chỉ giao hàng chi tiết *" value={checkoutForm.address} onChange={e => setCheckoutForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Tạm tính:</span> <span>{formatCurrency(cartTotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 mb-4"><span>Phí vận chuyển:</span> <span>30.000 đ</span></div>
                <div className="flex justify-between font-bold text-lg text-gray-900 mb-4"><span>Tổng cộng:</span> <span>{formatCurrency(cartTotal + 30000)}</span></div>
                
                <button
                  onClick={placeOrder}
                  disabled={!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
                  className="w-full py-4 bg-rose-900 hover:bg-rose-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  Đặt hàng ngay <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}