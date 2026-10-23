import { useEffect, useState, useMemo, useCallback } from "react";
import debounce from "lodash.debounce";
import { useSearchParams } from "react-router-dom";
import { db } from "../db/database";
import type { Order, OrderStatus, Return, Product, ProductVariant, CourierConfig } from "../types";
import { DEFAULT_COURIER_CONFIG } from "../types";
import {
  Plus, Download, Upload, X,
  Eye, Edit2, Trash2, Package, Printer, Truck, Phone, MessageSquare, MessageSquareText, Scan, CheckCircle2, RotateCcw, XCircle, ShieldAlert, Cloud
} from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import PrintShippingModal from "../components/ui/PrintShippingModal";
import QuickMessageModal from "../components/ui/QuickMessageModal";
import BarcodeScannerModal from "../components/ui/BarcodeScannerModal";
import PartialExchangeModal from "../components/orders/PartialExchangeModal";
import OrderModal from "../components/orders/OrderModal";
import { dispatchOrderToCourier } from "../services/courierGateway";
import { performFullTwoWaySync } from "../services/supabaseSync";
import {
  formatCurrency, formatDate, generateId, now, today,
  getOrderStatusLabel, getReturnReasonLabel, formatNumber, truncate,
  getChannelBadge
} from "../utils/helpers";
import { exportOrdersToExcel, importOrdersFromExcel, exportShopeeTemplate } from "../utils/exportData";
import { subscribeToNewOrders } from "../utils/orderSyncEvents";


const CANCEL_REASONS_MAP: Record<string, string> = {
  customer_changed_mind: "Khách đổi ý không muốn mua",
  wrong_order: "Trùng đơn / Đặt nhầm",
  out_of_stock: "Hết hàng phân loại",
  unreachable_phone: "Không liên lạc được khách",
  shipping_too_long: "Thời gian giao quá lâu",
  high_shipping_fee: "Phí ship cao",
  other: "Lý do khác",
};

const RETURN_REASONS_MAP: Record<string, string> = {
  wrong_size: "Sai kích thước / size",
  wrong_color: "Sai màu sắc",
  wrong_product: "Giao nhầm sản phẩm",
  defective: "Hàng lỗi / rách chỉ",
  not_as_described: "Không giống mô tả ảnh",
  changed_mind: "Đổi ý không muốn mua",
  damaged_shipping: "Hư hỏng do vận chuyển",
  other: "Lý do khác",
};

const STATUSES: OrderStatus[] = [
  "pending", "processing", "shipping", "delivered", "returned", "cancelled", "return_requested"
];

const emptyOrder: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
  tiktokOrderId: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  items: [],
  status: "pending",
  orderDate: today(),
  subtotal: 0,
  shippingFee: 0,
  total: 0,
  shippingCarrier: "GHTK",
  trackingNumber: "",
  note: "",
  tiktokFeeRate: 1.8,
  tiktokFeeAmount: 0,
};

interface OrdersProps {
  defaultFilter?: string;
}

export default function Orders({ defaultFilter }: OrdersProps = {}) {
  const [searchParams] = useSearchParams();
  const queryStatus = searchParams.get("status");
  const initialFilter = queryStatus || defaultFilter || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [returnsList, setReturnsList] = useState<Return[]>([]);
  const [reasonModal, setReasonModal] = useState<{
    order: Order;
    targetStatus: OrderStatus;
    selectedReason: string;
    customNote: string;
  } | null>(null);

  const returnsMap = useMemo(() => {
    const map = new Map<string, Return>();
    for (const r of returnsList) {
      if (r.orderId) map.set(r.orderId, r);
    }
    return map;
  }, [returnsList]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [channelFilter, setChannelFilter] = useState<"all" | "shopee" | "tiktok" | "website">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Partial<Order>>(emptyOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printOrders, setPrintOrders] = useState<Order[]>([]);
  const [quickMsgOrder, setQuickMsgOrder] = useState<Order | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [exchangeOrder, setExchangeOrder] = useState<Order | null>(null);
  const [courierConfig] = useState<CourierConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_courierConfig");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COURIER_CONFIG;
  });

  const handleDispatchGHN = async (orderToDispatch: Order) => {
    try {
      const result = await dispatchOrderToCourier(orderToDispatch, courierConfig);
      if (result.success) {
        await db.orders.update(orderToDispatch.id, {
          carrierTrackingCode: result.trackingCode,
          carrierName: result.carrierName,
          carrierFee: result.estimatedFee,
          carrierStatus: "ready_to_pick",
          status: "processing",
          updatedAt: now(),
        });
        alert(`🚀 ${result.message}\nMã vận đơn: ${result.trackingCode}\nCước ước tính: ${result.estimatedFee.toLocaleString('vi-VN')}đ`);
        loadOrders();
      }
    } catch (e: any) {
      alert("Lỗi khi kết nối bưu cục: " + (e?.message || "Vui lòng thử lại"));
    }
  };
  const [syncingCloud, setSyncingCloud] = useState(false);

  const performSync = useCallback(async () => {
    setSyncingCloud(true);
    try {
      const res = await performFullTwoWaySync();
      alert(res.message);
      loadOrders();
    } catch (e: any) {
      alert("Lỗi đồng bộ đám mây: " + (e?.message || "Không xác định"));
    } finally {
      setSyncingCloud(false);
    }
  }, []);

  const debouncedSyncCloud = useMemo(
    () => debounce(performSync, 400, { leading: true, trailing: false }),
    [performSync]
  );

  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    loadOrders();
    const unsubscribe = subscribeToNewOrders(() => {
      loadOrders();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (queryStatus) {
      setStatusFilter(queryStatus);
    } else if (defaultFilter) {
      setStatusFilter(defaultFilter);
    }
  }, [queryStatus, defaultFilter]);

  async function loadOrders() {
    setLoading(true);
    const [ordersData, returnsData, productsData, variantsData] = await Promise.all([
      db.orders.orderBy("orderDate").reverse().toArray(),
      db.returns ? db.returns.toArray() : Promise.resolve([]),
      db.products ? db.products.toArray() : Promise.resolve([]),
      db.variants ? db.variants.toArray() : Promise.resolve([]),
    ]);
    setOrders(ordersData);
    setReturnsList(returnsData || []);
    setProducts(productsData || []);
    setVariants(variantsData || []);
    setLoading(false);
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status: OrderStatus) => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    for (const id of selectedIds) {
      await db.orders.update(id, { status, updatedAt: now() });
    }
    await loadOrders();
    setSelectedIds([]);
    setSaving(false);
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || o.customerName.toLowerCase().includes(q)
        || (o.tiktokOrderId || "").toLowerCase().includes(q)
        || (o.shopeeOrderId || "").toLowerCase().includes(q)
        || (o.customerPhone || "").includes(search)
        || (o.trackingNumber || "").toLowerCase().includes(q);
      
      let matchChannel = true;
      if (channelFilter === "shopee") {
        matchChannel = o.channel === "shopee" || Boolean(o.shopeeOrderId) || (o.note || "").toLowerCase().includes("shopee");
      } else if (channelFilter === "website") {
        matchChannel = o.channel === "website" || (o.tiktokOrderId || "").startsWith("WEB-");
      } else if (channelFilter === "tiktok") {
        matchChannel = (o.channel === "tiktok" || !o.channel) && !(o.shopeeOrderId || (o.note || "").toLowerCase().includes("shopee")) && !(o.tiktokOrderId || "").startsWith("WEB-");
      }

      let matchStatus = true;
      if (statusFilter === "all") {
        matchStatus = true;
      } else if (statusFilter === "returns_all") {
        matchStatus = o.status === "returned" || o.status === "return_requested";
      } else {
        matchStatus = o.status === statusFilter;
      }

      const matchFrom = !dateFrom || o.orderDate >= dateFrom;
      const matchTo = !dateTo || o.orderDate <= dateTo;
      return matchSearch && matchChannel && matchStatus && matchFrom && matchTo;
    });
  }, [orders, search, channelFilter, statusFilter, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // High-performance single-pass status and channel counts
  const counts = useMemo(() => {
    let pending = 0, processing = 0, shipping = 0, delivered = 0, returns = 0, cancelled = 0;
    let shopee = 0, tiktok = 0, website = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const s = o.status;
      if (s === "pending") pending++;
      else if (s === "processing") processing++;
      else if (s === "shipping") shipping++;
      else if (s === "delivered") delivered++;
      else if (s === "cancelled") cancelled++;
      
      if (s === "returned" || s === "return_requested") returns++;

      if (o.channel === "shopee" || Boolean(o.shopeeOrderId) || (o.note || "").toLowerCase().includes("shopee")) {
        shopee++;
      } else if (o.channel === "website" || (o.tiktokOrderId || "").startsWith("WEB-")) {
        website++;
      } else {
        tiktok++;
      }
    }
    return {
      all: orders.length,
      pending,
      processing,
      shipping,
      delivered,
      returns,
      cancelled,
      shopee,
      tiktok,
      website,
    };
  }, [orders]);

  const countAll = counts.all;
  const countPending = counts.pending;
  const countProcessing = counts.processing;
  const countShipping = counts.shipping;
  const countDelivered = counts.delivered;
  const countReturns = counts.returns;
  const countCancelled = counts.cancelled;

  const countShopee = counts.shopee;
  const countTikTok = counts.tiktok;
  const countWebsite = counts.website;

  const totalRevenue = useMemo(() => filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0), [filtered]);

  async function handleSave() {
    if (!editOrder.customerName) return;
    setSaving(true);
    const subtotal = editOrder.subtotal || 0;
    const shippingFee = editOrder.shippingFee || 0;
    const discount = (editOrder.tiktokDiscount || 0) + (editOrder.sellerDiscount || 0);
    const total = Math.max(0, subtotal + shippingFee - discount);
    const feeRate = editOrder.tiktokFeeRate ?? 1.8;
    const feeAmount = Math.round(total * (feeRate / 100));

    if (isEditing && editOrder.id) {
      await db.orders.update(editOrder.id, {
        ...editOrder,
        total,
        tiktokFeeAmount: feeAmount,
        updatedAt: now()
      } as Partial<Order>);
    } else {
      const newOrder: Order = {
        ...emptyOrder,
        ...editOrder,
        id: generateId(),
        tiktokOrderId: editOrder.tiktokOrderId || `WEB-${generateId().slice(-8).toUpperCase()}`,
        total,
        tiktokFeeAmount: feeAmount,
        createdAt: now(),
        updatedAt: now(),
      } as Order;
      await db.orders.add(newOrder);
    }
    setSaving(false);
    setShowModal(false);
    setEditOrder(emptyOrder);
    setIsEditing(false);
    loadOrders();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xoá đơn hàng này?")) return;
    await db.orders.delete(id);
    loadOrders();
  }

  // Realistic inventory stock handling on order status transition
  function onStatusDropdownChange(order: Order, newStatus: OrderStatus) {
    if (order.status === newStatus) return;
    if (newStatus === "returned" || newStatus === "return_requested" || newStatus === "cancelled") {
      setReasonModal({
        order,
        targetStatus: newStatus,
        selectedReason: newStatus === "cancelled" ? "customer_changed_mind" : "wrong_size",
        customNote: "",
      });
      return;
    }
    handleStatusChange(order.id, newStatus);
  }

  async function confirmStatusWithReason() {
    if (!reasonModal) return;
    const { order, targetStatus, selectedReason, customNote } = reasonModal;
    const updates: Partial<Order> = {
      status: targetStatus,
      updatedAt: now(),
    };

    if (targetStatus === "cancelled") {
      updates.cancelReason = CANCEL_REASONS_MAP[selectedReason] || selectedReason;
      if (customNote) updates.note = customNote;
    } else {
      updates.returnReason = selectedReason;
      if (customNote) updates.note = customNote;

      const existingReturn = returnsMap.get(order.id);
      if (!existingReturn) {
        await db.returns.add({
          id: generateId(),
          orderId: order.id,
          tiktokOrderId: order.tiktokOrderId,
          shopeeOrderId: order.shopeeOrderId,
          channel: order.channel,
          customerName: order.customerName,
          items: order.items,
          reason: selectedReason as any,
          reasonDetail: customNote || undefined,
          status: targetStatus === "returned" ? "received" : "pending",
          returnDate: today(),
          refundAmount: order.total,
          createdAt: now(),
          updatedAt: now(),
        });
      } else {
        await db.returns.update(existingReturn.id, {
          reason: selectedReason as any,
          reasonDetail: customNote || existingReturn.reasonDetail,
          status: targetStatus === "returned" ? "received" : existingReturn.status,
          updatedAt: now(),
        });
      }
    }

    await handleStatusChange(order.id, targetStatus, updates);
    setReasonModal(null);
    await loadOrders();
  }

  async function handleStatusChange(id: string, newStatus: OrderStatus, extraUpdates?: Partial<Order>) {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const oldStatus = targetOrder.status;
    const updates: Partial<Order> = { status: newStatus, updatedAt: now(), ...(extraUpdates || {}) };

    if (newStatus === "shipping" && !targetOrder.shippingDate) {
      updates.shippingDate = today();
    }
    if (newStatus === "delivered") {
      updates.deliveredDate = today();
    }

    // 1. If transitioning TO cancelled: RESTORE stock to inventory
    if (newStatus === "cancelled" && oldStatus !== "cancelled") {
      for (const item of targetOrder.items || []) {
        if (!item.variantId) continue;
        const v = await db.productVariants.get(item.variantId);
        if (v) {
          await db.productVariants.update(v.id, { stock: v.stock + item.quantity });
          await db.stockMovements.add({
            id: generateId(),
            productId: item.productId,
            variantId: item.variantId,
            type: "adjustment",
            quantity: item.quantity,
            note: `Hoàn kho do huỷ đơn ${targetOrder.shopeeOrderId || targetOrder.tiktokOrderId || targetOrder.id.slice(-8)}`,
            date: today(),
            createdAt: now(),
          });
        }
      }
    }

    // 2. If transitioning FROM cancelled back to active: DEDUCT stock again
    if (oldStatus === "cancelled" && newStatus !== "cancelled") {
      for (const item of targetOrder.items || []) {
        if (!item.variantId) continue;
        const v = await db.productVariants.get(item.variantId);
        if (v) {
          await db.productVariants.update(v.id, { stock: Math.max(0, v.stock - item.quantity) });
          await db.stockMovements.add({
            id: generateId(),
            productId: item.productId,
            variantId: item.variantId,
            type: "sale",
            quantity: -item.quantity,
            note: `Trừ kho do mở lại đơn ${targetOrder.tiktokOrderId || targetOrder.id.slice(-8)}`,
            date: today(),
            createdAt: now(),
          });
        }
      }
    }

    await db.orders.update(id, updates);
    loadOrders();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importOrdersFromExcel(file);
      const ordersToAdd: Order[] = [];
      const timestamp = now();
      const todayStr = today();

      for (const o of imported) {
        if (o.tiktokOrderId || o.shopeeOrderId) {
          const isShopee = o.channel === "shopee" || Boolean(o.shopeeOrderId);
          ordersToAdd.push({
            id: generateId(),
            tiktokOrderId: o.tiktokOrderId || (o.shopeeOrderId ? o.shopeeOrderId : `WEB-${generateId().slice(-8).toUpperCase()}`),
            shopeeOrderId: o.shopeeOrderId,
            channel: o.channel || (isShopee ? "shopee" : "tiktok"),
            orderDate: o.orderDate || todayStr,
            customerName: o.customerName || "Khách mua hàng",
            customerPhone: o.customerPhone || "",
            customerAddress: o.customerAddress || "",
            subtotal: o.subtotal || 0,
            shippingFee: o.shippingFee || 0,
            tiktokDiscount: o.tiktokDiscount || 0,
            sellerDiscount: o.sellerDiscount || 0,
            total: o.total || 0,
            tiktokFeeRate: o.tiktokFeeRate ?? 1.8,
            tiktokFeeAmount: o.tiktokFeeAmount || 0,
            shopeeFeeRate: o.shopeeFeeRate ?? 9.5,
            shopeeFeeAmount: o.shopeeFeeAmount || 0,
            status: o.status || "pending",
            shippingCarrier: o.shippingCarrier || (isShopee ? "SPX Express" : "GHTK"),
            shopeeCarrier: o.shopeeCarrier,
            trackingNumber: o.trackingNumber || "",
            items: o.items || [],
            note: o.note || "",
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      }

      if (ordersToAdd.length > 0) {
        await db.orders.bulkAdd(ordersToAdd);
      }
      alert(`Đã import thành công ${ordersToAdd.length} đơn hàng siêu tốc!`);
      loadOrders();
    } catch {
      alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng!");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">Quản lý Đơn hàng</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Realtime Sync (Zero F5)
            </span>
          </div>
          <p className="page-subtitle">
            {formatNumber(filtered.length)} đơn hiển thị • Tổng giá trị: <span className="text-emerald-400 font-semibold">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={debouncedSyncCloud}
            disabled={syncingCloud}
            className="btn-secondary text-xs flex items-center gap-1.5 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10 transition-colors"
            title="Đồng bộ 2 chiều với cơ sở dữ liệu đám mây Supabase PostgreSQL"
          >
            <Cloud size={15} className={syncingCloud ? "animate-spin text-indigo-400" : "text-indigo-400"} />
            <span>{syncingCloud ? "Đang đồng bộ..." : "Đồng bộ Đám mây"}</span>
          </button>
          <button
            type="button"
            onClick={() => exportShopeeTemplate()}
            className="btn-secondary text-xs flex items-center gap-1.5 text-orange-400 border-orange-500/30 hover:bg-orange-500/10 transition-colors"
            title="Tải file mẫu Excel đơn hàng chuẩn Shopee Seller Centre"
          >
            <Download size={14} className="text-[#EE4D2D]" />
            <span>Mẫu Shopee</span>
          </button>
          <label className="btn-secondary cursor-pointer text-xs flex items-center gap-1.5">
            <Upload size={14} />
            <span>Import Excel (Shopee / TikTok)</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => exportOrdersToExcel(filtered)} className="btn-secondary text-xs">
            <Download size={15} /> Export Excel
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-colors"
            title="Quét mã vạch đóng gói đối soát"
          >
            <Scan size={15} />
            <span>Quét mã đóng gói</span>
          </button>
          <button onClick={() => { setEditOrder(emptyOrder); setIsEditing(false); setShowModal(true); }} className="btn-primary text-xs">
            <Plus size={15} /> Thêm đơn thủ công
          </button>
        </div>
      </div>

      {/* OMNICHANNEL CHANNEL TABS: TẤT CẢ / SHOPEE / TIKTOK / WEBSITE */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => { setChannelFilter("all"); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
            channelFilter === "all"
              ? "bg-gray-800 text-white border-gray-600 shadow-sm"
              : "bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white"
          }`}
        >
          <span>🌐 Tất cả sàn</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-800 text-gray-300">
            {countAll}
          </span>
        </button>

        <button
          onClick={() => { setChannelFilter("shopee"); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
            channelFilter === "shopee"
              ? "bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-[#EE4D2D]/30"
              : "bg-gray-900/60 text-[#EE4D2D] border-[#EE4D2D]/40 hover:bg-[#EE4D2D]/10"
          }`}
        >
          <span>🛍️ Shopee</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            channelFilter === "shopee" ? "bg-white/20 text-white" : "bg-[#EE4D2D]/20 text-[#EE4D2D]"
          }`}>
            {countShopee}
          </span>
        </button>

        <button
          onClick={() => { setChannelFilter("tiktok"); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
            channelFilter === "tiktok"
              ? "bg-rose-600 text-white border-rose-500 shadow-sm"
              : "bg-gray-900/60 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
          }`}
        >
          <span>🎵 TikTok Shop</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            channelFilter === "tiktok" ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-300"
          }`}>
            {countTikTok}
          </span>
        </button>

        <button
          onClick={() => { setChannelFilter("website"); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
            channelFilter === "website"
              ? "bg-blue-600 text-white border-blue-500 shadow-sm"
              : "bg-gray-900/60 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
          }`}
        >
          <span>🛒 Website Store</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            channelFilter === "website" ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300"
          }`}>
            {countWebsite}
          </span>
        </button>
      </div>

      {/* 1-CLICK STATUS TABS WITH LIVE COUNTER BADGES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
        <button
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "all"
              ? "bg-rose-600 text-white border-rose-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700"
          }`}
        >
          Tất cả đơn
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "all" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-300"
          }`}>
            {countAll}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("pending"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "pending"
              ? "bg-amber-500 text-gray-950 font-bold border-amber-400 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-amber-300 hover:border-amber-500/40"
          }`}
        >
          ⚡ Chờ xác nhận
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "pending" ? "bg-gray-950/20 text-gray-950" : "bg-amber-500/15 text-amber-300"
          }`}>
            {countPending}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("processing"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "processing"
              ? "bg-blue-600 text-white border-blue-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-blue-300 hover:border-blue-500/40"
          }`}
        >
          📦 Đang đóng gói
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "processing" ? "bg-white/20 text-white" : "bg-blue-500/15 text-blue-300"
          }`}>
            {countProcessing}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("shipping"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "shipping"
              ? "bg-purple-600 text-white border-purple-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-purple-300 hover:border-purple-500/40"
          }`}
        >
          🚚 Đang giao
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "shipping" ? "bg-white/20 text-white" : "bg-purple-500/15 text-purple-300"
          }`}>
            {countShipping}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("delivered"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "delivered"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-emerald-300 hover:border-emerald-500/40"
          }`}
        >
          ✅ Đã giao thành công
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "delivered" ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-300"
          }`}>
            {countDelivered}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("returns_all"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "returns_all"
              ? "bg-orange-600 text-white border-orange-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-orange-300 hover:border-orange-500/40"
          }`}
        >
          🔄 Hoàn / Khiếu nại
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "returns_all" ? "bg-white/20 text-white" : "bg-orange-500/15 text-orange-300"
          }`}>
            {countReturns}
          </span>
        </button>

        <button
          onClick={() => { setStatusFilter("cancelled"); setPage(1); }}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "cancelled"
              ? "bg-gray-700 text-white border-gray-600 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-300 hover:border-gray-700"
          }`}
        >
          ❌ Đã hủy
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === "cancelled" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
          }`}>
            {countCancelled}
          </span>
        </button>
      </div>

      {/* Filters Search and Dates */}
      <div className="card-sm flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo tên khách, SĐT, mã đơn, mã VĐ..." />
        </div>
        <div>
          <label className="label">Lọc trạng thái cụ thể</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-44">
            <option value="all">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Từ ngày</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="input w-36" />
        </div>
        <div>
          <label className="label">Đến ngày</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="input w-36" />
        </div>
        {(search || statusFilter !== "all" || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="btn-secondary text-xs">
            <X size={14} /> Xoá lọc
          </button>
        )}
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-950/70 border border-rose-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#fe2c55] text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-sm font-semibold text-white">
              Đơn hàng đã chọn
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatus("processing")}
              className="btn bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 px-3"
            >
              <Package size={14} /> Duyệt đơn ({selectedIds.length})
            </button>
            <button
              onClick={() => handleBulkStatus("shipping")}
              className="btn bg-purple-600 hover:bg-purple-500 text-white text-xs py-1.5 px-3"
            >
              <Truck size={14} /> Chuyển sang Giao hàng ({selectedIds.length})
            </button>
            <button
              onClick={() => {
                const toPrint = orders.filter(o => selectedIds.includes(o.id));
                setPrintOrders(toPrint);
              }}
              className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3"
            >
              <Printer size={14} /> In {selectedIds.length} vận đơn A6
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 transition-colors"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && paginated.every(o => selectedIds.includes(o.id))}
                  onChange={handleSelectAll}
                  className="rounded border-gray-700 bg-gray-800 text-[#fe2c55] focus:ring-[#fe2c55] cursor-pointer"
                />
              </th>
              <th>Mã đơn hàng</th>
              <th>Ngày đặt</th>
              <th>Khách hàng & SĐT</th>
              <th>Sản phẩm đặt</th>
              <th className="text-right">Tổng tiền & COD</th>
              <th>Trạng thái đơn</th>
              <th>Vận chuyển</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-500">Đang tải dữ liệu đơn hàng...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} className="py-10"><EmptyState icon={Package} title="Không có đơn hàng nào" description="Thêm đơn mới hoặc điều chỉnh bộ lọc trạng thái" /></td></tr>
            ) : paginated.map(o => {
              const cleanPhone = (o.customerPhone || "").replace(/\D/g, "");
              const isPending = o.status === "pending";

              return (
                <tr key={o.id} className={selectedIds.includes(o.id) ? "bg-rose-950/20" : ""}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={() => handleToggleSelect(o.id)}
                      className="rounded border-gray-700 bg-gray-800 text-[#fe2c55] focus:ring-[#fe2c55] cursor-pointer"
                    />
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      {getChannelBadge(o.channel, o)}
                      <span className="font-mono text-xs font-semibold text-gray-300">
                        {o.shopeeOrderId || o.tiktokOrderId || truncate(o.id, 14)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-xs">{formatDate(o.orderDate)}</td>
                  <td>
                    <p className="font-medium text-white">{o.customerName}</p>
                    {o.isSuspicious && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/70 border border-rose-800/80 rounded px-1.5 py-0.5 max-w-[220px]" title={o.suspiciousReason || "Cảnh báo rủi ro đơn hàng"}>
                        <ShieldAlert size={11} className="text-rose-400 shrink-0" />
                        <span className="truncate">{o.suspiciousReason || "Đơn nguy cơ cao"}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 font-mono">{o.customerPhone || "—"}</span>
                        {o.customerPhone && (
                          <a
                            href={`tel:${o.customerPhone}`}
                            className="p-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                            title="Bấm để gọi điện"
                          >
                            <Phone size={11} />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {o.customerPhone && (
                          <a
                            href={`https://zalo.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 transition-colors"
                            title="Mở Zalo nhắn tin"
                          >
                            Zalo
                          </a>
                        )}
                        {o.channel === "shopee" || o.shopeeOrderId ? (
                          <a
                            href="https://banhang.shopee.vn/webchat/conversations"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 flex items-center gap-1 transition-colors"
                            title="Mở Shopee Chat Web"
                          >
                            <span>🛍️ Shopee</span>
                          </a>
                        ) : (
                          <a
                            href={`https://seller-vn.tiktok.com/chat${o.tiktokOrderId ? `?order_id=${o.tiktokOrderId}` : ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center gap-1 transition-colors"
                            title="Mở chat TikTok Shop với khách"
                          >
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                            </svg>
                            <span>TikTok</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setQuickMsgOrder(o)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 transition-colors"
                          title="Mở mẫu tin nhắn chăm sóc khách"
                        >
                          <MessageSquareText size={11} />
                          <span>Mẫu</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[190px]">
                    <p className="text-xs text-gray-300 truncate" title={o.items?.map(i => `${i.productName} (${i.variantInfo || "bộ"}) x${i.quantity}`).join(", ")}>
                      {o.items?.length > 0
                        ? o.items.map(i => `${i.productName} x${i.quantity}`).join(", ")
                        : "Đơn không có chi tiết SP"}
                    </p>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <p className="font-bold text-white">{formatCurrency(o.total)}</p>
                    {(() => {
                      const isShopee = o.channel === "shopee" || Boolean(o.shopeeOrderId);
                      const feeRate = isShopee ? (o.shopeeFeeRate ?? 9.5) : (o.tiktokFeeRate ?? 1.8);
                      const feeAmount = isShopee
                        ? (o.shopeeFeeAmount ?? Math.round(o.total * (feeRate / 100)))
                        : (o.tiktokFeeAmount ?? Math.round(o.total * (feeRate / 100)));
                      const net = Math.max(0, o.total - feeAmount);
                      return (
                        <p className="text-[10px] text-gray-400 font-mono" title={`Phí sàn: -${formatCurrency(feeAmount)} (${feeRate}%) • Thực nhận: ${formatCurrency(net)}`}>
                          Ví: <span className="text-emerald-400 font-semibold">{formatCurrency(net)}</span>
                        </p>
                      );
                    })()}
                    {o.status === "delivered" ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        ✓ COD Đã thu
                      </span>
                    ) : o.status === "cancelled" ? (
                      <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                        ✕ Không thu
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        ⏳ Chưa thu COD
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      value={o.status}
                      onChange={e => onStatusDropdownChange(o, e.target.value as OrderStatus)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold bg-gray-900 cursor-pointer ${
                        o.status === "delivered" ? "text-emerald-400 border-emerald-800" :
                        o.status === "shipping" ? "text-purple-400 border-purple-800" :
                        o.status === "pending" ? "text-yellow-400 border-yellow-800" :
                        o.status === "returned" ? "text-red-400 border-red-800" :
                        o.status === "cancelled" ? "text-gray-400 border-gray-700" :
                        o.status === "processing" ? "text-blue-400 border-blue-800" :
                        "text-orange-400 border-orange-800"
                      }`}
                    >
                      {STATUSES.map(s => <option key={s} value={s} className="bg-gray-900 text-gray-100">{getOrderStatusLabel(s)}</option>)}
                    </select>

                    {o.carrierTrackingCode && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded px-1.5 py-0.5" title={o.carrierName || "Đơn vị vận chuyển"}>
                        <Truck size={10} /> {o.carrierTrackingCode}
                      </div>
                    )}
                    {/* Compact Return Reason Badge */}
                    {(o.status === "returned" || o.status === "return_requested") && (() => {
                      const ret = returnsMap.get(o.id);
                      const rKey = o.returnReason || ret?.reason || "wrong_size";
                      const rLabel = RETURN_REASONS_MAP[rKey] || getReturnReasonLabel(rKey);
                      const rDetail = ret?.reasonDetail || o.note;
                      const tooltip = `Lý do hoàn: ${rLabel}${rDetail && rDetail !== rLabel ? ` (${rDetail})` : ""}`;
                      return (
                        <div
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-300/90 bg-amber-950/40 border border-amber-800/40 rounded-md px-1.5 py-0.5 max-w-[155px] cursor-help hover:border-amber-600 transition-colors"
                          title={tooltip}
                        >
                          <RotateCcw size={10} className="text-amber-400 shrink-0" />
                          <span className="truncate">{rLabel}</span>
                        </div>
                      );
                    })()}

                    {/* Compact Cancel Reason Badge */}
                    {o.status === "cancelled" && (() => {
                      const cKey = o.cancelReason || "customer_changed_mind";
                      const cLabel = CANCEL_REASONS_MAP[cKey] || o.cancelReason || o.note || "Khách đổi ý không mua";
                      const tooltip = `Lý do hủy: ${cLabel}`;
                      return (
                        <div
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-300/90 bg-rose-950/40 border border-rose-800/40 rounded-md px-1.5 py-0.5 max-w-[155px] cursor-help hover:border-rose-600 transition-colors"
                          title={tooltip}
                        >
                          <XCircle size={10} className="text-rose-400 shrink-0" />
                          <span className="truncate">{cLabel}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <p className="text-xs text-gray-300 font-medium">
                      {o.shopeeCarrier || o.shippingCarrier || (o.channel === "shopee" ? "SPX Express" : "—")}
                    </p>
                    {o.trackingNumber ? (
                      (o.shopeeCarrier || o.shippingCarrier || "").toLowerCase().includes("spx") || o.channel === "shopee" ? (
                        <a
                          href={`https://spx.vn/track?${o.trackingNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-mono inline-flex items-center gap-0.5"
                          title="Tra cứu lộ trình đơn trên SPX Express"
                        >
                          {truncate(o.trackingNumber, 14)}
                        </a>
                      ) : (
                        <p className="text-[11px] text-gray-500 font-mono">{truncate(o.trackingNumber, 14)}</p>
                      )
                    ) : null}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      {isPending && (
                        <button
                          onClick={() => handleStatusChange(o.id, "processing")}
                          className="btn-success text-xs py-1 px-2 flex items-center gap-1"
                          title="Duyệt đơn nhanh"
                        >
                          <CheckCircle2 size={12} /> Duyệt
                        </button>
                      )}
                      {!o.carrierTrackingCode && o.status !== "cancelled" && o.channel !== "shopee" && !o.shopeeOrderId && (
                        <button
                          onClick={() => handleDispatchGHN(o)}
                          className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Bắn đơn sang GHN lấy mã vận đơn bưu cục"
                        >
                          <Truck size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setExchangeOrder(o)}
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-lg transition-colors"
                        title="Tách đơn đổi size 1 phần"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => setPrintOrders([o])}
                        className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="In vận đơn A6"
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        onClick={() => setShowDetail(o)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Xem chi tiết đơn"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { setEditOrder(o); setIsEditing(true); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <p className="text-gray-400 text-xs">
            Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} đơn
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Trước</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${p === page ? "bg-rose-600 text-white" : "btn-secondary"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-xs">Sau</button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <OrderModal
        isOpen={showModal}
        isEditing={isEditing}
        saving={saving}
        editOrder={editOrder}
        setEditOrder={setEditOrder}
        onClose={() => {
          setShowModal(false);
          setEditOrder(emptyOrder);
          setIsEditing(false);
        }}
        onSave={handleSave}
      />

      {/* Order Detail Modal */}
      {showDetail && (
        <Modal isOpen={true} onClose={() => setShowDetail(null)}
          title={`Chi tiết đơn hàng #${showDetail.shopeeOrderId || showDetail.tiktokOrderId || showDetail.id}`} size="lg">
          <div className="space-y-4 text-sm">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-gray-400">Khách hàng</p>
                  {getChannelBadge(showDetail.channel, showDetail)}
                </div>
                <p className="font-semibold text-white mt-0.5">{showDetail.customerName}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">{showDetail.customerPhone}</span>
                  {showDetail.customerPhone && (
                    <a href={`tel:${showDetail.customerPhone}`} className="text-rose-400 hover:text-rose-300" title="Gọi">
                      <Phone size={12} />
                    </a>
                  )}
                  {showDetail.channel === "shopee" || showDetail.shopeeOrderId ? (
                    <a
                      href="https://banhang.shopee.vn/webchat/conversations"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 flex items-center gap-1 transition-colors"
                      title="Mở chat Shopee với khách"
                    >
                      <span>🛍️ Shopee Chat</span>
                    </a>
                  ) : (
                    <a
                      href={`https://seller-vn.tiktok.com/chat${showDetail.tiktokOrderId ? `?order_id=${showDetail.tiktokOrderId}` : ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center gap-1 transition-colors"
                      title="Mở chat TikTok Shop với khách"
                    >
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                      </svg>
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ngày đặt hàng</p>
                <p className="font-semibold text-white mt-0.5">{formatDate(showDetail.orderDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Đơn vị vận chuyển</p>
                <p className="font-semibold text-white mt-0.5">{showDetail.shopeeCarrier || showDetail.shippingCarrier || (showDetail.channel === "shopee" ? "SPX Express" : "GHTK")}</p>
                <p className="text-xs text-gray-400 font-mono">{showDetail.trackingNumber || "Chưa có mã"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng thu khách (COD)</p>
                <p className="text-base font-bold text-rose-400 mt-0.5">{formatCurrency(showDetail.total)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Địa chỉ giao hàng:</p>
              <p className="text-xs text-gray-200 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700">
                📍 {showDetail.customerAddress || "Chưa cập nhật địa chỉ"}
              </p>
            </div>

            {/* Reason Banner in Order Detail */}
            {(showDetail.status === "returned" || showDetail.status === "return_requested") && (() => {
              const ret = returnsMap.get(showDetail.id);
              const rKey = showDetail.returnReason || ret?.reason || "wrong_size";
              const rLabel = RETURN_REASONS_MAP[rKey] || getReturnReasonLabel(rKey);
              const rDetail = ret?.reasonDetail || showDetail.note;
              return (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <RotateCcw size={14} />
                    <span>Thông tin hoàn trả hàng:</span>
                  </div>
                  <p className="text-amber-200 font-medium">
                    Lý do: <strong>{rLabel}</strong>
                  </p>
                  {rDetail && rDetail !== rLabel && (
                    <p className="text-gray-400 text-[11px] italic">
                      Chi tiết: "{rDetail}"
                    </p>
                  )}
                </div>
              );
            })()}

            {showDetail.status === "cancelled" && (() => {
              const cKey = showDetail.cancelReason || "customer_changed_mind";
              const cLabel = CANCEL_REASONS_MAP[cKey] || showDetail.cancelReason || showDetail.note || "Khách đổi ý không mua";
              return (
                <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <XCircle size={14} />
                    <span>Thông tin hủy đơn:</span>
                  </div>
                  <p className="text-red-200 font-medium">
                    Lý do: <strong>{cLabel}</strong>
                  </p>
                  {showDetail.note && showDetail.note !== cLabel && (
                    <p className="text-gray-400 text-[11px] italic">
                      Ghi chú: "{showDetail.note}"
                    </p>
                  )}
                </div>
              );
            })()}

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sản phẩm trong đơn ({showDetail.items.length})</p>
              <div className="space-y-2 border border-gray-700/60 rounded-xl p-3 bg-gray-800/30">
                {showDetail.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-800 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-gray-400">Phân loại: <span className="text-gray-200">{item.variantInfo || "Bộ mặc nhà"}</span> • Số lượng: <span className="text-rose-400 font-bold">x{item.quantity}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      <p className="text-[11px] text-gray-500">{formatCurrency(item.unitPrice)} / bộ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chi tiết tài chính & Phí sàn thực tế */}
            {(() => {
              const isShopee = showDetail.channel === "shopee" || Boolean(showDetail.shopeeOrderId);
              const feeRate = isShopee ? (showDetail.shopeeFeeRate ?? 9.5) : (showDetail.tiktokFeeRate ?? 1.8);
              const feeAmount = isShopee
                ? (showDetail.shopeeFeeAmount ?? Math.round(showDetail.total * (feeRate / 100)))
                : (showDetail.tiktokFeeAmount ?? Math.round(showDetail.total * (feeRate / 100)));
              const netPayout = Math.max(0, showDetail.total - feeAmount);

              return (
                <div className="bg-gradient-to-r from-gray-800/60 to-gray-850/60 rounded-xl p-3 border border-gray-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span className="flex items-center gap-1.5">
                      {isShopee ? "🛍️ Đối Soát Kênh Người Bán Shopee" : "🎵 Đối Soát TikTok Shop"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Tỷ lệ phí sàn: <strong className="text-amber-400 font-mono">{feeRate}%</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1.5 border-t border-gray-800">
                    <div>
                      <p className="text-[11px] text-gray-400">Doanh thu đơn</p>
                      <p className="font-semibold text-white mt-0.5">{formatCurrency(showDetail.total)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Phí sàn {isShopee ? "Shopee" : "TikTok"}</p>
                      <p className="font-semibold text-rose-400 mt-0.5">-{formatCurrency(feeAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Thực nhận về ví</p>
                      <p className="font-bold text-emerald-400 mt-0.5">{formatCurrency(netPayout)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between items-center pt-2 border-t border-gray-800 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {showDetail.customerPhone && (
                  <a
                    href={`https://zalo.me/${showDetail.customerPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs flex items-center gap-1 text-blue-400"
                  >
                    <MessageSquare size={13} /> Chat Zalo
                  </a>
                )}
                {showDetail.channel === "shopee" || showDetail.shopeeOrderId ? (
                  <>
                    <a
                      href={`https://banhang.shopee.vn/portal/sale/order/${showDetail.shopeeOrderId || showDetail.tiktokOrderId || ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs flex items-center gap-1.5 text-orange-400 hover:text-orange-300 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20"
                      title="Mở đơn trực tiếp trên Kênh Người Bán Shopee"
                    >
                      <span>🛍️ Đơn Shopee</span>
                    </a>
                    <a
                      href="https://banhang.shopee.vn/webchat/conversations"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs flex items-center gap-1.5 text-orange-400 hover:text-orange-300 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20"
                      title="Mở Shopee Chat Web"
                    >
                      <span>💬 Shopee Chat</span>
                    </a>
                    {showDetail.trackingNumber && (
                      <a
                        href={`https://spx.vn/track?${showDetail.trackingNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 bg-cyan-500/10"
                        title="Tra cứu lộ trình bưu kiện SPX Express"
                      >
                        <Truck size={13} /> Tra cứu SPX
                      </a>
                    )}
                  </>
                ) : (
                  <a
                    href={`https://seller-vn.tiktok.com/chat${showDetail.tiktokOrderId ? `?order_id=${showDetail.tiktokOrderId}` : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs flex items-center gap-1.5 text-rose-400 hover:text-rose-300 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
                    title="Mở chat TikTok Shop với khách"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z"/>
                    </svg>
                    <span>Chat TikTok Shop</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setQuickMsgOrder(showDetail)}
                  className="btn-secondary text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                >
                  <MessageSquareText size={13} /> Mẫu tin nhắn
                </button>
                <button
                  onClick={() => {
                    setPrintOrders([showDetail]);
                    setShowDetail(null);
                  }}
                  className="btn-secondary text-xs flex items-center gap-1 text-emerald-400"
                >
                  <Printer size={13} /> In vận đơn A6
                </button>
              </div>
              <button onClick={() => setShowDetail(null)} className="btn-secondary text-xs">
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Message Modal */}
      {quickMsgOrder && (
        <QuickMessageModal
          isOpen={true}
          onClose={() => setQuickMsgOrder(null)}
          customerName={quickMsgOrder.customerName}
          customerPhone={quickMsgOrder.customerPhone}
          orderId={quickMsgOrder.id}
          tiktokOrderId={quickMsgOrder.tiktokOrderId}
          items={quickMsgOrder.items}
          shippingCarrier={quickMsgOrder.shippingCarrier}
          trackingNumber={quickMsgOrder.trackingNumber}
          shopName="Henr.Studio"
        />
      )}

      {/* Barcode Scanner & Packing Verification Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={true}
          onClose={() => setIsScannerOpen(false)}
          orders={orders}
          onOrderPacked={async (orderId: string) => {
            await db.orders.update(orderId, {
              status: "shipping",
              shippingDate: today(),
              updatedAt: now(),
            });
            await loadOrders();
          }}
        />
      )}

            {/* Partial Size Exchange Modal */}
      <PartialExchangeModal
        isOpen={!!exchangeOrder}
        onClose={() => setExchangeOrder(null)}
        order={exchangeOrder}
        products={products}
        variants={variants}
        onExchangeComplete={() => {
          loadOrders();
        }}
      />

      {/* Print Shipping Modal */}
      {printOrders.length > 0 && (
        <PrintShippingModal
          orders={printOrders}
          onClose={() => setPrintOrders([])}
          shopName="Henr.Studio - Đồ Ngủ Thiết Kế"
          shopPhone="0988 234 567"
        />
      )}

      {/* Reason Modal (Cancel / Return) */}
      {reasonModal && (
        <Modal
          isOpen={true}
          onClose={() => setReasonModal(null)}
          title={
            reasonModal.targetStatus === "cancelled"
              ? "Xác nhận lý do hủy đơn hàng"
              : "Xác nhận lý do yêu cầu trả hàng / hoàn tiền"
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">
                {reasonModal.targetStatus === "cancelled" ? "Lý do hủy đơn *" : "Lý do hoàn trả *"}
              </label>
              <select
                className="input"
                value={reasonModal.selectedReason}
                onChange={(e) =>
                  setReasonModal((p) => (p ? { ...p, selectedReason: e.target.value } : null))
                }
              >
                {Object.entries(
                  reasonModal.targetStatus === "cancelled" ? CANCEL_REASONS_MAP : RETURN_REASONS_MAP
                ).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ghi chú chi tiết</label>
              <textarea
                rows={2}
                className="input"
                value={reasonModal.customNote}
                onChange={(e) =>
                  setReasonModal((p) => (p ? { ...p, customNote: e.target.value } : null))
                }
                placeholder="Nhập thêm chi tiết nếu cần..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="btn-secondary"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={confirmStatusWithReason}
                className="btn-primary"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
