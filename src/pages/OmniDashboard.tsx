import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, Expense } from "../types";
import {
  Layers, ShoppingBag, Globe, DollarSign, TrendingUp,
  BarChart3, PieChart as PieIcon
} from "lucide-react";
import { formatCurrency } from "../utils/helpers";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

export default function OmniDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [ords, exps] = await Promise.all([
      db.orders.toArray(),
      db.expenses.toArray(),
    ]);
    setOrders(ords);
    setExpenses(exps);
  }

  const metrics = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const filteredOrders = orders.filter(o => o.orderDate >= cutoff && o.status !== "cancelled");

    let shopeeRev = 0, shopeeOrders = 0, shopeeDelivered = 0, shopeeFees = 0;
    let tiktokRev = 0, tiktokOrders = 0, tiktokDelivered = 0, tiktokFees = 0;
    let webRev = 0, webOrders = 0, webDelivered = 0;

    filteredOrders.forEach(o => {
      const isShopee = o.channel === "shopee" || Boolean(o.shopeeOrderId) || (o.note || "").toLowerCase().includes("shopee");
      const isWeb = o.channel === "website" || (o.tiktokOrderId || "").startsWith("WEB-");

      if (isShopee) {
        shopeeRev += o.total;
        shopeeOrders++;
        if (o.status === "delivered") shopeeDelivered++;
        shopeeFees += o.shopeeFeeAmount || Math.round(o.total * 0.095);
      } else if (isWeb) {
        webRev += o.total;
        webOrders++;
        if (o.status === "delivered") webDelivered++;
      } else {
        tiktokRev += o.total;
        tiktokOrders++;
        if (o.status === "delivered") tiktokDelivered++;
        tiktokFees += o.tiktokFeeAmount || Math.round(o.total * 0.025);
      }
    });

    const totalRev = shopeeRev + tiktokRev + webRev;
    const totalPlatformFees = shopeeFees + tiktokFees;

    const cogs = filteredOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + ((item.unitCost || 0) * item.quantity), 0);
    }, 0);

    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRev - cogs - totalPlatformFees - totalExp;

    const pieData = [
      { name: "Shopee", value: shopeeRev, color: "#EE4D2D", orders: shopeeOrders },
      { name: "TikTok Shop", value: tiktokRev, color: "#FE2C55", orders: tiktokOrders },
      { name: "Website / Trực tiếp", value: webRev, color: "#6366F1", orders: webOrders },
    ].filter(item => item.value > 0);

    return {
      totalRev,
      shopeeRev, shopeeOrders, shopeeDelivered, shopeeFees,
      tiktokRev, tiktokOrders, tiktokDelivered, tiktokFees,
      webRev, webOrders, webDelivered,
      totalPlatformFees,
      cogs,
      netProfit,
      pieData,
    };
  }, [orders, expenses, timeRange]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Layers size={24} className="text-rose-500" />
            Báo Cáo Tổng Hợp 3 Nền Tảng (Omnichannel)
          </h1>
          <p className="page-subtitle">
            Hợp nhất doanh số, đối soát dòng tiền và thị phần giữa TikTok Shop, Shopee và Website Bán lẻ.
          </p>
        </div>

        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 self-start sm:self-auto">
          {(["7", "30", "90"] as const).map(d => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={"px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all " + (timeRange === d ? "bg-rose-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}
            >
              {d} Ngày Qua
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-sm bg-gradient-to-br from-gray-900 via-gray-900 to-orange-950/30 border border-orange-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#EE4D2D]">
              🛍️ Shopee
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {metrics.totalRev > 0 ? Math.round((metrics.shopeeRev / metrics.totalRev) * 100) : 0}% Doanh Số
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(metrics.shopeeRev)}</p>
          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span>{metrics.shopeeOrders} đơn hàng ({metrics.shopeeDelivered} đã giao)</span>
            <span className="text-rose-400 font-mono text-[11px]">Phí: -{formatCurrency(metrics.shopeeFees)}</span>
          </div>
        </div>

        <div className="card-sm bg-gradient-to-br from-gray-900 via-gray-900 to-rose-950/30 border border-rose-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              🎵 TikTok Shop
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              {metrics.totalRev > 0 ? Math.round((metrics.tiktokRev / metrics.totalRev) * 100) : 0}% Doanh Số
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(metrics.tiktokRev)}</p>
          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span>{metrics.tiktokOrders} đơn hàng ({metrics.tiktokDelivered} đã giao)</span>
            <span className="text-rose-400 font-mono text-[11px]">Phí: -{formatCurrency(metrics.tiktokFees)}</span>
          </div>
        </div>

        <div className="card-sm bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30 border border-indigo-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              🌐 Website / Bán Lẻ
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              {metrics.totalRev > 0 ? Math.round((metrics.webRev / metrics.totalRev) * 100) : 0}% Doanh Số
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(metrics.webRev)}</p>
          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span>{metrics.webOrders} đơn hàng ({metrics.webDelivered} đã giao)</span>
            <span className="text-emerald-400 font-mono text-[11px]">0đ phí sàn</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-white mb-2 self-start flex items-center gap-2">
            <PieIcon size={16} className="text-rose-500" /> Tỷ Trọng Thị Phần Doanh Số
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.pieData.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-1.5 mt-2">
            {metrics.pieData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.name} ({d.orders} đơn)
                </span>
                <span className="font-mono font-bold text-white">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" /> Cân Đối Tài Chính Tổng Hợp ({timeRange} ngày)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <span className="text-xs text-gray-300">Tổng doanh thu 3 sàn (Gross Revenue)</span>
              <span className="text-base font-extrabold text-white font-mono">{formatCurrency(metrics.totalRev)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <span className="text-xs text-gray-300">Giá vốn hàng bán (COGS)</span>
              <span className="text-sm font-bold text-amber-400 font-mono">-{formatCurrency(metrics.cogs)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <span className="text-xs text-gray-300">Tổng phí nền tảng đã chiết khấu (Shopee 9.5% + TikTok 2.5%)</span>
              <span className="text-sm font-bold text-rose-400 font-mono">-{formatCurrency(metrics.totalPlatformFees)}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase block">Lợi Nhuận Ròng Thực Tế (Net Profit)</span>
                <span className="text-[11px] text-gray-400">Đã trừ vốn, phí hoa hồng 3 sàn và phí vận hành</span>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(metrics.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
