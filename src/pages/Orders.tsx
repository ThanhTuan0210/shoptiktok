import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../db/database";
import type { Order, OrderStatus, Return } from "../types";
import {
  Plus, Download, Upload, X,
  Eye, Edit2, Trash2, Package, Printer, Truck, Phone, MessageSquare, CheckCircle2, RotateCcw, XCircle
} from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import PrintShippingModal from "../components/ui/PrintShippingModal";
import {
  formatCurrency, formatDate, generateId, now, today,
  getOrderStatusLabel, getReturnReasonLabel, formatNumber, truncate
} from "../utils/helpers";
import { exportOrdersToExcel, importOrdersFromExcel } from "../utils/exportData";


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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Partial<Order>>(emptyOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printOrders, setPrintOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    loadOrders();
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
    const [ordersData, returnsData] = await Promise.all([
      db.orders.orderBy("orderDate").reverse().toArray(),
      db.returns ? db.returns.toArray() : Promise.resolve([]),
    ]);
    setOrders(ordersData);
    setReturnsList(returnsData || []);
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
        || (o.customerPhone || "").includes(search)
        || (o.trackingNumber || "").toLowerCase().includes(q);
      
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
      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Status counts for badge tabs
  const countAll = orders.length;
  const countPending = orders.filter(o => o.status === "pending").length;
  const countProcessing = orders.filter(o => o.status === "processing").length;
  const countShipping = orders.filter(o => o.status === "shipping").length;
  const countDelivered = orders.filter(o => o.status === "delivered").length;
  const countReturns = orders.filter(o => o.status === "returned" || o.status === "return_requested").length;
  const countCancelled = orders.filter(o => o.status === "cancelled").length;

  const totalRevenue = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

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
            note: `Hoàn kho do huỷ đơn ${targetOrder.tiktokOrderId || targetOrder.id.slice(-8)}`,
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
      for (const o of imported) {
        if (o.tiktokOrderId) {
          await db.orders.add({
            id: generateId(),
            tiktokOrderId: o.tiktokOrderId,
            orderDate: o.orderDate || today(),
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
            status: o.status || "pending",
            shippingCarrier: o.shippingCarrier || "GHTK",
            trackingNumber: o.trackingNumber || "",
            items: o.items || [],
            note: o.note || "",
            createdAt: now(),
            updatedAt: now(),
          });
        }
      }
      alert(`Đã import thành công ${imported.length} đơn hàng!`);
      loadOrders();
    } catch {
      alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng!");
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đơn hàng</h1>
          <p className="page-subtitle">
            {formatNumber(filtered.length)} đơn hiển thị • Tổng giá trị: <span className="text-emerald-400 font-semibold">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer text-xs">
            <Upload size={15} />
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => exportOrdersToExcel(filtered)} className="btn-secondary text-xs">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={() => { setEditOrder(emptyOrder); setIsEditing(false); setShowModal(true); }} className="btn-primary text-xs">
            <Plus size={15} /> Thêm đơn thủ công
          </button>
        </div>
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
                  <td className="font-mono text-xs font-semibold text-gray-300">
                    {o.tiktokOrderId || truncate(o.id, 14)}
                  </td>
                  <td className="whitespace-nowrap text-xs">{formatDate(o.orderDate)}</td>
                  <td>
                    <p className="font-medium text-white">{o.customerName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">{o.customerPhone || "—"}</span>
                      {o.customerPhone && (
                        <>
                          <a
                            href={`tel:${o.customerPhone}`}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                            title="Bấm để gọi điện"
                          >
                            <Phone size={11} />
                          </a>
                          <a
                            href={`https://zalo.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline px-1 py-0.5 rounded bg-blue-500/10"
                            title="Mở Zalo nhắn tin"
                          >
                            Zalo
                          </a>
                        </>
                      )}
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
                    <p className="text-xs text-gray-300 font-medium">{o.shippingCarrier || "—"}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{o.trackingNumber ? truncate(o.trackingNumber, 14) : ""}</p>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={isEditing ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng thủ công"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Mã đơn TikTok</label>
              <input type="text" className="input font-mono" value={editOrder.tiktokOrderId || ""}
                onChange={e => setEditOrder(p => ({ ...p, tiktokOrderId: e.target.value }))}
                placeholder="578912345678901234" />
            </div>
            <div>
              <label className="label">Ngày đặt hàng</label>
              <input type="date" className="input" value={editOrder.orderDate || today()}
                onChange={e => setEditOrder(p => ({ ...p, orderDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tên khách hàng *</label>
              <input type="text" className="input" value={editOrder.customerName || ""}
                onChange={e => setEditOrder(p => ({ ...p, customerName: e.target.value }))}
                placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input type="text" className="input font-mono" value={editOrder.customerPhone || ""}
                onChange={e => setEditOrder(p => ({ ...p, customerPhone: e.target.value }))}
                placeholder="0912345678" />
            </div>
          </div>
          <div>
            <label className="label">Địa chỉ giao hàng</label>
            <textarea rows={2} className="input" value={editOrder.customerAddress || ""}
              onChange={e => setEditOrder(p => ({ ...p, customerAddress: e.target.value }))}
              placeholder="123 Đường ABC, Phường X, Quận Y, TP..." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Tiền hàng (VNĐ)</label>
              <input type="number" className="input" value={editOrder.subtotal || ""}
                onChange={e => setEditOrder(p => ({ ...p, subtotal: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Phí ship (VNĐ)</label>
              <input type="number" className="input" value={editOrder.shippingFee || ""}
                onChange={e => setEditOrder(p => ({ ...p, shippingFee: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">TikTok Voucher</label>
              <input type="number" className="input" value={editOrder.tiktokDiscount || ""}
                onChange={e => setEditOrder(p => ({ ...p, tiktokDiscount: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Shop Voucher</label>
              <input type="number" className="input" value={editOrder.sellerDiscount || ""}
                onChange={e => setEditOrder(p => ({ ...p, sellerDiscount: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Trạng thái</label>
              <select className="input" value={editOrder.status || "pending"}
                onChange={e => setEditOrder(p => ({ ...p, status: e.target.value as OrderStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Đơn vị vận chuyển</label>
              <select className="input" value={editOrder.shippingCarrier || "GHTK"}
                onChange={e => setEditOrder(p => ({ ...p, shippingCarrier: e.target.value }))}>
                {["GHTK", "GHN", "J&T Express", "Viettel Post", "Shopee Xpress", "SPX Express"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mã vận đơn</label>
              <input type="text" className="input font-mono" value={editOrder.trackingNumber || ""}
                onChange={e => setEditOrder(p => ({ ...p, trackingNumber: e.target.value }))}
                placeholder="GHTK123456789" />
            </div>
          </div>
          <div>
            <label className="label">Ghi chú đơn hàng</label>
            <input type="text" className="input" value={editOrder.note || ""}
              onChange={e => setEditOrder(p => ({ ...p, note: e.target.value }))}
              placeholder="Khách dặn giao buổi tối, kiểm tra hàng..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo đơn hàng"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      {showDetail && (
        <Modal isOpen={true} onClose={() => setShowDetail(null)}
          title={`Chi tiết đơn hàng #${showDetail.tiktokOrderId || showDetail.id}`} size="lg">
          <div className="space-y-4 text-sm">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400">Khách hàng</p>
                <p className="font-semibold text-white mt-0.5">{showDetail.customerName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 font-mono">{showDetail.customerPhone}</span>
                  {showDetail.customerPhone && (
                    <a href={`tel:${showDetail.customerPhone}`} className="text-rose-400 hover:text-rose-300" title="Gọi">
                      <Phone size={12} />
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
                <p className="font-semibold text-white mt-0.5">{showDetail.shippingCarrier || "GHTK"}</p>
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

            <div className="flex justify-between items-center pt-2 border-t border-gray-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
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

      {/* Print Shipping Modal */}
      {printOrders.length > 0 && (
        <PrintShippingModal
          orders={printOrders}
          onClose={() => setPrintOrders([])}
          shopName="Henr.Studio - Đồ Ngủ Thiết Kế"
          shopPhone="0988 234 567"
        />
      )}
    </div>
  );
}
