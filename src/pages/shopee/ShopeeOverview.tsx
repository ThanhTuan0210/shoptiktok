import { useEffect, useState, useMemo } from "react";
import { db } from "../../db/database";
import type { Order } from "../../types";
import {
  ShoppingBag, DollarSign, CheckCircle2,
  Clock, RotateCcw, ArrowUpRight, Percent, RefreshCw, Truck, PlusCircle
} from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import { Link } from "react-router-dom";
import { generateShopeeOrders } from "../../utils/generateShopeeOrders";

export default function ShopeeOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const shopeeShopName = localStorage.getItem("shopee_shopName") || "henr_studio_official";
  const shopeeFeeRate = parseFloat(localStorage.getItem("shopee_feeRate") || "9.5");

  useEffect(() => {
    async function load() {
      const all = await db.orders.toArray();
      const shopeeOnly = all.filter(o => 
        o.channel === "shopee" || 
        Boolean(o.shopeeOrderId) || 
        (o.note || "").toLowerCase().includes("shopee")
      );
      setOrders(shopeeOnly);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === "delivered");
    const pending = orders.filter(o => o.status === "pending");
    const processing = orders.filter(o => o.status === "processing");
    const shipping = orders.filter(o => o.status === "shipping");
    const returned = orders.filter(o => o.status === "returned" || o.status === "return_requested");

    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0);
    const deliveredRevenue = delivered.reduce((sum, o) => sum + o.total, 0);

    const totalShopeeFees = orders.reduce((sum, o) => {
      if (o.status === "cancelled") return sum;
      return sum + (o.shopeeFeeAmount || Math.round(o.total * (shopeeFeeRate / 100)));
    }, 0);

    const netPayout = Math.max(0, totalRevenue - totalShopeeFees);
    const walletBalance = Math.round(deliveredRevenue * 0.905);

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
      walletBalance,
      responseRate: 98.6,
      shopeeRating: 4.92,
      onTimeShipRate: 99.1,
    };
  }, [orders, shopeeFeeRate]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-[#EE4D2D] to-red-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={13} /> Shopee Seller Centre VN
              </span>
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                Official Store
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Tổng Quan Hiệu Suất Gian Hàng Shopee
            </h1>
            <p className="text-orange-100 text-sm mt-1">
              Gian hàng chính hãng: <strong>@{shopeeShopName}</strong> • Phí cố định & thanh toán sàn: <strong>{shopeeFeeRate}%</strong>.
            </p>
          </div>
          <div>
            <button
              onClick={async () => {
                await generateShopeeOrders(50);
                const all = await db.orders.toArray();
                const shopeeOnly = all.filter(o => 
                  o.channel === "shopee" || 
                  Boolean(o.shopeeOrderId) || 
                  (o.note || "").toLowerCase().includes("shopee")
                );
                setOrders(shopeeOnly);
                alert("Đã tạo thêm 50 đơn hàng Shopee ngẫu nhiên thành công!");
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-[#EE4D2D] hover:bg-orange-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <PlusCircle size={15} /> Tạo Nhanh 50 Đơn Shopee
            </button>
          </div>
        </div>

        {/* 4 Khối Việc Cần Làm Ngay */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <Link to="/shopee/orders?tab=pending" className="bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all">
            <p className="text-orange-200 text-xs flex items-center gap-1"><Clock size={12} /> Chờ Xác Nhận</p>
            <p className="text-2xl font-black text-white mt-1">{stats.pending}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">SLA: Cần duyệt trong 24h</p>
          </Link>
          <Link to="/shopee/orders?tab=processing" className="bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all">
            <p className="text-orange-200 text-xs flex items-center gap-1"><Truck size={12} /> Chờ Lấy Hàng SPX</p>
            <p className="text-2xl font-black text-white mt-1">{stats.processing}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Đã in bill, chờ bưu tá</p>
          </Link>
          <Link to="/shopee/spx" className="bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all">
            <p className="text-orange-200 text-xs flex items-center gap-1"><RefreshCw size={12} /> Đang Giao SPX</p>
            <p className="text-2xl font-black text-white mt-1">{stats.shipping}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Tỷ lệ phát thành công 98.4%</p>
          </Link>
          <Link to="/issues" className="bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all">
            <p className="text-orange-200 text-xs flex items-center gap-1"><RotateCcw size={12} /> Trả Hàng / Khiếu Nại</p>
            <p className="text-2xl font-black text-white mt-1">{stats.returned}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Bảo vệ người bán</p>
          </Link>
        </div>
      </div>

      {/* Chỉ Số Vận Hành Shopee Star / Mall */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Đánh Giá Cửa Hàng</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Shopee Mall Target</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.shopeeRating}</span>
            <span className="text-xs text-yellow-400">★★★★★</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dựa trên 1,280 lượt nhận xét từ khách mua hàng</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Tỷ Lệ Phản Hồi Chat</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">Rất nhanh (Trong 5p)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.responseRate}%</span>
            <span className="text-xs text-emerald-400">Đạt chuẩn Shopee Star</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Không bị trừ điểm Sao Quả Tạ tháng này</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Tỷ Lệ Chuẩn Bị Hàng Đúng Hạn</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">SLA Hoàn Hảo</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.onTimeShipRate}%</span>
            <span className="text-xs text-emerald-400">Giao SPX trong 1.2 ngày</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tỷ lệ hủy đơn do shop: 0.1% (&lt; 1.0% quy định)</p>
        </div>
      </div>

      {/* Doanh thu & Dòng tiền */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Tổng GMV Shopee</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#EE4D2D] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{formatCurrency(stats.totalRevenue)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <ArrowUpRight size={13} /> +18.4% so với tháng trước
          </div>
          <div>
            <button
              onClick={async () => {
                await generateShopeeOrders(50);
                const all = await db.orders.toArray();
                const shopeeOnly = all.filter(o => 
                  o.channel === "shopee" || 
                  Boolean(o.shopeeOrderId) || 
                  (o.note || "").toLowerCase().includes("shopee")
                );
                setOrders(shopeeOnly);
                alert("Đã tạo thêm 50 đơn hàng Shopee ngẫu nhiên thành công!");
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-[#EE4D2D] hover:bg-orange-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <PlusCircle size={15} /> Tạo Nhanh 50 Đơn Shopee
            </button>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Doanh Thu Giao Thành Công</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{formatCurrency(stats.deliveredRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">{stats.delivered} đơn đã giao SPX hoàn tất</p>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Phí Sàn Shopee Đã Trừ</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-red-400 mt-2">-{formatCurrency(stats.totalShopeeFees)}</p>
          <p className="text-xs text-gray-500 mt-2">Cố định {shopeeFeeRate}% + Thanh toán 5%</p>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Thực Nhận Sau Phí</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2">{formatCurrency(stats.netPayout)}</p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Số dư ví khả dụng: {formatCurrency(stats.walletBalance)}</p>
        </div>
      </div>
    </div>
  );
}
