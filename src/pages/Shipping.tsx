import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, OrderStatus } from "../types";
import {
  Truck, CheckCircle, Clock, MapPin, Search, RefreshCw, Package,
  AlertTriangle, ArrowRight, Check
} from "lucide-react";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import {
  formatCurrency, formatDate, formatNumber, generateId, now, today, truncate
} from "../utils/helpers";

const CARRIERS = ["GHTK", "GHN", "J&T Express", "Viettel Post", "SPX Express", "Ninja Van"];

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
      .anyOf(["pending", "processing", "shipping"])
      .reverse()
      .toArray();

    data.sort((a, b) => {
      const orderMap = { pending: 0, processing: 1, shipping: 2 };
      return (orderMap[a.status as keyof typeof orderMap] ?? 3) - (orderMap[b.status as keyof typeof orderMap] ?? 3);
    });
    setOrders(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || o.customerName.toLowerCase().includes(q)
        || (o.tiktokOrderId || "").toLowerCase().includes(q)
        || (o.customerPhone || "").includes(search)
        || (o.trackingNumber || "").toLowerCase().includes(q);
      const matchCarrier = selectedCarrier === "all" || o.shippingCarrier === selectedCarrier;
      return matchSearch && matchCarrier;
    });
  }, [orders, search, selectedCarrier]);

  const pendingOrders = filtered.filter(o => o.status === "pending");
  const processingOrders = filtered.filter(o => o.status === "processing");
  const shippingOrders = filtered.filter(o => o.status === "shipping");

  const carrierGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    shippingOrders.forEach(o => {
      const c = o.shippingCarrier || "Chưa chọn";
      groups[c] = (groups[c] || 0) + 1;
    });
    return groups;
  }, [shippingOrders]);

  async function moveToProcessing(order: Order) {
    setUpdatingId(order.id);
    await db.orders.update(order.id, {
      status: "processing",
      updatedAt: now(),
    });
    await loadShippingOrders();
    setUpdatingId(null);
  }

  async function markShipping(order: Order) {
    setUpdatingId(order.id);
    const defaultCarrier = order.shippingCarrier || "GHTK";
    const tracking = order.trackingNumber || `${defaultCarrier.slice(0, 3).toUpperCase()}${Math.floor(100000000 + Math.random() * 900000000)}`;
    await db.orders.update(order.id, {
      status: "shipping",
      shippingCarrier: defaultCarrier,
      trackingNumber: tracking,
      shippingDate: today(),
      updatedAt: now(),
    });
    await loadShippingOrders();
    setUpdatingId(null);
  }

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

  const getDaysInTransit = (order: Order): number => {
    const start = order.shippingDate ? new Date(order.shippingDate) : new Date(order.orderDate);
    const diff = Date.now() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vận chuyển & Giao hàng</h1>
          <p className="page-subtitle">Quản lý quy trình đóng gói, bàn giao ĐVVC và theo dõi bưu kiện</p>
        </div>
        <button onClick={loadShippingOrders} className="btn-secondary text-xs">
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-1 text-xs text-amber-400">
            <Clock size={16} />
            <span>Chờ xác nhận</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{pendingOrders.length} đơn</p>
          <p className="text-[11px] text-gray-500 mt-1">Cần shop duyệt</p>
        </div>

        <div className="card-sm">
          <div className="flex items-center gap-2 mb-1 text-xs text-blue-400">
            <Package size={16} />
            <span>Đang đóng gói</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{processingOrders.length} đơn</p>
          <p className="text-[11px] text-gray-500 mt-1">Đang chuẩn bị hàng</p>
        </div>

        <div className="card-sm">
          <div className="flex items-center gap-2 mb-1 text-xs text-purple-400">
            <Truck size={16} />
            <span>Đang vận chuyển</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{shippingOrders.length} đơn</p>
          <p className="text-[11px] text-gray-500 mt-1">Shipper đang giao</p>
        </div>

        <div className="card-sm">
          <div className="flex items-center gap-2 mb-1 text-xs text-emerald-400">
            <CheckCircle size={16} />
            <span>Tiền hàng đang giao</span>
          </div>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(shippingOrders.reduce((s, o) => s + o.total, 0))}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">COD & Chuyển khoản</p>
        </div>
      </div>

      {/* Search & Carrier Filter */}
      <div className="card-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm khách hàng, mã đơn, mã vận đơn..." />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Đơn vị vận chuyển:</span>
          <select
            value={selectedCarrier}
            onChange={e => setSelectedCarrier(e.target.value)}
            className="input text-xs py-1.5 w-36"
          >
            <option value="all">Tất cả ĐVVC</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* SECTION 1: Pending Orders (Chờ xác nhận) */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
            <Clock size={16} /> Đơn mới chờ xác nhận ({pendingOrders.length})
          </h2>
          <div className="space-y-2.5">
            {pendingOrders.map(order => (
              <div key={order.id} className="card-sm hover:border-amber-700/50 transition-colors bg-gray-900/90 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white text-sm">{order.customerName}</span>
                    <span className="font-mono text-xs text-amber-400 font-bold">{order.tiktokOrderId}</span>
                    <span className="text-xs text-gray-400">({order.customerPhone})</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {order.customerAddress} • <span className="text-white font-semibold">{formatCurrency(order.total)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveToProcessing(order)}
                    disabled={updatingId === order.id}
                    className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Check size={14} /> Duyệt đơn & Đóng gói
                  </button>
                  <button
                    onClick={() => setShowDetail(order)}
                    className="btn-secondary text-xs py-1.5 px-2.5"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Processing Orders (Đang đóng gói) */}
      {processingOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
            <Package size={16} /> Đang chuẩn bị & Đóng gói ({processingOrders.length})
          </h2>
          <div className="space-y-2.5">
            {processingOrders.map(order => (
              <div key={order.id} className="card-sm hover:border-blue-700/50 transition-colors bg-gray-900/90 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white text-sm">{order.customerName}</span>
                    <span className="font-mono text-xs text-blue-400">{order.tiktokOrderId}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    ĐVVC dự kiến: <span className="text-gray-200 font-medium">{order.shippingCarrier || "GHTK"}</span> • {formatCurrency(order.total)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markShipping(order)}
                    disabled={updatingId === order.id}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Truck size={14} /> Giao cho shipper
                  </button>
                  <button
                    onClick={() => setShowDetail(order)}
                    className="btn-secondary text-xs py-1.5 px-2.5"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Shipping Orders (Đang giao) */}
      {shippingOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
            <Truck size={16} /> Bưu kiện đang trên đường giao ({shippingOrders.length})
          </h2>
          <div className="space-y-2.5">
            {shippingOrders.map(order => {
              const days = getDaysInTransit(order);
              return (
                <div key={order.id} className="card-sm hover:border-purple-700/50 transition-colors bg-gray-900/90 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-sm">{order.customerName}</span>
                      <span className="font-mono text-xs text-purple-300">{order.tiktokOrderId}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {order.shippingCarrier}: {order.trackingNumber || "Chưa có mã"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Giao đến: {truncate(order.customerAddress || "", 35)} • Đã gửi {days} ngày trước • <span className="text-white font-semibold">{formatCurrency(order.total)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markDelivered(order)}
                      disabled={updatingId === order.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle size={14} /> Xác nhận Đã giao
                    </button>
                    <button
                      onClick={() => setShowDetail(order)}
                      className="btn-secondary text-xs py-1.5 px-2.5"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={Truck}
          title="Không có đơn hàng nào cần giao"
          description="Tất cả các đơn đã hoàn tất giao hoặc chưa phát sinh đơn mới"
        />
      )}

      {/* Modal detail */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title={`Hành trình đơn: ${showDetail.tiktokOrderId || showDetail.id.slice(-8)}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-gray-800/60 p-3.5 rounded-xl border border-gray-700 text-xs">
              <div>
                <p className="text-gray-400">Khách nhận:</p>
                <p className="font-bold text-white text-sm mt-0.5">{showDetail.customerName}</p>
                <p className="text-gray-300 font-mono mt-0.5">{showDetail.customerPhone}</p>
                <p className="text-gray-400 mt-1">{showDetail.customerAddress}</p>
              </div>
              <div>
                <p className="text-gray-400">Đơn vị vận chuyển:</p>
                <p className="font-bold text-purple-300 text-sm mt-0.5">{showDetail.shippingCarrier || "GHTK"}</p>
                <p className="text-gray-300 font-mono mt-0.5">Mã VĐ: {showDetail.trackingNumber || "—"}</p>
                <p className="text-gray-400 mt-1">Ngày đặt: {formatDate(showDetail.orderDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Sản phẩm cần đóng gói:</p>
              <div className="space-y-1.5">
                {showDetail.items?.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs bg-gray-800/40 p-2.5 rounded-lg">
                    <span className="text-white font-medium">{it.productName} ({it.variantInfo || "Bộ"})</span>
                    <span className="text-rose-400 font-bold">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowDetail(null)} className="btn-secondary text-xs">
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
