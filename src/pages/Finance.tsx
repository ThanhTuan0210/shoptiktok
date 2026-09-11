import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Expense, ExpenseCategory } from "../types";
import { DollarSign, Plus, Download, X, TrendingUp, TrendingDown, Trash2, Edit2 } from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatDate, generateId, now, today, getExpenseCategoryLabel, formatNumber } from "../utils/helpers";
import { exportFinanceToExcel } from "../utils/exportData";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { subDays, format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

const EXPENSE_CATS: ExpenseCategory[] = ["cogs","tiktok_fee","advertising","shipping","labor","warehouse","packaging","livestream","other"];
const COLORS = ["#f43f5e","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#84cc16","#6b7280"];

export default function Finance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<30 | 60 | 90>(30);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Partial<Expense>>({ category: "other", amount: 0, date: today(), description: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [financeData, setFinanceData] = useState({
    revenue: 0, cogs: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0,
    tiktokFees: 0, shippingCost: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    const now2 = new Date();
    const from = subDays(now2, period);

    const allOrders = await db.orders.toArray();
    const allExpenses = await db.expenses.toArray();
    const allReturns = await db.returns.toArray();

    const inRange = (dateStr: string) => {
      try {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: startOfDay(from), end: endOfDay(now2) });
      } catch { return false; }
    };

    const curOrders = allOrders.filter(o => inRange(o.orderDate) && o.status !== "cancelled" && o.status !== "returned");
    const curExpenses = allExpenses.filter(e => inRange(e.date));
    const curReturns = allReturns.filter(r => inRange(r.returnDate));

    const revenue = curOrders.reduce((s, o) => s + o.total, 0);
    const cogs = curOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.unitCost * i.quantity, 0), 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = curExpenses.reduce((s, e) => s + e.amount, 0);
    const tiktokFees = curOrders.reduce((s, o) => s + (o.tiktokFeeAmount || 0), 0);
    const returnCost = curReturns.reduce((s, r) => s + r.refundAmount + (r.shippingBack || 0), 0);
    const netProfit = grossProfit - totalExpenses - tiktokFees;

    setFinanceData({ revenue, cogs, grossProfit, totalExpenses, netProfit, tiktokFees, shippingCost: 0 });
    setExpenses(allExpenses);

    // Monthly breakdown chart
    const months: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    curOrders.forEach(o => {
      const m = o.orderDate.slice(0, 7);
      if (!months[m]) months[m] = { revenue: 0, expenses: 0, profit: 0 };
      months[m].revenue += o.total;
    });
    curExpenses.forEach(e => {
      const m = e.date.slice(0, 7);
      if (!months[m]) months[m] = { revenue: 0, expenses: 0, profit: 0 };
      months[m].expenses += e.amount;
    });
    Object.keys(months).forEach(m => {
      months[m].profit = months[m].revenue - months[m].expenses;
    });
    const chart = Object.entries(months).sort().map(([k, v]) => ({
      month: k.slice(5) + "/" + k.slice(0, 4),
      ...v,
    }));
    setChartData(chart);
    setLoading(false);
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || e.category === catFilter;
      const matchFrom = !dateFrom || e.date >= dateFrom;
      const matchTo = !dateTo || e.date <= dateTo;
      return matchSearch && matchCat && matchFrom && matchTo;
    });
  }, [expenses, search, catFilter, dateFrom, dateTo]);

  const catBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    return Object.entries(totals).map(([k, v]) => ({ name: getExpenseCategoryLabel(k), value: v }));
  }, [expenses]);

  async function handleSave() {
    if (!editExpense.description || !editExpense.amount) return;
    setSaving(true);
    if (isEditing && editExpense.id) {
      await db.expenses.update(editExpense.id, { ...editExpense });
    } else {
      await db.expenses.add({ ...editExpense, id: generateId(), createdAt: now() } as Expense);
    }
    setSaving(false);
    setShowModal(false);
    setEditExpense({ category: "other", amount: 0, date: today(), description: "" });
    setIsEditing(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa chi phí này?")) return;
    await db.expenses.delete(id);
    loadData();
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>)}
      </div>
    );
  };

  const profitMargin = financeData.revenue > 0 ? (financeData.netProfit / financeData.revenue * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tài chính</h1>
          <p className="page-subtitle">Doanh thu, chi phí và lợi nhuận chi tiết</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
            {([30, 60, 90] as const).map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === d ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"}`}>
                {d} ngày
              </button>
            ))}
          </div>
          <button onClick={() => exportFinanceToExcel(filteredExpenses, dateFrom, dateTo)} className="btn-secondary">
            <Download size={16} /> Export
          </button>
          <button onClick={() => { setEditExpense({ category: "other", amount: 0, date: today(), description: "" }); setIsEditing(false); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Thêm chi phí
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-emerald-400" /><span className="text-gray-400 text-xs">Doanh thu</span></div>
          <p className="text-xl font-bold text-white">{formatCurrency(financeData.revenue)}</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-400" /><span className="text-gray-400 text-xs">Giá vốn (COGS)</span></div>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(financeData.cogs)}</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-blue-400" /><span className="text-gray-400 text-xs">Lợi nhuận gộp</span></div>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(financeData.grossProfit)}</p>
          <p className="text-xs text-gray-500">{financeData.revenue > 0 ? (financeData.grossProfit/financeData.revenue*100).toFixed(1) : 0}% biên gộp</p>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-rose-400" /><span className="text-gray-400 text-xs">Lợi nhuận ròng</span></div>
          <p className={`text-xl font-bold ${financeData.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(financeData.netProfit)}</p>
          <p className="text-xs text-gray-500">{profitMargin}% biên ròng</p>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-amber-400">{formatCurrency(financeData.tiktokFees)}</p>
          <p className="text-xs text-gray-400 mt-1">Phí TikTok</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-red-400">{formatCurrency(financeData.totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-1">Chi phí vận hành</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-purple-400">{profitMargin}%</p>
          <p className="text-xs text-gray-400 mt-1">Biên lợi nhuận ròng</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-cyan-400">{formatCurrency(financeData.revenue - financeData.cogs - financeData.tiktokFees)}</p>
          <p className="text-xs text-gray-400 mt-1">Sau phí TikTok</p>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Báo cáo Thu chi ({period} ngày gần nhất)</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: "📈 Doanh thu bán hàng", value: financeData.revenue, color: "text-white" },
            { label: "  − Giá vốn hàng bán (COGS)", value: -financeData.cogs, color: "text-red-400" },
            { label: "= Lợi nhuận gộp", value: financeData.grossProfit, color: "text-blue-400", bold: true },
            { label: "  − Phí TikTok", value: -financeData.tiktokFees, color: "text-amber-400" },
            { label: "  − Chi phí vận hành khác", value: -financeData.totalExpenses, color: "text-red-400" },
            { label: "= Lợi nhuận ròng", value: financeData.netProfit, color: financeData.netProfit >= 0 ? "text-emerald-400" : "text-red-400", bold: true, border: true },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between items-center py-2 ${row.border ? "border-t-2 border-gray-700 mt-2 pt-3" : ""}`}>
              <span className={`${row.bold ? "font-semibold text-white" : "text-gray-400"}`}>{row.label}</span>
              <span className={`font-semibold ${row.color} ${row.bold ? "text-base" : ""}`}>{formatCurrency(Math.abs(row.value))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-white mb-4">Doanh thu vs Chi phí theo tháng</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Chi phí" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Cơ cấu chi phí</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                {catBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense list */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white">Chi tiết chi phí</h3>
          <div className="flex flex-wrap gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm chi phí..." />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-44">
              <option value="all">Tất cả danh mục</option>
              {EXPENSE_CATS.map(c => <option key={c} value={c}>{getExpenseCategoryLabel(c)}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-36" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-36" />
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th className="text-right">Số tiền</th>
                <th>Ghi chú</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={6} className="py-10"><EmptyState icon={DollarSign} title="Không có chi phí" description="Thêm chi phí để theo dõi tài chính" /></td></tr>
              ) : filteredExpenses.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{formatDate(e.date)}</td>
                  <td><span className="badge-blue">{getExpenseCategoryLabel(e.category)}</span></td>
                  <td className="max-w-[200px]"><p className="truncate text-gray-300">{e.description}</p></td>
                  <td className="text-right font-semibold text-rose-400">{formatCurrency(e.amount)}</td>
                  <td className="text-gray-500 text-xs max-w-[120px] truncate">{e.note || "—"}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditExpense(e); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-gray-800/50">
                  <td colSpan={3} className="px-4 py-3 text-gray-400 font-medium">Tổng ({filteredExpenses.length} mục)</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-400">{formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditExpense({ category: "other", amount: 0, date: today(), description: "" }); setIsEditing(false); }}
        title={isEditing ? "Chỉnh sửa chi phí" : "Thêm chi phí mới"} size="sm">
        <div className="space-y-3">
          <div>
            <label className="label">Danh mục</label>
            <select className="input" value={editExpense.category || "other"} onChange={e => setEditExpense(p => ({ ...p, category: e.target.value as ExpenseCategory }))}>
              {EXPENSE_CATS.map(c => <option key={c} value={c}>{getExpenseCategoryLabel(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mô tả *</label>
            <input className="input" value={editExpense.description || ""} onChange={e => setEditExpense(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả chi phí" />
          </div>
          <div>
            <label className="label">Số tiền (VNĐ) *</label>
            <input type="number" className="input" value={editExpense.amount || ""} onChange={e => setEditExpense(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="0" />
          </div>
          <div>
            <label className="label">Ngày</label>
            <input type="date" className="input" value={editExpense.date || today()} onChange={e => setEditExpense(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea className="input resize-none" rows={2} value={editExpense.note || ""} onChange={e => setEditExpense(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !editExpense.description || !editExpense.amount} className="btn-primary">
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm chi phí"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
