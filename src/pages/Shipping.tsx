import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, OrderStatus } from "../types";
import { Truck, CheckCircle, Clock, MapPin, Search, RefreshCw, Package } from "lucide-react";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { formatCurrency, formatDate, formatNumber, generateId, now, today, truncate } from "../utils/helpers";

const CARRIERS = ["J&T Express", "GHN", "GHTK", "Viettel Post", "SPX Express", "Best Express", "Ninja Van"];

export default function Shipping() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadShippingOrders(); }, []);

  async function loadShippingOrders() {
    setLoading(true);
    const data = await db.orders
      .where("status")
      .anyOf(["processing", "shipping"])
      .reverse()
      .toArray();
    // Sort: shipping first, then processing
    data.sort((a, b) => {
      const order = ["shipping", "processing"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
    setOrders(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search
        || o.customerName.toLowerCase().includes(search.toLowerCase())
        || (o.tiktokOrderId || "").toLowerCase().includes(search.toLowerCase())
        || (o.trackingNumber || "").toLowerCase().includes(search.toLowerCase());
      const matchCarrier = selectedCarrier === "all" || o.shippingCarrier === selectedCarrier;
      return matchSearch && matchCarrier;
    });
  }, [orders, search, selectedCarrier]);

  const shippingCount = filtered.filter(o => o.status === "shipping").length;
  const processingCount = filtered.filter(o => o.status === "processing").length;

  const carrierGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    filtered.filter(o => o.status === "shipping").forEach(o => {
      const c = o.shippingCarrier || "Không xác định";
      groups[c] = (groups[c] || 0) + 1;
    });
    return groups;
  }, [filtered]);

  async function markDelivered(order: Order) {
    setUpdatingId(order.id);
    await db.orders.update(order.id, {
      status: "delivered",
      deliveredDate: today(),
      updatedAt: now(),
    });
    await loadShippingOrders();
    setUpdatingId(null);
  }

  async function markShipping(order: Order) {
    setUpdatingId(order.id);
    await db.orders.update(order.id, {
      status: "shipping",
      shippingDate: today(),
      updatedAt: now(),
    });
    await loadShippingOrders();
    setUpdatingId(null);
  }

  async function updateTracking(id: string, trackingNumber: string, carrier: string) {
    await db.orders.update(id, { trackingNumber, shippingCarrier: carrier, updatedAt: now() });
    await loadShippingOrders();
  }

  const getDaysInTransit = (order: Order): number => {
    const start = order.shippingDate ? new Date(order.shippingDate) : new Date(order.orderDate);
    const diff = Date.now() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number): string => {
    if (days >= 7) return "text-red-400 bg-red-900/20 border-red-800";
    if (days >= 4) return "text-amber-400 bg-amber-900/20 border-amber-800";
    return "text-emerald-400 bg-emerald-900/20 border-emerald-800";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Đơn đang giao hàng</h1>
          <p className="page-subtitle">Theo dõi tất cả đơn hàng đang trên đường giao đến khách</p>
        </div>
        <button onClick={loadShippingOrders} className="btn-secondary">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-purple-400" />
            <span className="text-gray-400 text-sm">Đang giao</span>
          </div>
          <p className="text-3xl font-bold text-white">{shippingCount}</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-blue-400" />
            <span className="text-gray-400 text-sm">Đang xử lý</span>
          </div>
          <p className="text-3xl font-bold text-white">{processingCount}</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-amber-400" />
            <span className="text-gray-400 text-sm">Tổng đơn</span>
          </div>
          <p className="text-3xl font-bold text-white">{filtered.length}</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-gray-400 text-sm">Giá trị đang giao</span>
          </div>
          <p className="text-lg font-bold text-white">{formatCurrency(filtered.filter(o => o.status === "shipping").reduce((s, o) => s + o.total, 0))}</p>
        </div>
      </div>

      {/* Carrier breakdown */}
      {Object.keys(carrierGroups).length > 0 && (
        <div className="card-sm">
          <p className="text-sm font-semibold text-gray-300 mb-3">Phân bổ theo đơn vị vận chuyển (đang giao)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(carrierGroups).map(([carrier, count]) => (
              <div key={carrier} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <Truck size={14} className="text-purple-400" />
                <span className="text-sm text-gray-300">{carrier}</span>
                <span className="bg-purple-600/30 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm khách, mã đơn, mã VĐ..." />
        <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)} className="input w-44">
          <option value="all">Tất cả đơn vị</option>
          {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Shipping orders */}
      {filtered.filter(o => o.status === "shipping").length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <Truck size={18} /> Đang giao hàng ({shippingCount})
          </h2>
          <div className="space-y-3">
            {filtered.filter(o => o.status === "shipping").map(order => {
              const days = getDaysInTransit(order);
              const urgency = getUrgencyColor(days);
              return (
                <div key={order.id} className="card-sm hover:border-purple-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-semibold text-white">{order.customerName}</span>
                        <span className="text-gray-500 text-xs">{order.customerPhone}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${urgency}`}>
                          {days === 0 ? "Hôm nay" : `${days} ngày`}
                        </span>
                        {days >= 7 && <span className="text-xs text-red-400 font-medium">⚠ Giao chậm</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>📦 {order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>Mã TikTok: <span className="text-gray-300 font-mono">{order.tiktokOrderId || "—"}</span></span>
                        <span>Mã VĐ: <span className="text-gray-300 font-mono">{order.trackingNumber || "—"}</span></span>
                        <span>ĐV: <span className="text-gray-300">{order.shippingCarrier || "—"}</span></span>
                        {order.shippingDate && <span>Gửi: <span className="text-gray-300">{formatDate(order.shippingDate)}</span></span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-white">{formatCurrency(order.total)}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDetail(order)} className="btn-secondary text-xs py-1.5">
                          Chi tiết
                        </button>
                        <button
                          onClick={() => markDelivered(order)}
                          disabled={updatingId === order.id}
                          className="btn-success text-xs py-1.5">
                          <CheckCircle size={14} />
                          {updatingId === order.id ? "..." : "Đã giao"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Processing orders */}
      {filtered.filter(o => o.status === "processing").length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Clock size={18} /> Đang xử lý / đóng gói ({processingCount})
          </h2>
          <div className="space-y-3">
            {filtered.filter(o => o.status === "processing").map(order => (
              <div key={order.id} className="card-sm hover:border-blue-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-semibold text-white">{order.customerName}</span>
                      <span className="text-gray-500 text-xs">{order.customerPhone}</span>
                      <span className="badge-blue">Đang xử lý</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {order.items.map(i => `${i.productName} (${i.variantInfo}) x${i.quantity}`).join(" | ")}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Mã TikTok: <span className="text-gray-300 font-mono">{order.tiktokOrderId || "—"}</span></span>
                      <span>Đặt: <span className="text-gray-300">{formatDate(order.orderDate)}</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-white">{formatCurrency(order.total)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDetail(order)} className="btn-secondary text-xs py-1.5">Chi tiết</button>
                      <button
                        onClick={() => markShipping(order)}
                        disabled={updatingId === order.id}
                        className="btn-primary text-xs py-1.5">
                        <Truck size={14} />
                        {updatingId === order.id ? "..." : "Giao đi"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <EmptyState icon={Truck} title="Không có đơn nào đang giao" description="Tất cả đơn hàng đã được xử lý hoặc chưa có đơn mới" />
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Chi tiết đơn đang giao" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="label">Khách hàng</p><p className="text-white font-medium">{showDetail.customerName}</p><p className="text-gray-400">{showDetail.customerPhone}</p></div>
              <div><p className="label">Trạng thái</p><p className="text-white">{showDetail.status === "shipping" ? "🚚 Đang giao" : "📦 Đang xử lý"}</p></div>
              <div><p className="label">Đơn vị vận chuyển</p><p className="text-white">{showDetail.shippingCarrier || "—"}</p></div>
              <div><p className="label">Mã vận đơn</p><p className="text-white font-mono">{showDetail.trackingNumber || "—"}</p></div>
              <div><p className="label">Ngày đặt</p><p className="text-white">{formatDate(showDetail.orderDate)}</p></div>
              {showDetail.shippingDate && <div><p className="label">Ngày gửi</p><p className="text-white">{formatDate(showDetail.shippingDate)}</p></div>}
            </div>
            <div>
              <p className="label mb-2">Sản phẩm</p>
              {showDetail.items.map((item, i) => (
                <div key={i} className="flex justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2">
                  <div>
                    <p className="text-white text-sm">{item.productName}</p>
                    <p className="text-gray-400 text-xs">{item.variantInfo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">x{item.quantity}</p>
                    <p className="text-gray-400 text-xs">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex justify-between">
              <span className="text-gray-400">Tổng thanh toán</span>
              <span className="font-bold text-rose-400">{formatCurrency(showDetail.total)}</span>
            </div>
            <div className="flex gap-3 pt-2">
              {showDetail.status === "processing" && (
                <button onClick={() => { markShipping(showDetail); setShowDetail(null); }} className="btn-primary flex-1">
                  <Truck size={16} /> Chuyển sang Đang giao
                </button>
              )}
              {showDetail.status === "shipping" && (
                <button onClick={() => { markDelivered(showDetail); setShowDetail(null); }} className="btn-success flex-1">
                  <CheckCircle size={16} /> Xác nhận Đã giao
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
