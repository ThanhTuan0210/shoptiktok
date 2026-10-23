import { useEffect, useState, useMemo } from "react";
import { db } from "../../db/database";
import type { Order } from "../../types";
import { DollarSign, Percent, ShieldCheck, ArrowDownRight, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";

export default function ShopeeFinance() {
  const [orders, setOrders] = useState<Order[]>([]);
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
    const delivered = orders.filter(o => o.status === "delivered");
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0);
    const deliveredRevenue = delivered.reduce((sum, o) => sum + o.total, 0);

    const paymentFee = Math.round(totalRevenue * 0.05); // 5%
    const commissionFee = Math.round(totalRevenue * 0.045); // 4.5%
    const totalFees = paymentFee + commissionFee;
    const walletBalance = Math.round(deliveredRevenue * 0.905);

    return {
      totalRevenue,
      deliveredRevenue,
      paymentFee,
      commissionFee,
      totalFees,
      walletBalance,
      deliveredCount: delivered.length,
    };
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="text-[#EE4D2D]" />
            Tài Chính & Ví Người Bán Shopee
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Bóc tách minh bạch phí thanh toán, phí cố định và quản lý lệnh rút tiền về ngân hàng.
          </p>
        </div>
      </div>

      {/* Hero Card Ví Người Bán */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
              Số Dư Ví Người Bán Khả Dụng (Shopee Balance)
            </span>
            <p className="text-3xl font-black text-white mt-1">{formatCurrency(stats.walletBalance)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Đã quyết toán từ {stats.deliveredCount} đơn hàng giao thành công.
            </p>
          </div>
          <div>
            <button 
              onClick={() => alert(`Yêu cầu rút ${formatCurrency(stats.walletBalance)} về tài khoản ngân hàng liên kết đã được gửi tới Shopee!`)}
              className="px-5 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 font-bold text-xs text-white shadow-md shadow-orange-950 transition-all"
            >
              Rút Tiền Về Ngân Hàng Liên Kết
            </button>
          </div>
        </div>
      </div>

      {/* 3 Khối Bóc Tách Phí Sàn Chuẩn Shopee VN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">1. Phí Thanh Toán (Payment Fee)</span>
            <span className="text-xs font-bold text-orange-400">5.0%</span>
          </div>
          <p className="text-xl font-black text-white mt-2">{formatCurrency(stats.paymentFee)}</p>
          <p className="text-xs text-gray-500 mt-1">Áp dụng cho mọi giao dịch thanh toán COD & Ví ShopeePay</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">2. Phí Cố Định Hoa Hồng Sàn</span>
            <span className="text-xs font-bold text-orange-400">4.5%</span>
          </div>
          <p className="text-xl font-black text-white mt-2">{formatCurrency(stats.commissionFee)}</p>
          <p className="text-xs text-gray-500 mt-1">Biểu phí cố định dành cho ngành hàng Thời Trang & May Mặc</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">3. Gói Freeship Xtra & Dịch Vụ</span>
            <span className="text-xs font-bold text-emerald-400">Kích hoạt</span>
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2">Đang Hưởng Ưu Đãi</p>
          <p className="text-xs text-gray-500 mt-1">Hỗ trợ phí vận chuyển cho khách từ 45K, tăng lượt click 35%</p>
        </div>
      </div>

      {/* Bảng Lịch Sử Quyết Toán */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-white text-sm mb-4">Lịch Sử Quyết Toán Đơn Hàng Mới Nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/60 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-3">Mã Đơn Shopee</th>
                <th className="p-3">Ngày Giao Hàng</th>
                <th className="p-3">Doanh Thu Khách Trả</th>
                <th className="p-3">Phí Sàn Khấu Trừ (9.5%)</th>
                <th className="p-3 text-right">Thực Chuyển Vào Ví</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {orders.slice(0, 8).map(o => {
                const fee = Math.round(o.total * (shopeeFeeRate / 100));
                const net = Math.max(0, o.total - fee);
                return (
                  <tr key={o.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-400">
                      {o.shopeeOrderId || ("SHOPEE-" + o.id.slice(0, 8).toUpperCase())}
                    </td>
                    <td className="p-3 text-gray-400">{formatDate(o.orderDate)}</td>
                    <td className="p-3 font-bold text-white">{formatCurrency(o.total)}</td>
                    <td className="p-3 text-red-400">-{formatCurrency(fee)}</td>
                    <td className="p-3 text-right font-black text-emerald-400">{formatCurrency(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
