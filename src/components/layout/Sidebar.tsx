import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign,
  Settings, RotateCcw, Users, UserCheck, ExternalLink,
  Search, Radio, ShoppingBag, Globe, BarChart3, ChevronDown, ChevronRight,
  Truck, Tag, MessageCircle, Flame
} from "lucide-react";

export default function Sidebar() {
  const role = sessionStorage.getItem("tt_adminRole") || "admin";
  const isStaff = role === "staff";

  // Section collapse states
  const [tiktokOpen, setTiktokOpen] = useState(true);
  const [shopeeOpen, setShopeeOpen] = useState(true);
  const [webOpen, setWebOpen] = useState(true);
  const [commonOpen, setCommonOpen] = useState(true);

  if (isStaff) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-gray-800 flex flex-col z-40">
        <div className="p-4 border-b border-gray-800">
          <h1 className="font-bold text-white text-base">Henr.Studio (Kho)</h1>
        </div>
        <nav className="p-3 space-y-1">
          <NavLink to="/orders" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-rose-600 text-white' : 'text-gray-400'}`}>
            <ShoppingCart size={16} /> Đơn hàng đóng gói
          </NavLink>
          <NavLink to="/shopee/orders" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-[#EE4D2D] text-white' : 'text-gray-400'}`}>
            <ShoppingBag size={16} /> Shopee SPX
          </NavLink>
          <NavLink to="/inventory" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-rose-600 text-white' : 'text-gray-400'}`}>
            <Package size={16} /> Quản lý tồn kho
          </NavLink>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-gray-800/80 flex flex-col z-40 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center font-black text-white text-xs shadow-md shadow-rose-950">
            H
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-tight">Henr.Studio</h1>
            <p className="text-[10px] text-gray-500 font-medium">Hệ Thống Đa Kênh 3 Sàn</p>
          </div>
        </div>
      </div>

      {/* Top Omni Hub Link */}
      <div className="p-3 pb-1">
        <NavLink
          to="/omni-dashboard"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isActive
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-indigo-950"
                : "bg-gray-900/90 text-indigo-300 hover:bg-gray-800 hover:text-white border border-indigo-500/20"
            }`
          }
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 size={16} className="text-indigo-400" />
            <span>Dashboard Tổng 3 Sàn</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            OMNI
          </span>
        </NavLink>
      </div>

      {/* Structured Channels Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs">
        
        {/* PHÂN HỆ 1: SHOPEE MALL (ĐÃ TÁCH TỪNG TRANG CON) */}
        <div className="space-y-1">
          <button
            onClick={() => setShopeeOpen(!shopeeOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EE4D2D]"></span>
              Kênh Shopee Mall
            </span>
            {shopeeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {shopeeOpen && (
            <div className="space-y-0.5 pl-1.5 border-l border-orange-500/20 ml-2">
              <NavLink
                to="/shopee"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <LayoutDashboard size={14} />
                <span>Tổng quan Shopee</span>
              </NavLink>

              <NavLink
                to="/shopee/orders"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <ShoppingBag size={14} />
                <span>Quản lý đơn hàng</span>
              </NavLink>

              <NavLink
                to="/shopee/spx"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <Truck size={14} />
                <span>Điều phối SPX Express</span>
              </NavLink>

              <NavLink
                to="/shopee/finance"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <DollarSign size={14} />
                <span>Ví Shopee & Đối soát</span>
              </NavLink>

              <NavLink
                to="/shopee/live"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <Flame size={14} className="text-orange-400" />
                <span>Shopee Live & Flash Sale</span>
              </NavLink>

              <NavLink
                to="/shopee/marketing"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <Tag size={14} />
                <span>Marketing & Vouchers</span>
              </NavLink>

              <NavLink
                to="/shopee/chat"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-[#EE4D2D] text-white font-bold" : "text-gray-400 hover:text-orange-300 hover:bg-gray-900"
                  }`
                }
              >
                <MessageCircle size={14} />
                <span>Shopee Chat Khách</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* PHÂN HỆ 2: TIKTOK SHOP */}
        <div className="space-y-1">
          <button
            onClick={() => setTiktokOpen(!tiktokOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Kênh TikTok Shop
            </span>
            {tiktokOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {tiktokOpen && (
            <div className="space-y-0.5 pl-1.5 border-l border-rose-500/20 ml-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-rose-600 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <LayoutDashboard size={14} />
                <span>Tổng quan TikTok</span>
              </NavLink>

              <NavLink
                to="/live"
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-rose-600 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-rose-400" />
                  <span>TikTok Live Studio</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </NavLink>

              <NavLink
                to="/partners"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-rose-600 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <UserCheck size={14} />
                <span>KOL & Tiếp Thị Liên Kết</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* PHÂN HỆ 3: WEBSITE BÁN HÀNG */}
        <div className="space-y-1">
          <button
            onClick={() => setWebOpen(!webOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-400 hover:text-sky-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Kênh Website Shop
            </span>
            {webOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {webOpen && (
            <div className="space-y-1 pl-1.5 border-l border-sky-500/20 ml-2">
              <Link
                to="/shop"
                target="_blank"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-sky-300 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} />
                  <span>Giao Diện Web Khách</span>
                </div>
                <ExternalLink size={12} className="text-gray-500" />
              </Link>

              <Link
                to="/track"
                target="_blank"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search size={14} />
                  <span>Tra Cứu Vận Đơn Khách</span>
                </div>
                <ExternalLink size={12} className="text-gray-500" />
              </Link>
            </div>
          )}
        </div>

        {/* KHO & HỆ THỐNG DÙNG CHUNG */}
        <div className="space-y-1">
          <button
            onClick={() => setCommonOpen(!commonOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              Kho & Vận Hành Chung
            </span>
            {commonOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {commonOpen && (
            <div className="space-y-0.5 pl-1.5 border-l border-gray-700/40 ml-2">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <ShoppingCart size={14} />
                <span>Đơn hàng tất cả sàn</span>
              </NavLink>

              <NavLink
                to="/inventory"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <Package size={14} />
                <span>Sản phẩm & Kho may</span>
              </NavLink>

              <NavLink
                to="/finance"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <DollarSign size={14} />
                <span>Tài chính & Lợi nhuận</span>
              </NavLink>

              <NavLink
                to="/issues"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <RotateCcw size={14} />
                <span>Hoàn hàng & Khiếu nại</span>
              </NavLink>

              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <Users size={14} />
                <span>Khách hàng (CRM)</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-gray-800 text-white font-bold" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`
                }
              >
                <Settings size={14} />
                <span>Cấu hình hệ thống</span>
              </NavLink>
            </div>
          )}
        </div>

      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-900 text-center">
        <span className="text-[10px] text-gray-600 font-mono">
          Vercel Live: Production v2.5
        </span>
      </div>
    </aside>
  );
}
