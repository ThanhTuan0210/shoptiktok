import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order, AppSettings, Product } from "../types";
import {
  ShoppingBag, Truck, DollarSign, Download, Upload, ExternalLink,
  RefreshCw, CheckCircle2, Clock, RotateCcw, AlertTriangle, Eye,
  Search, Filter, ArrowUpRight, MessageCircle, BarChart3, Radio, Flame
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber, truncate } from "../utils/helpers";
import { exportShopeeTemplate, exportOrdersToExcel, importOrdersFromExcel } from "../utils/exportData";
import Modal from "../components/ui/Modal";

export default function ShopeeCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "spx" | "live">("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const shopeeShopName = localStorage.getItem("shopee_shopName") || "henr_studio_official";
  const shopeeFeeRate = parseFloat(localStorage.getItem("shopee_feeRate") || "9.5");

  useEffect(() => {
    loadShopeeData();
  }, []);

  async function loadShopeeData() {
    setLoading(true);
    const all = await db.orders.toArray();
    // Lọc 100% đơn hàng thuộc kênh Shopee
    const shopeeOnly = all.filter(o => 
      o.channel === "shopee" || 
      Boolean(o.shopeeOrderId) || 
      (o.note || "").toLowerCase().includes("shopee")
    );
    setOrders(shopeeOnly.sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
    setLoading(false);
  }

  // Thống kê nhanh Shopee
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === "delivered");
    const pending = orders.filter(o => o.status === "pending");
    const processing = orders.filter(o => o.status === "processing");
    const shipping = orders.filter(o => o.status === "shipping");
    const returned = orders.filter(o => o.status === "returned" || o.status === "return_requested");

    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0);
    const deliveredRevenue = delivered.reduce((sum, o) => sum + o.total, 0);

    // Tính phí sàn thực tế
    const totalShopeeFees = orders.reduce((sum, o) => {
      if (o.status === "cancelled") return sum;
      return sum + (o.shopeeFeeAmount || Math.round(o.total * (shopeeFeeRate / 100)));
    }, 0);

    const netPayout = Math.max(0, totalRevenue - totalShopeeFees);

    return {
      totalOrders,
      pending: pending.length,
      processing: processing.length,
      shipping: shipping.length,
      delivered: delivered.length,
      returned: returned.length,
      totalRevenue,
      deliveredRevenue,
      totalShopeeFees,
      netPayout,
    };
  }, [orders, shopeeFeeRate]);

  // Bộ lọc đơn Shopee
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search || 
        (o.shopeeOrderId || "").toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone || "").includes(search) ||
        (o.trackingNumber || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  async function handleUpdateStatus(id: string, newStatus: any) {
    await db.orders.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
    await loadShopeeData();
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Shopee Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-[#EE4D2D] to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <ShoppingBag size={220} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
                Shopee Seller Centre
              </span>
              <span className="flex items-center gap-1 text-xs bg-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Kết Nối Trực Tiếp SPX
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Trung Tâm Điều Hành Kênh Shopee
            </h1>
            <p className="text-orange-100 text-xs md:text-sm mt-1 max-w-xl">
              Quản lý vận đơn SPX Express, đối soát ví Shopee (phí 9.5%), in phiếu gửi hàng chuẩn quy cách Shopee Seller.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportShopeeTemplate()}
              className="px-3.5 py-2 rounded-xl bg-white text-[#EE4D2D] hover:bg-orange-50 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download size={14} /> Tải Mẫu Excel Shopee
            </button>
            <a
              href="https://banhang.shopee.vn"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-orange-800/60 hover:bg-orange-800/80 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all"
            >
              <ExternalLink size={14} /> Mở Kênh Người Bán <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Shopee Sub-Tabs */}
      <div className="flex border-b border-gray-800 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={"px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors " + (activeTab === "overview" ? "border-[#EE4D2D] text-[#EE4D2D]" : "border-transparent text-gray-400 hover:text-gray-200")}
        >
          <BarChart3 size={16} /> Tổng Quan Kênh Shopee
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={"px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors " + (activeTab === "orders" ? "border-[#EE4D2D] text-[#EE4D2D]" : "border-transparent text-gray-400 hover:text-gray-200")}
        >
          <ShoppingBag size={16} /> Đơn Hàng Shopee ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("spx")}
          className={"px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors " + (activeTab === "spx" ? "border-[#EE4D2D] text-[#EE4D2D]" : "border-transparent text-gray-400 hover:text-gray-200")}
        >
          <Truck size={16} /> Điều Vận SPX Express ({stats.shipping})
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={"px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors " + (activeTab === "live" ? "border-[#EE4D2D] text-[#EE4D2D]" : "border-transparent text-gray-400 hover:text-gray-200")}
        >
          <Radio size={16} className="text-orange-400" /> Shopee Live & Flash Sale
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-sm bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-400">Tổng doanh thu Shopee</p>
              <p className="text-xl font-extrabold text-white mt-1 font-mono">{formatCurrency(stats.totalRevenue)}</p>
              <span className="text-[11px] text-gray-500 mt-1 block">{stats.totalOrders} đơn hàng phát sinh</span>
            </div>
            <div className="card-sm bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-400">Phí sàn khấu trừ ({shopeeFeeRate}%)</p>
              <p className="text-xl font-extrabold text-rose-400 mt-1 font-mono">-{formatCurrency(stats.totalShopeeFees)}</p>
              <span className="text-[11px] text-gray-500 mt-1 block">5% thanh toán + 4.5% cố định</span>
            </div>
            <div className="card-sm bg-gray-900 border border-orange-900/40 bg-gradient-to-br from-gray-900 to-orange-950/20">
              <p className="text-xs text-orange-400 font-medium">Thực nhận về Ví Shopee</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{formatCurrency(stats.netPayout)}</p>
              <span className="text-[11px] text-emerald-500/80 mt-1 block">Khả dụng rút tài khoản bank</span>
            </div>
            <div className="card-sm bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-400">Đơn giao thành công</p>
              <p className="text-xl font-extrabold text-cyan-400 mt-1 font-mono">{stats.delivered} / {stats.totalOrders}</p>
              <span className="text-[11px] text-gray-500 mt-1 block">Tỉ lệ giao: {stats.totalOrders > 0 ? Math.round((stats.delivered / stats.totalOrders) * 100) : 0}%</span>
            </div>
          </div>

          {/* Action Center Shopee */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold uppercase text-gray-300 tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-[#EE4D2D]" /> Cần Xử Lý Shopee Hôm Nay
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div 
                onClick={() => { setActiveTab("orders"); setStatusFilter("pending"); }}
                className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 cursor-pointer transition-all"
              >
                <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <Clock size={13} /> Chờ duyệt
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                <span className="text-[11px] text-gray-500">Cần xác nhận chuẩn bị hàng</span>
              </div>
              <div 
                onClick={() => { setActiveTab("orders"); setStatusFilter("processing"); }}
                className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 cursor-pointer transition-all"
              >
                <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <ShoppingBag size={13} /> Đang đóng gói
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stats.processing}</p>
                <span className="text-[11px] text-gray-500">Chờ in phiếu gửi SPX</span>
              </div>
              <div 
                onClick={() => { setActiveTab("spx"); }}
                className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 cursor-pointer transition-all"
              >
                <p className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                  <Truck size={13} /> Đang giao (SPX)
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stats.shipping}</p>
                <span className="text-[11px] text-gray-500">Bưu tá đang vận chuyển</span>
              </div>
              <div 
                onClick={() => { setActiveTab("orders"); setStatusFilter("returned"); }}
                className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 cursor-pointer transition-all"
              >
                <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                  <RotateCcw size={13} /> Hoàn hàng / Trả
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stats.returned}</p>
                <span className="text-[11px] text-gray-500">Kiểm tra kiện hoàn Shopee</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOPEE ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm mã đơn Shopee, tên khách, SĐT, mã SPX..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
              {["all", "pending", "processing", "shipping", "delivered", "returned"].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={"px-3 py-1.5 rounded-lg border transition-all " + (statusFilter === st ? "bg-[#EE4D2D] text-white border-[#EE4D2D]" : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white")}
                >
                  {st === "all" ? "Tất cả đơn Shopee" : st === "pending" ? "Chờ duyệt" : st === "processing" ? "Đóng gói" : st === "shipping" ? "Đang giao" : st === "delivered" ? "Đã giao" : "Hoàn trả"}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn Shopee</th>
                  <th>Khách hàng & SĐT</th>
                  <th>Sản phẩm đặt</th>
                  <th className="text-right">Tổng tiền</th>
                  <th className="text-right">Phí sàn (9.5%)</th>
                  <th className="text-right">Ví Shopee</th>
                  <th>Vận đơn SPX</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      Chưa có đơn hàng Shopee nào khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const fee = o.shopeeFeeAmount || Math.round(o.total * (shopeeFeeRate / 100));
                    const net = Math.max(0, o.total - fee);
                    return (
                      <tr key={o.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="font-mono text-xs">
                          <span className="font-bold text-orange-400">#{o.shopeeOrderId || truncate(o.id, 12)}</span>
                          <p className="text-[11px] text-gray-500 font-normal">{formatDate(o.orderDate)}</p>
                        </td>
                        <td>
                          <p className="font-medium text-white">{o.customerName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400 font-mono">{o.customerPhone || "—"}</span>
                            <a
                              href="https://banhang.shopee.vn/webchat/conversations"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-orange-400 hover:underline flex items-center gap-0.5"
                            >
                              <MessageCircle size={10} /> Chat
                            </a>
                          </div>
                        </td>
                        <td className="max-w-[200px]">
                          <p className="text-xs text-gray-300 truncate">
                            {o.items?.map(i => i.productName + " x" + i.quantity).join(", ") || "Chi tiết đơn"}
                          </p>
                        </td>
                        <td className="text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatCurrency(o.total)}
                        </td>
                        <td className="text-right font-mono text-rose-400 text-xs whitespace-nowrap">
                          -{formatCurrency(fee)}
                        </td>
                        <td className="text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {formatCurrency(net)}
                        </td>
                        <td>
                          <p className="text-xs text-gray-300 font-medium">SPX Express</p>
                          {o.trackingNumber ? (
                            <a
                              href={"https://spx.vn/track?" + (o.trackingNumber || "")}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-400 hover:underline font-mono inline-flex items-center gap-0.5"
                            >
                              {truncate(o.trackingNumber, 14)} ↗
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-500">Chờ gán mã</span>
                          )}
                        </td>
                        <td className="text-center">
                          <select
                            value={o.status}
                            onChange={e => handleUpdateStatus(o.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full border bg-gray-900 text-gray-200 cursor-pointer"
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="processing">Đang đóng gói</option>
                            <option value="shipping">Đang giao SPX</option>
                            <option value="delivered">Đã giao thành công</option>
                            <option value="returned">Hoàn trả hàng</option>
                            <option value="cancelled">Đã hủy đơn</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SPX EXPRESS */}
      {activeTab === "spx" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-[#EE4D2D]" /> Điều Vận & Tra Cứu SPX Express
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Đơn vị vận chuyển tích hợp độc quyền trên Shopee Seller Centre.
              </p>
            </div>
            <a
              href="https://spx.vn"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              Cổng Tra Cứu SPX.VN <ExternalLink size={12} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.filter(o => o.status === "shipping" || o.trackingNumber).map(o => (
              <div key={o.id} className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">#{o.shopeeOrderId || o.id.slice(-8)}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                      {o.status === "shipping" ? "Đang luân chuyển" : "Đã giao"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">Người nhận: <strong className="text-white">{o.customerName}</strong> ({o.customerPhone})</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5" title={o.customerAddress}>📍 {o.customerAddress}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">Mã VĐ: {o.trackingNumber || "Chưa tạo mã"}</span>
                    {o.trackingNumber && (
                      <a
                              href={"https://spx.vn/track?" + (o.trackingNumber || "")}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-orange-400 hover:underline flex items-center gap-0.5"
                      >
                        Xem hành trình bưu kiện &rarr;
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="font-bold text-white text-sm font-mono">{formatCurrency(o.total)}</p>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1 inline-block">
                    COD Shopee
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SHOPEE LIVE & FLASH SALE */}
      {activeTab === "live" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame size={18} className="text-[#EE4D2D]" /> Shopee Live Studio & Khóa Kho Flash Sale
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Đồng bộ số lượng tồn kho tự động khi mở phiên Live Stream trên ứng dụng Shopee Live.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-[#EE4D2D] border border-orange-500/30 font-bold">
              Shop: @{shopeeShopName}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/60">
              <p className="text-xs text-gray-400">Voucher Shopee Live độc quyền</p>
              <p className="text-lg font-bold text-white mt-1">Giảm 15% tối đa 40K</p>
              <p className="text-[11px] text-orange-400 mt-1">Tự động gắn mã cho khách xem live</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/60">
              <p className="text-xs text-gray-400">Ngưỡng khóa kho an toàn</p>
              <p className="text-lg font-bold text-white mt-1">5 bộ / biến thể</p>
              <p className="text-[11px] text-gray-500 mt-1">Chống bán vượt quá số lượng kho may</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/60">
              <p className="text-xs text-gray-400">Trạng thái phát trực tiếp</p>
              <p className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Sẵn sàng phát sóng
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Đã kết nối Shopee Live RTMP</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn */}
      {selectedOrder && (
        <Modal isOpen={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={"Chi Tiết Đơn Hàng Shopee #" + (selectedOrder ? (selectedOrder.shopeeOrderId || selectedOrder.id) : "")}>
          <div className="space-y-4 text-sm text-gray-200">
            <div className="bg-gray-800/60 p-4 rounded-xl space-y-2">
              <p><strong>Khách hàng:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone || "—"})</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerAddress || "Chưa có địa chỉ"}</p>
              <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.orderDate)}</p>
              <p><strong>Đơn vị vận chuyển:</strong> SPX Express (Mã VĐ: {selectedOrder.trackingNumber || "Chưa tạo"})</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-gray-400 mb-2">Sản phẩm</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded bg-gray-800 text-xs">
                    <span>{it.productName} ({it.variantInfo || "Bộ"}) x{it.quantity}</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 font-bold">
              <span>Tổng thanh toán:</span>
              <span className="text-orange-400 text-base">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

