import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, OrderStatus } from "../types";
import {
  Plus, Download, Upload, Search, X,
  Eye, Edit2, Trash2, Package, CheckCircle2
} from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import {
  formatCurrency, formatDate, generateId, now, today,
  getOrderStatusLabel, formatNumber, truncate
} from "../utils/helpers";
import { exportOrdersToExcel, importOrdersFromExcel } from "../utils/exportData";

const STATUSES: OrderStatus[] = [
  "pending", "processing", "shipping", "delivered", "returned", "cancelled", "return_requested"
];

const emptyOrder: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
  tiktokOrderId: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  items: [],
  status: "pending",
  orderDate: today(),
  subtotal: 0,
  shippingFee: 0,
  total: 0,
  shippingCarrier: "GHTK",
  trackingNumber: "",
  note: "",
  tiktokFeeRate: 1.8,
  tiktokFeeAmount: 0,
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Partial<Order>>(emptyOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    const data = await db.orders.orderBy("orderDate").reverse().toArray();
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
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchFrom = !dateFrom || o.orderDate >= dateFrom;
      const matchTo = !dateTo || o.orderDate <= dateTo;
      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  async function handleSave() {
    if (!editOrder.customerName) return;
    setSaving(true);
    const subtotal = editOrder.subtotal || 0;
    const shippingFee = editOrder.shippingFee || 0;
    const discount = (editOrder.tiktokDiscount || 0) + (editOrder.sellerDiscount || 0);
    const total = Math.max(0, subtotal + shippingFee - discount);
    const feeRate = editOrder.tiktokFeeRate ?? 1.8;
    const feeAmount = Math.round(total * (feeRate / 100));

    if (isEditing && editOrder.id) {
      await db.orders.update(editOrder.id, {
        ...editOrder,
        total,
        tiktokFeeAmount: feeAmount,
        updatedAt: now()
      } as Partial<Order>);
    } else {
      const newOrder: Order = {
        ...emptyOrder,
        ...editOrder,
        id: generateId(),
        tiktokOrderId: editOrder.tiktokOrderId || `WEB-${generateId().slice(-8).toUpperCase()}`,
        total,
        tiktokFeeAmount: feeAmount,
        createdAt: now(),
        updatedAt: now(),
      } as Order;
      await db.orders.add(newOrder);
    }
    setSaving(false);
    setShowModal(false);
    setEditOrder(emptyOrder);
    setIsEditing(false);
    loadOrders();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xoá đơn hàng này?")) return;
    await db.orders.delete(id);
    loadOrders();
  }

  // Realistic inventory stock handling on order status transition
  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const oldStatus = targetOrder.status;
    const updates: Partial<Order> = { status: newStatus, updatedAt: now() };

    if (newStatus === "shipping" && !targetOrder.shippingDate) {
      updates.shippingDate = today();
    }
    if (newStatus === "delivered") {
      updates.deliveredDate = today();
    }

    // 1. If transitioning TO cancelled: RESTORE stock to inventory
    if (newStatus === "cancelled" && oldStatus !== "cancelled") {
      for (const item of targetOrder.items || []) {
        if (!item.variantId) continue;
        const v = await db.productVariants.get(item.variantId);
        if (v) {
          await db.productVariants.update(v.id, { stock: v.stock + item.quantity });
          await db.stockMovements.add({
            id: generateId(),
            productId: item.productId,
            variantId: item.variantId,
            type: "adjustment",
            quantity: item.quantity,
            note: `Hoàn kho do huỷ đơn ${targetOrder.tiktokOrderId || targetOrder.id.slice(-8)}`,
            date: today(),
            createdAt: now(),
          });
        }
      }
    }

    // 2. If transitioning FROM cancelled back to active: DEDUCT stock again
    if (oldStatus === "cancelled" && newStatus !== "cancelled") {
      for (const item of targetOrder.items || []) {
        if (!item.variantId) continue;
        const v = await db.productVariants.get(item.variantId);
        if (v) {
          await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.quantity) });
          await db.stockMovements.add({
            id: generateId(),
            productId: item.productId,
            variantId: item.variantId,
            type: "sale",
            quantity: -item.quantity,
            note: `Trừ kho do mở lại đơn ${targetOrder.tiktokOrderId || targetOrder.id.slice(-8)}`,
            date: today(),
            createdAt: now(),
          });
        }
      }
    }

    await db.orders.update(id, updates);
    loadOrders();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importOrdersFromExcel(file);
      for (const o of imported) {
        if (o.tiktokOrderId) {
          await db.orders.add({
            id: generateId(),
            ...emptyOrder,
            ...o,
            createdAt: now(),
            updatedAt: now(),
          } as Order);
        }
      }
      loadOrders();
      alert(`Đã import thành công ${imported.length} đơn hàng!`);
    } catch (err) {
      alert("Lỗi khi đọc file Excel: " + err);
    }
    e.target.value = "";
  }

  const totalRevenue = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const totalPending = filtered.filter(o => o.status === "pending").length;
  const totalShipping = filtered.filter(o => o.status === "shipping").length;
  const totalDelivered = filtered.filter(o => o.status === "delivered").length;
  const totalReturned = filtered.filter(o => o.status === "returned").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đơn hàng</h1>
          <p className="page-subtitle">
            {formatNumber(filtered.length)} đơn • Doanh thu: {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer text-xs">
            <Upload size={15} />
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => exportOrdersToExcel(filtered)} className="btn-secondary text-xs">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={() => { setEditOrder(emptyOrder); setIsEditing(false); setShowModal(true); }} className="btn-primary text-xs">
            <Plus size={15} /> Thêm đơn thủ công
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-amber-400">{formatNumber(totalPending)}</p>
          <p className="text-xs text-gray-400 mt-1">Chờ xác nhận</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-purple-400">{formatNumber(totalShipping)}</p>
          <p className="text-xs text-gray-400 mt-1">Đang vận chuyển</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatNumber(totalDelivered)}</p>
          <p className="text-xs text-gray-400 mt-1">Giao thành công</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-red-400">{formatNumber(totalReturned)}</p>
          <p className="text-xs text-gray-400 mt-1">Đơn hoàn về</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-sm flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo tên khách, SĐT, mã đơn, mã VĐ..." />
        </div>
        <div>
          <label className="label">Trạng thái</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-44">
            <option value="all">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Từ ngày</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="input w-36" />
        </div>
        <div>
          <label className="label">Đến ngày</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="input w-36" />
        </div>
        {(search || statusFilter !== "all" || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="btn-secondary text-xs">
            <X size={14} /> Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Ngày đặt</th>
              <th>Khách hàng</th>
              <th>Sản phẩm đặt</th>
              <th className="text-right">Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Vận chuyển</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">Đang tải dữ liệu đơn hàng...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="py-10"><EmptyState icon={Package} title="Không có đơn hàng nào" description="Thêm đơn mới hoặc điều chỉnh bộ lọc" /></td></tr>
            ) : paginated.map(o => (
              <tr key={o.id}>
                <td className="font-mono text-xs font-semibold text-gray-300">
                  {o.tiktokOrderId || truncate(o.id, 14)}
                </td>
                <td className="whitespace-nowrap text-xs">{formatDate(o.orderDate)}</td>
                <td>
                  <p className="font-medium text-white">{o.customerName}</p>
                  <p className="text-xs text-gray-500 font-mono">{o.customerPhone || "—"}</p>
                </td>
                <td className="max-w-[190px]">
                  <p className="text-xs text-gray-300 truncate" title={o.items?.map(i => `${i.productName} (${i.variantInfo || "bộ"}) x${i.quantity}`).join(", ")}>
                    {o.items?.length > 0
                      ? o.items.map(i => `${i.productName} x${i.quantity}`).join(", ")
                      : "Đơn không có chi tiết SP"}
                  </p>
                </td>
                <td className="text-right font-bold text-white whitespace-nowrap">{formatCurrency(o.total)}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold bg-gray-900 cursor-pointer ${
                      o.status === "delivered" ? "text-emerald-400 border-emerald-800" :
                      o.status === "shipping" ? "text-purple-400 border-purple-800" :
                      o.status === "pending" ? "text-yellow-400 border-yellow-800" :
                      o.status === "returned" ? "text-red-400 border-red-800" :
                      o.status === "cancelled" ? "text-gray-400 border-gray-700" :
                      o.status === "processing" ? "text-blue-400 border-blue-800" :
                      "text-orange-400 border-orange-800"
                    }`}
                  >
                    {STATUSES.map(s => <option key={s} value={s} className="bg-gray-900 text-gray-100">{getOrderStatusLabel(s)}</option>)}
                  </select>
                </td>
                <td>
                  <p className="text-xs text-gray-300 font-medium">{o.shippingCarrier || "—"}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{o.trackingNumber ? truncate(o.trackingNumber, 14) : ""}</p>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setShowDetail(o)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Xem chi tiết đơn">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => { setEditOrder(o); setIsEditing(true); setShowModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(o.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <p className="text-gray-400 text-xs">
            Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} đơn
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Trước</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${p === page ? "bg-rose-600 text-white" : "btn-secondary"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-xs">Sau</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`Chi tiết đơn hàng: ${showDetail.tiktokOrderId || showDetail.id.slice(-8)}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
              <div>
                <p className="label">Khách hàng</p>
                <p className="text-white font-semibold text-base">{showDetail.customerName}</p>
                <p className="text-gray-300 text-sm font-mono mt-0.5">{showDetail.customerPhone || "Chưa có SĐT"}</p>
                <p className="text-gray-400 text-xs mt-1">{showDetail.customerAddress || "Chưa có địa chỉ"}</p>
              </div>
              <div>
                <p className="label">Vận chuyển & Thanh toán</p>
                <p className="text-white font-medium">{showDetail.shippingCarrier || "GHTK"}</p>
                <p className="text-gray-400 text-xs font-mono mt-0.5">Mã VĐ: {showDetail.trackingNumber || "Chưa tạo mã"}</p>
                <p className="text-gray-400 text-xs mt-1">Ngày đặt: {formatDate(showDetail.orderDate)}</p>
                {showDetail.shippingDate && <p className="text-purple-400 text-xs">Ngày gửi đi: {formatDate(showDetail.shippingDate)}</p>}
                {showDetail.deliveredDate && <p className="text-emerald-400 text-xs">Ngày nhận: {formatDate(showDetail.deliveredDate)}</p>}
              </div>
            </div>

            <div>
              <p className="label mb-2">Danh sách sản phẩm</p>
              <div className="space-y-2">
                {showDetail.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
                    <div>
                      <p className="text-white text-sm font-medium">{item.productName}</p>
                      <p className="text-gray-400 text-xs">{item.variantInfo || (item as any).variantName || "Phân loại chuẩn"} • SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">x{item.quantity}</p>
                      <p className="text-gray-400 text-xs">{formatCurrency(item.unitPrice)}/bộ</p>
                    </div>
                    <p className="text-white font-semibold text-sm">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Tiền hàng</span><span className="text-white">{formatCurrency(showDetail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Phí ship</span><span className="text-white">{formatCurrency(showDetail.shippingFee)}</span></div>
              <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-base">
                <span className="text-white">Tổng thanh toán</span>
                <span className="text-rose-400 text-lg">{formatCurrency(showDetail.total)}</span>
              </div>
            </div>
            {showDetail.note && <div className="bg-gray-800/60 rounded-lg p-3 text-xs text-gray-300">Ghi chú: {showDetail.note}</div>}
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditOrder(emptyOrder); setIsEditing(false); }}
        title={isEditing ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mã đơn hàng</label>
              <input className="input" value={editOrder.tiktokOrderId || ""} onChange={e => setEditOrder(p => ({ ...p, tiktokOrderId: e.target.value }))} placeholder="VD: TT1234567890 hoặc WEB-..." />
            </div>
            <div>
              <label className="label">Ngày đặt hàng *</label>
              <input type="date" className="input" value={editOrder.orderDate || today()} onChange={e => setEditOrder(p => ({ ...p, orderDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tên khách hàng *</label>
              <input className="input" value={editOrder.customerName || ""} onChange={e => setEditOrder(p => ({ ...p, customerName: e.target.value }))} placeholder="Nguyễn Thị Lan" />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input className="input" value={editOrder.customerPhone || ""} onChange={e => setEditOrder(p => ({ ...p, customerPhone: e.target.value }))} placeholder="0912 345 678" />
            </div>
            <div className="col-span-2">
              <label className="label">Địa chỉ giao hàng</label>
              <input className="input" value={editOrder.customerAddress || ""} onChange={e => setEditOrder(p => ({ ...p, customerAddress: e.target.value }))} placeholder="Số nhà, đường, phường/xã, quận, tỉnh thành" />
            </div>
            <div>
              <label className="label">Tổng tiền hàng (VNĐ)</label>
              <input type="number" className="input" value={editOrder.subtotal || ""} onChange={e => setEditOrder(p => ({ ...p, subtotal: Number(e.target.value) }))} placeholder="349000" />
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select className="input" value={editOrder.status || "pending"} onChange={e => setEditOrder(p => ({ ...p, status: e.target.value as OrderStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Đơn vị vận chuyển</label>
              <select className="input" value={editOrder.shippingCarrier || "GHTK"} onChange={e => setEditOrder(p => ({ ...p, shippingCarrier: e.target.value }))}>
                {["GHTK", "GHN", "J&T Express", "Viettel Post", "SPX Express", "Ninja Van"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mã vận đơn</label>
              <input className="input" value={editOrder.trackingNumber || ""} onChange={e => setEditOrder(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="VD: GHTK12345678" />
            </div>
            <div className="col-span-2">
              <label className="label">Ghi chú đơn hàng</label>
              <input className="input" value={editOrder.note || ""} onChange={e => setEditOrder(p => ({ ...p, note: e.target.value }))} placeholder="Yêu cầu giao hàng, phương thức thanh toán..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button onClick={() => { setShowModal(false); setEditOrder(emptyOrder); }} className="btn-secondary">Huỷ</button>
            <button onClick={handleSave} disabled={saving || !editOrder.customerName} className="btn-primary">
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật đơn" : "Tạo đơn hàng"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
