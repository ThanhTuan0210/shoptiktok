import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Return, ReturnReason, ReturnStatus } from "../types";
import { RotateCcw, Plus, Download, X, Eye, Edit2, Trash2 } from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatDate, generateId, now, today,
  getReturnReasonLabel, getReturnStatusLabel, getReturnStatusClass, formatNumber } from "../utils/helpers";
import { exportReturnsToExcel } from "../utils/exportData";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const REASONS: ReturnReason[] = ["wrong_size","wrong_color","wrong_product","defective","not_as_described","changed_mind","damaged_shipping","other"];
const STATUSES: ReturnStatus[] = ["pending","received","restocked","disposed"];
const COLORS = ["#f43f5e","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

const emptyReturn: Omit<Return, "id" | "createdAt" | "updatedAt"> = {
  orderId: "", tiktokOrderId: "", customerName: "",
  items: [], reason: "wrong_size", reasonDetail: "",
  status: "pending", returnDate: today(),
  refundAmount: 0, shippingBack: 0, note: "",
};

export default function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Return | null>(null);
  const [editReturn, setEditReturn] = useState<Partial<Return>>(emptyReturn);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadReturns(); }, []);

  async function loadReturns() {
    setLoading(true);
    const data = await db.returns.orderBy("returnDate").reverse().toArray();
    setReturns(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return returns.filter(r => {
      const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase())
        || r.orderId.toLowerCase().includes(search.toLowerCase())
        || (r.tiktokOrderId || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchReason = reasonFilter === "all" || r.reason === reasonFilter;
      return matchSearch && matchStatus && matchReason;
    });
  }, [returns, search, statusFilter, reasonFilter]);

  // Analytics
  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    returns.forEach(r => { counts[r.reason] = (counts[r.reason] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: getReturnReasonLabel(k), value: v }));
  }, [returns]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: getReturnStatusLabel(k), value: v }));
  }, [filtered]);

  const totalRefund = filtered.reduce((s, r) => s + r.refundAmount, 0);
  const totalShippingBack = filtered.reduce((s, r) => s + (r.shippingBack || 0), 0);
  const returnRate = returns.length > 0 ? ((returns.length / Math.max(1, (returns.length * 15))) * 100).toFixed(1) : "0";

  async function handleSave() {
    if (!editReturn.customerName || !editReturn.orderId) return;
    setSaving(true);
    if (isEditing && editReturn.id) {
      await db.returns.update(editReturn.id, { ...editReturn, updatedAt: now() } as Partial<Return>);
    } else {
      await db.returns.add({
        ...emptyReturn, ...editReturn, id: generateId(),
        createdAt: now(), updatedAt: now(),
      } as Return);
    }
    setSaving(false);
    setShowModal(false);
    setEditReturn(emptyReturn);
    setIsEditing(false);
    loadReturns();
  }

  async function handleStatusChange(id: string, status: ReturnStatus) {
    const updates: Partial<Return> = { status, updatedAt: now() };
    if (status === "received") updates.receivedDate = today();
    await db.returns.update(id, updates);
    loadReturns();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa đơn hoàn này?")) return;
    await db.returns.delete(id);
    loadReturns();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Hàng Hoàn</h1>
          <p className="page-subtitle">{returns.length} đơn hoàn • Tổng tiền hoàn: {formatCurrency(totalRefund)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportReturnsToExcel(filtered)} className="btn-secondary">
            <Download size={16} /> Export
          </button>
          <button onClick={() => { setEditReturn(emptyReturn); setIsEditing(false); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Thêm hoàn
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-rose-400">{formatNumber(returns.length)}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng đơn hoàn</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-amber-400">{filtered.filter(r => r.status === "pending").length}</p>
          <p className="text-xs text-gray-400 mt-1">Chờ xử lý</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalRefund)}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng tiền hoàn</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-orange-400">{formatCurrency(totalShippingBack)}</p>
          <p className="text-xs text-gray-400 mt-1">Phí ship hoàn</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Lý do hoàn hàng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {reasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Trạng thái xử lý</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Số đơn" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm khách hàng, mã đơn..." />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-40">
          <option value="all">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{getReturnStatusLabel(s)}</option>)}
        </select>
        <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="input w-44">
          <option value="all">Tất cả lý do</option>
          {REASONS.map(r => <option key={r} value={r}>{getReturnReasonLabel(r)}</option>)}
        </select>
        {(search || statusFilter !== "all" || reasonFilter !== "all") && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setReasonFilter("all"); }} className="btn-secondary text-xs">
            <X size={14} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày hoàn</th>
              <th>Khách hàng</th>
              <th>Lý do</th>
              <th className="text-right">Tiền hoàn</th>
              <th className="text-right">Phí ship hoàn</th>
              <th>Trạng thái</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-10"><EmptyState icon={RotateCcw} title="Không có đơn hoàn" description="Chưa có đơn hoàn nào hoặc không khớp bộ lọc" /></td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs">
                  <p className="text-gray-300">{r.orderId.slice(-8)}</p>
                  {r.tiktokOrderId && <p className="text-gray-500">{r.tiktokOrderId.slice(-12)}</p>}
                </td>
                <td className="whitespace-nowrap">{formatDate(r.returnDate)}</td>
                <td className="font-medium text-white">{r.customerName}</td>
                <td>
                  <span className="badge-red">{getReturnReasonLabel(r.reason)}</span>
                  {r.reasonDetail && <p className="text-xs text-gray-500 mt-1">{r.reasonDetail}</p>}
                </td>
                <td className="text-right font-semibold text-red-400">{formatCurrency(r.refundAmount)}</td>
                <td className="text-right text-gray-400">{formatCurrency(r.shippingBack || 0)}</td>
                <td>
                  <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value as ReturnStatus)}
                    className="text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer text-yellow-400 border-yellow-800">
                    {STATUSES.map(s => <option key={s} value={s} className="bg-gray-900 text-gray-100">{getReturnStatusLabel(s)}</option>)}
                  </select>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setShowDetail(r)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg" title="Chi tiết"><Eye size={15} /></button>
                    <button onClick={() => { setEditReturn(r); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg" title="Sửa"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Xóa"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Chi tiết đơn hoàn" size="md">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="label">Mã đơn gốc</p><p className="text-white font-mono">{showDetail.orderId}</p></div>
              <div><p className="label">Ngày hoàn</p><p className="text-white">{formatDate(showDetail.returnDate)}</p></div>
              <div><p className="label">Khách hàng</p><p className="text-white">{showDetail.customerName}</p></div>
              <div><p className="label">Trạng thái</p><span className={getReturnStatusClass(showDetail.status)}>{getReturnStatusLabel(showDetail.status)}</span></div>
              <div><p className="label">Lý do</p><p className="text-white">{getReturnReasonLabel(showDetail.reason)}</p></div>
              <div><p className="label">Chi tiết lý do</p><p className="text-white">{showDetail.reasonDetail || "—"}</p></div>
            </div>
            {showDetail.items.length > 0 && (
              <div>
                <p className="label mb-2">Sản phẩm hoàn</p>
                {showDetail.items.map((i, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg px-3 py-2 mb-1 flex justify-between">
                    <span className="text-gray-300">{i.productName} ({i.variantInfo})</span>
                    <span className="text-white">x{i.quantity}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-gray-800 rounded-lg p-3 space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">Tiền hoàn khách</span><span className="text-red-400 font-semibold">{formatCurrency(showDetail.refundAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Phí ship hoàn</span><span className="text-orange-400">{formatCurrency(showDetail.shippingBack || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-700 pt-1"><span className="font-semibold text-white">Tổng thiệt hại</span><span className="font-bold text-red-400">{formatCurrency(showDetail.refundAmount + (showDetail.shippingBack || 0))}</span></div>
            </div>
            {showDetail.note && <p className="text-gray-400 text-xs">{showDetail.note}</p>}
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditReturn(emptyReturn); setIsEditing(false); }}
        title={isEditing ? "Chỉnh sửa đơn hoàn" : "Thêm đơn hoàn mới"} size="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mã đơn gốc *</label>
              <input className="input" value={editReturn.orderId || ""} onChange={e => setEditReturn(p => ({ ...p, orderId: e.target.value }))} placeholder="ID đơn hàng gốc" />
            </div>
            <div>
              <label className="label">Mã TikTok</label>
              <input className="input" value={editReturn.tiktokOrderId || ""} onChange={e => setEditReturn(p => ({ ...p, tiktokOrderId: e.target.value }))} placeholder="TT..." />
            </div>
            <div>
              <label className="label">Khách hàng *</label>
              <input className="input" value={editReturn.customerName || ""} onChange={e => setEditReturn(p => ({ ...p, customerName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ngày hoàn</label>
              <input type="date" className="input" value={editReturn.returnDate || today()} onChange={e => setEditReturn(p => ({ ...p, returnDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Lý do hoàn</label>
              <select className="input" value={editReturn.reason || "wrong_size"} onChange={e => setEditReturn(p => ({ ...p, reason: e.target.value as ReturnReason }))}>
                {REASONS.map(r => <option key={r} value={r}>{getReturnReasonLabel(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select className="input" value={editReturn.status || "pending"} onChange={e => setEditReturn(p => ({ ...p, status: e.target.value as ReturnStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{getReturnStatusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tiền hoàn (VNĐ)</label>
              <input type="number" className="input" value={editReturn.refundAmount || ""} onChange={e => setEditReturn(p => ({ ...p, refundAmount: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Phí ship hoàn</label>
              <input type="number" className="input" value={editReturn.shippingBack || ""} onChange={e => setEditReturn(p => ({ ...p, shippingBack: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Chi tiết lý do</label>
              <input className="input" value={editReturn.reasonDetail || ""} onChange={e => setEditReturn(p => ({ ...p, reasonDetail: e.target.value }))} placeholder="Mô tả thêm..." />
            </div>
            <div className="col-span-2">
              <label className="label">Ghi chú</label>
              <textarea className="input resize-none" rows={2} value={editReturn.note || ""} onChange={e => setEditReturn(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !editReturn.customerName || !editReturn.orderId} className="btn-primary">
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm đơn hoàn"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
