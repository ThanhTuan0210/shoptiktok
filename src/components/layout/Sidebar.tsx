import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign,
  ChevronDown, ChevronRight, Settings, RotateCcw,
  Users, UserCheck, ExternalLink, Search, Radio
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);

  const mainNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/live", icon: Radio, label: "Phiên Live TikTok", isLive: true },
    { to: "/inventory", icon: Package, label: "Sản phẩm & Kho" },
    { to: "/finance", icon: DollarSign, label: "Tài chính & Báo cáo" },
    { to: "/issues", icon: RotateCcw, label: "Hoàn trả & Sự cố" },
  ];

  const secondaryNav = [
    { to: "/customers", icon: Users, label: "Khách hàng (CRM)" },
    { to: "/partners", icon: UserCheck, label: "Đối tác & KOLs" },
    { to: "/settings", icon: Settings, label: "Cài đặt hệ thống" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Brand */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #e879a0 100%)" }}>
            <span className="text-white font-bold text-sm italic" style={{ fontFamily: "Georgia, serif" }}>H</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              Henr.Studio
            </h1>
            <p className="text-gray-500 text-xs">Quản lý Shop</p>
          </div>
        </div>
      </div>

      {/* Storefront Shortcuts */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <Link
          to="/shop"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg font-bold text-xs shadow-md shadow-rose-900/20 transition-all"
        >
          <ExternalLink size={14} /> Xem Website Cửa Hàng
        </Link>
        <Link
          to="/track"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-all"
        >
          <Search size={13} /> Trang Tra Cứu Đơn
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2">Tính năng chính</p>
        <ul className="space-y-1 mb-5">
          {mainNav.map(({ to, icon: Icon, label, isLive }: any) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ||
                    (to === '/orders' && location.pathname === '/shipping') ||
                    (to === '/finance' && location.pathname === '/analytics') ||
                    (to === '/issues' && ['/returns', '/defective'].includes(location.pathname))
                      ? "text-rose-400 bg-rose-950/30 border border-rose-900/50"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} className={isLive ? "text-rose-500 animate-pulse" : ""} /> {label}
                </span>
                {isLive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600/90 text-white tracking-wider flex items-center gap-1 shadow-sm shadow-rose-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <p
          className="text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2 flex items-center justify-between cursor-pointer hover:text-gray-300 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <span>Công cụ mở rộng</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </p>
        
        {expanded && (
          <ul className="space-y-1">
            {secondaryNav.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "text-blue-400 bg-blue-950/30 font-medium"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`
                  }
                >
                  <Icon size={16} /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <div className="bg-gray-800/40 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400 font-medium">Henr.Studio • Pyjama</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Hệ thống đang hoạt động</p>
        </div>
      </div>
    </aside>
  );
}
