import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { DefectiveItem, DefectiveType } from "../types";
import { AlertTriangle, Plus, Download, X, Eye, Trash2, TrendingDown } from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatDate, generateId, now, today, getDefectiveTypeLabel, formatNumber } from "../utils/helpers";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const DEFECTIVE_TYPES: DefectiveType[] = ["manufacturing","storage","shipping","customer_use","other"];
const COLORS = ["#f43f5e","#f59e0b","#3b82f6","#8b5cf6","#10b981"];

const emptyDefective: Omit<DefectiveItem, "id" | "createdAt"> = {
  productId: "", variantId: "", productName: "", variantInfo: "",
  quantity: 1, type: "manufacturing", description: "",
  costValue: 0, returnId: "", date: today(), note: "",
};

export default function Defective() {
  const [items, setItems] = useState<DefectiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<DefectiveItem | null>(null);
  const [editItem, setEditItem] = useState<Partial<DefectiveItem>>(emptyDefective);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const data = await db.defectiveItems.orderBy("date").reverse().toArray();
    setItems(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return items.filter(d => {
      const matchSearch = !search
        || d.productName.toLowerCase().includes(search.toLowerCase())
        || d.variantInfo.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || d.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [items, search, typeFilter]);

  const typeData = useMemo(() => {
    const counts: Record<string, { count: number; cost: number }> = {};
    items.forEach(d => {
      if (!counts[d.type]) counts[d.type] = { count: 0, cost: 0 };
      counts[d.type].count += d.quantity;
      counts[d.type].cost += d.costValue;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: getDefectiveTypeLabel(k), value: v.count, cost: v.cost }));
  }, [items]);

  const totalCost = filtered.reduce((s, d) => s + d.costValue, 0);
  const totalQty = filtered.reduce((s, d) => s + d.quantity, 0);

  async function handleSave() {
    if (!editItem.productName || !editItem.description) return;
    setSaving(true);
    await db.defectiveItems.add({
      ...emptyDefective, ...editItem, id: generateId(), createdAt: now(),
    } as DefectiveItem);
    setSaving(false);
    setShowModal(false);
    setEditItem(emptyDefective);
    loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mục hàng lỗi này?")) return;
    await db.defectiveItems.delete(id);
    loadItems();
  }

  const getTypeClass = (type: string) => {
    const map: Record<string, string> = {
      manufacturing: "badge-red", storage: "badge-yellow",
      shipping: "badge-blue", customer_use: "badge-purple", other: "badge-gray",
    };
    return map[type] || "badge-gray";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Hàng Lỗi</h1>
          <p className="page-subtitle">{formatNumber(totalQty)} sản phẩm lỗi • Thiệt hại: {formatCurrency(totalCost)}</p>
        </div>
        <button onClick={() => { setEditItem(emptyDefective); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Ghi nhận lỗi
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-red-400">{formatNumber(items.length)}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng ghi nhận</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-orange-400">{formatNumber(items.reduce((s, d) => s + d.quantity, 0))}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng sản phẩm lỗi</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-red-400">{formatCurrency(items.reduce((s, d) => s + d.costValue, 0))}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng thiệt hại</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-amber-400">
            {formatCurrency(items.reduce((s, d) => s + d.costValue, 0) / Math.max(1, items.length))}
          </p>
          <p className="text-xs text-gray-400 mt-1">Thiệt hại TB/lần</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Phân loại theo nguyên nhân</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, "Số lượng"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Thiệt hại theo loại lỗi (VNĐ)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [formatCurrency(v), "Thiệt hại"]} />
              <Bar dataKey="cost" name="Thiệt hại" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm sản phẩm..." />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input w-44">
          <option value="all">Tất cả loại lỗi</option>
          {DEFECTIVE_TYPES.map(t => <option key={t} value={t}>{getDefectiveTypeLabel(t)}</option>)}
        </select>
        {(search || typeFilter !== "all") && (
          <button onClick={() => { setSearch(""); setTypeFilter("all"); }} className="btn-secondary text-xs"><X size={14} /> Xóa lọc</button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Ngày ghi nhận</th>
              <th>Loại lỗi</th>
              <th>Mô tả</th>
              <th className="text-right">Số lượng</th>
              <th className="text-right">Thiệt hại</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-10"><EmptyState icon={AlertTriangle} title="Không có hàng lỗi" description="Ghi nhận hàng lỗi để theo dõi thiệt hại" /></td></tr>
            ) : filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <p className="font-medium text-white">{d.productName}</p>
                  <p className="text-xs text-gray-400">{d.variantInfo}</p>
                </td>
                <td className="whitespace-nowrap">{formatDate(d.date)}</td>
                <td><span className={getTypeClass(d.type)}>{getDefectiveTypeLabel(d.type)}</span></td>
                <td className="max-w-[200px]"><p className="text-gray-400 text-xs truncate">{d.description}</p></td>
                <td className="text-right font-semibold text-amber-400">{d.quantity}</td>
                <td className="text-right font-semibold text-red-400">{formatCurrency(d.costValue)}</td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setShowDetail(d)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg"><Eye size={15} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-gray-800/50">
                <td colSpan={4} className="px-4 py-3 text-gray-400 font-medium">Tổng cộng ({filtered.length} mục)</td>
                <td className="px-4 py-3 text-right font-bold text-amber-400">{formatNumber(totalQty)}</td>
                <td className="px-4 py-3 text-right font-bold text-red-400">{formatCurrency(totalCost)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Chi tiết hàng lỗi" size="sm">
          <div className="space-y-3 text-sm">
            <div><p className="label">Sản phẩm</p><p className="text-white font-medium">{showDetail.productName}</p><p className="text-gray-400">{showDetail.variantInfo}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="label">Ngày</p><p className="text-white">{formatDate(showDetail.date)}</p></div>
              <div><p className="label">Số lượng</p><p className="text-white font-bold">{showDetail.quantity}</p></div>
              <div><p className="label">Loại lỗi</p><span className={getTypeClass(showDetail.type)}>{getDefectiveTypeLabel(showDetail.type)}</span></div>
              <div><p className="label">Thiệt hại</p><p className="text-red-400 font-bold">{formatCurrency(showDetail.costValue)}</p></div>
            </div>
            <div><p className="label">Mô tả</p><p className="text-white">{showDetail.description}</p></div>
            {showDetail.note && <div><p className="label">Ghi chú</p><p className="text-gray-400">{showDetail.note}</p></div>}
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(emptyDefective); }} title="Ghi nhận hàng lỗi" size="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Tên sản phẩm *</label>
              <input className="input" value={editItem.productName || ""} onChange={e => setEditItem(p => ({ ...p, productName: e.target.value }))} placeholder="Tên sản phẩm lỗi" />
            </div>
            <div>
              <label className="label">Biến thể (màu/size)</label>
              <input className="input" value={editItem.variantInfo || ""} onChange={e => setEditItem(p => ({ ...p, variantInfo: e.target.value }))} placeholder="VD: Đen / L" />
            </div>
            <div>
              <label className="label">Ngày ghi nhận</label>
              <input type="date" className="input" value={editItem.date || today()} onChange={e => setEditItem(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Loại lỗi</label>
              <select className="input" value={editItem.type || "manufacturing"} onChange={e => setEditItem(p => ({ ...p, type: e.target.value as DefectiveType }))}>
                {DEFECTIVE_TYPES.map(t => <option key={t} value={t}>{getDefectiveTypeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Số lượng</label>
              <input type="number" min="1" className="input" value={editItem.quantity || 1} onChange={e => setEditItem(p => ({ ...p, quantity: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Mô tả lỗi *</label>
              <input className="input" value={editItem.description || ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả chi tiết lỗi..." />
            </div>
            <div>
              <label className="label">Giá trị thiệt hại (VNĐ)</label>
              <input type="number" className="input" value={editItem.costValue || ""} onChange={e => setEditItem(p => ({ ...p, costValue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">ID đơn hoàn (nếu có)</label>
              <input className="input" value={editItem.returnId || ""} onChange={e => setEditItem(p => ({ ...p, returnId: e.target.value }))} placeholder="Liên kết đơn hoàn" />
            </div>
            <div className="col-span-2">
              <label className="label">Ghi chú</label>
              <textarea className="input resize-none" rows={2} value={editItem.note || ""} onChange={e => setEditItem(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !editItem.productName || !editItem.description} className="btn-danger">
              {saving ? "Đang lưu..." : "Ghi nhận lỗi"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
