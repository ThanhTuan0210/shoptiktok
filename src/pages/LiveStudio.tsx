import { useEffect, useState, useMemo, useRef } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant, LiveSession, LivePinnedProduct, Order } from "../types";
import {
  Radio, Video, Play, Square, Plus, Sparkles, Clock, Flame,
  TrendingUp, ShoppingBag, Phone, MapPin, Printer, CheckCircle2,
  AlertTriangle, ArrowRight, Eye, RefreshCw, X, Zap, MessageSquare, Heart, Users, ExternalLink, Share2
} from "lucide-react";
import Modal from "../components/ui/Modal";
import PrintShippingModal from "../components/ui/PrintShippingModal";
import { formatCurrency, formatDate, formatNumber, generateId, now, today } from "../utils/helpers";
import { playOrderChime } from "../utils/audioAlert";
import { broadcastNewOrder } from "../utils/orderSyncEvents";

export default function LiveStudio() {
  const [activeTab, setActiveTab] = useState<"studio" | "sessions" | "reports">("studio");
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Print Modal
  const [printOrders, setPrintOrders] = useState<Order[]>([]);

  // Flash sale countdown timer (in seconds)
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Fast Live Order Form
  const [fastOrder, setFastOrder] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    pinNumber: 1,
    variantId: "",
    quantity: 1,
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // New Live Session Modal
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: "Đại Tiệc Pyjama TikTok Live - Săn Deal Độc Quyền",
    hostName: "Trang Henr",
    scheduledStartTime: today() + "T20:00",
    targetRevenue: 20000000,
    note: "Tập trung các mẫu sọc kẻ và lụa satin bán chạy",
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customLivePrices, setCustomLivePrices] = useState<Record<string, number>>({});

  // Selected session for reports
  const [selectedReportSessionId, setSelectedReportSessionId] = useState<string>("");

  // TikTok Live Connector State
  const [tiktokChannel, setTiktokChannel] = useState<string>(() => {
    return localStorage.getItem("tt_live_channel") || "@henr.studio";
  });
  const [viewerCount, setViewerCount] = useState(1428);
  const [likeCount, setLikeCount] = useState(28500);
  const [liveTabRight, setLiveTabRight] = useState<"orders" | "comments">("comments");

  interface LiveComment {
    id: string;
    user: string;
    avatar: string;
    text: string;
    time: string;
    suggestedOrder?: {
      pinNumber: number;
      size: string;
      phone: string;
      name: string;
    };
  }

  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', user: 'Lan Hương', avatar: 'LH', text: 'Chốt ghim 1 màu hồng size M nhé shop! SĐT 0988234123', time: 'Vừa xong', suggestedOrder: { pinNumber: 1, size: 'M', phone: '0988234123', name: 'Chị Lan Hương' } },
    { id: '2', user: 'Ngọc Bích', avatar: 'NB', text: '52kg cao 1m58 mặc size M vừa xinh không shop ơi?', time: '6s trước' },
    { id: '3', user: 'Hoàng Oanh', avatar: 'HO', text: 'Chốt bộ sọc caro L, SĐT 0912456789 giao về Hà Nội nha', time: '15s trước', suggestedOrder: { pinNumber: 2, size: 'L', phone: '0912456789', name: 'Chị Hoàng Oanh' } },
    { id: '4', user: 'Thu Hằng', avatar: 'TH', text: 'Đã share live chốt 2 bộ freeship nha shop! 0977891234', time: '28s trước', suggestedOrder: { pinNumber: 1, size: 'S', phone: '0977891234', name: 'Thu Hằng' } },
    { id: '5', user: 'Thanh Mai', avatar: 'TM', text: 'Chất lụa satin này có giặt máy được không shop?', time: '40s trước' },
  ]);

  // Simulated live viewers and comments stream
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(v => Math.max(900, v + Math.floor(Math.random() * 21) - 10));
      setLikeCount(l => l + Math.floor(Math.random() * 35) + 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCaptureCommentOrder = (comm: LiveComment) => {
    if (!comm.suggestedOrder) return;
    const { pinNumber, size, phone, name } = comm.suggestedOrder;
    const item = activeSession?.pinnedProducts.find(p => p.pinNumber === pinNumber);
    const itemVars = item ? variants.filter(v => v.productId === item.productId) : [];
    const matchedVar = itemVars.find(v => v.size.toLowerCase() === size.toLowerCase()) || itemVars[0];

    setFastOrder(prev => ({
      ...prev,
      pinNumber,
      variantId: matchedVar ? matchedVar.id : prev.variantId,
      customerName: name,
      customerPhone: phone,
      quantity: 1,
    }));
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Flash Sale Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  async function loadAllData() {
    setLoading(true);
    const [allSessions, allProds, allVars, allOrders] = await Promise.all([
      db.liveSessions.orderBy("createdAt").reverse().toArray(),
      db.products.toArray(),
      db.productVariants.toArray(),
      db.orders.toArray()
    ]);

    setProducts(allProds);
    setVariants(allVars);

    // If no sessions exist, auto-seed an initial exciting session
    if (allSessions.length === 0 && allProds.length > 0) {
      const initialPinned: LivePinnedProduct[] = allProds.slice(0, 4).map((p, idx) => ({
        pinNumber: idx + 1,
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        imageUrl: p.imageUrl,
        originalPrice: p.sellingPrice,
        livePrice: Math.round(p.sellingPrice * 0.8 / 1000) * 1000, // 20% off
        allocatedStock: 50,
        soldCount: 0,
      }));

      const seedSession: LiveSession = {
        id: generateId(),
        title: "Đại Tiệc Pyjama Giữa Tháng - Săn Deal Khủng",
        hostName: "Trang Henr",
        status: "active",
        scheduledStartTime: today() + "T19:30",
        actualStartTime: now(),
        targetRevenue: 15000000,
        pinnedProducts: initialPinned,
        note: "Phiên Live chính thức của Henr.Studio trên kênh TikTok",
        createdAt: now(),
        updatedAt: now(),
      };
      await db.liveSessions.add(seedSession);
      allSessions.push(seedSession);
    }

    setSessions(allSessions);

    // Identify active session
    const current = allSessions.find(s => s.status === "active") || null;
    setActiveSession(current);

    if (current) {
      setSelectedReportSessionId(current.id);
      // Filter orders tied to active session
      const matched = allOrders.filter(o => o.liveSessionId === current.id);
      setLiveOrders(matched);
      if (current.pinnedProducts.length > 0) {
        setFastOrder(p => ({ ...p, pinNumber: 1 }));
      }
    } else if (allSessions.length > 0) {
      setSelectedReportSessionId(allSessions[0].id);
    }

    setLoading(false);
  }

  // Active Session Metrics
  const activeMetrics = useMemo(() => {
    if (!activeSession) return { revenue: 0, orderCount: 0, pctTarget: 0, totalItems: 0 };
    const revenue = liveOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const orderCount = liveOrders.length;
    const totalItems = liveOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);
    const pctTarget = activeSession.targetRevenue > 0
      ? Math.min(100, Math.round((revenue / activeSession.targetRevenue) * 100))
      : 0;
    return { revenue, orderCount, pctTarget, totalItems };
  }, [activeSession, liveOrders]);

  // Selected Pinned Item for fast order
  const currentPinnedItem = useMemo(() => {
    if (!activeSession) return null;
    return activeSession.pinnedProducts.find(p => p.pinNumber === Number(fastOrder.pinNumber));
  }, [activeSession, fastOrder.pinNumber]);

  const currentItemVariants = useMemo(() => {
    if (!currentPinnedItem) return [];
    return variants.filter(v => v.productId === currentPinnedItem.productId);
  }, [variants, currentPinnedItem]);

  // Quick Restock in Studio Mode
  async function handleQuickStockAdd(variantId: string, addQty: number) {
    const v = await db.productVariants.get(variantId);
    if (!v) return;

    await db.productVariants.update(v.id, { stock: v.stock + addQty });
    await db.stockMovements.add({
      id: generateId(),
      variantId: v.id,
      productId: v.productId,
      type: "purchase",
      quantity: addQty,
      unitCost: 150000,
      note: `Bơm thêm kho phòng Live (${activeSession?.title || "Live"})`,
      date: today(),
      createdAt: now(),
    });

    // Refresh variants
    const allVars = await db.productVariants.toArray();
    setVariants(allVars);
  }

  // Fast Live Order Submission (Chốt đơn nóng 3 giây)
  async function handleFastLiveOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession || !currentPinnedItem || !fastOrder.customerName || !fastOrder.customerPhone) {
      alert("Vui lòng điền đủ Tên và Số điện thoại khách hàng!");
      return;
    }

    const selectedVar = variants.find(v => v.id === fastOrder.variantId) || currentItemVariants[0];
    if (!selectedVar) {
      alert("Chưa chọn màu sắc & kích cỡ!");
      return;
    }

    if (selectedVar.stock < fastOrder.quantity) {
      alert(`Mẫu này hiện chỉ còn ${selectedVar.stock} bộ trong kho, không đủ để chốt!`);
      return;
    }

    setIsSubmittingOrder(true);
    const orderId = `LIVE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const unitPrice = currentPinnedItem.livePrice;
    const total = unitPrice * fastOrder.quantity;

    const newOrder: Order = {
      id: generateId(),
      tiktokOrderId: orderId,
      customerName: fastOrder.customerName,
      customerPhone: fastOrder.customerPhone,
      customerAddress: fastOrder.customerAddress || "Chờ bổ sung địa chỉ từ Live chat",
      status: "pending",
      orderDate: today(),
      subtotal: total,
      sellerDiscount: 0,
      shippingFee: 0,
      total,
      shippingCarrier: "GHTK",
      trackingNumber: "",
      note: `🔴 Đơn chốt trong TikTok Live: "${activeSession.title}" | Ghim #${currentPinnedItem.pinNumber}`,
      paymentMethod: "cod",
      liveSessionId: activeSession.id,
      createdAt: now(),
      updatedAt: now(),
      items: [{
        id: generateId(),
        productId: currentPinnedItem.productId,
        variantId: selectedVar.id,
        productName: currentPinnedItem.productName,
        variantInfo: `${selectedVar.color} - ${selectedVar.size}`,
        variantName: `${selectedVar.color} - ${selectedVar.size}`,
        sku: selectedVar.sku,
        quantity: fastOrder.quantity,
        unitPrice,
        unitCost: 150000,
      }]
    };

    await db.orders.add(newOrder);
    broadcastNewOrder(newOrder);

    // Deduct stock
    await db.productVariants.update(selectedVar.id, { stock: Math.max(0, selectedVar.stock - fastOrder.quantity) });
    await db.stockMovements.add({
      id: generateId(),
      productId: currentPinnedItem.productId,
      variantId: selectedVar.id,
      type: "sale",
      quantity: -fastOrder.quantity,
      note: `Bán trong Live #${activeSession.title}`,
      date: today(),
      createdAt: now(),
    });

    // Update session sold count
    const updatedPinned = activeSession.pinnedProducts.map(p =>
      p.pinNumber === currentPinnedItem.pinNumber
        ? { ...p, soldCount: p.soldCount + fastOrder.quantity }
        : p
    );
    await db.liveSessions.update(activeSession.id, { pinnedProducts: updatedPinned, updatedAt: now() });

    // Play upbeat audio alert
    playOrderChime();

    // Reset fast order input
    setFastOrder(p => ({
      ...p,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      quantity: 1,
    }));

    // Refresh state
    setLiveOrders(prev => [newOrder, ...prev]);
    const allVars = await db.productVariants.toArray();
    setVariants(allVars);
    setActiveSession(prev => prev ? { ...prev, pinnedProducts: updatedPinned } : null);
    setIsSubmittingOrder(false);
  }

  // Start Live Session
  async function handleStartSession(session: LiveSession) {
    // End any currently active session first
    if (activeSession) {
      await db.liveSessions.update(activeSession.id, { status: "ended", actualEndTime: now() });
    }

    const updates: Partial<LiveSession> = {
      status: "active",
      actualStartTime: now(),
      updatedAt: now(),
    };
    await db.liveSessions.update(session.id, updates);
    await loadAllData();
    setActiveTab("studio");
  }

  // End Live Session
  async function handleEndSession() {
    if (!activeSession) return;
    if (!confirm(`Bạn có chắc muốn kết thúc phiên live "${activeSession.title}"?`)) return;

    await db.liveSessions.update(activeSession.id, {
      status: "ended",
      actualEndTime: now(),
      updatedAt: now(),
    });

    await loadAllData();
    setActiveTab("reports");
  }

  // Create New Live Session
  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProductIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để ghim vào giỏ hàng Live!");
      return;
    }

    const pinned: LivePinnedProduct[] = selectedProductIds.map((pid, idx) => {
      const p = products.find(x => x.id === pid)!;
      const livePrice = customLivePrices[pid] || Math.round(p.sellingPrice * 0.85 / 1000) * 1000;
      return {
        pinNumber: idx + 1,
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        imageUrl: p.imageUrl,
        originalPrice: p.sellingPrice,
        livePrice,
        allocatedStock: 50,
        soldCount: 0,
      };
    });

    const newSession: LiveSession = {
      id: generateId(),
      title: newSessionForm.title,
      hostName: newSessionForm.hostName,
      status: "scheduled",
      scheduledStartTime: newSessionForm.scheduledStartTime,
      targetRevenue: Number(newSessionForm.targetRevenue),
      pinnedProducts: pinned,
      note: newSessionForm.note,
      createdAt: now(),
      updatedAt: now(),
    };

    await db.liveSessions.add(newSession);
    setShowNewSessionModal(false);
    setSelectedProductIds([]);
    setCustomLivePrices({});
    await loadAllData();
  }

  // Selected Report Session Data
  const reportSession = useMemo(() => {
    return sessions.find(s => s.id === selectedReportSessionId) || sessions[0] || null;
  }, [sessions, selectedReportSessionId]);

  const reportOrders = useMemo(() => {
    if (!reportSession) return [];
    return liveOrders.filter(o => o.liveSessionId === reportSession.id);
  }, [reportSession, liveOrders]);

  const reportStats = useMemo(() => {
    const valid = reportOrders.filter(o => o.status !== "cancelled");
    const totalRev = valid.reduce((s, o) => s + o.total, 0);
    const aov = valid.length > 0 ? Math.round(totalRev / valid.length) : 0;
    return {
      revenue: totalRev,
      ordersCount: valid.length,
      aov,
    };
  }, [reportOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title flex items-center gap-2">
              <Radio size={22} className="text-rose-500" /> TikTok Live Studio
            </h1>
            {activeSession ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> ĐANG LIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-400">
                Chưa phát trực tiếp
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Màn hình Trợ lý phòng live: Kiểm soát tồn kho ghim, đồng hồ Flash Sale, nhảy đơn tức thì và in vận đơn A6
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> Tạo phiên Live mới
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-gray-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab("studio")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "studio"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Video size={16} /> 🔴 Trợ Lý Phòng Live (Studio Mode)
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "sessions"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Clock size={16} /> Kế Hoạch & Lịch Live ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "reports"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <TrendingUp size={16} /> Báo Cáo & In Vận Đơn Buổi Live
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: STUDIO ASSISTANT MODE (MÀN HÌNH TRỰC CHIẾN TRỢ LÝ) */}
      {/* ============================================================ */}
      {activeTab === "studio" && (
        <div className="space-y-5">
          {activeSession ? (
            <>
              {/* Active Session Status Bar */}
              <div className="bg-gradient-to-r from-rose-950/60 via-gray-900 to-gray-900 border border-rose-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Radio size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base">{activeSession.title}</span>
                      <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        🎤 Host: {activeSession.hostName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Bắt đầu lúc: {formatDate(activeSession.actualStartTime || activeSession.createdAt)} • {activeSession.pinnedProducts.length} sản phẩm ghim giỏ hàng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEndSession}
                    className="btn bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 flex items-center gap-1.5"
                  >
                    <Square size={13} fill="currentColor" /> Kết thúc phiên Live
                  </button>
                </div>
              </div>

              {/* TikTok Live Connector Command Bar */}
              <div className="bg-gray-900 border border-rose-900/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                      TikTok Live Stream:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-700">
                    <span className="text-xs font-bold text-white">{tiktokChannel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <Users size={13} /> {viewerCount.toLocaleString()} mắt xem
                    </span>
                    <span className="flex items-center gap-1 text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                      <Heart size={13} fill="currentColor" /> {(likeCount / 1000).toFixed(1)}k tim
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.tiktok.com/${tiktokChannel}/live`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bg-[#fe2c55] hover:bg-[#e62045] text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-transform active:scale-95"
                    title="Mở xem phòng live trực tiếp trên TikTok"
                  >
                    <ExternalLink size={13} /> Mở TikTok Live
                  </a>
                  <span className="text-[11px] text-gray-400 bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-700 hidden sm:inline-block">
                    ✓ Đã liên kết TikTok Shop Bridge
                  </span>
                </div>
              </div>

              {/* Real-time KPI Counters & Flash Sale Widget */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 flex items-center justify-between mb-1">
                    <span>Doanh thu phòng Live</span>
                    <TrendingUp size={15} className="text-emerald-400" />
                  </p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(activeMetrics.revenue)}</p>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${activeMetrics.pctTarget}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Đạt {activeMetrics.pctTarget}% mục tiêu ({formatCurrency(activeSession.targetRevenue)})</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 flex items-center justify-between mb-1">
                    <span>Số đơn nổ</span>
                    <ShoppingBag size={15} className="text-rose-400" />
                  </p>
                  <p className="text-xl font-bold text-white">{formatNumber(activeMetrics.orderCount)} <span className="text-xs font-normal text-gray-400">đơn</span></p>
                  <p className="text-[11px] text-gray-500 mt-2">Tổng {formatNumber(activeMetrics.totalItems)} bộ đã chốt</p>
                </div>

                {/* Flash Sale Countdown Timer */}
                <div className="bg-gray-900 border border-amber-600/40 rounded-xl p-4 col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Flame size={15} /> Đồng hồ Flash Sale chớp nhoáng
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          isTimerRunning ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isTimerRunning ? "Tạm dừng" : "Bắt đầu"}
                      </button>
                      <button
                        onClick={() => { setTimerSeconds(600); setIsTimerRunning(false); }}
                        className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:text-white"
                      >
                        10p
                      </button>
                      <button
                        onClick={() => { setTimerSeconds(300); setIsTimerRunning(false); }}
                        className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:text-white"
                      >
                        5p
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                      {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
                    </p>
                    <span className="text-xs text-gray-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      🔥 Nhắc host hô: Deal chỉ mở bán trong đồng hồ đếm ngược!
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Workspace: Pinned Items Monitor Left & Fast Order Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left (2 Cols): Pinned Items Real-time Stock Monitor */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" /> Bảng Giám Sát Tồn Kho Theo Ghim Giỏ Hàng
                    </h3>
                    <span className="text-xs text-gray-500">Tự động báo đỏ khi mẫu còn &le; 3 bộ</span>
                  </div>

                  <div className="space-y-3">
                    {activeSession.pinnedProducts.map(item => {
                      const itemVars = variants.filter(v => v.productId === item.productId);
                      const totalVarStock = itemVars.reduce((s, v) => s + v.stock, 0);
                      const lowVar = itemVars.find(v => v.stock > 0 && v.stock <= 3);
                      const outVar = itemVars.find(v => v.stock === 0);

                      return (
                        <div
                          key={item.pinNumber}
                          className={`bg-gray-900 border rounded-2xl p-4 transition-all ${
                            lowVar
                              ? "border-red-600/70 shadow-lg shadow-red-950/40 bg-gradient-to-r from-red-950/20 to-gray-900"
                              : "border-gray-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                                #{item.pinNumber}
                              </span>
                              <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No img</div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm leading-snug">{item.productName}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="font-mono text-xs text-gray-400">{item.productSku}</span>
                                  <span className="text-xs text-gray-500 line-through">{formatCurrency(item.originalPrice)}</span>
                                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                    Giá Live: {formatCurrency(item.livePrice)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-400">Tổng kho còn</p>
                              <p className={`text-lg font-bold ${totalVarStock <= 10 ? "text-red-400" : "text-emerald-400"}`}>
                                {totalVarStock} bộ
                              </p>
                            </div>
                          </div>

                          {/* Urgent Host Alert Badge */}
                          {lowVar && (
                            <div className="mt-3 bg-red-500/20 border border-red-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-red-300 animate-pulse">
                              <span className="font-bold flex items-center gap-1.5">
                                <AlertTriangle size={14} /> BÁO HOST: {lowVar.color} - Size {lowVar.size} chỉ còn {lowVar.stock} bộ cuối!
                              </span>
                              <button
                                onClick={() => handleQuickStockAdd(lowVar.id, 10)}
                                className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm"
                              >
                                + Bơm 10 bộ
                              </button>
                            </div>
                          )}

                          {/* Variants breakdown chips */}
                          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-semibold">Tồn kho theo size:</span>
                            {itemVars.map(v => (
                              <div
                                key={v.id}
                                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                                  v.stock === 0
                                    ? "bg-gray-800/60 border-gray-700 text-gray-500 line-through"
                                    : v.stock <= 3
                                    ? "bg-red-950/60 border-red-700 text-red-300 font-bold"
                                    : "bg-gray-800 border-gray-700 text-gray-200"
                                }`}
                              >
                                <span>{v.size}:</span>
                                <span className="font-bold">{v.stock}</span>
                                <button
                                  onClick={() => handleQuickStockAdd(v.id, 10)}
                                  className="text-[10px] text-gray-400 hover:text-emerald-400 ml-1"
                                  title="Thêm nhanh 10 bộ"
                                >
                                  +10
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right (1 Col): Fast Live Order Box (Chốt đơn nóng 3 giây) */}
                <div className="space-y-4">
                  <div className="bg-gray-900 border border-rose-800/40 rounded-2xl p-4 shadow-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-rose-500" /> Chốt Đơn Nóng Phòng Live (3 Giây)
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-3">
                      Nhập SĐT khách để lại trên comment hoặc chat Zalo/TikTok để chốt đơn ngay
                    </p>

                    <form onSubmit={handleFastLiveOrder} className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Chọn Ghim sản phẩm:</label>
                        <select
                          className="input text-xs"
                          value={fastOrder.pinNumber}
                          onChange={e => setFastOrder(p => ({ ...p, pinNumber: Number(e.target.value) }))}
                        >
                          {activeSession.pinnedProducts.map(p => (
                            <option key={p.pinNumber} value={p.pinNumber}>
                              Ghim #{p.pinNumber} - {p.productName} ({formatCurrency(p.livePrice)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {currentItemVariants.length > 0 && (
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Chọn Màu & Size:</label>
                          <select
                            className="input text-xs font-medium"
                            value={fastOrder.variantId || currentItemVariants[0]?.id}
                            onChange={e => setFastOrder(p => ({ ...p, variantId: e.target.value }))}
                          >
                            {currentItemVariants.map(v => (
                              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                                {v.color} - Size {v.size} (Còn {v.stock} bộ){v.stock === 0 ? " - HẾT HÀNG" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Số điện thoại *</label>
                          <input
                            required
                            type="text"
                            placeholder="0988..."
                            className="input text-xs font-mono"
                            value={fastOrder.customerPhone}
                            onChange={e => setFastOrder(p => ({ ...p, customerPhone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Tên khách *</label>
                          <input
                            required
                            type="text"
                            placeholder="Chị Mai..."
                            className="input text-xs"
                            value={fastOrder.customerName}
                            onChange={e => setFastOrder(p => ({ ...p, customerName: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Địa chỉ nhận</label>
                          <input
                            type="text"
                            placeholder="Số nhà, phố, tỉnh..."
                            className="input text-xs"
                            value={fastOrder.customerAddress}
                            onChange={e => setFastOrder(p => ({ ...p, customerAddress: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Số lượng</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="input text-xs font-bold text-center"
                            value={fastOrder.quantity}
                            onChange={e => setFastOrder(p => ({ ...p, quantity: Math.max(1, Number(e.target.value)) }))}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingOrder}
                        className="w-full btn bg-gradient-to-r from-rose-600 to-[#fe2c55] hover:from-rose-500 hover:to-[#e62045] text-white font-bold py-2.5 text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5"
                      >
                        <Zap size={14} /> Chốt đơn Live ngay ({formatCurrency((currentPinnedItem?.livePrice || 0) * fastOrder.quantity)})
                      </button>
                    </form>
                  </div>

                  {/* Live Stream Interaction Box: Comments Feed & Orders Ticker */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setLiveTabRight("comments")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            liveTabRight === "comments"
                              ? "bg-rose-600 text-white"
                              : "text-gray-400 hover:text-white bg-gray-800/60"
                          }`}
                        >
                          <MessageSquare size={13} /> Chat TikTok Live ({liveComments.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLiveTabRight("orders")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            liveTabRight === "orders"
                              ? "bg-rose-600 text-white"
                              : "text-gray-400 hover:text-white bg-gray-800/60"
                          }`}
                        >
                          <ShoppingBag size={13} /> Đơn Nổ ({liveOrders.length})
                        </button>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>

                    {liveTabRight === "comments" ? (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        <div className="text-[11px] text-gray-400 bg-gray-800/40 p-2 rounded-lg border border-gray-800 flex items-center justify-between mb-2">
                          <span>💡 Bấm <b>"Bắt đơn"</b> để tự điền SĐT & Size vào form chốt</span>
                          <span className="text-emerald-400 font-bold">● Live Chat</span>
                        </div>
                        {liveComments.map(comm => (
                          <div
                            key={comm.id}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              comm.suggestedOrder
                                ? "bg-rose-950/30 border-rose-800/60 shadow-sm"
                                : "bg-gray-800/40 border-gray-800 text-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {comm.avatar}
                                </div>
                                <span className="font-bold text-gray-200">{comm.user}</span>
                              </div>
                              <span className="text-[10px] text-gray-500">{comm.time}</span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1 pl-6 leading-relaxed">
                              {comm.text}
                            </p>
                            {comm.suggestedOrder && (
                              <div className="mt-2 pt-1.5 border-t border-rose-900/40 flex items-center justify-between pl-6">
                                <span className="text-[10px] text-rose-300 font-mono">
                                  Phát hiện: Ghim #{comm.suggestedOrder.pinNumber} • Size {comm.suggestedOrder.size} • {comm.suggestedOrder.phone}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCaptureCommentOrder(comm)}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                  title="Tự động bốc thông tin comment vào form chốt đơn"
                                >
                                  <Zap size={11} /> Bắt đơn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {liveOrders.length === 0 ? (
                          <p className="text-xs text-gray-500 py-8 text-center">Chưa có đơn nào. Hãy chốt đơn đầu tiên!</p>
                        ) : (
                          liveOrders.map(order => (
                            <div key={order.id} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{order.customerName}</span>
                                <span className="font-bold text-rose-400">{formatCurrency(order.total)}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-400 mt-1">
                                <span className="font-mono text-[11px]">{order.customerPhone}</span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  COD
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <Radio size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Hiện chưa có phiên Live nào đang phát</h3>
              <p className="text-xs text-gray-400">
                Hãy chọn một phiên live đã lên lịch để bấm "Bắt đầu Live ngay", hoặc tạo một phiên live mới để đưa sản phẩm lên sóng.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("sessions")}
                  className="btn-secondary text-xs"
                >
                  Xem danh sách phiên Live
                </button>
                <button
                  onClick={() => setShowNewSessionModal(true)}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> Tạo phiên Live mới
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: LIVE SESSIONS LIST & SCHEDULER */}
      {/* ============================================================ */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {/* TikTok Live Guidance Banner */}
          <div className="bg-gradient-to-r from-gray-900 via-rose-950/40 to-gray-900 border border-rose-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Radio size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Kênh TikTok Live: <span className="text-rose-400 font-mono">{tiktokChannel}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700">● Đã liên kết TikTok</span>
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  👉 Bạn đang ở tab <b>Lên lịch Live</b>. Hãy bấm nút đỏ <b className="text-rose-400">"Vào phòng Live Studio"</b> bên dưới để vào <b>buồng lái tác chiến trực tiếp</b> (Flash Sale đếm ngược, Ghim deal tự nhảy giá ra web, Luồng bình luận TikTok & Chốt đơn 3 giây)!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.tiktok.com/${tiktokChannel}/live`}
                target="_blank"
                rel="noreferrer"
                className="btn bg-[#fe2c55] hover:bg-[#e62045] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-transform active:scale-95"
              >
                <ExternalLink size={13} /> Mở TikTok Live Kênh
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Kế Hoạch Các Buổi Livestream TikTok</h3>
              <p className="text-xs text-gray-400">Lên lịch trước, cài đặt ghim và đặt giá deal để tự tin lên sóng</p>
            </div>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Thêm lịch Live mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(s => {
              const isCurr = s.status === "active";
              const isEnded = s.status === "ended";

              return (
                <div
                  key={s.id}
                  className={`bg-gray-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isCurr
                      ? "border-rose-600/70 shadow-lg shadow-rose-950/40 bg-gradient-to-br from-rose-950/30 to-gray-900"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {isCurr ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                          🔴 ĐANG PHÁT TRỰC TIẾP
                        </span>
                      ) : isEnded ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-400">
                          Đã kết thúc
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Đã lên lịch
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-mono">{formatDate(s.scheduledStartTime)}</span>
                    </div>

                    <h4 className="font-bold text-white text-base leading-snug mb-1">{s.title}</h4>
                    <p className="text-xs text-gray-400 mb-3">🎤 Host chính: <strong className="text-gray-200">{s.hostName}</strong></p>

                    <div className="bg-gray-800/50 rounded-xl p-3 space-y-1.5 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mục tiêu doanh thu:</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(s.targetRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sản phẩm ghim giỏ:</span>
                        <span className="font-bold text-white">{s.pinnedProducts.length} ghim</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
                    {!isCurr && !isEnded && (
                      <button
                        onClick={() => handleStartSession(s)}
                        className="btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 px-3 flex-1 flex items-center justify-center gap-1"
                      >
                        <Play size={13} fill="currentColor" /> Bắt đầu Live ngay
                      </button>
                    )}
                    {isCurr && (
                      <button
                        onClick={() => setActiveTab("studio")}
                        className="btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 px-3 flex-1 flex items-center justify-center gap-1"
                      >
                        Vào phòng Live Studio
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedReportSessionId(s.id);
                        setActiveTab("reports");
                      }}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Báo cáo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: POST-LIVE REPORTS & BATCH PRINTING */}
      {/* ============================================================ */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Báo Cáo Hiệu Quả & In Vận Đơn Phiên Live</h3>
              <p className="text-xs text-gray-400">Tổng kết doanh số và gom đơn in A6 hàng loạt để bàn giao shipper</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Chọn phiên Live:</label>
              <select
                className="input text-xs w-64"
                value={selectedReportSessionId}
                onChange={e => setSelectedReportSessionId(e.target.value)}
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({formatDate(s.scheduledStartTime)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportSession && (
            <>
              {/* Report Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Tổng doanh thu Live</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportStats.revenue)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Mục tiêu: {formatCurrency(reportSession.targetRevenue)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Số đơn chốt được</p>
                  <p className="text-xl font-bold text-white">{reportStats.ordersCount} đơn</p>
                  <p className="text-[11px] text-gray-500 mt-1">Nguồn: TikTok Live</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Giá trị đơn trung bình (AOV)</p>
                  <p className="text-xl font-bold text-rose-400">{formatCurrency(reportStats.aov)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Trung bình mỗi đơn chốt</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Host phiên live</p>
                  <p className="text-base font-bold text-white mt-1">{reportSession.hostName}</p>
                  <p className="text-[11px] text-amber-400 mt-0.5">{reportSession.pinnedProducts.length} sản phẩm ghim</p>
                </div>
              </div>

              {/* Orders Table & Batch Print Bar */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Danh sách đơn hàng của phiên live ({reportOrders.length} đơn)
                    </h4>
                    <p className="text-xs text-gray-400">Các đơn được gắn mã phiên live này</p>
                  </div>

                  {reportOrders.length > 0 && (
                    <button
                      onClick={() => setPrintOrders(reportOrders)}
                      className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer size={14} /> In toàn bộ {reportOrders.length} vận đơn phiên Live này (A6)
                    </button>
                  )}
                </div>

                {reportOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Chưa có đơn hàng nào phát sinh trong phiên live này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase border-b border-gray-800">
                        <tr>
                          <th className="py-3 px-4">Mã đơn</th>
                          <th className="py-3 px-4">Khách hàng</th>
                          <th className="py-3 px-4">Sản phẩm chốt</th>
                          <th className="py-3 px-4 text-right">Tổng tiền (COD)</th>
                          <th className="py-3 px-4 text-center">Trạng thái</th>
                          <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-200">
                        {reportOrders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-800/40">
                            <td className="py-3 px-4 font-mono text-xs font-bold text-white">
                              {order.tiktokOrderId || order.id}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-white">{order.customerName}</p>
                              <p className="text-xs text-gray-400 font-mono">{order.customerPhone}</p>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-300">
                              {order.items.map(i => `${i.productName} (${i.variantInfo}) x${i.quantity}`).join(", ")}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-400">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setPrintOrders([order])}
                                className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="In vận đơn A6"
                              >
                                <Printer size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal: Create New Live Session */}
      <Modal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        title="Tạo Phiên Livestream TikTok Mới"
        size="lg"
      >
        <form onSubmit={handleCreateSession} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Tiêu đề phiên Live *</label>
              <input
                required
                type="text"
                className="input"
                value={newSessionForm.title}
                onChange={e => setNewSessionForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Đại Tiệc Pyjama TikTok Live..."
              />
            </div>
            <div>
              <label className="label">Host / Người Live chính *</label>
              <input
                required
                type="text"
                className="input"
                value={newSessionForm.hostName}
                onChange={e => setNewSessionForm(p => ({ ...p, hostName: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Mục tiêu doanh thu (VNĐ)</label>
              <input
                type="number"
                step="1000000"
                className="input"
                value={newSessionForm.targetRevenue}
                onChange={e => setNewSessionForm(p => ({ ...p, targetRevenue: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Chọn sản phẩm ghim vào giỏ hàng Live (Chọn theo thứ tự Ghim #1, #2...):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 border border-gray-800 rounded-xl p-2 bg-gray-900/50">
              {products.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                const pinIdx = selectedProductIds.indexOf(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProductIds(prev => prev.filter(x => x !== p.id));
                      } else {
                        setSelectedProductIds(prev => [...prev, p.id]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-rose-950/40 border-rose-600/70"
                        : "bg-gray-800/40 border-gray-700/60 hover:border-gray-600"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {isSelected ? `#${pinIdx + 1}` : "+"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">Gốc: {formatCurrency(p.sellingPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowNewSessionModal(false)}
              className="btn-secondary text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary text-xs font-bold"
            >
              Lưu & Lên lịch phiên Live
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Shipping Modal */}
      {printOrders.length > 0 && (
        <PrintShippingModal
          orders={printOrders}
          onClose={() => setPrintOrders([])}
          shopName="Henr.Studio - TikTok Live"
          shopPhone="0988 234 567"
        />
      )}
    </div>
  );
}
