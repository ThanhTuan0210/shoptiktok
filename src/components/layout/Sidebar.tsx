import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign,
  Settings, RotateCcw, Users, UserCheck, ExternalLink,
  Search, Radio, ShoppingBag, Layers
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const role = sessionStorage.getItem("tt_adminRole") || "admin";
  const isStaff = role === "staff";

  const mainNav = isStaff ? [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng (Đóng gói)" },
    { to: "/shopee", icon: ShoppingBag, label: "Kênh Shopee (SPX)" },
    { to: "/inventory", icon: Package, label: "Sản phẩm & Tồn kho" },
  ] : [
    { to: "/omni-dashboard", icon: Layers, label: "Dashboard Đa Kênh", isSpecial: true },
    { to: "/dashboard", icon: LayoutDashboard, label: "Tổng quan Shop" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng Tất cả" },
    { to: "/shopee", icon: ShoppingBag, label: "Kênh Shopee Centre", isShopee: true },
    { to: "/live", icon: Radio, label: "Phiên Live TikTok", isLive: true },
    { to: "/inventory", icon: Package, label: "Sản phẩm & Kho" },
    { to: "/finance", icon: DollarSign, label: "Tài chính & Báo cáo" },
    { to: "/issues", icon: RotateCcw, label: "Hoàn trả & Sự cố" },
  ];

  const secondaryNav = isStaff ? [] : [
    { to: "/customers", icon: Users, label: "Khách hàng (CRM)" },
    { to: "/partners", icon: UserCheck, label: "Đối tác & KOLs" },
    { to: "/settings", icon: Settings, label: "Cài đặt hệ thống" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-rose-500 to-pink-500">
            <span className="text-white font-bold text-sm italic">H</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight italic">
              Henr.Studio
            </h1>
            <p className="text-gray-500 text-xs">Quản trị Đa Kênh</p>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <Link
          to="/shop"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg font-bold text-xs shadow-md transition-all"
        >
          <ExternalLink size={14} /> Xem Website Cửa Hàng
        </Link>
        <Link
          to="/track"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium text-xs border border-gray-700/60 transition-all"
        >
          <Search size={13} /> Khách Tra Cứu Đơn (SPX/GHN)
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Menu Quản trị</p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          let btnClass = "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200";
          if (isActive) {
            if (item.isShopee) btnClass = "bg-[#EE4D2D] text-white shadow-md shadow-orange-900/30";
            else if (item.isSpecial) btnClass = "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-900/20";
            else btnClass = "bg-rose-600 text-white shadow-md shadow-rose-900/20";
          } else {
            if (item.isShopee) btnClass = "text-orange-400 hover:bg-orange-950/30 hover:text-orange-300";
            else if (item.isSpecial) btnClass = "text-rose-300 hover:bg-rose-950/30 hover:text-rose-200";
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={"flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all " + btnClass}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "text-white" : item.isShopee ? "text-[#EE4D2D]" : item.isLive ? "text-rose-400" : item.isSpecial ? "text-amber-400" : ""} />
                <span>{item.label}</span>
              </div>
              {item.isSpecial && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-400 text-black rounded font-mono">
                  3 SÀN
                </span>
              )}
              {item.isShopee && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-orange-500/20 text-orange-400 rounded font-mono border border-orange-500/30">
                  SPX
                </span>
              )}
              {item.isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </NavLink>
          );
        })}

        {secondaryNav.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3">Hệ thống & Mở rộng</p>
            </div>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all " + (isActive ? "bg-rose-600 text-white" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200")}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
