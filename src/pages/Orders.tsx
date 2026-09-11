import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, OrderItem, OrderStatus } from "../types";
import {
  Plus, Download, Upload, Search, Filter, X,
  ChevronDown, Eye, Edit2, Trash2, Package
} from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import {
  formatCurrency, formatDate, formatDateTime, generateId, now, today,
  getOrderStatusLabel, getOrderStatusClass, truncate, formatNumber
} from "../utils/helpers";
import { exportOrdersToExcel, importOrdersFromExcel } from "../utils/exportData";

const STATUSES: OrderStatus[] = ["pending","processing","shipping","delivered","returned","cancelled","return_requested"];

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
  shippingCarrier: "",
  trackingNumber: "",
  note: "",
  tiktokFeeRate: 2.5,
  tiktokFeeAmount: 0,
};

export default function Orders({ defaultFilter = "all" }: { defaultFilter?: string }) {
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
      const matchSearch = !search || o.customerName.toLowerCase().includes(search.toLowerCase())
        || (o.tiktokOrderId || "").toLowerCase().includes(search.toLowerCase())
        || (o.trackingNumber || "").toLowerCase().includes(search.toLowerCase());
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
    const total = subtotal + shippingFee - discount;
    const feeAmount = Math.round(total * ((editOrder.tiktokFeeRate || 2.5) / 100));

    if (isEditing && editOrder.id) {
      await db.orders.update(editOrder.id, { ...editOrder, total, tiktokFeeAmount: feeAmount, updatedAt: now() } as Partial<Order>);
    } else {
      const newOrder: Order = {
        ...emptyOrder, ...editOrder, id: generateId(),
        total, tiktokFeeAmount: feeAmount,
        createdAt: now(), updatedAt: now(),
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
    if (!confirm("Xóa đơn hàng này?")) return;
    await db.orders.delete(id);
    loadOrders();
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const updates: Partial<Order> = { status, updatedAt: now() };
    if (status === "shipping" && !orders.find(o => o.id === id)?.shippingDate) {
      updates.shippingDate = today();
    }
    if (status === "delivered") updates.deliveredDate = today();
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
            id: generateId(), ...emptyOrder, ...o,
            createdAt: now(), updatedAt: now(),
          } as Order);
        }
      }
      loadOrders();
      alert(`Đã import ${imported.length} đơn hàng`);
    } catch (err) {
      alert("Lỗi khi đọc file: " + err);
    }
    e.target.value = "";
  }

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const totalShipping = filtered.filter(o => o.status === "shipping").length;
  const totalDelivered = filtered.filter(o => o.status === "delivered").length;
  const totalReturned = filtered.filter(o => o.status === "returned").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đơn hàng</h1>
          <p className="page-subtitle">{formatNumber(filtered.length)} đơn • Doanh thu: {formatCurrency(totalRevenue)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer">
            <Upload size={16} />
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => exportOrdersToExcel(filtered)} className="btn-secondary">
            <Download size={16} /> Export Excel
          </button>
          <button onClick={() => { setEditOrder(emptyOrder); setIsEditing(false); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Thêm đơn
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Đang giao", value: totalShipping, color: "text-purple-400" },
          { label: "Đã giao", value: totalDelivered, color: "text-emerald-400" },
          { label: "Đã hoàn", value: totalReturned, color: "text-red-400" },
          { label: "Tổng đơn", value: filtered.length, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="card-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{formatNumber(s.value)}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-sm flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm khách, mã đơn, mã VĐ..." />
        </div>
        <div>
          <label className="label">Trạng thái</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-44">
            <option value="all">Tất cả</option>
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
            <X size={14} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã TikTok</th>
              <th>Ngày đặt</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th className="text-right">Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Vận chuyển</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">Đang tải...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="py-10"><EmptyState icon={Package} title="Không có đơn hàng" description="Thêm đơn mới hoặc thay đổi bộ lọc" /></td></tr>
            ) : paginated.map(o => (
              <tr key={o.id}>
                <td className="font-mono text-xs text-gray-400">{o.tiktokOrderId ? truncate(o.tiktokOrderId, 16) : "—"}</td>
                <td className="whitespace-nowrap">{formatDate(o.orderDate)}</td>
                <td>
                  <p className="font-medium text-white">{o.customerName}</p>
                  <p className="text-xs text-gray-500">{o.customerPhone}</p>
                </td>
                <td className="max-w-[180px]">
                  <p className="text-xs text-gray-400 truncate">{o.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}</p>
                </td>
                <td className="text-right font-semibold text-white whitespace-nowrap">{formatCurrency(o.total)}</td>
                <td>
                  <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className={`text-xs px-2 py-1 rounded-full border font-semibold bg-transparent cursor-pointer ${
                      o.status === "delivered" ? "text-emerald-400 border-emerald-800" :
                      o.status === "shipping" ? "text-purple-400 border-purple-800" :
                      o.status === "pending" ? "text-yellow-400 border-yellow-800" :
                      o.status === "returned" ? "text-red-400 border-red-800" :
                      o.status === "cancelled" ? "text-gray-400 border-gray-700" :
                      o.status === "processing" ? "text-blue-400 border-blue-800" :
                      "text-orange-400 border-orange-800"}`}>
                    {STATUSES.map(s => <option key={s} value={s} className="bg-gray-900 text-gray-100">{getOrderStatusLabel(s)}</option>)}
                  </select>
                </td>
                <td>
                  <p className="text-xs text-gray-400">{o.shippingCarrier || "—"}</p>
                  <p className="text-xs text-gray-500 font-mono">{o.trackingNumber ? truncate(o.trackingNumber, 12) : ""}</p>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setShowDetail(o)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Xem chi tiết">
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
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-400">
            Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} đơn
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs">Trước</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${p === page ? "bg-rose-600 text-white" : "btn-secondary"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-xs">Sau</button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`Chi tiết đơn hàng #${showDetail.tiktokOrderId || showDetail.id.slice(-8)}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Khách hàng</p>
                <p className="text-white font-semibold">{showDetail.customerName}</p>
                <p className="text-gray-400 text-sm">{showDetail.customerPhone}</p>
                <p className="text-gray-400 text-sm mt-1">{showDetail.customerAddress}</p>
              </div>
              <div>
                <p className="label">Vận chuyển</p>
                <p className="text-white">{showDetail.shippingCarrier || "—"}</p>
                <p className="text-gray-400 text-sm font-mono">{showDetail.trackingNumber || "—"}</p>
                <p className="text-gray-400 text-sm mt-1">Ngày đặt: {formatDate(showDetail.orderDate)}</p>
                {showDetail.shippingDate && <p className="text-gray-400 text-sm">Ngày gửi: {formatDate(showDetail.shippingDate)}</p>}
                {showDetail.deliveredDate && <p className="text-gray-400 text-sm">Ngày giao: {formatDate(showDetail.deliveredDate)}</p>}
              </div>
            </div>

            <div>
              <p className="label mb-2">Sản phẩm</p>
              <div className="space-y-2">
                {showDetail.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{item.productName}</p>
                      <p className="text-gray-400 text-xs">{item.variantInfo} • SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">x{item.quantity}</p>
                      <p className="text-gray-400 text-xs">{formatCurrency(item.unitPrice)}/cái</p>
                    </div>
                    <p className="text-white font-semibold text-sm">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Tiền hàng</span><span className="text-white">{formatCurrency(showDetail.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Phí vận chuyển</span><span className="text-white">{formatCurrency(showDetail.shippingFee)}</span></div>
              {(showDetail.tiktokDiscount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Giảm giá TikTok</span><span className="text-emerald-400">-{formatCurrency(showDetail.tiktokDiscount!)}</span></div>}
              {(showDetail.sellerDiscount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Giảm giá shop</span><span className="text-emerald-400">-{formatCurrency(showDetail.sellerDiscount!)}</span></div>}
              <div className="border-t border-gray-700 pt-2 flex justify-between"><span className="font-semibold text-white">Tổng thanh toán</span><span className="font-bold text-rose-400 text-lg">{formatCurrency(showDetail.total)}</span></div>
              {showDetail.tiktokFeeAmount && <div className="flex justify-between text-sm"><span className="text-gray-400">Phí TikTok ({showDetail.tiktokFeeRate}%)</span><span className="text-amber-400">-{formatCurrency(showDetail.tiktokFeeAmount)}</span></div>}
            </div>
            {showDetail.note && <div className="bg-gray-800 rounded-lg p-3"><p className="text-xs text-gray-400">Ghi chú: {showDetail.note}</p></div>}
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditOrder(emptyOrder); setIsEditing(false); }}
        title={isEditing ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mã đơn TikTok</label>
              <input className="input" value={editOrder.tiktokOrderId || ""} onChange={e => setEditOrder(p => ({ ...p, tiktokOrderId: e.target.value }))} placeholder="TT1234567890" />
            </div>
            <div>
              <label className="label">Ngày đặt hàng *</label>
              <input type="date" className="input" value={editOrder.orderDate || today()} onChange={e => setEditOrder(p => ({ ...p, orderDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tên khách hàng *</label>
              <input className="input" value={editOrder.customerName || ""} onChange={e => setEditOrder(p => ({ ...p, customerName: e.target.value }))} placeholder="Nguyễn Thị A" />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input className="input" value={editOrder.customerPhone || ""} onChange={e => setEditOrder(p => ({ ...p, customerPhone: e.target.value }))} placeholder="09xxxxxxxx" />
            </div>
            <div className="col-span-2">
              <label className="label">Địa chỉ</label>
              <input className="input" value={editOrder.customerAddress || ""} onChange={e => setEditOrder(p => ({ ...p, customerAddress: e.target.value }))} placeholder="Địa chỉ giao hàng" />
            </div>
            <div>
              <label className="label">Tiền hàng (VNĐ)</label>
              <input type="number" className="input" value={editOrder.subtotal || ""} onChange={e => setEditOrder(p => ({ ...p, subtotal: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Phí ship (VNĐ)</label>
              <input type="number" className="input" value={editOrder.shippingFee || ""} onChange={e => setEditOrder(p => ({ ...p, shippingFee: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Giảm giá TikTok</label>
              <input type="number" className="input" value={editOrder.tiktokDiscount || ""} onChange={e => setEditOrder(p => ({ ...p, tiktokDiscount: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Phí TikTok (%)</label>
              <input type="number" className="input" step="0.1" value={editOrder.tiktokFeeRate || 2.5} onChange={e => setEditOrder(p => ({ ...p, tiktokFeeRate: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select className="input" value={editOrder.status || "pending"} onChange={e => setEditOrder(p => ({ ...p, status: e.target.value as OrderStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Đơn vị vận chuyển</label>
              <select className="input" value={editOrder.shippingCarrier || ""} onChange={e => setEditOrder(p => ({ ...p, shippingCarrier: e.target.value }))}>
                <option value="">Chọn đơn vị</option>
                {["J&T Express","GHN","GHTK","Viettel Post","SPX Express","Best Express","Ninja Van"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mã vận đơn</label>
              <input className="input" value={editOrder.trackingNumber || ""} onChange={e => setEditOrder(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="VD123456789" />
            </div>
            <div className="col-span-2">
              <label className="label">Ghi chú</label>
              <textarea className="input resize-none" rows={2} value={editOrder.note || ""} onChange={e => setEditOrder(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú đơn hàng..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setEditOrder(emptyOrder); }} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !editOrder.customerName} className="btn-primary">
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm đơn"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


