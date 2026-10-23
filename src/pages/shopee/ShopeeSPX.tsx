import { useEffect, useState } from "react";
import { db } from "../../db/database";
import type { Order } from "../../types";
import { Truck, Printer, Scan, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import Modal from "../../components/ui/Modal";

export default function ShopeeSPX() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannedTrackingList, setScannedTrackingList] = useState<string[]>([]);

  useEffect(() => {
    loadSPXOrders();
  }, []);

  async function loadSPXOrders() {
    const all = await db.orders.toArray();
    const shopeeOnly = all.filter(o => 
      o.channel === "shopee" || 
      Boolean(o.shopeeOrderId) || 
      (o.note || "").toLowerCase().includes("shopee")
    );
    setOrders(shopeeOnly);
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    if (!scannedTrackingList.includes(code)) {
      setScannedTrackingList([code, ...scannedTrackingList]);
      const match = orders.find(o => 
        (o.trackingNumber && o.trackingNumber.toUpperCase() === code) || 
        (o.shopeeOrderId && o.shopeeOrderId.toUpperCase() === code) ||
        o.id.toUpperCase() === code
      );
      if (match) {
        db.orders.update(match.id, { status: "shipping", updatedAt: new Date().toISOString() });
        loadSPXOrders();
      }
    }
    setScanInput("");
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Truck className="text-[#EE4D2D]" />
            Điều Phối SPX Express (Shopee Xpress)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Quét mã bàn giao bưu tá, đồng kiểm và giám sát luân chuyển bưu kiện trên toàn quốc.
          </p>
        </div>

        <button
          onClick={() => setScanModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-950"
        >
          <Scan size={15} /> Quét Barcode Bàn Giao
        </button>
      </div>

      {/* 3 Thẻ Thông Tin SPX */}
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
          <div className="mt-4 p-3 bg-gray-800/60 rounded-xl space-y-1 text-xs">
            <p className="text-gray-300">Quy cách: <strong>Giấy decal nhiệt 3 lớp chống thấm</strong></p>
            <p className="text-gray-300">Trạng thái máy in: <strong className="text-emerald-400">Đã kết nối LAN/USB</strong></p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Scan className="text-emerald-400" size={18} />
            <h3 className="font-bold text-white text-sm">Hiệu Suất Vận Chuyển</h3>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Tỷ lệ đơn hàng giao thành công lần 1 đạt <strong>98.2%</strong>.
          </p>
          <div className="mt-4 p-3 bg-gray-800/60 rounded-xl space-y-1 text-xs">
            <p className="text-gray-300">Thời gian giao trung bình: <strong>1.4 ngày</strong></p>
            <p className="text-gray-300">Khiếu nại hư hỏng hàng: <strong className="text-emerald-400">0 đơn</strong></p>
          </div>
        </div>
      </div>

      {/* Danh Sách Vận Đơn Đang Chuyển */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4">Danh Sách Bưu Kiện Đang Lưu Chuyển SPX Express</h3>
        <div className="space-y-3">
          {orders.filter(o => o.status === "shipping" || o.trackingNumber).length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Chưa có đơn hàng nào đang trong quá trình luân chuyển.</p>
          ) : (
            orders.filter(o => o.status === "shipping" || o.trackingNumber).map(o => (
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
            ))
          )}
        </div>
      </div>

      {/* Modal Quét Barcode */}
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
    </div>
  );
}
