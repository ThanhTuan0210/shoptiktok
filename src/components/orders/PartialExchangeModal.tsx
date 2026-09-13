import { useState } from "react";
import Modal from "../ui/Modal";
import { RefreshCw, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Package } from "lucide-react";
import type { Order, Product, ProductVariant, OrderExchangeRecord, OrderItem } from "../../types";
import { formatCurrency, generateId, now } from "../../utils/helpers";
import { db } from "../../db/database";

interface PartialExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  products: Product[];
  variants: ProductVariant[];
  onExchangeComplete?: (updatedOrder: Order) => void;
}

export default function PartialExchangeModal({
  isOpen,
  onClose,
  order,
  products,
  variants,
  onExchangeComplete,
}: PartialExchangeModalProps) {
  if (!order || !isOpen) return null;

  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>(order.items[0]?.productId || "");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [reason, setReason] = useState("Mặc chật, đổi tăng 1 size");
  const [shippingPayer, setShippingPayer] = useState<"shop" | "customer" | "split">("customer");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentItem: OrderItem | undefined = order.items[selectedItemIdx];
  const targetProductVariants = variants.filter(v => v.productId === selectedProductId);
  const selectedNewVariant = variants.find(v => v.id === selectedVariantId);

  const priceDiff = selectedNewVariant
    ? (selectedNewVariant.sellingPrice || currentItem?.unitPrice || 0) - (currentItem?.unitPrice || 0)
    : 0;

  const handleConfirmExchange = async () => {
    if (!currentItem || !selectedNewVariant) return;
    setSubmitting(true);

    try {
      // 1. Create exchange record
      const exchangeRecord: OrderExchangeRecord = {
        id: "EX-" + generateId().slice(0, 8).toUpperCase(),
        orderId: order.id,
        originalVariantId: currentItem.variantId,
        originalProductName: currentItem.productName,
        originalSku: currentItem.sku,
        newVariantId: selectedNewVariant.id,
        newProductName: products.find(p => p.id === selectedProductId)?.name || currentItem.productName,
        newSku: selectedNewVariant.sku,
        qty: 1,
        reason: reason,
        priceDifference: priceDiff,
        shippingFeePayer: shippingPayer,
        status: "pending_pickup",
        createdAt: now(),
      };

      // 2. Deduct 1 stock of the new variant
      if (selectedNewVariant.stock > 0) {
        await db.variants.update(selectedNewVariant.id, {
          stock: selectedNewVariant.stock - 1,
        });
        await db.stockMovements.add({
          id: generateId(),
          variantId: selectedNewVariant.id,
          productId: selectedNewVariant.productId,
          type: "out",
          quantity: 1,
          referenceId: exchangeRecord.id,
          note: `Xuất hàng đổi size cho đơn ${order.id} (${reason})`,
          date: now(),
          createdAt: now(),
        });
      }

      // 3. Update Order with exchange history
      const existingExchanges = order.exchanges || [];
      const updatedExchanges = [...existingExchanges, exchangeRecord];
      const updatedNote = order.note
        ? `${order.note} | [Đổi hàng ${exchangeRecord.id}: ${currentItem.variantInfo} -> ${selectedNewVariant.size}/${selectedNewVariant.color}]`
        : `[Đổi hàng ${exchangeRecord.id}: ${currentItem.variantInfo} -> ${selectedNewVariant.size}/${selectedNewVariant.color}]`;

      await db.orders.update(order.id, {
        exchanges: updatedExchanges,
        note: updatedNote,
        updatedAt: now(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onExchangeComplete) {
          onExchangeComplete({
            ...order,
            exchanges: updatedExchanges,
            note: updatedNote,
          });
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to process partial exchange:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Tách Đơn Đổi Size / Đổi Hàng 1 Phần" size="lg">
      <div className="space-y-4">
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-white">Tạo Phiếu Đổi Hàng Thành Công!</h3>
            <p className="text-sm text-gray-400">
              Đã tự động trừ 1 bộ tồn kho cho phân loại mới và ghi nhận phiếu đối soát vận đơn.
            </p>
          </div>
        ) : (
          <>
            <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-3">
              <ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-200 leading-relaxed">
                Tính năng này cho phép khách giữ lại các món ưng ý và chỉ đổi riêng món cần đổi. Chiết khấu combo của đơn gốc <strong>vẫn được bảo lưu 100%</strong>, số liệu doanh thu P&L không bị sai lệch.
              </p>
            </div>

            {/* Step 1: Pick item to return */}
            <div>
              <label className="label text-xs text-gray-300 font-bold mb-2">
                1. Chọn sản phẩm khách muốn đổi trong đơn #{order.id}:
              </label>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedItemIdx(idx);
                      setSelectedProductId(item.productId);
                      setSelectedVariantId("");
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedItemIdx === idx
                        ? "bg-rose-950/40 border-rose-500 text-white"
                        : "bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800/80"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{item.productName}</p>
                      <p className="text-xs text-rose-400 mt-0.5">Phân loại hiện tại: {item.variantInfo} • SKU: {item.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-300">{formatCurrency(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Choose replacement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="label text-xs">2. Mẫu muốn đổi sang</label>
                <select
                  className="input"
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    setSelectedVariantId("");
                  }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Phân loại mới (Màu & Size)</label>
                <select
                  className="input"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">-- Chọn Size & Màu mới --</option>
                  {targetProductVariants.map(v => (
                    <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                      {v.color} - Size {v.size} (Còn {v.stock} bộ) {v.stock <= 0 ? "[HẾT HÀNG]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Reason & Shipping liability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Lý do đổi hàng</label>
                <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="Mặc chật, đổi tăng 1 size">Mặc chật, đổi tăng 1 size</option>
                  <option value="Mặc rộng, đổi giảm 1 size">Mặc rộng, đổi giảm 1 size</option>
                  <option value="Khách thích đổi sang màu khác">Khách thích đổi sang màu khác</option>
                  <option value="Hàng lỗi đường may / cúc áo">Hàng lỗi đường may / cúc áo (Shop chịu ship)</option>
                  <option value="Khách muốn đổi sang mẫu cao cấp hơn">Khách muốn đổi sang mẫu khác</option>
                </select>
              </div>

              <div>
                <label className="label text-xs">Bên chịu phí vận chuyển đổi hàng</label>
                <select className="input" value={shippingPayer} onChange={e => setShippingPayer(e.target.value as any)}>
                  <option value="customer">Khách hàng chịu phí ship đổi (30.000đ)</option>
                  <option value="shop">Shop hỗ trợ 100% phí ship (Lỗi shop/Ưu đãi VIP)</option>
                  <option value="split">Mỗi bên chịu 1 đầu phí (Chia đôi)</option>
                </select>
              </div>
            </div>

            {/* Summary card */}
            {selectedNewVariant && (
              <div className="p-3.5 bg-gray-800/80 rounded-xl border border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Đổi từ: <span className="text-gray-200 font-bold">{currentItem?.variantInfo}</span></p>
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <ArrowRight size={12} /> Sang: {selectedNewVariant.color} - Size {selectedNewVariant.size}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400">Chênh lệch giá hàng:</p>
                  <p className="text-sm font-bold text-white">
                    {priceDiff > 0 ? `+${formatCurrency(priceDiff)} (Thu thêm)` : priceDiff < 0 ? `-${formatCurrency(Math.abs(priceDiff))} (Hoàn lại)` : "0đ (Đổi ngang)"}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!selectedVariantId || submitting}
                onClick={handleConfirmExchange}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={submitting ? "animate-spin" : ""} />
                {submitting ? "Đang xử lý trừ kho..." : "Xác Nhận Xuất Đổi Size & Trừ Kho"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
