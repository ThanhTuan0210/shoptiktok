import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import { BarChart3, Download, TrendingUp, TrendingDown, Package } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { subDays, format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { formatCurrency, formatNumber, formatDate } from "../utils/helpers";
import { exportReportToPDF } from "../utils/exportData";

const COLORS = ["#f43f5e","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

export default function Analytics() {
  const [period, setPeriod] = useState<7 | 30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [returnByProduct, setReturnByProduct] = useState<any[]>([]);
  const [categoryChart, setCategoryChart] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    revenue: 0, orders: 0, avgOrderValue: 0,
    returnRate: 0, grossMargin: 0, netProfit: 0,
    prevRevenue: 0, prevOrders: 0,
  });

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const from = subDays(now, period);
    const prevFrom = subDays(now, period * 2);

    const allOrders = await db.orders.toArray();
    const allReturns = await db.returns.toArray();
    const allExpenses = await db.expenses.toArray();
    const allProducts = await db.products.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    const inRange = (d: string, start: Date, end: Date) => {
      try { return isWithinInterval(parseISO(d), { start: startOfDay(start), end: endOfDay(end) }); }
      catch { return false; }
    };

    const curOrders = allOrders.filter(o => inRange(o.orderDate, from, now) && o.status !== "cancelled");
    const prevOrders = allOrders.filter(o => inRange(o.orderDate, prevFrom, from) && o.status !== "cancelled");
    const curReturns = allReturns.filter(r => inRange(r.returnDate, from, now));
    const curExpenses = allExpenses.filter(e => inRange(e.date, from, now));

    const revenue = curOrders.reduce((s, o) => s + o.total, 0);
    const cogs = curOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = curExpenses.reduce((s, e) => s + e.amount, 0);
    const tiktokFees = curOrders.reduce((s, o) => s + (o.tiktokFeeAmount || 0), 0);

    setSummary({
      revenue,
      orders: curOrders.length,
      avgOrderValue: curOrders.length > 0 ? revenue / curOrders.length : 0,
      returnRate: curOrders.length > 0 ? (curReturns.length / curOrders.length) * 100 : 0,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netProfit: grossProfit - totalExpenses - tiktokFees,
      prevRevenue: prevOrders.reduce((s, o) => s + o.total, 0),
      prevOrders: prevOrders.length,
    });

    // Daily revenue chart
    const daily: any[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const day = subDays(now, i);
      const ds = format(day, "yyyy-MM-dd");
      const dayOrders = curOrders.filter(o => o.orderDate.startsWith(ds));
      const dayReturns = curReturns.filter(r => r.returnDate.startsWith(ds));
      const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
      const dayCOGS = dayOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);
      daily.push({
        date: format(day, period <= 14 ? "dd/MM" : "dd/MM"),
        revenue: dayRevenue,
        profit: dayRevenue - dayCOGS,
        orders: dayOrders.length,
        returns: dayReturns.length,
      });
    }
    setRevenueChart(daily);

    // Best sellers
    const prodSales: Record<string, { name: string; qty: number; revenue: number; margin: number }> = {};
    curOrders.forEach(o => {
      o.items.forEach(i => {
        if (!prodSales[i.productId]) {
          prodSales[i.productId] = { name: i.productName, qty: 0, revenue: 0, margin: 0 };
        }
        prodSales[i.productId].qty += i.quantity;
        prodSales[i.productId].revenue += i.unitPrice * i.quantity;
        prodSales[i.productId].margin += (i.unitPrice - (i.unitCost || 0)) * i.quantity;
      });
    });
    const sellers = Object.values(prodSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(s => ({ ...s, marginRate: s.revenue > 0 ? (s.margin / s.revenue * 100) : 0 }));
    setBestSellers(sellers);

    // Return by product
    const retByProd: Record<string, { name: string; count: number }> = {};
    curReturns.forEach(r => {
      r.items.forEach(i => {
        if (!retByProd[i.productId]) retByProd[i.productId] = { name: i.productName, count: 0 };
        retByProd[i.productId].count += i.quantity;
      });
    });
    setReturnByProduct(Object.values(retByProd).sort((a, b) => b.count - a.count).slice(0, 7));

    // Category breakdown
    const catRev: Record<string, number> = {};
    curOrders.forEach(o => {
      o.items.forEach(i => {
        const prod = productMap.get(i.productId);
        const cat = prod?.category || "Khác";
        catRev[cat] = (catRev[cat] || 0) + i.unitPrice * i.quantity;
      });
    });
    setCategoryChart(Object.entries(catRev).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value));
    setLoading(false);
  }

  const pctChange = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.dataKey === "revenue" || p.dataKey === "profit"
              ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  function handleExportPDF() {
    exportReportToPDF(
      `Báo cáo phân tích ${period} ngày`,
      ["Sản phẩm", "Số lượng bán", "Doanh thu", "Biên lợi nhuận"],
      bestSellers.map(s => [s.name, s.qty, formatCurrency(s.revenue), `${s.marginRate.toFixed(1)}%`]),
      `bao-cao-analytics-${period}ngay.pdf`
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-center"><div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-gray-400 text-sm">Đang phân tích...</p></div></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Thống kê & Báo cáo</h1>
          <p className="page-subtitle">Phân tích hiệu suất shop TikTok của bạn</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
            {([7, 30, 60, 90] as const).map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === d ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"}`}>
                {d}N
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} className="btn-secondary"><Download size={16} /> PDF</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Doanh thu", value: formatCurrency(summary.revenue), change: pctChange(summary.revenue, summary.prevRevenue), good: true },
          { label: "Đơn hàng", value: formatNumber(summary.orders), change: pctChange(summary.orders, summary.prevOrders), good: true },
          { label: "Giá trị TB/đơn", value: formatCurrency(summary.avgOrderValue), change: undefined, good: true },
          { label: "Biên gộp", value: `${summary.grossMargin.toFixed(1)}%`, change: undefined, good: true },
          { label: "Tỉ lệ hoàn", value: `${summary.returnRate.toFixed(1)}%`, change: undefined, good: false },
          { label: "Lợi nhuận ròng", value: formatCurrency(summary.netProfit), change: undefined, good: summary.netProfit >= 0 },
        ].map(stat => (
          <div key={stat.label} className="card-sm">
            <p className="text-xs text-gray-400 mb-2">{stat.label}</p>
            <p className={`text-base font-bold ${stat.good ? "text-white" : "text-amber-400"}`}>{stat.value}</p>
            {stat.change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${stat.change >= 0 && stat.good ? "text-emerald-400" : "text-red-400"}`}>
                {stat.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(stat.change).toFixed(1)}% vs kỳ trước
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue + Profit chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Doanh thu & Lợi nhuận theo ngày</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueChart}>
            <defs>
              <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#f43f5e" strokeWidth={2} fill="url(#revG)" />
            <Area type="monotone" dataKey="profit" name="Lợi nhuận gộp" stroke="#10b981" strokeWidth={2} fill="url(#profG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders + Returns chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Đơn hàng vs Hoàn hàng theo ngày</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueChart.filter((_, i) => i % Math.max(1, Math.floor(period / 14)) === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="returns" name="Hoàn hàng" fill="#f43f5e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best sellers + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Top sản phẩm bán chạy</h3>
          <div className="space-y-2">
            {bestSellers.slice(0, 7).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-800 text-gray-400"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{s.name}</p>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    <span>Bán: {s.qty}</span>
                    <span>Biên: {s.marginRate.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white shrink-0">{formatCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Doanh thu theo danh mục</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}>
                {categoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Return by product */}
      {returnByProduct.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Sản phẩm bị hoàn nhiều nhất</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={returnByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} width={150} />
              <Tooltip />
              <Bar dataKey="count" name="Số lượng hoàn" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

