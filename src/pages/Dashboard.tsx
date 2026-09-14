import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db/database";
import {
  ShoppingCart, DollarSign, Package, RotateCcw,
  TrendingUp, AlertTriangle, Truck, CheckCircle2,
  Clock, Phone, Printer, ArrowRight, Eye, Sparkles, X, Radio
} from "lucide-react";
import { subscribeToNewOrders, type OrderBroadcastPayload } from "../utils/orderSyncEvents";
import KPICard from "../components/ui/KPICard";
import PrintShippingModal from "../components/ui/PrintShippingModal";
import Modal from "../components/ui/Modal";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency, formatNumber, formatDate, truncate, now } from "../utils/helpers";
import type { Order } from "../types";

const COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  returns: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);

  // Live actionable counts for Action Center
  const [actionCounts, setActionCounts] = useState({
    pending: 0,
    processing: 0,
    lowStock: 0,
    issues: 0,
  });

  // Recent orders
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [printOrders, setPrintOrders] = useState<Order[]>([]);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

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
  const [liveOrderToast, setLiveOrderToast] = useState<OrderBroadcastPayload | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  useEffect(() => {
    const unsubscribe = subscribeToNewOrders((payload) => {
      loadData();
      if (payload.orderId !== "FOCUS_SYNC" && payload.customerName) {
        setLiveOrderToast(payload);
        const timer = setTimeout(() => {
          setLiveOrderToast(null);
        }, 7000);
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const nowTime = new Date();
      const from = subDays(nowTime, period);
      const prevFrom = subDays(nowTime, period * 2);

      const allOrders = await db.orders.toArray();
      const allReturns = await db.returns.toArray();
      const allDefective = await db.defectiveItems.toArray();
      const allExpenses = await db.expenses.toArray();
      const allVariants = await db.productVariants.toArray();

      // Action Center Live Counts
      const pendingCount = allOrders.filter(o => o.status === "pending").length;
      const processingCount = allOrders.filter(o => o.status === "processing").length;
      const lowStockCount = allVariants.filter(v => v.stock <= 10).length;
      const issuesCount = allReturns.filter(r => r.status === "pending" || !r.status).length
        + allOrders.filter(o => o.status === "return_requested").length;

      setActionCounts({
        pending: pendingCount,
        processing: processingCount,
        lowStock: lowStockCount,
        issues: issuesCount,
      });

      // Recent 6 orders
      const sortedOrders = [...allOrders].sort((a, b) => {
        const dateA = a.createdAt || a.orderDate || "";
        const dateB = b.createdAt || b.orderDate || "";
        return dateB.localeCompare(dateA);
      }).slice(0, 6);
      setRecentOrders(sortedOrders);

      const inRange = (dateStr: string, start: Date, end: Date) => {
        try {
          const d = parseISO(dateStr);
          return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
        } catch { return false; }
      };

      const curOrders = allOrders.filter(o => inRange(o.orderDate, from, nowTime) && o.status !== "cancelled");
      const prevOrders = allOrders.filter(o => inRange(o.orderDate, prevFrom, from) && o.status !== "cancelled");
      const curReturns = allReturns.filter(r => inRange(r.returnDate, from, nowTime));
      const prevReturnsArr = allReturns.filter(r => inRange(r.returnDate, prevFrom, from));
      const curExpenses = allExpenses.filter(e => inRange(e.date, from, nowTime));

      const revenue = curOrders.reduce((s, o) => s + o.total, 0);
      const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
      const cogs = curOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);
      const grossProfit = revenue - cogs;
      const totalExpenses = curExpenses.reduce((s, e) => s + e.amount, 0);
      const netProfit = grossProfit - totalExpenses;
      const prevNetProfit = prevOrders.reduce((s, o) => s + o.total, 0) - prevOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.unitCost || 0) * i.quantity, 0), 0);

      const shippingOrders = allOrders.filter(o => o.status === "shipping").length;
      const defectiveCount = allDefective.filter(d => inRange(d.date, from, nowTime)).reduce((s, d) => s + d.quantity, 0);

      // Chart data
      const days: DailyData[] = [];
      for (let i = period - 1; i >= 0; i--) {
        const day = subDays(nowTime, i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOrders = curOrders.filter(o => o.orderDate.startsWith(dayStr));
        const dayReturns = curReturns.filter(r => r.returnDate.startsWith(dayStr));
        days.push({
          date: format(day, "dd/MM", { locale: vi }),
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
        wrong_size: "Sai size", wrong_color: "Sai màu", defective: "Lỗi SP",
        not_as_described: "Không đúng mô tả", changed_mind: "Đổi ý",
        damaged_shipping: "Hỏng do ship", other: "Khác", wrong_product: "Giao sai SP",
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
        netProfit, prevNetProfit, totalExpenses, grossProfit, lowStockCount,
      });
      setChartData(days);
      setBestSellers(sellers);
      setReturnReasons(reasons);
      setStatusDist(statusData);
    } finally {
      setLoading(false);
    }
  }

  // Quick Approve Order directly from Dashboard
  async function handleQuickApprove(orderId: string) {
    await db.orders.update(orderId, {
      status: "processing",
      updatedAt: now(),
    });
    setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "processing" } : o));
    setActionCounts(prev => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      processing: prev.processing + 1,
    }));
  }

  const pctChange = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
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
          <p className="text-gray-400 text-sm font-medium">Đang tải dữ liệu Henr.Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Live Real-time Order Popup Banner */}
      {liveOrderToast && (
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-gray-900 to-rose-900 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-rose-600/30 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
                🎉
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white flex items-center gap-1 shadow-sm">
                    <Radio size={12} className="animate-pulse" /> NỔ ĐƠN MỚI REALTIME
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    Mã: #{liveOrderToast.orderId}
                  </span>
                  <span className="text-xs text-gray-400">
                    • {new Date(liveOrderToast.timestamp).toLocaleTimeString("vi-VN")}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Khách: <span className="text-amber-300">{liveOrderToast.customerName}</span> • Tổng tiền:{" "}
                  <span className="text-emerald-400 font-black">{formatCurrency(liveOrderToast.totalAmount ?? liveOrderToast.total ?? 0)}</span>
                </h3>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Đã tự động cập nhật số liệu Dashboard mà không cần tải lại trang (Zero F5)!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate("/orders")}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow"
              >
                Xem đơn ngay <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setLiveOrderToast(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Trung tâm Quản trị Shop</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <Sparkles size={12} /> Henr.Studio
            </span>
          </div>
          <p className="page-subtitle">Theo dõi tiến độ đơn hàng, doanh số và nhiệm vụ vận hành hôm nay</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Realtime Sync (Zero F5)
          </span>
          <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {([7, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === d ? "bg-rose-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ACTION CENTER - VIỆC CẦN LÀM HÔM NAY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Clock size={16} className="text-rose-500" /> Việc cần làm hôm nay (Action Center)
          </h2>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Tự động cập nhật không cần F5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Chờ duyệt */}
          <div
            onClick={() => navigate("/orders?status=pending")}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              actionCounts.pending > 0
                ? "bg-gradient-to-br from-amber-950/40 to-gray-900 border-amber-600/50 hover:border-amber-500 shadow-lg hover:shadow-amber-500/10"
                : "bg-gray-900/80 border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Clock size={14} /> Chờ xác nhận
              </span>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">
                {formatNumber(actionCounts.pending)} <span className="text-xs font-normal text-gray-400">đơn</span>
              </p>
              {actionCounts.pending > 0 ? (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Cần duyệt ngay
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã duyệt hết
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Bấm để vào trang duyệt và in nhanh đơn hàng</p>
          </div>

          {/* 2. Cần đóng gói */}
          <div
            onClick={() => navigate("/orders?status=processing")}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              actionCounts.processing > 0
                ? "bg-gradient-to-br from-blue-950/40 to-gray-900 border-blue-600/50 hover:border-blue-500 shadow-lg hover:shadow-blue-500/10"
                : "bg-gray-900/80 border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <Package size={14} /> Cần đóng gói & In A6
              </span>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">
                {formatNumber(actionCounts.processing)} <span className="text-xs font-normal text-gray-400">đơn</span>
              </p>
              {actionCounts.processing > 0 ? (
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Chuẩn bị gửi
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã giao shipper
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Gói hàng, dán mã vận đơn A6 và bàn giao đơn vị VC</p>
          </div>

          {/* 3. Tồn kho thấp */}
          <div
            onClick={() => navigate("/inventory?stock=low")}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              actionCounts.lowStock > 0
                ? "bg-gradient-to-br from-red-950/30 to-gray-900 border-red-700/50 hover:border-red-500 shadow-lg hover:shadow-red-500/10"
                : "bg-gray-900/80 border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Cảnh báo tồn kho
              </span>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">
                {formatNumber(actionCounts.lowStock)} <span className="text-xs font-normal text-gray-400">mẫu</span>
              </p>
              {actionCounts.lowStock > 0 ? (
                <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  Tồn &le; 10 bộ
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đầy đủ kho
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Cần liên hệ xưởng may nhập thêm hàng bán chạy</p>
          </div>

          {/* 4. Khiếu nại / Hoàn hàng */}
          <div
            onClick={() => navigate("/issues")}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              actionCounts.issues > 0
                ? "bg-gradient-to-br from-purple-950/30 to-gray-900 border-purple-700/50 hover:border-purple-500 shadow-lg hover:shadow-purple-500/10"
                : "bg-gray-900/80 border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <RotateCcw size={14} /> Hoàn hàng & Khiếu nại
              </span>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">
                {formatNumber(actionCounts.issues)} <span className="text-xs font-normal text-gray-400">vụ việc</span>
              </p>
              {actionCounts.issues > 0 ? (
                <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Cần xử lý
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> 0 khiếu nại
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Kiểm tra kiện hoàn về, nhập kho lại hoặc đổi hàng</p>
          </div>
        </div>
      </div>

      {/* ĐƠN HÀNG MỚI NHẤT CẦN XỬ LÝ (QUICK ACTION TABLE) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart size={18} className="text-rose-500" /> Đơn hàng mới nhất cần xử lý
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Duyệt đơn, in vận đơn A6 hoặc gọi điện xác nhận nhanh ngay tại đây</p>
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            Xem tất cả đơn hàng <ArrowRight size={13} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chưa có đơn hàng nào phát sinh.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng & SĐT</th>
                  <th className="py-3 px-4">Sản phẩm đặt</th>
                  <th className="py-3 px-4 text-right">Tổng tiền (COD)</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {recentOrders.map(order => {
                  const isPending = order.status === "pending";
                  const isProcessing = order.status === "processing";

                  return (
                    <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-white">
                        {order.tiktokOrderId || truncate(order.id, 12)}
                        <p className="text-[11px] text-gray-500 font-normal mt-0.5">{formatDate(order.orderDate)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{order.customerName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-gray-400">{order.customerPhone || "—"}</span>
                          {order.customerPhone && (
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 transition-colors"
                              title="Bấm để gọi ngay"
                            >
                              <Phone size={10} /> Gọi
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <p className="text-xs text-gray-300 truncate" title={order.items?.map(i => `${i.productName} (${i.variantInfo || "bộ"}) x${i.quantity}`).join(", ")}>
                          {order.items?.length > 0
                            ? order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")
                            : "Chi tiết đơn hàng"}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5" title={order.customerAddress}>
                          📍 {truncate(order.customerAddress || "", 30)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <p className="font-bold text-rose-400 text-sm">{formatCurrency(order.total)}</p>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          COD Chưa thu
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚡ Chờ xác nhận
                          </span>
                        )}
                        {isProcessing && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            📦 Đang đóng gói
                          </span>
                        )}
                        {order.status === "shipping" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🚚 Đang giao
                          </span>
                        )}
                        {order.status === "delivered" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✅ Đã giao
                          </span>
                        )}
                        {order.status === "cancelled" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                            ❌ Đã hủy
                          </span>
                        )}
                        {(order.status === "returned" || order.status === "return_requested") && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                            🔄 Hoàn hàng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleQuickApprove(order.id)}
                              className="btn-success text-xs py-1 px-2.5 shadow-sm font-semibold flex items-center gap-1"
                              title="Duyệt đơn và chuyển sang Đóng gói"
                            >
                              <CheckCircle2 size={13} /> Duyệt đơn
                            </button>
                          )}
                          <button
                            onClick={() => setPrintOrders([order])}
                            className="btn-secondary text-xs py-1 px-2 hover:border-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                            title="In phiếu gửi hàng A6"
                          >
                            <Printer size={13} /> In A6
                          </button>
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
        <h3 className="text-base font-semibold text-white mb-4">Biểu đồ doanh thu theo ngày</h3>
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
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Không có dữ liệu hoàn hàng</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={returnReasons} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
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
          <h3 className="text-base font-semibold text-white mb-4">Đơn theo trạng thái (toàn bộ)</h3>
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

      {/* Print Shipping Modal */}
      {printOrders.length > 0 && (
        <PrintShippingModal
          orders={printOrders}
          onClose={() => setPrintOrders([])}
          shopName="Henr.Studio - Đồ Ngủ Thiết Kế"
          shopPhone="0988 234 567"
        />
      )}

      {/* Quick View Order Detail Modal */}
      {viewOrder && (
        <Modal isOpen={true} onClose={() => setViewOrder(null)} title={`Chi tiết đơn: ${viewOrder.tiktokOrderId || viewOrder.id}`} size="lg">
          <div className="space-y-4 text-sm">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400">Khách hàng</p>
                <p className="text-sm font-semibold text-white mt-0.5">{viewOrder.customerName}</p>
                <p className="text-xs text-gray-400 font-mono">{viewOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ngày đặt</p>
                <p className="text-sm font-semibold text-white mt-0.5">{formatDate(viewOrder.orderDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vận chuyển</p>
                <p className="text-sm font-semibold text-white mt-0.5">{viewOrder.shippingCarrier || "GHTK"}</p>
                <p className="text-[11px] text-gray-400 font-mono">{viewOrder.trackingNumber || "Chưa có mã"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng thu (COD)</p>
                <p className="text-base font-bold text-rose-400 mt-0.5">{formatCurrency(viewOrder.total)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Địa chỉ nhận hàng:</p>
              <p className="text-xs text-gray-200 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700">
                📍 {viewOrder.customerAddress || "Chưa có địa chỉ"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sản phẩm trong đơn ({viewOrder.items.length})</p>
              <div className="space-y-2 border border-gray-700/60 rounded-xl p-3 bg-gray-800/30">
                {viewOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-800 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-gray-400">Phân loại: <span className="text-gray-200">{item.variantInfo || "Bộ mặc nhà"}</span> • SL: <span className="text-rose-400 font-bold">x{item.quantity}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      <p className="text-[11px] text-gray-500">{formatCurrency(item.unitPrice)} / bộ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  setPrintOrders([viewOrder]);
                  setViewOrder(null);
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Printer size={14} /> In vận đơn A6
              </button>
              {viewOrder.status === "pending" && (
                <button
                  onClick={() => {
                    handleQuickApprove(viewOrder.id);
                    setViewOrder(null);
                  }}
                  className="btn-success text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Duyệt đơn ngay
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
