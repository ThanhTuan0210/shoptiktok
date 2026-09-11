import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant } from "../types";
import { ShoppingCart, Search, Home, PlaySquare, User, MessageCircle, Share2, ChevronLeft, X, CheckCircle, Zap, Star } from "lucide-react";
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
  
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    document.title = "TikTok Shop | Henr.Studio";
    async function load() {
      const allProds = await db.products.filter(p => p.isActive).toArray();
      // TikTok aesthetic images
      const fallbackImages = [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80", // Fashion 1
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80", // Fashion 2
        "https://images.unsplash.com/photo-1434389673259-22a466453b0e?w=600&q=80", // Fashion 3
        "https://images.unsplash.com/photo-1550614000-4b95d466f272?w=600&q=80", // Fashion 4
        "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80", // Fashion 5
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80", // Fashion 6
        "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=80", // Fashion 7
        "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=80"  // Fashion 8
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
      tiktokOrderId: "TT-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      status: "pending" as const,
      orderDate: today(),
      subtotal: cartTotal,
      shippingFee: 0, // Free shipping tiktok voucher
      total: cartTotal,
      shippingCarrier: "J&T Express",
      trackingNumber: "",
      note: "Khách đặt qua TikTok Shop",
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
        note: "Đơn Tiktok " + newOrder.tiktokOrderId,
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
    <div className="bg-[#f1f1f1] min-h-screen font-sans pb-[70px] text-[15px] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200 sm:shadow-2xl relative overflow-x-hidden">
      
      {/* Top Header - Search & Cart */}
      <div className="sticky top-0 z-30 bg-white px-3 py-2 flex items-center gap-3 shadow-sm">
        <div className="flex-1 bg-[#f1f1f1] h-9 rounded-md flex items-center px-3 text-gray-500">
          <Search size={18} />
          <input type="text" placeholder="Tìm kiếm trên TikTok Shop" className="bg-transparent border-none outline-none w-full ml-2 text-sm text-gray-800 placeholder-gray-500" />
        </div>
        <button onClick={() => setIsCheckoutOpen(true)} className="relative p-1">
          <ShoppingCart size={24} className="text-gray-800" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#fe2c55] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-center border-b border-gray-200 px-1">
        {['Dành cho bạn', 'Shop', 'Quần áo nữ', 'Mỹ phẩm'].map((tab, i) => (
          <button key={i} className={`flex-1 py-3 text-sm font-medium text-center whitespace-nowrap px-2 ${i === 1 ? 'text-[#fe2c55] border-b-2 border-[#fe2c55]' : 'text-gray-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Banner & Vouchers */}
      <div className="bg-white p-3 mb-2">
        <div className="w-full h-32 rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 relative overflow-hidden mb-3">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 p-4 h-full flex flex-col justify-center">
            <h2 className="text-white font-extrabold text-2xl italic tracking-wider">SALE<br/>SẬP SÀN</h2>
            <p className="text-white text-xs mt-1 bg-black/30 inline-block w-max px-2 py-0.5 rounded">Freeship mọi đơn</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2 min-w-[140px]">
              <div className="text-[#fe2c55]">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-[#fe2c55] font-bold text-xs leading-none">Giảm 50K</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Đơn tối thiểu 200K</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Feed (Masonry-ish) */}
      <div className="px-2 py-1 flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {products.filter((_, i) => i % 2 === 0).map(product => (
            <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {products.filter((_, i) => i % 2 !== 0).map(product => (
            <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto h-[60px] bg-white border-t border-gray-200 flex items-center justify-around z-40">
        <NavButton icon={<Home size={22} />} label="Trang chủ" />
        <NavButton icon={<PlaySquare size={22} />} label="Video" />
        <NavButton icon={<ShoppingCart size={22} />} label="Shop" active />
        <NavButton icon={<MessageCircle size={22} />} label="Hộp thư" />
        <NavButton icon={<User size={22} />} label="Hồ sơ" />
      </div>

      {/* Product Detail Full Screen View (TikTok Style) */}
      {selectedProduct && (
        <div className="fixed inset-0 sm:max-w-md sm:mx-auto z-50 bg-[#f1f1f1] flex flex-col overflow-y-auto animate-fade-in pb-20">
          <div className="absolute top-4 left-4 z-10 bg-black/40 text-white p-2 rounded-full cursor-pointer" onClick={() => {setSelectedProduct(null); setSelectedVariant(null)}}>
            <ChevronLeft size={24} />
          </div>
          <div className="absolute top-4 right-4 z-10 bg-black/40 text-white p-2 rounded-full cursor-pointer">
            <Share2 size={24} />
          </div>

          {/* Video/Image Area */}
          <div className="w-full aspect-[3/4] bg-gray-200 relative">
            <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">1/5</div>
          </div>

          {/* Product Info */}
          <div className="bg-white p-4 mb-2">
            <div className="flex items-center gap-2 text-[#fe2c55] font-bold text-2xl mb-2">
              <span>{formatCurrency(selectedProduct.sellingPrice)}</span>
            </div>
            <h1 className="text-gray-900 font-medium text-lg leading-snug mb-3">
              <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded mr-2 font-bold align-middle uppercase tracking-wider">Mall</span>
              {selectedProduct.name}
            </h1>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center text-amber-500">
                <Star size={12} fill="currentColor" />
                <span className="ml-1 text-gray-700 font-medium text-sm">4.9</span>
                <span className="mx-1 text-gray-300">|</span>
                <span>Đã bán 12.5k</span>
              </div>
              <span>Hà Nội</span>
            </div>
          </div>

          {/* Variants Selector */}
          <div className="bg-white p-4 mb-2">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Chọn phân loại</h3>
            <div className="flex flex-wrap gap-2">
              {variants.filter(v => v.productId === selectedProduct.id).map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 text-sm rounded-md border ${selectedVariant?.id === v.id ? 'border-[#fe2c55] text-[#fe2c55] bg-red-50 font-medium' : 'border-gray-200 text-gray-700 bg-gray-50'}`}
                >
                  {v.color} - {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Shop Profile */}
          <div className="bg-white p-4 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black text-white font-bold italic text-xl flex items-center justify-center rounded-full">H</div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Henr.Studio Official</h4>
                <p className="text-xs text-gray-500">99% Đánh giá tích cực</p>
              </div>
            </div>
            <button className="border border-[#fe2c55] text-[#fe2c55] px-4 py-1.5 rounded-full text-sm font-medium">Vào cửa hàng</button>
          </div>

          {/* Bottom Buy Bar */}
          <div className="fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-3 z-50">
            <div className="flex flex-col items-center justify-center text-gray-500 px-2" onClick={() => setIsCheckoutOpen(true)}>
              <div className="relative">
                <ShoppingCart size={22} />
                {cart.length > 0 && <span className="absolute -top-1 -right-2 bg-[#fe2c55] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
              </div>
              <span className="text-[10px] mt-1">Giỏ hàng</span>
            </div>
            <div className="flex-1 flex gap-2">
              <button 
                onClick={() => selectedVariant && addToCart(selectedProduct, selectedVariant)}
                className="flex-1 bg-[#ffecd8] text-[#ff8000] font-bold py-2.5 rounded-full text-sm"
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
                className="flex-1 bg-[#fe2c55] text-white font-bold py-2.5 rounded-full text-sm shadow-lg shadow-red-200"
              >
                Mua với voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sidebar / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] bg-white sm:max-w-md sm:mx-auto flex flex-col overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-900">Giỏ Hàng / Thanh toán</h2>
            <button onClick={() => setIsCheckoutOpen(false)} className="p-1"><X size={24} /></button>
          </div>
          
          <div className="flex-1 p-4 bg-[#f8f8f8]">
            {checkoutSuccess ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                <CheckCircle size={64} className="mx-auto text-[#20d540] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
                <p className="text-sm text-gray-500 mb-6 px-4">Shop sẽ đóng gói và giao cho đơn vị vận chuyển J&T Express.</p>
                <button onClick={() => { setIsCheckoutOpen(false); setCheckoutSuccess(false); }} className="px-8 py-2 bg-[#fe2c55] text-white rounded-full font-medium text-sm">Về trang chủ</button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Mall</span>
                    <span className="font-bold text-sm">Henr.Studio</span>
                  </div>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                      <img src={item.product.imageUrl} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm text-gray-900 leading-tight line-clamp-2">{item.product.name}</h4>
                          <p className="text-[11px] text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">{item.variant.color}, {item.variant.size}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-[#fe2c55] text-sm">{formatCurrency(item.product.sellingPrice)}</p>
                          <span className="text-xs text-gray-600 font-medium">x{item.qty}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Địa chỉ nhận hàng</h3>
                  <input className="w-full text-sm px-3 py-2.5 bg-[#f8f8f8] rounded-lg mb-2 outline-none focus:ring-1 focus:ring-[#fe2c55]" placeholder="Họ và tên" value={checkoutForm.name} onChange={e => setCheckoutForm(p => ({...p, name: e.target.value}))} />
                  <input type="tel" className="w-full text-sm px-3 py-2.5 bg-[#f8f8f8] rounded-lg mb-2 outline-none focus:ring-1 focus:ring-[#fe2c55]" placeholder="Số điện thoại" value={checkoutForm.phone} onChange={e => setCheckoutForm(p => ({...p, phone: e.target.value}))} />
                  <textarea className="w-full text-sm px-3 py-2.5 bg-[#f8f8f8] rounded-lg outline-none focus:ring-1 focus:ring-[#fe2c55] resize-none h-16" placeholder="Địa chỉ chi tiết (Tòa nhà, số nhà, ngõ...)" value={checkoutForm.address} onChange={e => setCheckoutForm(p => ({...p, address: e.target.value}))} />
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tổng tiền hàng</span><span>{formatCurrency(cartTotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Phí vận chuyển</span><span className="line-through text-gray-400">30.000đ</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Voucher từ TikTok Shop</span><span className="text-[#fe2c55]">-30.000đ</span></div>
                </div>
              </>
            )}
          </div>

          {!checkoutSuccess && cart.length > 0 && (
            <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
              <div>
                <p className="text-[11px] text-gray-500">Tổng thanh toán</p>
                <p className="font-bold text-[#fe2c55] text-lg leading-none">{formatCurrency(cartTotal)}</p>
              </div>
              <button
                onClick={placeOrder}
                disabled={!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
                className="px-8 py-2.5 bg-[#fe2c55] text-white rounded-full font-bold text-sm shadow-md shadow-red-200 disabled:opacity-50"
              >
                Đặt hàng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product, onClick: () => void }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm" onClick={onClick}>
      <div className="relative aspect-[4/5] bg-gray-100">
        <img src={product.imageUrl} className="w-full h-full object-cover" />
        {product.sellingPrice < 300000 && (
          <div className="absolute top-0 left-0 bg-[#fe2c55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
            Rẻ vô địch
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-[13px] text-gray-800 leading-tight line-clamp-2 mb-1.5 h-[34px]">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-1">
          <span className="bg-red-100 text-[#fe2c55] text-[9px] px-1 font-bold rounded">FREESHIP</span>
          <span className="bg-orange-100 text-orange-600 text-[9px] px-1 font-bold rounded">VOUCHER</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#fe2c55] font-bold text-sm">{formatCurrency(product.sellingPrice)}</span>
            <p className="text-[10px] text-gray-400 mt-0.5">Đã bán {Math.floor(Math.random() * 900) + 100}</p>
          </div>
          <button className="w-6 h-6 bg-[#fe2c55] rounded-full flex items-center justify-center text-white">
            <ShoppingCart size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${active ? 'text-black' : 'text-gray-400'}`}>
      {icon}
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </div>
  );
}
