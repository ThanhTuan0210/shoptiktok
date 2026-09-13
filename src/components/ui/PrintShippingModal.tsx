import { useRef } from "react";
import { X, Printer, Package, Truck, Phone, MapPin, ShieldCheck } from "lucide-react";
import type { Order } from "../../types";
import { formatCurrency, formatDate } from "../../utils/helpers";

interface PrintShippingModalProps {
  orders: Order[];
  onClose: () => void;
  shopName?: string;
  shopPhone?: string;
}

export default function PrintShippingModal({
  orders,
  onClose,
  shopName = "Henr.Studio",
  shopPhone = "0988 234 567"
}: PrintShippingModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!orders || orders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 text-gray-900 border border-gray-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
              <Printer size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">In Phiếu Giao Hàng / Vận Đơn Bưu Tá</h3>
              <p className="text-xs text-gray-400">Đã chọn {orders.length} đơn hàng • Khổ giấy chuẩn A6 / A7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <Printer size={16} />
              <span>In Ngay ({orders.length} đơn)</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printAreaRef} className="printable-labels p-6 bg-gray-100 max-h-[75vh] overflow-y-auto space-y-6">
          {orders.map((order, index) => {
            const isCOD = !order.paymentMethod || order.paymentMethod === "cod";
            return (
              <div
                key={order.id}
                className="shipping-label-card bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 shadow-sm text-gray-900 page-break-after"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {/* Header: Shop & Carrier */}
                <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xl tracking-tight text-gray-950 uppercase">{shopName}</span>
                      <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-bold uppercase">OFFICIAL</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Đồ ngủ Pyjama Lụa & Cotton Cao Cấp</p>
                    <p className="text-xs text-gray-600">Hotline gửi hàng: <strong>{shopPhone}</strong></p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded uppercase tracking-wider">
                      {order.shippingCarrier || "GHTK"} EXPRESS
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Ngày tạo: {formatDate(order.orderDate)}</p>
                    <p className="text-xs font-mono font-bold text-gray-900">Mã đơn: #{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="flex flex-col items-center justify-center my-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-[2px] h-10">
                    {[1,2,1,3,1,2,4,1,2,1,3,2,1,4,2,1,3,1,2,1,4,1,2,3,1,2,4,1,2,1,3,2,1,4,2,1,3].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-black h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs font-bold tracking-widest mt-1 text-gray-800">
                    *{order.id.toUpperCase()}*
                  </span>
                </div>

                {/* Sender & Receiver Grid */}
                <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded-xl p-3 my-3 text-xs">
                  {/* Sender */}
                  <div className="border-r border-gray-200 pr-3">
                    <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Người gửi:</p>
                    <p className="font-bold text-gray-900">{shopName} Official</p>
                    <p className="text-gray-700">{shopPhone}</p>
                    <p className="text-gray-600 mt-0.5">Kho Tổng Henr.Studio, Hà Nội, Việt Nam</p>
                  </div>

                  {/* Receiver */}
                  <div className="pl-1">
                    <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Người nhận:</p>
                    <p className="font-bold text-sm text-gray-950 uppercase">{order.customerName}</p>
                    <p className="font-black text-sm text-[#fe2c55] font-mono mt-0.5">{order.customerPhone || "Chưa có SĐT"}</p>
                    <p className="text-gray-800 mt-1 leading-snug font-medium">
                      {order.customerAddress || "Địa chỉ cập nhật khi liên hệ"}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="border border-gray-300 rounded-xl overflow-hidden my-3">
                  <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700 flex justify-between border-b border-gray-200">
                    <span>NỘI DUNG HÀNG HÓA ({order.items.reduce((s, i) => s + i.quantity, 0)} MÓN)</span>
                    <span>SL</span>
                  </div>
                  <div className="divide-y divide-gray-100 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex-1 pr-2">
                          <p className="font-semibold text-gray-900 leading-snug">{item.productName}</p>
                          <p className="text-[11px] text-gray-500">Phân loại: {item.variantInfo || item.sku}</p>
                        </div>
                        <span className="font-bold text-gray-900 font-mono px-2 py-0.5 bg-gray-100 rounded">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COD & Payment Banner */}
                <div className="border-2 border-gray-900 rounded-xl p-3 my-3 flex items-center justify-between bg-amber-50/60">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block uppercase">TIỀN THU NGƯỜI NHẬN (COD):</span>
                    <span className="text-2xl font-black text-red-600 font-mono">
                      {isCOD ? formatCurrency(order.total) : "0 đ"}
                    </span>
                    {!isCOD && (
                      <span className="block text-[11px] font-bold text-emerald-700">
                        ✓ ĐÃ THANH TOÁN CHUYỂN KHOẢN
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-gray-900">Khối lượng: {(order.items.reduce((s, i) => s + i.quantity, 0) * 0.35).toFixed(2)} kg</p>
                    <p className="text-[10px] text-gray-500">Kích thước: 25x18x8 cm</p>
                  </div>
                </div>

                {/* Delivery Notes & Signatures */}
                <div className="text-[11px] text-gray-700 border-t border-gray-200 pt-2 flex items-end justify-between">
                  <div className="max-w-[65%]">
                    <p className="font-bold text-gray-900">Ghi chú giao hàng:</p>
                    <p className="italic text-gray-600">
                      Cho khách đồng kiểm (xem hàng, không thử). Hàng đồ ngủ lụa cao cấp, xin nhẹ tay!
                    </p>
                    {order.note && <p className="text-rose-700 font-semibold mt-0.5">Ghi chú khách: {order.note}</p>}
                  </div>
                  <div className="text-center w-28 border-t border-dashed border-gray-400 pt-1">
                    <p className="text-[10px] font-semibold text-gray-500">Chữ ký người nhận</p>
                    <p className="text-[9px] text-gray-400 italic mt-6">(Ký & ghi rõ họ tên)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .printable-labels, .printable-labels * {
            visibility: visible;
          }
          .printable-labels {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .shipping-label-card {
            box-shadow: none !important;
            border: 2px solid black !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
