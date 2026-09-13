import { useState, useEffect } from "react";
import { db } from "../db/database";
import type { Order } from "../types";
import {
  Search, Package, CheckCircle, Truck, Clock, XCircle, ArrowLeft,
  ChevronDown, ChevronUp, Phone, MessageSquare, ShieldCheck
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/helpers";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; desc: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Chờ xác nhận",
    desc: "Đơn hàng đã được tạo thành công. Nhân viên shop đang chuẩn bị gọi điện xác nhận đơn cho bạn.",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon: <Clock size={14} />
  },
  processing: {
    label: "Đang chuẩn bị",
    desc: "Shop đã duyệt đơn và đang đóng gói sản phẩm cẩn thận để bàn giao cho shipper.",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: <Package size={14} />
  },
  shipping: {
    label: "Đang giao hàng",
    desc: "Bưu kiện đã được bàn giao cho bưu tá và đang trên đường vận chuyển đến địa chỉ của bạn.",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: <Truck size={14} />
  },
  delivered: {
    label: "Giao thành công",
    desc: "Đơn hàng đã giao thành công. Cảm ơn bạn đã lựa chọn mua sắm tại cửa hàng!",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle size={14} />
  },
  cancelled: {
    label: "Đã huỷ đơn",
    desc: "Đơn hàng đã được huỷ. Mọi khoản tiền (nếu chuyển khoản) sẽ được hoàn trả theo quy định.",
    color: "bg-gray-800 text-gray-400 border-gray-700",
    icon: <XCircle size={14} />
  },
  return_requested: {
    label: "Yêu cầu đổi trả",
    desc: "Hệ thống đã nhận yêu cầu đổi trả của bạn. Shop sẽ liên hệ hỗ trợ trong vòng 24h.",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: <ArrowLeft size={14} />
  },
  returned: {
    label: "Đã hoàn trả",
    desc: "Kiện hàng đã được hoàn trả về kho shop hoàn tất.",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: <ArrowLeft size={14} />
  },
};

const STEPS = ["Chờ duyệt", "Đang đóng gói", "Đang giao hàng", "Đã nhận hàng"];
const STEP_STATUS: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipping: 2,
  delivered: 3,
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shopName = localStorage.getItem("tt_shopName") || "Henr.Studio";
  const hotline = localStorage.getItem("tt_shopPhone") || "0988 234 567";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setLoading(true);

    // Normalize: strip non-alphanumeric, convert +84 to 0
    let cleanDigits = cleanQuery.replace(/\D/g, "");
    if (cleanDigits.startsWith("84")) {
      cleanDigits = "0" + cleanDigits.slice(2);
    }

    const allOrders = await db.orders.reverse().toArray();
    const found = allOrders.filter(o => {
      // Match by order code (e.g. WEB-1234ABCD or TT12345678)
      const orderCode = (o.tiktokOrderId || "").toUpperCase();
      if (orderCode.includes(cleanQuery.toUpperCase())) return true;

      // Match by phone number
      const orderPhone = (o.customerPhone || "").replace(/\D/g, "");
      if (cleanDigits.length >= 7 && (orderPhone.includes(cleanDigits) || cleanDigits.includes(orderPhone))) {
        return true;
      }

      return false;
    });

    setOrders(found);
    setSearched(true);
    setLoading(false);
    if (found.length > 0) setExpandedId(found[0].id);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-2 text-gray-700 hover:text-[#fe2c55] font-medium text-sm transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Về cửa hàng</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white font-bold italic flex items-center justify-center rounded-lg text-sm">
              {shopName.charAt(0)}
            </div>
            <span className="font-bold text-gray-900">{shopName}</span>
          </div>
          <a
            href={`tel:${hotline.replace(/\s/g, "")}`}
            className="text-xs font-semibold text-[#fe2c55] flex items-center gap-1 hover:underline"
          >
            <Phone size={13} /> {hotline}
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-[#fe2c55] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tra cứu hành trình đơn hàng</h1>
          <p className="text-sm text-gray-500">
            Nhập <strong>Số điện thoại</strong> hoặc <strong>Mã đơn hàng (WEB-... / TT...)</strong> để kiểm tra
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Số điện thoại nhận hàng hoặc Mã đơn hàng
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="VD: 0912345678 hoặc WEB-A1B2C3D4"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:border-[#fe2c55] outline-none text-sm font-medium transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-[#fe2c55] hover:bg-[#e62045] text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md shadow-red-200"
            >
              <Search size={16} />
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-gray-800 text-base mb-1">Không tìm thấy đơn hàng nào</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Không có đơn hàng nào khớp với "<strong>{query}</strong>". Vui lòng kiểm tra lại số điện thoại hoặc mã đơn.
              </p>
              <div className="mt-5 p-3.5 bg-gray-50 rounded-xl max-w-sm mx-auto text-xs text-gray-600">
                Cần trợ giúp? Hotline shop: <strong className="text-gray-900">{hotline}</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                <span>Tìm thấy <strong className="text-gray-900">{orders.length}</strong> đơn hàng</span>
                <span className="text-xs text-gray-400">Click vào đơn để xem chi tiết</span>
              </div>

              {orders.map(order => {
                const isExpanded = expandedId === order.id;
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const stepIdx = STEP_STATUS[order.status] ?? -1;
                const isCancelled = order.status === "cancelled" || order.status === "returned" || order.status === "return_requested";
                const payMethod = (order as any).paymentMethod || "cod";

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                    {/* Order summary header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <span className="font-mono font-bold text-gray-900 text-sm tracking-wide">
                            {order.tiktokOrderId || `ORDER-${order.id.slice(-8)}`}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Ngày đặt: {formatDate(order.orderDate)} • Người nhận: <strong className="text-gray-700">{order.customerName}</strong> • {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div className="text-gray-400 shrink-0 ml-3">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 pb-5 pt-3">
                        {/* Status Description Box */}
                        <div className="p-3.5 bg-gray-50 rounded-xl mb-4 text-xs text-gray-700 leading-relaxed border border-gray-100 flex items-start gap-2.5">
                          <div className="text-[#fe2c55] mt-0.5 shrink-0">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs mb-0.5">{statusCfg.label}</p>
                            <p>{statusCfg.desc}</p>
                          </div>
                        </div>

                        {/* Progress Stepper (if not cancelled) */}
                        {!isCancelled && (
                          <div className="py-4 px-2 mb-4 bg-white border border-gray-100 rounded-xl">
                            <div className="flex items-center">
                              {STEPS.map((step, i) => (
                                <div key={i} className="flex-1 flex items-center">
                                  <div className="flex flex-col items-center mx-auto">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                        i <= stepIdx
                                          ? "bg-[#fe2c55] border-[#fe2c55] text-white shadow-sm"
                                          : "bg-white border-gray-200 text-gray-400"
                                      }`}
                                    >
                                      {i < stepIdx ? <CheckCircle size={15} /> : i + 1}
                                    </div>
                                    <span
                                      className={`text-[11px] mt-1.5 text-center font-medium leading-tight ${
                                        i <= stepIdx ? "text-[#fe2c55] font-bold" : "text-gray-400"
                                      }`}
                                    >
                                      {step}
                                    </span>
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div
                                      className={`flex-1 h-0.5 mb-5 ${
                                        i < stepIdx ? "bg-[#fe2c55]" : "bg-gray-200"
                                      }`}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items ordered */}
                        <div className="bg-gray-50 rounded-xl p-3.5 mb-3 border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Sản phẩm trong kiện hàng
                          </p>
                          <div className="space-y-2">
                            {order.items?.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs items-center py-1 border-b border-gray-200/50 last:border-b-0">
                                <div>
                                  <p className="font-semibold text-gray-900">{it.productName}</p>
                                  <p className="text-gray-500 text-[11px]">
                                    {it.variantInfo || (it as any).variantName || "Phân loại tiêu chuẩn"} × {it.quantity}
                                  </p>
                                </div>
                                <span className="font-bold text-gray-900 ml-3">
                                  {formatCurrency(it.unitPrice * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping & Payment Meta */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">Phương thức thanh toán</p>
                            <p className="font-bold text-gray-900">
                              {payMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận (COD)"}
                            </p>
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              {payMethod === "bank_transfer" ? "Đã xác nhận theo mã chuyển khoản" : "Khách chuẩn bị tiền mặt khi nhận"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">Đơn vị vận chuyển</p>
                            <p className="font-bold text-gray-900">{order.shippingCarrier || "GHTK Express"}</p>
                            <p className="text-gray-500 font-mono text-[11px] mt-0.5">
                              Mã VĐ: {order.trackingNumber || "Đang tạo mã vận đơn"}
                            </p>
                          </div>
                        </div>

                        {/* Delivery address */}
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs mb-3">
                          <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">Địa chỉ giao hàng</p>
                          <p className="font-medium text-gray-900">{order.customerAddress || "Chưa cung cấp địa chỉ chi tiết"}</p>
                        </div>

                        {/* Total payment */}
                        <div className="bg-red-50/60 border border-red-100 rounded-xl p-3.5 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">Tổng thanh toán:</span>
                          <span className="text-lg font-extrabold text-[#fe2c55]">{formatCurrency(order.total)}</span>
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
