import { useEffect, useState } from "react";
import { db } from "../db/database";
import {
  ShoppingCart, DollarSign, Package, RotateCcw,
  TrendingUp, AlertTriangle, Truck, XCircle
} from "lucide-react";
import KPICard from "../components/ui/KPICard";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency, formatNumber } from "../utils/helpers";
import type { Order } from "../types";

const COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  returns: number;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0, prevRevenue: 0,
    orders: 0, prevOrders: 0,
    returns: 0, prevReturns: 0,
    shipping: 0,
    defective: 0,
    netProfit: 0, prevNetProfit: 0,
    totalExpenses: 0,
    grossProfit: 0,
    lowStockCount: 0,
  });
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [bestSellers, setBestSellers] = useState<Array<{ name: string; qty: number; revenue: number }>>([]);
  const [returnReasons, setReturnReasons] = useState<Array<{ name: string; value: number }>>([]);
  const [statusDist, setStatusDist] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const now = new Date();
      const from = subDays(now, period);
      const prevFrom = subDays(now, period * 2);

      const allOrders = await db.orders.toArray();
      const allReturns = await db.returns.toArray();
      const allDefective = await db.defectiveItems.toArray();
      const allExpenses = await db.expenses.toArray();
      const allVariants = await db.productVariants.toArray();

      const inRange = (dateStr: string, start: Date, end: Date) => {
        try {
          const d = parseISO(dateStr);
          return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
        } catch { return false; }
      };

      const curOrders = allOrders.filter(o => inRange(o.orderDate, from, now) && o.status !== "cancelled");
      const prevOrders = allOrders.filter(o => inRange(o.orderDate, prevFrom, from) && o.status !== "cancelled");
      const curReturns = allReturns.filter(r => inRange(r.returnDate, from, now));
      const prevReturnsArr = allReturns.filter(r => inRange(r.returnDate, prevFrom, from));
      const curExpenses = allExpenses.filter(e => inRange(e.date, from, now));

      const revenue = curOrders.reduce((s, o) => s + o.total, 0);
      const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
      const cogs = curOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);
      const grossProfit = revenue - cogs;
      const totalExpenses = curExpenses.reduce((s, e) => s + e.amount, 0);
      const netProfit = grossProfit - totalExpenses;
      const prevNetProfit = prevOrders.reduce((s, o) => s + o.total, 0) - prevOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);

      const shippingOrders = allOrders.filter(o => o.status === "shipping").length;
      const lowStock = allVariants.filter(v => v.stock <= 10).length;
      const defectiveCount = allDefective.filter(d => inRange(d.date, from, now)).reduce((s, d) => s + d.quantity, 0);

      // Chart data
      const days: DailyData[] = [];
      for (let i = period - 1; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOrders = curOrders.filter(o => o.orderDate.startsWith(dayStr));
        const dayReturns = curReturns.filter(r => r.returnDate.startsWith(dayStr));
        days.push({
          date: format(day, period <= 14 ? "dd/MM" : "dd/MM", { locale: vi }),
          revenue: dayOrders.reduce((s, o) => s + o.total, 0),
          orders: dayOrders.length,
          returns: dayReturns.length,
        });
      }

      // Best sellers
      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      curOrders.forEach(o => {
        o.items.forEach(i => {
          if (!productSales[i.productId]) {
            productSales[i.productId] = { name: i.productName, qty: 0, revenue: 0 };
          }
          productSales[i.productId].qty += i.quantity;
          productSales[i.productId].revenue += i.unitPrice * i.quantity;
        });
      });
      const sellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 7);

      // Return reasons
      const reasonCounts: Record<string, number> = {};
      curReturns.forEach(r => {
        const label = r.reason || "other";
        reasonCounts[label] = (reasonCounts[label] || 0) + 1;
      });
      const reasonLabels: Record<string, string> = {
        wrong_size: "Sai size", wrong_color: "Sai màu", defective: "Lỗi",
        not_as_described: "Không đúng mô tả", changed_mind: "Đổi ý",
        damaged_shipping: "Hỏng ship", other: "Khác", wrong_product: "Sai SP",
      };
      const reasons = Object.entries(reasonCounts).map(([k, v]) => ({ name: reasonLabels[k] || k, value: v }));

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        pending: "Chờ XN", processing: "Xử lý", shipping: "Đang giao",
        delivered: "Đã giao", returned: "Hoàn", cancelled: "Hủy", return_requested: "YC hoàn",
      };
      const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));

      setStats({
        revenue, prevRevenue, orders: curOrders.length, prevOrders: prevOrders.length,
        returns: curReturns.length, prevReturns: prevReturnsArr.length,
        shipping: shippingOrders, defective: defectiveCount,
        netProfit, prevNetProfit, totalExpenses, grossProfit, lowStockCount: lowStock,
      });
      setChartData(days);
      setBestSellers(sellers);
      setReturnReasons(reasons);
      setStatusDist(statusData);
    } finally {
      setLoading(false);
    }
  }

  const pctChange = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard Tổng quan</h1>
          <p className="page-subtitle">Thống kê hoạt động shop TikTok của bạn</p>
        </div>
        <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {([7, 30, 90] as const).map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === d ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={`Doanh thu (${period} ngày)`} value={stats.revenue} icon={DollarSign}
          color="rose" format="currency" change={pctChange(stats.revenue, stats.prevRevenue)} />
        <KPICard title="Lợi nhuận ròng" value={stats.netProfit} icon={TrendingUp}
          color="emerald" format="currency" change={pctChange(stats.netProfit, stats.prevNetProfit)} />
        <KPICard title="Đơn hàng" value={stats.orders} icon={ShoppingCart}
          color="blue" format="number" change={pctChange(stats.orders, stats.prevOrders)} />
        <KPICard title="Đang giao" value={stats.shipping} icon={Truck}
          color="purple" format="number" subtitle="Đang trên đường giao" />
        <KPICard title="Hàng hoàn" value={stats.returns} icon={RotateCcw}
          color="amber" format="number" change={pctChange(stats.returns, stats.prevReturns)} />
        <KPICard title="Hàng lỗi" value={stats.defective} icon={AlertTriangle}
          color="red" format="number" subtitle="Số lượng trong kỳ" />
        <KPICard title="Tồn kho thấp" value={stats.lowStockCount} icon={Package}
          color="cyan" format="number" subtitle="Biến thể sắp hết hàng" />
        <KPICard title="Lợi nhuận gộp" value={stats.grossProfit} icon={DollarSign}
          color="indigo" format="currency" />
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">Doanh thu theo ngày</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#f43f5e" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Sellers */}
        <div className="lg:col-span-2 card">
          <h3 className="text-base font-semibold text-white mb-4">Top sản phẩm bán chạy</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bestSellers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }}
                tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
              <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Return Reasons Pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Lý do hoàn hàng</h3>
          {returnReasons.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={returnReasons} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {returnReasons.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Order status + Orders vs Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Đơn theo trạng thái (tất cả)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Đơn hàng vs Hoàn hàng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.filter((_, i) => i % Math.max(1, Math.floor(period / 14)) === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="returns" name="Hoàn hàng" fill="#f43f5e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

