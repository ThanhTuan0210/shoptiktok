import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order } from "../types";
import {
  Users, Search, Phone, Eye, Star, Award, TrendingUp, MessageSquare, MessageSquareText, ExternalLink
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "../utils/helpers";
import Modal from "../components/ui/Modal";
import QuickMessageModal from "../components/ui/QuickMessageModal";

interface CustomerAggregated {
  key: string;
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
  segment: "vip" | "loyal" | "new";
}

export default function Customers() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAggregated | null>(null);
  const [quickMsgCustomer, setQuickMsgCustomer] = useState<CustomerAggregated | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allOrders = await db.orders.orderBy("orderDate").reverse().toArray();
      setOrders(allOrders);
      setLoading(false);
    }
    load();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerAggregated>();

    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const phoneClean = (order.customerPhone || "").replace(/\D/g, "");
      const key = phoneClean || order.customerName.trim().toLowerCase();
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name: order.customerName || "Khách mua hàng",
          phone: order.customerPhone || "-",
          address: order.customerAddress || "-",
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: order.orderDate,
          orders: [],
          segment: "new",
        });
      }

      const c = map.get(key)!;
      c.orderCount += 1;
      c.totalSpent += order.total;
      c.orders.push(order);
      if (order.orderDate > c.lastOrderDate) {
        c.lastOrderDate = order.orderDate;
        if (order.customerAddress) c.address = order.customerAddress;
      }
    }

    const list = Array.from(map.values());
    for (const c of list) {
      if (c.totalSpent >= 1500000 || c.orderCount >= 4) {
        c.segment = "vip";
      } else if (c.orderCount >= 2) {
        c.segment = "loyal";
      } else {
        c.segment = "new";
      }
    }

    // Sort by total spent desc
    list.sort((a, b) => b.totalSpent - a.totalSpent);
    return list;
  }, [orders]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || c.name.toLowerCase().includes(q)
        || c.phone.includes(search)
        || c.address.toLowerCase().includes(q);
      const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
      return matchSearch && matchSegment;
    });
  }, [customers, search, segmentFilter]);

  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.segment === "vip").length;
  const loyalCount = customers.filter(c => c.segment === "loyal").length;
  const newCount = customers.filter(c => c.segment === "new").length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-rose-500" /> Quản lý Khách hàng &amp; Chăm sóc (CRM)
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tổng hợp dữ liệu khách hàng từ tất cả đơn mua để gọi điện xác nhận, remarketing và tư vấn Zalo
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Tổng khách hàng</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(totalCustomers)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Đã có đơn phát sinh</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Khách VIP</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">{formatNumber(vipCount)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Chi tiêu trên 1.500.000 đ</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Khách mua lại (Loyal)</span>
            <Star size={16} className="text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-400">{formatNumber(loyalCount)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Đặt từ 2 đơn trở lên</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Giá trị đơn TB (AOV)</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(avgOrderValue)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Trung bình trên mỗi đơn</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, địa chỉ giao hàng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSegmentFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              segmentFilter === "all" ? "bg-rose-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Tất cả ({totalCustomers})
          </button>
          <button
            onClick={() => setSegmentFilter("vip")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              segmentFilter === "vip" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            ⭐ VIP ({vipCount})
          </button>
          <button
            onClick={() => setSegmentFilter("loyal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              segmentFilter === "loyal" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Quen ({loyalCount})
          </button>
          <button
            onClick={() => setSegmentFilter("new")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              segmentFilter === "new" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Mới ({newCount})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Đang tải danh sách khách hàng...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Không tìm thấy khách hàng nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Khu vực / Địa chỉ</th>
                  <th className="py-3 px-4 text-center">Số đơn</th>
                  <th className="py-3 px-4 text-right">Tổng chi tiêu (LTV)</th>
                  <th className="py-3 px-4">Đơn gần nhất</th>
                  <th className="py-3 px-4 text-center">Phân hạng</th>
                  <th className="py-3 px-4 text-center">Liên hệ &amp; Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {filtered.map(c => {
                  const cleanPhone = c.phone.replace(/\D/g, "");
                  const hasPhone = cleanPhone.length >= 8;

                  return (
                    <tr key={c.key} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-rose-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px]">{c.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{c.phone}</span>
                          {hasPhone && (
                            <a
                              href={`tel:${c.phone}`}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                              title="Gọi điện"
                            >
                              <Phone size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-[200px]" title={c.address}>
                        {c.address}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-200">
                          {c.orderCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400 text-sm whitespace-nowrap">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(c.lastOrderDate)}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {c.segment === "vip" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⭐ VIP
                          </span>
                        )}
                        {c.segment === "loyal" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Khách quen
                          </span>
                        )}
                        {c.segment === "new" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-400">
                            Mới
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {hasPhone && (
                            <a
                              href={`https://zalo.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors inline-flex items-center gap-1 border border-blue-500/20"
                              title="Chat Zalo với khách"
                            >
                              <MessageSquare size={12} /> Zalo
                            </a>
                          )}
                          <a
                            href={`https://seller-vn.tiktok.com/chat${c.orders[0]?.tiktokOrderId ? `?order_id=${c.orders[0].tiktokOrderId}` : ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center gap-1 border border-rose-500/20"
                            title="Chat TikTok Shop với khách"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                            </svg>
                            <span>TikTok</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setQuickMsgCustomer(c)}
                            className="px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center gap-1 border border-emerald-500/20"
                            title="Mẫu tin nhắn chăm sóc"
                          >
                            <MessageSquareText size={12} /> Mẫu
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Xem lịch sử mua hàng"
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Hồ sơ khách hàng: ${selectedCustomer.name}`}
          size="lg"
        >
          <div className="space-y-4 text-sm">
            {/* Contact Actions Header inside modal */}
            <div className="flex items-center justify-between bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5 flex-wrap gap-2">
              <div>
                <p className="text-white font-semibold text-base">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCustomer.phone && selectedCustomer.phone !== "-" && (
                  <>
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="btn bg-rose-600 hover:bg-rose-500 text-white text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Phone size={13} /> Gọi điện ngay
                    </a>
                    <a
                      href={`https://zalo.me/${selectedCustomer.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <MessageSquare size={13} /> Nhắn tin Zalo <ExternalLink size={11} />
                    </a>
                  </>
                )}
                <a
                  href={`https://seller-vn.tiktok.com/chat${selectedCustomer.orders[0]?.tiktokOrderId ? `?order_id=${selectedCustomer.orders[0].tiktokOrderId}` : ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-rose-500/30 text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Mở hộp thư chat TikTok Shop Seller Center"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                  </svg>
                  <span>Chat TikTok Shop</span> <ExternalLink size={11} />
                </a>
                <button
                  type="button"
                  onClick={() => setQuickMsgCustomer(selectedCustomer)}
                  className="btn bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <MessageSquareText size={13} /> Mẫu tin nhắn chăm sóc
                </button>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400">Số điện thoại</p>
                <p className="text-sm font-semibold text-white font-mono mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng đã mua</p>
                <p className="text-sm font-bold text-rose-400 mt-0.5">{formatCurrency(selectedCustomer.totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Số lượng đơn</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedCustomer.orderCount} đơn</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phân loại</p>
                <p className="text-sm font-semibold text-amber-400 mt-0.5 uppercase">
                  {selectedCustomer.segment === "vip" ? "Khách VIP" : selectedCustomer.segment === "loyal" ? "Khách quen" : "Khách mới"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Địa chỉ giao hàng gần nhất:</p>
              <p className="text-xs text-gray-200 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700">
                📍 {selectedCustomer.address}
              </p>
            </div>

            {/* Orders list */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Lịch sử {selectedCustomer.orders.length} đơn hàng
              </p>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {selectedCustomer.orders.map(order => (
                  <div key={order.id} className="bg-gray-800/40 border border-gray-700/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{order.tiktokOrderId}</span>
                        <span className="text-gray-400">{formatDate(order.orderDate)}</span>
                      </div>
                      <p className="text-gray-400 mt-1">
                        {order.items.map(i => `${i.productName} (${i.variantInfo || "Bộ"}) x${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-rose-400">{formatCurrency(order.total)}</p>
                      <span className="text-[10px] text-gray-400 capitalize">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
