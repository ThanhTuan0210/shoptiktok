import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import { Camera, CheckCircle2, AlertCircle, PackageCheck, Scan, RefreshCw, Volume2, ShieldCheck } from "lucide-react";
import type { Order } from "../../types";

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onOrderPacked: (orderId: string) => Promise<void>;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  orders,
  onOrderPacked,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [packing, setPacking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio synthesizer beep
  function playBeep(type: "success" | "error") {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  }

  // Camera stream setup
  useEffect(() => {
    if (isOpen && isCameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => {
          console.warn("Camera access error:", err);
          setIsCameraActive(false);
          setMessage({ type: "info", text: "Không thể mở camera. Bạn có thể dùng máy quét USB hoặc nhập mã bên dưới." });
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, isCameraActive]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setMatchedOrder(null);
      setVerifiedItems({});
      setMessage(null);
      setManualCode("");
    }
  }, [isOpen]);

  function handleScanCode(code: string) {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    // Search order by trackingNumber, tiktokOrderId, or id
    const found = orders.find(o =>
      (o.trackingNumber && o.trackingNumber.toLowerCase() === clean) ||
      (o.tiktokOrderId && o.tiktokOrderId.toLowerCase() === clean) ||
      o.id.toLowerCase() === clean ||
      o.id.toLowerCase().endsWith(clean)
    );

    if (found) {
      playBeep("success");
      setMatchedOrder(found);
      // Auto verify items or leave empty for check
      const initialMap: Record<string, boolean> = {};
      found.items.forEach(i => {
        initialMap[`${i.productId}_${i.variantId}`] = false;
      });
      setVerifiedItems(initialMap);
      setMessage({ type: "success", text: `Tìm thấy đơn hàng #${found.tiktokOrderId || found.id.slice(-8)} - Khách: ${found.customerName}` });
    } else {
      playBeep("error");
      setMessage({ type: "error", text: `Không tìm thấy đơn hàng nào có mã: "${code.trim()}"` });
    }

    setManualCode("");
  }

  function toggleItemVerification(key: string) {
    playBeep("success");
    setVerifiedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const allItemsVerified = matchedOrder
    ? matchedOrder.items.every(i => verifiedItems[`${i.productId}_${i.variantId}`])
    : false;

  async function handleConfirmPacking() {
    if (!matchedOrder) return;
    setPacking(true);
    try {
      await onOrderPacked(matchedOrder.id);
      playBeep("success");
      setMessage({ type: "success", text: `Đơn hàng #${matchedOrder.tiktokOrderId || matchedOrder.id.slice(-8)} đã đóng gói thành công!` });
      setMatchedOrder(null);
      setVerifiedItems({});
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (err: any) {
      setMessage({ type: "error", text: "Lỗi đóng gói: " + err.message });
    } finally {
      setPacking(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📷 Quét Mã Vạch & Đóng Gói Đối Soát Siêu Tốc" size="lg">
      <div className="space-y-4 text-xs">
        {/* Top Scan Bar & Camera Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Scan size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleScanCode(manualCode);
              }}
              placeholder="Quét mã vận đơn / mã đơn hoặc máy tít cầm tay (Bấm Enter)..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-20 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
            <button
              type="button"
              onClick={() => handleScanCode(manualCode)}
              className="absolute right-1.5 top-1 btn bg-rose-600 hover:bg-rose-500 text-white text-[11px] py-1 px-2.5 rounded-lg"
            >
              Tìm đơn
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCameraActive(p => !p)}
            className={`btn text-xs py-2 px-3 flex items-center gap-1.5 ${
              isCameraActive ? "bg-amber-600 text-white" : "btn-secondary text-gray-300"
            }`}
          >
            <Camera size={14} />
            <span>{isCameraActive ? "Tắt Camera" : "Bật Camera"}</span>
          </button>
        </div>

        {/* Video Camera Preview */}
        {isCameraActive && (
          <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Target Box Overlay */}
            <div className="absolute inset-0 m-auto w-48 h-24 border-2 border-rose-500/80 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-rose-500/60 animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-gray-300 flex items-center gap-1">
              <Volume2 size={11} /> Căn mã vạch vào khung giữa
            </div>
          </div>
        )}

        {/* Status Notification */}
        {message && (
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : message.type === "error"
                ? "bg-rose-950/40 border-rose-800 text-rose-300"
                : "bg-blue-950/40 border-blue-800 text-blue-300"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Matched Order Details & Verification Checklist */}
        {matchedOrder ? (
          <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-700 pb-2">
              <div>
                <span className="text-gray-400">Khách hàng: </span>
                <strong className="text-white text-sm">{matchedOrder.customerName}</strong>
                <span className="ml-2 font-mono text-gray-400">({matchedOrder.customerPhone || "—"})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                  {matchedOrder.shippingCarrier || "GHTK"} • {matchedOrder.trackingNumber || "Chưa có MVĐ"}
                </span>
              </div>
            </div>

            {/* Checklist of Items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Đối soát sản phẩm trong đơn (Tích chọn khi nhặt xong đồ):
                </span>
                <span>{Object.values(verifiedItems).filter(Boolean).length}/{matchedOrder.items.length} món</span>
              </div>

              <div className="space-y-1.5">
                {matchedOrder.items.map((item, idx) => {
                  const key = `${item.productId}_${item.variantId}`;
                  const isChecked = !!verifiedItems[key];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItemVerification(key)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "bg-emerald-950/30 border-emerald-600 text-white"
                          : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded bg-gray-800 border-gray-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-semibold text-xs text-white">{item.productName}</p>
                          <p className="text-[11px] text-gray-400">
                            Phân loại: <strong className="text-amber-300">{item.variantInfo || "Bộ"}</strong> • SKU: <span className="font-mono text-gray-300">{item.sku || "—"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-gray-800 font-mono font-bold text-white text-xs">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packing Confirmation Action */}
            <div className="pt-2 border-t border-gray-700 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {allItemsVerified ? "✨ Đã đối soát đủ 100% sản phẩm" : "⚠️ Cần đối soát đủ các món trước khi đóng gói"}
              </span>

              <button
                type="button"
                onClick={handleConfirmPacking}
                disabled={packing || !allItemsVerified}
                className={`btn py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-lg transition-all ${
                  allItemsVerified
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                <PackageCheck size={15} />
                <span>{packing ? "Đang xử lý..." : "XÁC NHẬN ĐÓNG GÓI XONG"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 space-y-1">
            <PackageCheck size={28} className="mx-auto text-gray-600 mb-2" />
            <p>Sẵn sàng quét mã vận đơn hoặc mã đơn hàng để đối soát đóng gói</p>
            <p className="text-[10px] text-gray-600">Hỗ trợ máy quét mã vạch USB, súng bắn mã, hoặc Camera điện thoại</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
