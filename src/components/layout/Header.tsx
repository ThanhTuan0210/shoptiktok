import { Bell, Package, AlertTriangle, CheckCircle2, Lock, Store } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { db } from "../../db/database";
import { lockAdmin } from "./AdminGuard";
import { playOrderChime } from "../../utils/audioAlert";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Tổng quan hoạt động", subtitle: "Hiệu suất bán hàng Henr.Studio" },
  "/inventory": { title: "Quản lý Kho & Sản phẩm", subtitle: "Danh mục Pyjama & Đồ ngủ cao cấp" },
  "/orders": { title: "Đơn hàng & Vận chuyển", subtitle: "Tất cả đơn hàng Website & TikTok Shop" },
  "/shipping": { title: "Vận chuyển & Giao hàng", subtitle: "Theo dõi hành trình bưu phẩm" },
  "/finance": { title: "Tài chính & Doanh thu", subtitle: "Doanh thu • Chi phí • Lợi nhuận ròng" },
  "/analytics": { title: "Báo cáo phân tích", subtitle: "Phân tích sản phẩm bán chạy & tỷ suất" },
  "/issues": { title: "Đổi trả & Hàng lỗi", subtitle: "Kiểm soát khiếu nại & chất lượng may mặc" },
  "/returns": { title: "Yêu cầu hoàn trả", subtitle: "Xử lý hàng trả về kho" },
  "/defective": { title: "Hàng lỗi chất lượng", subtitle: "Hao hụt & tỷ lệ lỗi xưởng may" },
  "/customers": { title: "Khách hàng thân thiết (CRM)", subtitle: "Danh sách khách & lịch sử đơn hàng" },
  "/partners": { title: "Đối tác & KOLs Affiliate", subtitle: "Quản lý hoa hồng chiến dịch" },
  "/settings": { title: "Cài đặt hệ thống", subtitle: "Cấu hình thông tin Shop & Ngân hàng" },
};

export default function Header() {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Henr.Studio Manager", subtitle: "Hệ thống quản trị" };
  
  const [showNoti, setShowNoti] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setShowNoti(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      const variants = await db.productVariants.toArray();
      const products = await db.products.toArray();
      const pMap = new Map(products.map(p => [p.id, p]));
      
      const lowStock: any[] = [];
      variants.forEach(v => {
        const p = pMap.get(v.productId);
        const threshold = p?.lowStockThreshold || 10;
        if (p && v.stock <= threshold) {
          lowStock.push({
            id: `stock-${v.id}`,
            type: "warning",
            title: "Cảnh báo sắp hết hàng",
            message: `${p.name} (${v.color} - ${v.size}) chỉ còn ${v.stock} bộ trong kho.`,
            time: "Cần nhập thêm"
          });
        }
      });

      const returns = await db.returns.where("status").equals("pending").toArray();
      const returnNotis = returns.map(r => ({
        id: `ret-${r.id}`,
        type: "alert",
        title: "Yêu cầu đổi trả mới",
        message: `Đơn ${r.tiktokOrderId || r.orderId.slice(-8)} đang chờ shop xử lý kiểm tra.`,
        time: "Chờ duyệt"
      }));

      // Check pending orders from website
      const pendingOrders = await db.orders.where("status").equals("pending").toArray();
      const pendingNotis = pendingOrders.slice(0, 3).map(o => ({
        id: `ord-${o.id}`,
        type: "order",
        title: "Đơn hàng mới chờ xác nhận",
        message: `${o.customerName} vừa đặt đơn ${o.tiktokOrderId} (${o.customerPhone}).`,
        time: o.orderDate
      }));

      setNotifications([...pendingNotis, ...lowStock.slice(0, 4), ...returnNotis.slice(0, 3)]);
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;
  const isStaff = sessionStorage.getItem("tt_adminRole") === "staff";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between"
      style={{ backgroundColor: "rgba(3,7,18,0.85)", backdropFilter: "blur(12px)" }}>
      <div>
        <h2 className="text-base font-semibold text-white leading-tight">{page.title}</h2>
        {page.subtitle && <p className="text-xs text-gray-400 mt-0.5">{page.subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <div className="relative" ref={notiRef}>
          <button 
            onClick={() => setShowNoti(!showNoti)}
            className={`relative p-2 rounded-lg transition-colors ${showNoti ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            title="Thông báo"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-gray-900 animate-pulse"></span>
            )}
          </button>
          
          {/* Dropdown */}
          {showNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/40">
                <h3 className="text-sm font-semibold text-white">Thông báo hoạt động</h3>
                {unreadCount > 0 && <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} việc cần làm</span>}
              </div>
              
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center flex flex-col items-center">
                    <CheckCircle2 size={24} className="text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Không có cảnh báo tồn đọng</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {notifications.map(n => (
                      <li key={n.id} className="p-3.5 hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3">
                        <div className={`mt-0.5 shrink-0 ${n.type === 'warning' ? 'text-amber-400' : n.type === 'order' ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {n.type === 'warning' ? <Package size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white mb-0.5">{n.title}</p>
                          <p className="text-xs text-gray-300 leading-snug">{n.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{n.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-800 bg-gray-800/30">
                  <button onClick={() => setNotifications([])} className="w-full text-center text-xs text-gray-400 hover:text-white py-1">
                    Đánh dấu đã đọc tất cả
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        
        {/* Link to Storefront */}
        <Link
          to="/shop"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium border border-gray-700 transition-colors"
          title="Xem Cửa Hàng Bán Lẻ"
        >
          <Store size={14} className="text-[#fe2c55]" />
          <span>Xem Shop</span>
        </Link>

        {/* Lock Admin Session */}
        <button
          onClick={() => {
            if (window.confirm("Bạn có muốn khóa bảng quản trị ngay bây giờ không?")) {
              lockAdmin();
            }
          }}
          className="p-2 rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 transition-colors"
          title="Khóa Bảng Quản Trị"
        >
          <Lock size={15} />
        </button>
    
        {/* User Profile */}
        <div className="flex items-center gap-2.5 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-1.5 hover:bg-gray-700/80 transition-colors">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f43f5e, #e879a0)" }}>
            <span className="text-white font-bold text-xs italic" style={{ fontFamily: "Georgia, serif" }}>H</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">Henr.Studio</p>
            <p className={`text-[10px] font-semibold leading-tight ${isStaff ? "text-amber-400" : "text-rose-400"}`}>
              {isStaff ? "Nhân viên đóng hàng" : "Chủ cửa hàng"}
            </p>
          </div>
        </div>
        
      </div>
    </header>
  );
}
