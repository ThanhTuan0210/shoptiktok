import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order } from "../types";
import {
  Users, Search, ShoppingBag, DollarSign, Calendar,
  Phone, MapPin, Eye, Star, Award, TrendingUp, X
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "../utils/helpers";
import Modal from "../components/ui/Modal";

interface CustomerAggregated {
  key: string; // phone or name
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
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-rose-500" /> Quản lý Khách hàng (CRM)
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tổng hợp dữ liệu khách hàng từ tất cả đơn mua để chăm sóc & tiếp thị lại
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
            placeholder="Tìm theo tên, SĐT, địa chỉ giao hàng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
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
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {filtered.map(c => (
                  <tr key={c.key} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-rose-400">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[150px]">{c.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-xs">{c.phone}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-[200px]" title={c.address}>
                      {c.address}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-200">
                        {c.orderCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400 text-sm">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">{formatDate(c.lastOrderDate)}</td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Xem lịch sử mua hàng"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
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
                {selectedCustomer.address}
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
