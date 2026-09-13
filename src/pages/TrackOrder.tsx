import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Order } from "../types";
import { Search, Package, CheckCircle, Truck, Clock, XCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "../utils/helpers";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:          { label: "Chờ xác nhận",    color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: <Clock size={14} /> },
  processing:       { label: "Đang chuẩn bị",   color: "bg-blue-50 text-blue-700 border-blue-200",        icon: <Package size={14} /> },
  shipping:         { label: "Đang giao hàng",   color: "bg-purple-50 text-purple-700 border-purple-200",  icon: <Truck size={14} /> },
  delivered:        { label: "Đã giao thành công", color: "bg-green-50 text-green-700 border-green-200",  icon: <CheckCircle size={14} /> },
  cancelled:        { label: "Đã huỷ",           color: "bg-gray-50 text-gray-500 border-gray-200",        icon: <XCircle size={14} /> },
  return_requested: { label: "Yêu cầu hoàn trả", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <ArrowLeft size={14} /> },
  returned:         { label: "Đã hoàn trả",      color: "bg-red-50 text-red-600 border-red-200",           icon: <ArrowLeft size={14} /> },
};

const STEPS = ["Chờ xác nhận", "Đang chuẩn bị", "Đang giao hàng", "Đã nhận hàng"];
const STEP_STATUS: Record<string, number> = {
  pending: 0, processing: 1, shipping: 2, delivered: 3,
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shopName = localStorage.getItem("tt_shopName") || "Henr.Studio";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    const found = await db.orders
      .filter(o => o.customerPhone.replace(/\s/g, "").includes(phone.replace(/\s/g, "")))
      .reverse()
      .toArray();
    setOrders(found);
    setSearched(true);
    setLoading(false);
    if (found.length > 0) setExpandedId(found[0].id);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate("/shop")} className="flex items-center gap-2 text-gray-600 hover:text-[#fe2c55] transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Về cửa hàng</span>
          </button>
          <div className="flex items-center gap-2 mx-auto">
            <div className="w-7 h-7 bg-black text-white font-bold italic flex items-center justify-center rounded-lg text-sm">{shopName.charAt(0)}</div>
            <span className="font-bold text-gray-900">{shopName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#fe2c55]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-[#fe2c55]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tra cứu đơn hàng</h1>
          <p className="text-sm text-gray-500">Nhập số điện thoại đã đặt hàng để kiểm tra trạng thái</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại đặt hàng</label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912 345 678"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-[#fe2c55] outline-none text-sm font-medium"
            />
            <button type="submit" disabled={loading || !phone.trim()}
              className="bg-[#fe2c55] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#e62045] transition-colors disabled:opacity-50 flex items-center gap-2">
              <Search size={18} />
              {loading ? "..." : "Tìm"}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-gray-700 mb-1">Không tìm thấy đơn hàng</p>
              <p className="text-sm text-gray-500">Số điện thoại <strong>{phone}</strong> chưa có đơn hàng nào.</p>
              <p className="text-sm text-gray-400 mt-2">Nếu cần hỗ trợ, vui lòng liên hệ shop.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Tìm thấy <strong className="text-gray-900">{orders.length}</strong> đơn hàng</p>
              {orders.map(order => {
                const isExpanded = expandedId === order.id;
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const stepIdx = STEP_STATUS[order.status] ?? -1;
                const isCancelled = order.status === "cancelled" || order.status === "returned" || order.status === "return_requested";
                const payMethod = (order as any).paymentMethod || "cod";

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-gray-900 text-sm">{order.tiktokOrderId}</span>
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{order.orderDate} • {formatCurrency(order.total)}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {/* Order Detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 pb-5">
                        {/* Progress Steps — chỉ hiện khi đơn không bị huỷ */}
                        {!isCancelled && (
                          <div className="py-5">
                            <div className="flex items-center">
                              {STEPS.map((step, i) => (
                                <div key={i} className="flex-1 flex items-center">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                      i <= stepIdx ? 'bg-[#fe2c55] border-[#fe2c55] text-white' : 'bg-white border-gray-200 text-gray-400'
                                    }`}>
                                      {i < stepIdx ? <CheckCircle size={16} /> : i + 1}
                                    </div>
                                    <span className={`text-[10px] mt-1 text-center w-16 leading-tight font-medium ${i <= stepIdx ? 'text-[#fe2c55]' : 'text-gray-400'}`}>{step}</span>
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < stepIdx ? 'bg-[#fe2c55]' : 'bg-gray-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-3">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sản phẩm</p>
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium text-gray-900">{item.productName}</span>
                                  <span className="text-gray-500 text-xs ml-2">{item.variantName} × {item.quantity}</span>
                                </div>
                                <span className="font-bold text-gray-900 shrink-0 ml-2">{formatCurrency(item.unitPrice * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-1.5 text-sm mb-3">
                          <div className="flex justify-between text-gray-600">
                            <span>Phí vận chuyển</span>
                            <span className="font-medium text-green-600">Miễn phí</span>
                          </div>
                          <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                            <span className="text-gray-900">Tổng cộng</span>
                            <span className="text-[#fe2c55]">{formatCurrency(order.total)}</span>
                          </div>
                        </div>

                        {/* Payment & Shipping Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-400 font-bold uppercase mb-1">Thanh toán</p>
                            <p className="font-bold text-gray-900">
                              {payMethod === "bank_transfer" ? "Chuyển khoản" : "Thanh toán khi nhận"}
                            </p>
                            {payMethod === "cod" && <p className="text-gray-500 mt-0.5">Trả tiền mặt cho shipper</p>}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-400 font-bold uppercase mb-1">Giao hàng</p>
                            <p className="font-bold text-gray-900">{order.shippingCarrier || "GHTK"}</p>
                            {order.trackingNumber && <p className="text-gray-500 font-mono text-[10px] mt-0.5">{order.trackingNumber}</p>}
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="mt-3 p-3 bg-[#fe2c55]/5 border border-[#fe2c55]/10 rounded-xl text-center">
                          <p className="text-xs text-gray-600">Cần hỗ trợ? Liên hệ {shopName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}
