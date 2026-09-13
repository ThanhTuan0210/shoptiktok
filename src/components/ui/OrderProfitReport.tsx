import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Filter, Search, CheckCircle, XCircle } from "lucide-react";
import type { Order } from "../../types";
import { formatCurrency, formatDate } from "../../utils/helpers";
import * as XLSX from "xlsx";

export interface OrderProfitReportProps {
  orders: Order[];
}

export default function OrderProfitReport({ orders }: OrderProfitReportProps) {
  const [channelFilter, setChannelFilter] = useState<"all" | "tiktok" | "web">("all");
  const [marginFilter, setMarginFilter] = useState<"all" | "high" | "medium" | "low" | "loss">("all");
  const [search, setSearch] = useState("");

  // Calculate realistic profit metrics per order
  const profitData = useMemo(() => {
    return orders.map(order => {
      const isTikTok = !!order.tiktokOrderId;
      const isReturned = order.status === "returned" || order.status === "return_requested";
      const isCancelled = order.status === "cancelled";

      const revenue = isCancelled ? 0 : order.total;

      // COGS (Cost of goods sold)
      const cogs = isCancelled ? 0 : order.items.reduce((sum, item) => {
        const cost = item.unitCost && item.unitCost > 0 ? item.unitCost : Math.round(item.unitPrice * 0.42);
        return sum + cost * item.quantity;
      }, 0);

      // TikTok Fee (~4.5% if TikTok order)
      const platformFee = isTikTok && !isCancelled
        ? Math.round(order.total * (order.tiktokFeeRate ? order.tiktokFeeRate / 100 : 0.045))
        : 0;

      // Packaging cost (Box, zip, labels, tape ~ 5.000đ)
      const packagingCost = isCancelled ? 0 : 5000;

      // Shipping cost: If returned, shop incurs 2-way shipping loss ~ 45.000đ
      const shippingCost = isReturned ? 45000 : 0;

      // Net profit
      let netProfit = 0;
      if (isCancelled) {
        netProfit = 0;
      } else if (isReturned) {
        // Lost shipping + lost packaging + restock check cost
        netProfit = -(packagingCost + shippingCost);
      } else {
        netProfit = revenue - cogs - platformFee - packagingCost;
      }

      const marginPct = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

      return {
        order,
        isTikTok,
        isReturned,
        isCancelled,
        revenue,
        cogs,
        platformFee,
        packagingCost,
        shippingCost,
        netProfit,
        marginPct,
      };
    });
  }, [orders]);

  // Filtered orders
  const filtered = useMemo(() => {
    return profitData.filter(item => {
      // Channel
      if (channelFilter === "tiktok" && !item.isTikTok) return false;
      if (channelFilter === "web" && item.isTikTok) return false;

      // Margin
      if (marginFilter === "high" && item.marginPct < 30) return false;
      if (marginFilter === "medium" && (item.marginPct < 15 || item.marginPct >= 30)) return false;
      if (marginFilter === "low" && (item.marginPct < 0 || item.marginPct >= 15)) return false;
      if (marginFilter === "loss" && item.netProfit >= 0) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (item.order.tiktokOrderId || item.order.id).toLowerCase();
        const name = (item.order.customerName || "").toLowerCase();
        const phone = (item.order.customerPhone || "").toLowerCase();
        return code.includes(q) || name.includes(q) || phone.includes(q);
      }

      return true;
    });
  }, [profitData, channelFilter, marginFilter, search]);

  // Aggregated totals
  const totals = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let fee = 0;
    let pack = 0;
    let profit = 0;

    for (const item of filtered) {
      rev += item.revenue;
      cost += item.cogs;
      fee += item.platformFee;
      pack += item.packagingCost;
      profit += item.netProfit;
    }

    const avgMargin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    return { rev, cost, fee, pack, profit, avgMargin };
  }, [filtered]);

  function exportToExcel() {
    const rows = filtered.map(item => ({
      "Mã đơn hàng": item.order.tiktokOrderId || item.order.id,
      "Kênh bán": item.isTikTok ? "TikTok Shop" : "Website Henr.Studio",
      "Ngày đặt": formatDate(item.order.orderDate),
      "Khách hàng": item.order.customerName,
      "SĐT": item.order.customerPhone || "-",
      "Trạng thái": item.order.status,
      "Doanh thu (VNĐ)": item.revenue,
      "Giá vốn COGS (VNĐ)": item.cogs,
      "Phí sàn TikTok (VNĐ)": item.platformFee,
      "Phí đóng gói (VNĐ)": item.packagingCost,
      "Lợi nhuận ròng (VNĐ)": item.netProfit,
      "Tỷ suất lợi nhuận (%)": item.marginPct + "%",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoLaiLo_PL");
    XLSX.writeFile(wb, `HenrStudio_PL_ChiTiet_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-sm bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-[11px]">Tổng Doanh Thu</p>
          <p className="text-lg font-bold text-white font-mono mt-1">{formatCurrency(totals.rev)}</p>
          <span className="text-[10px] text-gray-500">{filtered.length} đơn hàng</span>
        </div>

        <div className="card-sm bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-[11px]">Tổng Giá Vốn (COGS)</p>
          <p className="text-lg font-bold text-amber-400 font-mono mt-1">{formatCurrency(totals.cost)}</p>
          <span className="text-[10px] text-gray-500">Tiền vải & gia công lụa</span>
        </div>

        <div className="card-sm bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-[11px]">Phí Sàn & Đóng Gói</p>
          <p className="text-lg font-bold text-purple-400 font-mono mt-1">{formatCurrency(totals.fee + totals.pack)}</p>
          <span className="text-[10px] text-gray-500">TikTok Fee + Hộp Zip</span>
        </div>

        <div className="card-sm bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-[11px]">LỢI NHUẬN RÒNG BỎ TÚI</p>
          <p className={`text-lg font-bold font-mono mt-1 ${totals.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(totals.profit)}
          </p>
          <span className="text-[10px] text-gray-500">Sau khi trừ hết chi phí</span>
        </div>

        <div className="card-sm bg-gray-900 border-gray-800 col-span-2 lg:col-span-1">
          <p className="text-gray-400 text-[11px]">Tỷ Suất Lợi Nhuận TB</p>
          <div className="flex items-center gap-1.5 mt-1">
            {totals.avgMargin >= 20 ? (
              <ArrowUpRight size={18} className="text-emerald-400" />
            ) : (
              <ArrowDownRight size={18} className="text-amber-400" />
            )}
            <span className={`text-lg font-bold font-mono ${totals.avgMargin >= 25 ? "text-emerald-400" : "text-amber-400"}`}>
              {totals.avgMargin}%
            </span>
          </div>
          <span className="text-[10px] text-gray-500">Biên lợi nhuận ròng</span>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="card-sm bg-gray-900 border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel selector */}
          <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
            <button
              onClick={() => setChannelFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                channelFilter === "all" ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Tất cả kênh ({profitData.length})
            </button>
            <button
              onClick={() => setChannelFilter("tiktok")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                channelFilter === "tiktok" ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              TikTok Shop ({profitData.filter(p => p.isTikTok).length})
            </button>
            <button
              onClick={() => setChannelFilter("web")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                channelFilter === "web" ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Website ({profitData.filter(p => !p.isTikTok).length})
            </button>
          </div>

          {/* Margin filter */}
          <select
            value={marginFilter}
            onChange={e => setMarginFilter(e.target.value as any)}
            className="input py-1 text-xs w-auto bg-gray-800 border-gray-700"
          >
            <option value="all">Mọi mức lợi nhuận</option>
            <option value="high">Lãi cao (&gt; 30%)</option>
            <option value="medium">Lãi chuẩn (15% - 30%)</option>
            <option value="low">Lãi mỏng (&lt; 15%)</option>
            <option value="loss">Đơn hoàn / Bị lỗ</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44"
            />
          </div>

          <button
            onClick={exportToExcel}
            className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5"
            title="Xuất Excel bảng P&L"
          >
            <Download size={13} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Detail Table */}
      <div className="table-container bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Mã Đơn & Kênh</th>
              <th>Ngày Đặt</th>
              <th>Khách Hàng</th>
              <th className="text-right">Doanh Thu</th>
              <th className="text-right">Giá Vốn</th>
              <th className="text-right">Phí Sàn</th>
              <th className="text-right">LÃI RÒNG</th>
              <th className="text-center">Biên Lãi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  Không tìm thấy đơn hàng nào phù hợp bộ lọc
                </td>
              </tr>
            ) : (
              filtered.slice(0, 50).map(item => {
                const code = item.order.tiktokOrderId || item.order.id.slice(-8);
                return (
                  <tr key={item.order.id} className="hover:bg-gray-800/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        {item.isTikTok ? (
                          <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Đơn từ TikTok Shop">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="p-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-sans font-bold" title="Đơn từ Website">
                            WEB
                          </span>
                        )}
                        <span className="font-semibold text-white">#{code}</span>
                      </div>
                    </td>
                    <td className="text-gray-400 whitespace-nowrap">{formatDate(item.order.orderDate)}</td>
                    <td>
                      <p className="font-medium text-white">{item.order.customerName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{item.order.customerPhone || "—"}</p>
                    </td>
                    <td className="text-right font-mono font-medium text-white">{formatCurrency(item.revenue)}</td>
                    <td className="text-right font-mono text-amber-300">{formatCurrency(item.cogs)}</td>
                    <td className="text-right font-mono text-purple-300">{formatCurrency(item.platformFee)}</td>
                    <td className="text-right font-mono font-bold">
                      <span className={item.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(item.netProfit)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.marginPct >= 30
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                            : item.marginPct >= 15
                            ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                            : item.marginPct > 0
                            ? "bg-yellow-950/60 text-yellow-400 border border-yellow-800"
                            : "bg-rose-950/60 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {item.marginPct}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
