import { useEffect, useState, useMemo } from "react";
import { db } from "../../db/database";
import type { Order } from "../../types";
import {
  ShoppingBag, Search, Filter, Eye, Printer, Check, ExternalLink, Download, Upload, PlusCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { exportShopeeTemplate, importOrdersFromExcel } from "../../utils/exportData";
import { generateShopeeOrders } from "../../utils/generateShopeeOrders";
import Modal from "../../components/ui/Modal";
import { useSearchParams } from "react-router-dom";

export default function ShopeeOrders() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("tab") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const shopeeShopName = localStorage.getItem("shopee_shopName") || "henr_studio_official";
  const shopeeFeeRate = parseFloat(localStorage.getItem("shopee_feeRate") || "9.5");

  useEffect(() => {
    loadShopeeData();
  }, []);

  async function loadShopeeData() {
    const all = await db.orders.toArray();
    const shopeeOnly = all.filter(o => 
      o.channel === "shopee" || 
      Boolean(o.shopeeOrderId) || 
      (o.note || "").toLowerCase().includes("shopee")
    );
    setOrders(shopeeOnly.sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
  }

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
    setSuccessMsg(`Đã duyệt chuẩn bị hàng loạt cho ${selectedOrderIds.length} đơn hàng!`);
    setSelectedOrderIds([]);
    await loadShopeeData();
    setTimeout(() => setSuccessMsg(null), 3000);
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
          body { font-family: sans-serif; font-size: 11px; margin: 0; padding: 0; }
          .page-break { page-break-after: always; padding: 8px; border: 1.5px solid #000; border-radius: 4px; height: 140mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 10px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .logo { font-size: 20px; font-weight: 900; color: #EE4D2D; }
          .spx { font-weight: 900; background: #000; color: #fff; padding: 2px 6px; border-radius: 3px; }
          .barcode-box { text-align: center; margin: 10px 0; border: 1px dashed #666; padding: 8px; }
          .barcode { font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 3px; }
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
                  <div style="font-weight: bold;">NGƯỜI GỬI:</div>
                  <div>HENR STUDIO VIETNAM</div>
                  <div>SĐT: 0987.654.321</div>
                </div>
                <div style="flex: 1.2;">
                  <div style="font-weight: bold;">NGƯỜI NHẬN:</div>
                  <div style="font-weight: bold;">${o.customerName}</div>
                  <div>SĐT: ${o.customerPhone || "—"}</div>
                  <div style="font-size: 9px;">${o.customerAddress || "Địa chỉ giao hàng Shopee"}</div>
                </div>
              </div>
              <table class="items-table">
                <thead><tr><th>Tên hàng</th><th style="width: 35px;">SL</th><th>Phân loại</th></tr></thead>
                <tbody>
                  ${(o.items || []).map(it => `
                    <tr><td>${it.productName}</td><td align="center">${it.quantity}</td><td align="center">${it.variantInfo || "Bộ"}</td></tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            <div style="border-top: 2px solid #000; padding-top: 4px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="font-size: 9px;">Ngày đặt: ${formatDate(o.orderDate)}</div>
              <div style="text-align: right;">
                <div style="font-size: 9px;">Thu tiền COD:</div>
                <div style="font-size: 14px; font-weight: 900;">${o.paymentStatus === "paid" ? "0 đ (ĐÃ TT)" : formatCurrency(o.total)}</div>
              </div>
            </div>
          </div>
        `).join("")}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="text-[#EE4D2D]" />
            Quản Lý Đơn Hàng Shopee
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Xử lý hàng loạt, in phiếu gửi A6 chuẩn SPX và đồng bộ vận đơn tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportShopeeTemplate}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-700"
          >
            <Download size={14} /> Mẫu Excel Shopee
          </button>
          <label className="px-3.5 py-2 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md">
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
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Bulk Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-orange-300">
            Đã chọn <strong className="text-white">{selectedOrderIds.length}</strong> đơn hàng Shopee
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPrintA6}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Printer size={14} /> In Phiếu Gửi A6
            </button>
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Check size={14} /> Duyệt Chuẩn Bị
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:text-white"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã đơn Shopee, tên khách, SĐT, mã SPX..."
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
                statusFilter === st.id ? "bg-[#EE4D2D] text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                <th className="p-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng Shopee nào phù hợp.
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
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{formatCurrency(o.total)}</div>
                        <div className="text-[10px] text-gray-500">
                          Phí: -{formatCurrency(Math.round(o.total * (shopeeFeeRate / 100)))}
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
                          <span className="text-gray-500 text-[11px] italic">Chờ lấy hàng</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          o.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                          o.status === "shipping" ? "bg-blue-500/10 text-blue-400" :
                          o.status === "processing" ? "bg-amber-500/10 text-amber-400" :
                          "bg-gray-800 text-gray-400"
                        }`}>
                          {o.status === "delivered" ? "Đã Giao" :
                           o.status === "shipping" ? "Đang Giao" :
                           o.status === "processing" ? "Chờ Lấy" :
                           o.status === "pending" ? "Chờ Duyệt" : o.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <Modal isOpen={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={"Chi Tiết Đơn Shopee #" + (selectedOrder.shopeeOrderId || selectedOrder.id)}>
          <div className="space-y-4 text-sm text-gray-200">
            <div className="bg-gray-800/60 p-4 rounded-xl space-y-2">
              <p><strong>Khách hàng:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone || "—"})</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerAddress || "Địa chỉ mặc định Shopee"}</p>
              <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.orderDate)}</p>
              <p><strong>Vận đơn SPX:</strong> {selectedOrder.trackingNumber || "Chưa tạo"}</p>
            </div>
            <div className="space-y-2">
              {selectedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded bg-gray-800 text-xs">
                  <span>{it.productName} ({it.variantInfo || "Bộ"}) x{it.quantity}</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
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
