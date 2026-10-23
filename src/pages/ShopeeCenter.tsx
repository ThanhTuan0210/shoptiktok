import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Order } from "../types";
import {
  ShoppingBag, Truck, DollarSign, Download, Upload, ExternalLink,
  RefreshCw, CheckCircle2, Clock, RotateCcw, AlertTriangle, Eye,
  Search, Filter, ArrowUpRight, MessageCircle, BarChart3, Radio, Flame,
  Printer, Scan, Tag, Percent, Check, Send, User, ChevronRight, Copy, HelpCircle,
  FileText
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "../utils/helpers";
import { exportShopeeTemplate, exportOrdersToExcel, importOrdersFromExcel } from "../utils/exportData";
import Modal from "../components/ui/Modal";

type ShopeeTab = "overview" | "orders" | "spx" | "finance" | "live" | "marketing" | "chat";

interface ChatMessage {
  id: string;
  sender: "customer" | "seller";
  text: string;
  time: string;
  orderRef?: string;
}

export default function ShopeeCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ShopeeTab>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  // SPX Express Handover Scanner State
  const [scanInput, setScanInput] = useState("");
  const [scannedTrackingList, setScannedTrackingList] = useState<string[]>([]);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Flash Sale / Marketing State
  const [flashSaleActive, setFlashSaleActive] = useState(true);
  const [flashSaleSlots, setFlashSaleSlots] = useState([
    { id: "fs-1", name: "Bộ vest công sở cao cấp", originalPrice: 650000, salePrice: 489000, stock: 20, sold: 16, time: "12:00 - 14:00 (Hôm nay)" },
    { id: "fs-2", name: "Đầm xòe lụa tơ tằm thanh lịch", originalPrice: 420000, salePrice: 299000, stock: 35, sold: 28, time: "12:00 - 14:00 (Hôm nay)" },
    { id: "fs-3", name: "Áo sơ mi lụa công sở cao cấp", originalPrice: 320000, salePrice: 225000, stock: 50, sold: 44, time: "12:00 - 14:00 (Hôm nay)" },
  ]);

  // Vouchers state
  const [vouchers] = useState([
    { code: "HENRSHOPEE10", name: "Voucher Toàn Shop Giảm 10%", minOrder: 300000, discount: "10% tối đa 50K", used: 142, limit: 200, status: "active" },
    { code: "FREESHIPXTRA", name: "Freeship Xtra Đơn Từ 45K", minOrder: 45000, discount: "Freeship 15K-70K", used: 310, limit: 500, status: "active" },
    { code: "COMBO2GIAM5", name: "Mua 2 Giảm Thêm 5%", minOrder: 0, discount: "Giảm 5% Combo", used: 88, limit: 100, status: "active" },
  ]);

  // Shopee Web Chat simulator state
  const [chatConversations, setChatConversations] = useState([
    {
      id: "c1",
      customer: "nguyenthimai_92",
      avatar: "M",
      lastMsg: "Dạ shop tư vấn giúp em size L nặng 56kg mặc vừa không ạ?",
      time: "10:24",
      unread: true,
      orderCode: "241023SPX9821",
      messages: [
        { id: "m1", sender: "customer", text: "Chào shop ạ! Mẫu đầm lụa công sở màu be em cao 1m58 nặng 56kg thì nên lấy size L hay XL ạ?", time: "10:20" },
        { id: "m2", sender: "seller", text: "Dạ em chào chị Mai ạ! Mẫu này form may chuẩn eo co giãn nhẹ, số đo 56kg chị mặc size L sẽ rất tôn dáng và vừa vặn thoải mái chị nhé!", time: "10:22" },
        { id: "m3", sender: "customer", text: "Dạ shop tư vấn giúp em size L nặng 56kg mặc vừa không ạ? Nếu em đặt trưa nay thì SPX mai có giao tới Cầu Giấy Hà Nội không?", time: "10:24" }
      ] as ChatMessage[]
    },
    {
      id: "c2",
      customer: "tranhuy_danang",
      avatar: "H",
      lastMsg: "Đơn này shop giao cho bên SPX chưa nhỉ?",
      time: "09:15",
      unread: false,
      orderCode: "241022SPX3341",
      messages: [
        { id: "m1", sender: "customer", text: "Đơn này shop giao cho bên SPX chưa nhỉ?", time: "09:15" },
        { id: "m2", sender: "seller", text: "Dạ đơn của anh Huy bên em đã đóng gói xong và bàn giao cho bưu tá SPX ca sáng nay rồi ạ. Anh theo dõi lộ trình trên app Shopee nhé!", time: "09:18" }
      ] as ChatMessage[]
    }
  ]);
  const [activeChatId, setActiveChatId] = useState("c1");
  const [chatReply, setChatReply] = useState("");

  const shopeeShopName = localStorage.getItem("shopee_shopName") || "henr_studio_official";
  const shopeeFeeRate = parseFloat(localStorage.getItem("shopee_feeRate") || "9.5");

  useEffect(() => {
    loadShopeeData();
  }, []);

  async function loadShopeeData() {
    setLoading(true);
    const all = await db.orders.toArray();
    // Lọc đơn hàng thuộc kênh Shopee
    const shopeeOnly = all.filter(o => 
      o.channel === "shopee" || 
      Boolean(o.shopeeOrderId) || 
      (o.note || "").toLowerCase().includes("shopee")
    );
    setOrders(shopeeOnly.sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
    setLoading(false);
  }

  // Thống kê toàn diện Shopee
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === "delivered");
    const pending = orders.filter(o => o.status === "pending");
    const processing = orders.filter(o => o.status === "processing");
    const shipping = orders.filter(o => o.status === "shipping");
    const returned = orders.filter(o => o.status === "returned" || o.status === "return_requested");

    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0);
    const deliveredRevenue = delivered.reduce((sum, o) => sum + o.total, 0);

    // Bóc tách 3 loại phí Shopee chuẩn Việt Nam:
    // 1. Phí thanh toán (5.0%)
    // 2. Phí cố định hoa hồng (4.5%)
    // 3. Phí dịch vụ Freeship Xtra & Hoàn Xu Xtra (nếu có tính ước lượng)
    const paymentFee = Math.round(totalRevenue * 0.05);
    const commissionFee = Math.round(totalRevenue * 0.045);
    const totalShopeeFees = orders.reduce((sum, o) => {
      if (o.status === "cancelled") return sum;
      return sum + (o.shopeeFeeAmount || Math.round(o.total * (shopeeFeeRate / 100)));
    }, 0);

    const netPayout = Math.max(0, totalRevenue - totalShopeeFees);
    const walletBalance = Math.round(deliveredRevenue * 0.905); // Tiền đã quyết toán về ví người bán

    return {
      totalOrders,
      pending: pending.length,
      processing: processing.length,
      shipping: shipping.length,
      delivered: delivered.length,
      returned: returned.length,
      totalRevenue,
      deliveredRevenue,
      paymentFee,
      commissionFee,
      totalShopeeFees,
      netPayout,
      walletBalance,
      responseRate: 98.6,
      shopeeRating: 4.92,
      onTimeShipRate: 99.1,
    };
  }, [orders, shopeeFeeRate]);

  // Bộ lọc đơn Shopee
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search || 
        (o.shopeeOrderId || "").toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone || "").includes(search) ||
        (o.trackingNumber || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  async function handleUpdateStatus(id: string, newStatus: any) {
    await db.orders.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
    await loadShopeeData();
  }

  // Bulk actions
  function toggleSelectAll() {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  }

  function toggleSelectOrder(id: string) {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(x => x !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  }

  async function handleBulkApprove() {
    if (selectedOrderIds.length === 0) return;
    for (const id of selectedOrderIds) {
      await db.orders.update(id, { status: "processing", updatedAt: new Date().toISOString() });
    }
    setBulkActionSuccess(`Đã duyệt chuẩn bị hàng loạt cho ${selectedOrderIds.length} đơn hàng Shopee thành công!`);
    setSelectedOrderIds([]);
    await loadShopeeData();
    setTimeout(() => setBulkActionSuccess(null), 4000);
  }

  function handleBulkPrintA6() {
    if (selectedOrderIds.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id));
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>In Phiếu Gửi Shopee SPX Hàng Loạt (${ordersToPrint.length} đơn)</title>
        <style>
          @page { size: A6 portrait; margin: 4mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; margin: 0; padding: 0; }
          .page-break { page-break-after: always; padding: 8px; border: 1.5px solid #000; border-radius: 4px; height: 140mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 10px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .logo { font-size: 20px; font-weight: 900; color: #EE4D2D; }
          .spx { font-weight: 900; background: #000; color: #fff; padding: 2px 6px; border-radius: 3px; }
          .barcode-box { text-align: center; margin: 10px 0; border: 1px dashed #666; padding: 8px; }
          .barcode { font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 3px; }
          .section { margin-top: 6px; border-top: 1px solid #ccc; padding-top: 4px; }
          .bold { font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 3px; }
        </style>
      </head>
      <body>
        ${ordersToPrint.map(o => `
          <div class="page-break">
            <div>
              <div class="header">
                <div>
                  <span class="logo">Shopee</span>
                  <div style="font-size: 9px; color: #555;">Kênh Người Bán: @${shopeeShopName}</div>
                </div>
                <div style="text-align: right;">
                  <span class="spx">SPX Express</span>
                  <div style="font-size: 9px; margin-top: 3px;">Chuẩn vận chuyển Shopee</div>
                </div>
              </div>
              <div class="barcode-box">
                <div style="font-size: 9px; color: #666;">MÃ VẬN ĐƠN SPX</div>
                <div class="barcode">${o.trackingNumber || ("SPXVN" + Math.floor(1000000000 + Math.random() * 9000000000))}</div>
                <div style="font-size: 9px; color: #666; margin-top: 2px;">Mã đơn: ${o.shopeeOrderId || o.id}</div>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <div style="flex: 1; border-right: 1px dashed #ccc; padding-right: 6px;">
                  <div class="bold" style="font-size: 10px;">NGƯỜI GỬI:</div>
                  <div>HENR STUDIO VIETNAM</div>
                  <div>SĐT: 0987.654.321</div>
                  <div style="font-size: 9px; color: #555;">Hà Nội, Việt Nam</div>
                </div>
                <div style="flex: 1.2;">
                  <div class="bold" style="font-size: 10px;">NGƯỜI NHẬN:</div>
                  <div class="bold">${o.customerName}</div>
                  <div>SĐT: ${o.customerPhone || "—"}</div>
                  <div style="font-size: 9px;">${o.customerAddress || "Địa chỉ giao hàng Shopee"}</div>
                </div>
              </div>
              <div class="section">
                <div class="bold">NỘI DUNG HÀNG HÓA:</div>
                <table class="items-table">
                  <thead>
                    <tr><th>Tên hàng</th><th style="width: 35px;">SL</th><th style="width: 50px;">Phân loại</th></tr>
                  </thead>
                  <tbody>
                    ${(o.items || []).map(it => `
                      <tr>
                        <td>${it.productName}</td>
                        <td align="center">${it.quantity}</td>
                        <td align="center">${it.variantInfo || "Tiêu chuẩn"}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
            <div style="border-top: 2px solid #000; padding-top: 4px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 9px; color: #666;">Chỉ dẫn phát: Không cho xem hàng / Đồng kiểm theo chính sách Shopee</div>
                <div style="font-size: 9px; font-weight: bold;">Ngày tạo đơn: ${formatDate(o.orderDate)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 9px; color: #555;">Thu tiền người nhận (COD):</div>
                <div style="font-size: 14px; font-weight: 900; color: #000;">${o.paymentStatus === "paid" ? "0 đ (ĐÃ TT)" : formatCurrency(o.total)}</div>
              </div>
            </div>
          </div>
        `).join("")}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  // Scan Handover Handler
  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    if (!scannedTrackingList.includes(code)) {
      setScannedTrackingList([code, ...scannedTrackingList]);
      // Cập nhật trạng thái đơn hàng sang shipping nếu khớp mã vận đơn hoặc mã đơn
      const match = orders.find(o => 
        (o.trackingNumber && o.trackingNumber.toUpperCase() === code) || 
        (o.shopeeOrderId && o.shopeeOrderId.toUpperCase() === code) ||
        o.id.toUpperCase() === code
      );
      if (match) {
        db.orders.update(match.id, { status: "shipping", updatedAt: new Date().toISOString() });
        loadShopeeData();
      }
    }
    setScanInput("");
  }

  // Chat reply handler
  function handleSendChat() {
    if (!chatReply.trim()) return;
    const currentConv = chatConversations.find(c => c.id === activeChatId);
    if (!currentConv) return;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "seller",
      text: chatReply,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setChatConversations(chatConversations.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMsg: chatReply,
          time: newMsg.time,
          unread: false,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
    setChatReply("");
  }

  const currentChat = chatConversations.find(c => c.id === activeChatId);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Shopee Top Official Header */}
      <div className="bg-gradient-to-r from-orange-600 via-[#EE4D2D] to-red-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <ShoppingBag size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={13} /> Kênh Người Bán Shopee (Seller Centre VN)
              </span>
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                SPX Express Ready
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Trung Tâm Quản Trị Shopee Official
            </h1>
            <p className="text-orange-100 text-sm mt-1 max-w-xl">
              Cửa hàng chính hãng: <strong className="text-white underline underline-offset-2">@{shopeeShopName}</strong> • Phí cố định & thanh toán sàn: <strong>{shopeeFeeRate}%</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setScanModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all shadow-sm"
            >
              <Scan size={15} className="text-orange-300" /> Quét Barcode Bàn Giao SPX
            </button>
            <button
              onClick={exportShopeeTemplate}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all"
            >
              <Download size={14} /> Mẫu Excel Shopee
            </button>
            <label className="px-3.5 py-2 rounded-xl bg-white text-[#EE4D2D] hover:bg-orange-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
              <Upload size={14} /> Nhập Đơn Shopee
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await importOrdersFromExcel(file);
                    loadShopeeData();
                  }
                }}
              />
            </label>
            <a
              href="https://banhang.shopee.vn"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Mở Kênh Người Bán banhang.shopee.vn"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Operational Action Center (Việc cần làm ngay của Shop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <div 
            onClick={() => { setActiveTab("orders"); setStatusFilter("pending"); }}
            className="cursor-pointer bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all"
          >
            <p className="text-orange-200 text-xs flex items-center gap-1"><Clock size={12} /> Chờ Xác Nhận</p>
            <p className="text-2xl font-black text-white mt-1">{stats.pending}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">SLA: Cần duyệt trong 24h</p>
          </div>
          <div 
            onClick={() => { setActiveTab("orders"); setStatusFilter("processing"); }}
            className="cursor-pointer bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all"
          >
            <p className="text-orange-200 text-xs flex items-center gap-1"><Truck size={12} /> Chờ Lấy Hàng SPX</p>
            <p className="text-2xl font-black text-white mt-1">{stats.processing}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Đã in bill, chờ bưu tá quét</p>
          </div>
          <div 
            onClick={() => { setActiveTab("orders"); setStatusFilter("shipping"); }}
            className="cursor-pointer bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all"
          >
            <p className="text-orange-200 text-xs flex items-center gap-1"><RefreshCw size={12} /> Đang Giao SPX</p>
            <p className="text-2xl font-black text-white mt-1">{stats.shipping}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Tỷ lệ phát thành công 98.4%</p>
          </div>
          <div 
            onClick={() => { setActiveTab("orders"); setStatusFilter("returned"); }}
            className="cursor-pointer bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl p-3 border border-white/10 transition-all"
          >
            <p className="text-orange-200 text-xs flex items-center gap-1"><RotateCcw size={12} /> Trả Hàng / Khiếu Nại</p>
            <p className="text-2xl font-black text-white mt-1">{stats.returned}</p>
            <p className="text-[10px] text-orange-200/80 mt-0.5">Bảo vệ quyền lợi người bán</p>
          </div>
        </div>
      </div>

      {/* 7 Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: "overview", label: "Tổng Quan Hiệu Suất", icon: BarChart3, badge: null },
          { key: "orders", label: "Quản Lý Đơn Hàng", icon: ShoppingBag, badge: stats.pending > 0 ? stats.pending : null },
          { key: "spx", label: "Điều Phối SPX Express", icon: Truck, badge: "Vận chuyển" },
          { key: "finance", label: "Ví Shopee & Đối Soát", icon: DollarSign, badge: formatCurrency(stats.walletBalance) },
          { key: "live", label: "Shopee Live & Flash Sale", icon: Flame, badge: "HOT" },
          { key: "marketing", label: "Kênh Marketing & Voucher", icon: Tag, badge: "Vouchers" },
          { key: "chat", label: "Shopee Chat Khách Hàng", icon: MessageCircle, badge: "98.6%" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ShopeeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#EE4D2D] text-white shadow-md shadow-orange-500/20 font-semibold"
                  : "bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-700/50"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white text-[#EE4D2D]" : "bg-orange-500/20 text-[#EE4D2D]"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & HEALTH METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Shop Health Performance */}
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
              <p className="text-xs text-emerald-400 mt-2 font-medium">Số dư khả dụng: {formatCurrency(stats.walletBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ ĐƠN HÀNG VỚI BULK OPERATIONS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Notification banner if bulk action */}
          {bulkActionSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{bulkActionSuccess}</span>
            </div>
          )}

          {/* Bulk Action Toolbar */}
          {selectedOrderIds.length > 0 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="text-xs font-semibold text-orange-300 flex items-center gap-2">
                <span>Đã chọn <strong className="text-white">{selectedOrderIds.length}</strong> đơn hàng Shopee</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkPrintA6}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer size={14} /> In Phiếu Gửi A6 Hàng Loạt
                </button>
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check size={14} /> Duyệt Chuẩn Bị Hàng Loạt
                </button>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn Shopee, tên khách, SĐT, mã vận đơn SPX..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter size={14} className="text-gray-400" />
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending", label: "Chờ xác nhận" },
                { id: "processing", label: "Chờ lấy hàng" },
                { id: "shipping", label: "Đang giao" },
                { id: "delivered", label: "Đã giao" },
                { id: "returned", label: "Hoàn hàng" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st.id
                      ? "bg-[#EE4D2D] text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Order Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-800/60 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        onChange={toggleSelectAll}
                        className="rounded bg-gray-700 border-gray-600 text-orange-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Mã Đơn Shopee</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Sản Phẩm & Phân Loại</th>
                    <th className="p-3">Thanh Toán</th>
                    <th className="p-3">Vận Đơn SPX</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        Không tìm thấy đơn hàng Shopee nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const isSelected = selectedOrderIds.includes(o.id);
                      return (
                        <tr key={o.id} className={`hover:bg-gray-800/40 transition-colors ${isSelected ? "bg-orange-500/5" : ""}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(o.id)}
                              className="rounded bg-gray-700 border-gray-600 text-orange-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-orange-400">
                              {o.shopeeOrderId || ("SHOPEE-" + o.id.slice(0, 8).toUpperCase())}
                            </span>
                            <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(o.orderDate)}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-white">{o.customerName}</div>
                            <div className="text-[11px] text-gray-500">{o.customerPhone || "Khách Shopee App"}</div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-xs space-y-1">
                              {(o.items || []).slice(0, 2).map((item, idx) => (
                                <div key={idx} className="truncate text-gray-300">
                                  <span className="text-white font-medium">{item.productName}</span>
                                  {item.variantInfo && <span className="text-gray-500 text-[11px]"> ({item.variantInfo})</span>}
                                  <span className="text-orange-400 font-bold ml-1">x{item.quantity}</span>
                                </div>
                              ))}
                              {(o.items || []).length > 2 && (
                                <span className="text-[10px] text-gray-500">+{o.items.length - 2} sản phẩm khác</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{formatCurrency(o.total)}</div>
                            <div className="text-[10px] text-gray-500">
                              Phí sàn ước tính: -{formatCurrency(Math.round(o.total * (shopeeFeeRate / 100)))}
                            </div>
                          </td>
                          <td className="p-3">
                            {o.trackingNumber ? (
                              <div>
                                <span className="font-mono text-[11px] bg-gray-800 text-gray-200 px-2 py-0.5 rounded border border-gray-700">
                                  {o.trackingNumber}
                                </span>
                                <a
                                  href={`https://spx.vn/track?${o.trackingNumber}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-orange-400 hover:underline flex items-center gap-0.5 mt-0.5"
                                >
                                  Tra cứu SPX <ExternalLink size={10} />
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-[11px] italic">Chưa phát hành</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              o.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              o.status === "shipping" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              o.status === "processing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              o.status === "returned" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              "bg-gray-800 text-gray-400"
                            }`}>
                              {o.status === "delivered" ? "Đã Giao SPX" :
                               o.status === "shipping" ? "Đang Giao SPX" :
                               o.status === "processing" ? "Chờ Lấy Hàng" :
                               o.status === "pending" ? "Chờ Duyệt" :
                               o.status === "returned" ? "Hoàn Hàng" : o.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.status === "pending" && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, "processing")}
                                  className="px-2 py-1 rounded bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-[11px]"
                                  title="Chuẩn bị hàng"
                                >
                                  Chuẩn Bị Hàng
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
                                title="Xem chi tiết"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ĐIỀU PHỐI SPX EXPRESS */}
      {activeTab === "spx" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Truck className="text-[#EE4D2D]" size={18} />
                <h3 className="font-bold text-white text-sm">Điểm Bàn Giao SPX Hub</h3>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Bưu tá SPX lấy hàng định kỳ lúc <strong>11:30</strong> và <strong>16:30</strong> mỗi ngày.
              </p>
              <div className="mt-4 p-3 bg-gray-800/60 rounded-xl space-y-1 text-xs">
                <p className="text-gray-300">Hub tiếp nhận: <strong>SPX Hub Cầu Giấy HN</strong></p>
                <p className="text-gray-300">Bưu tá phụ trách: <strong>Nguyễn Văn Toàn (0912.888.xxx)</strong></p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Printer className="text-blue-400" size={18} />
                <h3 className="font-bold text-white text-sm">In Tem Vận Chuyển A6</h3>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Chuẩn kích thước 100x150mm theo tiêu chuẩn máy in nhiệt cầm tay và Xprinter.
              </p>
              <button
                onClick={() => {
                  setSelectedOrderIds(filteredOrders.slice(0, 10).map(o => o.id));
                  handleBulkPrintA6();
                }}
                className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors"
              >
                In 10 Tem Vận Đơn Mới Nhất
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Scan className="text-emerald-400" size={18} />
                <h3 className="font-bold text-white text-sm">Quét Mã Barcode Bàn Giao</h3>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Sử dụng súng bắn mã vạch hoặc camera quét khi bàn giao đơn hàng cho bưu tá.
              </p>
              <button
                onClick={() => setScanModalOpen(true)}
                className="mt-4 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors"
              >
                Mở Giao Diện Quét Barcode
              </button>
            </div>
          </div>

          {/* SPX Tracking Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-bold text-white text-sm mb-3">Danh Sách Bưu Kiện Đang Lưu Chuyển SPX Express</h3>
            <div className="space-y-3">
              {filteredOrders.filter(o => o.status === "shipping" || o.trackingNumber).slice(0, 8).map(o => (
                <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-800/40 border border-gray-800 rounded-xl gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-400 text-xs">{o.trackingNumber || ("SPXVN" + o.id.slice(0, 8).toUpperCase())}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Đang luân chuyển</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Giao đến: <strong>{o.customerName}</strong> ({o.customerAddress || "Hà Nội / HCM"})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{formatCurrency(o.total)}</span>
                    <a
                      href={`https://spx.vn/track?${o.trackingNumber || o.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      Kiểm Tra SPX.vn <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VÍ SHOPEE & BÓC TÁCH PHÍ SÀN */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Số Dư Ví Người Bán Shopee (Shopee Wallet)</span>
                <p className="text-3xl font-black text-white mt-1">{formatCurrency(stats.walletBalance)}</p>
                <p className="text-xs text-gray-400 mt-1">Đã đối soát thành công sau khi khách bấm xác nhận đã nhận hàng.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert(`Yêu cầu rút ${formatCurrency(stats.walletBalance)} về tài khoản ngân hàng liên kết đã được gửi tới Shopee!`)}
                  className="px-4 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 font-bold text-xs text-white shadow-md transition-all"
                >
                  Rút Tiền Về Ngân Hàng
                </button>
              </div>
            </div>
          </div>

          {/* Phân tách 3 loại chi phí Shopee chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <span className="text-xs text-gray-400">1. Phí Thanh Toán (Payment Fee)</span>
              <p className="text-xl font-black text-white mt-2">{formatCurrency(stats.paymentFee)}</p>
              <p className="text-xs text-gray-500 mt-1">Tỷ lệ: 5.0% trên tổng giá trị người mua thanh toán</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <span className="text-xs text-gray-400">2. Phí Cố Định Hoa Hồng Sàn</span>
              <p className="text-xl font-black text-white mt-2">{formatCurrency(stats.commissionFee)}</p>
              <p className="text-xs text-gray-500 mt-1">Tỷ lệ: 4.5% đối với gian hàng Thời Trang</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <span className="text-xs text-gray-400">3. Gói Freeship Xtra & Dịch Vụ</span>
              <p className="text-xl font-black text-white mt-2">Đang áp dụng</p>
              <p className="text-xs text-gray-500 mt-1">Tăng 35% tỷ lệ hiển thị trên trang tìm kiếm Shopee</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SHOPEE LIVE & FLASH SALE */}
      {activeTab === "live" && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Flame size={18} className="text-[#EE4D2D]" />
                  Flash Sale Trong Ngày (Khung Giờ Vàng)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Đã khóa số lượng kho may để tránh tình trạng bán vượt tồn kho trong phiên Flash Sale.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Đang diễn ra (12:00 - 14:00)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {flashSaleSlots.map(item => (
                <div key={item.id} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs line-clamp-1">{item.name}</h4>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                      -{Math.round((1 - item.salePrice / item.originalPrice) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-[#EE4D2D]">{formatCurrency(item.salePrice)}</span>
                    <span className="text-xs text-gray-500 line-through">{formatCurrency(item.originalPrice)}</span>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Đã bán {item.sold}/{item.stock}</span>
                      <span className="text-orange-400 font-bold">{Math.round((item.sold / item.stock) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#EE4D2D] h-full rounded-full transition-all" style={{ width: `${(item.sold / item.stock) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: KÊNH MARKETING & VOUCHERS */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vouchers.map((v, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20">
                    {v.code}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Đang chạy</span>
                </div>
                <h4 className="font-bold text-white text-xs mt-3">{v.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{v.discount} • Đơn tối thiểu {formatCurrency(v.minOrder)}</p>
                <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Đã dùng: <strong>{v.used}/{v.limit}</strong></span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(v.code)}
                    className="text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Copy size={11} /> Sao chép mã
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SHOPEE WEB CHAT SIMULATOR */}
      {activeTab === "chat" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 h-[520px]">
          {/* Conversation List */}
          <div className="border-r border-gray-800 flex flex-col h-full bg-gray-900/60">
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between">
              <span className="font-bold text-white text-xs">Tin Nhắn Khách Hàng Shopee</span>
              <span className="text-[10px] bg-orange-500/20 text-[#EE4D2D] font-bold px-2 py-0.5 rounded-full">Phản hồi 98.6%</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
              {chatConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    activeChatId === conv.id ? "bg-orange-500/10 border-l-2 border-[#EE4D2D]" : "hover:bg-gray-800/40"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-xs">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-white text-xs truncate">@{conv.customer}</span>
                      <span className="text-[10px] text-gray-500">{conv.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMsg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Chat Window */}
          <div className="col-span-2 flex flex-col h-full bg-gray-950">
            {currentChat && (
              <>
                <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">@{currentChat.customer}</span>
                    <span className="text-[11px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Đơn #{currentChat.orderCode}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Trực tuyến
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {currentChat.messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === "seller" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md rounded-2xl px-3.5 py-2 text-xs ${
                        m.sender === "seller"
                          ? "bg-[#EE4D2D] text-white rounded-br-sm"
                          : "bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700"
                      }`}>
                        <p>{m.text}</p>
                        <span className={`text-[9px] block text-right mt-1 ${m.sender === "seller" ? "text-orange-200" : "text-gray-500"}`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Nhập nội dung tư vấn size, kiểm tra đơn hàng..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleSendChat}
                    className="p-2 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Quét Barcode Bàn Giao SPX */}
      {scanModalOpen && (
        <Modal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} title="Quét Barcode Bàn Giao SPX Express">
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Nhập hoặc dùng máy quét bắn mã vận đơn SPX (bắt đầu bằng SPXVN...) để tự động chuyển trạng thái đơn hàng sang <strong className="text-blue-400">Đang Giao</strong>.
            </p>
            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Quét hoặc gõ mã vận đơn SPX..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Ghi Nhận
              </button>
            </form>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Đã quét bàn giao ({scannedTrackingList.length} kiện):</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-gray-900 p-2 rounded-xl border border-gray-800">
                {scannedTrackingList.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">Chưa có mã vận đơn nào được quét.</p>
                ) : (
                  scannedTrackingList.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-800/60 rounded">
                      <span className="font-mono text-emerald-400 font-bold">{code}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-400" /> Thành công</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <Modal isOpen={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={"Chi Tiết Đơn Hàng Shopee #" + (selectedOrder ? (selectedOrder.shopeeOrderId || selectedOrder.id) : "")}>
          <div className="space-y-4 text-sm text-gray-200">
            <div className="bg-gray-800/60 p-4 rounded-xl space-y-2">
              <p><strong>Khách hàng:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone || "—"})</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerAddress || "Chưa có địa chỉ"}</p>
              <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.orderDate)}</p>
              <p><strong>Đơn vị vận chuyển:</strong> SPX Express (Mã VĐ: {selectedOrder.trackingNumber || "Chưa tạo"})</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-gray-400 mb-2">Sản phẩm</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded bg-gray-800 text-xs">
                    <span>{it.productName} ({it.variantInfo || "Bộ"}) x{it.quantity}</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 font-bold">
              <span>Tổng thanh toán:</span>
              <span className="text-orange-400 text-base">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
