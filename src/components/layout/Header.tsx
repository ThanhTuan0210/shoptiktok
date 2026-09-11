import { Bell, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { db } from "../../db/database";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard Tổng quan", subtitle: "Hiệu suất shop Henr.Studio" },
  "/inventory": { title: "Quản lý Kho hàng", subtitle: "Pyjama & Đồ ngủ cao cấp" },
  "/orders": { title: "Đơn hàng & Vận chuyển", subtitle: "Tất cả đơn TikTok Shop" },
  "/finance": { title: "Tài chính & Báo cáo", subtitle: "Doanh thu · Chi phí · Phân tích" },
  "/issues": { title: "Hậu mãi & Sự cố", subtitle: "Khách trả hàng & Hàng lỗi" },
  "/customers": { title: "Khách hàng thân thiết", subtitle: "Quản lý CRM" },
  "/partners": { title: "Đối tác & KOLs", subtitle: "Quản lý Affiliate" },
  "/settings": { title: "Cài đặt hệ thống", subtitle: "Cấu hình Henr.Studio Manager" },
};

export default function Header() {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Henr.Studio Manager", subtitle: "" };
  
  const [showNoti, setShowNoti] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for outside click to close dropdown
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
      // 1. Low stock variants
      const variants = await db.productVariants.toArray();
      const products = await db.products.toArray();
      const pMap = new Map(products.map(p => [p.id, p]));
      
      const lowStock: any[] = [];
      variants.forEach(v => {
        const p = pMap.get(v.productId);
        if (p && v.stock <= p.lowStockThreshold) {
          lowStock.push({
            id: `stock-${v.id}`,
            type: "warning",
            title: "Sắp hết hàng",
            message: `${p.name} (${v.color} - ${v.size}) chỉ còn ${v.stock} chiếc.`,
            time: "Vừa xong"
          });
        }
      });

      // 2. Pending returns
      const returns = await db.returns.where("status").equals("pending").toArray();
      const returnNotis = returns.map(r => ({
        id: `ret-${r.id}`,
        type: "alert",
        title: "Yêu cầu hoàn hàng mới",
        message: `Đơn ${r.tiktokOrderId || r.orderId.slice(-8)} đang chờ xử lý hoàn trả.`,
        time: "Hôm nay"
      }));

      setNotifications([...lowStock.slice(0, 5), ...returnNotis.slice(0, 3)]);
    }
    fetchNotifications();
    
    // Refresh every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between"
      style={{ backgroundColor: "rgba(3,7,18,0.85)", backdropFilter: "blur(12px)" }}>
      <div>
        <h2 className="text-base font-semibold text-white leading-tight">{page.title}</h2>
        {page.subtitle && <p className="text-xs text-gray-500 mt-0.5">{page.subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <div className="relative" ref={notiRef}>
          <button 
            onClick={() => setShowNoti(!showNoti)}
            className={`relative p-2 rounded-lg transition-colors ${showNoti ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-gray-900"></span>
            )}
          </button>
          
          {/* Dropdown */}
          {showNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/30">
                <h3 className="text-sm font-semibold text-white">Thông báo</h3>
                {unreadCount > 0 && <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} mới</span>}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center flex flex-col items-center">
                    <CheckCircle2 size={24} className="text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Không có thông báo nào</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {notifications.map(n => (
                      <li key={n.id} className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3">
                        <div className={`mt-0.5 shrink-0 ${n.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {n.type === 'warning' ? <Package size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white mb-0.5">{n.title}</p>
                          <p className="text-xs text-gray-400 leading-snug">{n.message}</p>
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

        {/* User Profile */}
        <div className="flex items-center gap-2.5 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-gray-700/80 transition-colors">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f43f5e, #e879a0)" }}>
            <span className="text-white font-bold text-xs italic" style={{ fontFamily: "Georgia, serif" }}>H</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">Henr.Studio</p>
            <p className="text-[10px] text-gray-400 leading-tight">Admin</p>
          </div>
        </div>
        
      </div>
    </header>
  );
}

