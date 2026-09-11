import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign,
  ChevronDown, ChevronRight, Settings, RotateCcw,
  Users, UserCheck
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(
    ["/customers", "/partners", "/settings"].includes(location.pathname)
  );

  const mainNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/inventory", icon: Package, label: "Sản phẩm & Kho" },
    { to: "/finance", icon: DollarSign, label: "Tài chính & Báo cáo" },
    { to: "/issues", icon: RotateCcw, label: "Hoàn, Hủy & Lỗi" },
  ];

  const secondaryNav = [
    { to: "/customers", icon: Users, label: "Khách hàng" },
    { to: "/partners", icon: UserCheck, label: "Đối tác & KOL" },
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
            <p className="text-gray-500 text-xs">Shop Manager</p>
          </div>
        </div>
      </div>

            {/* Navigation */}
      <div className="px-3 pt-4 pb-2">
        <Link to="/shop" target="_blank" className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg font-bold text-sm shadow-lg shadow-rose-900/20 transition-all">
          🛍️ Xem Website Bán Hàng
        </Link>
      </div>
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Tính năng chính</p>
        <ul className="space-y-1 mb-6">
          {mainNav.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive || (to === '/orders' && location.pathname === '/shipping') || (to === '/finance' && location.pathname === '/analytics') || (to === '/issues' && ['/returns', '/defective'].includes(location.pathname))
                      ? "text-rose-400 bg-rose-950/30 border border-rose-900/50"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }>
                <Icon size={18} /> {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2 flex items-center gap-2 cursor-pointer"
           onClick={() => setExpanded(!expanded)}>
          Công cụ mở rộng
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </p>
        
        {expanded && (
          <ul className="space-y-1 animate-fade-in">
            {secondaryNav.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "text-blue-400 bg-blue-950/30"
                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                    }`
                  }>
                  <Icon size={16} /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
          <p className="text-xs text-gray-400 font-medium">Henr.Studio</p>
          <p className="text-xs text-gray-600 mt-0.5">Đồ Ngủ Cao Cấp 🛏️</p>
        </div>
      </div>
    </aside>
  );
}
