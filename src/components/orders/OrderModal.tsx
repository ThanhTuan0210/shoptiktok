import React from "react";
import Modal from "../ui/Modal";
import type { Order, OrderStatus } from "../../types";
import { getOrderStatusLabel, today } from "../../utils/helpers";

const STATUSES: OrderStatus[] = [
  "pending", "processing", "shipping", "delivered", "returned", "cancelled", "return_requested"
];

interface OrderModalProps {
  isOpen: boolean;
  isEditing: boolean;
  saving: boolean;
  editOrder: Partial<Order>;
  setEditOrder: React.Dispatch<React.SetStateAction<Partial<Order>>>;
  onClose: () => void;
  onSave: () => void;
}

export default function OrderModal({
  isOpen,
  isEditing,
  saving,
  editOrder,
  setEditOrder,
  onClose,
  onSave,
}: OrderModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng thủ công"}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="label">Kênh bán hàng</label>
          <select
            className="input"
            value={editOrder.channel || "tiktok"}
            onChange={(e) =>
              setEditOrder((p) => ({ ...p, channel: e.target.value as any }))
            }
          >
            <option value="tiktok">🎵 TikTok Shop</option>
            <option value="shopee">🛍️ Shopee</option>
            <option value="website">🛒 Website Store</option>
            <option value="live">🔴 Live Stream</option>
          </select>
        </div>

        <div>
          <label className="label">
            Mã đơn hàng ({editOrder.channel === "shopee" ? "Shopee" : "TikTok / Web"})
          </label>
          <input
            type="text"
            className="input font-mono"
            value={
              editOrder.channel === "shopee"
                ? editOrder.shopeeOrderId || editOrder.tiktokOrderId || ""
                : editOrder.tiktokOrderId || ""
            }
            onChange={(e) => {
              const val = e.target.value;
              setEditOrder((p) => ({
                ...p,
                tiktokOrderId: val,
                shopeeOrderId: p.channel === "shopee" ? val : p.shopeeOrderId,
              }));
            }}
            placeholder={
              editOrder.channel === "shopee"
                ? "241019ABCD1234"
                : "578912345678901234"
            }
          />
        </div>

        <div>
          <label className="label">Ngày đặt hàng</label>
          <input
            type="date"
            className="input"
            value={editOrder.orderDate || today()}
            onChange={(e) => setEditOrder((p) => ({ ...p, orderDate: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Tên khách hàng *</label>
          <input
            type="text"
            className="input"
            value={editOrder.customerName || ""}
            onChange={(e) => setEditOrder((p) => ({ ...p, customerName: e.target.value }))}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div>
          <label className="label">Số điện thoại</label>
          <input
            type="text"
            className="input font-mono"
            value={editOrder.customerPhone || ""}
            onChange={(e) => setEditOrder((p) => ({ ...p, customerPhone: e.target.value }))}
            placeholder="0912345678"
          />
        </div>

        <div>
          <label className="label">Địa chỉ giao hàng</label>
          <textarea
            rows={2}
            className="input"
            value={editOrder.customerAddress || ""}
            onChange={(e) => setEditOrder((p) => ({ ...p, customerAddress: e.target.value }))}
            placeholder="123 Đường ABC, Phường X, Quận Y, TP..."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Tiền hàng (VNĐ)</label>
            <input
              type="number"
              className="input"
              value={editOrder.subtotal || ""}
              onChange={(e) => setEditOrder((p) => ({ ...p, subtotal: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label">Phí ship (VNĐ)</label>
            <input
              type="number"
              className="input"
              value={editOrder.shippingFee || ""}
              onChange={(e) => setEditOrder((p) => ({ ...p, shippingFee: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label">TikTok Voucher</label>
            <input
              type="number"
              className="input"
              value={editOrder.tiktokDiscount || ""}
              onChange={(e) => setEditOrder((p) => ({ ...p, tiktokDiscount: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label">Shop Voucher</label>
            <input
              type="number"
              className="input"
              value={editOrder.sellerDiscount || ""}
              onChange={(e) => setEditOrder((p) => ({ ...p, sellerDiscount: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Trạng thái</label>
            <select
              className="input"
              value={editOrder.status || "pending"}
              onChange={(e) => setEditOrder((p) => ({ ...p, status: e.target.value as OrderStatus }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getOrderStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Đơn vị vận chuyển</label>
            <select
              className="input"
              value={editOrder.shippingCarrier || "GHTK"}
              onChange={(e) => setEditOrder((p) => ({ ...p, shippingCarrier: e.target.value }))}
            >
              {["GHTK", "GHN", "J&T Express", "Viettel Post", "Shopee Xpress", "SPX Express"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mã vận đơn</label>
            <input
              type="text"
              className="input font-mono"
              value={editOrder.trackingNumber || ""}
              onChange={(e) => setEditOrder((p) => ({ ...p, trackingNumber: e.target.value }))}
              placeholder="GHTK123456789"
            />
          </div>
        </div>

        <div>
          <label className="label">Ghi chú đơn hàng</label>
          <input
            type="text"
            className="input"
            value={editOrder.note || ""}
            onChange={(e) => setEditOrder((p) => ({ ...p, note: e.target.value }))}
            placeholder="Khách dặn giao buổi tối, kiểm tra hàng..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
          <button onClick={onClose} className="btn-secondary" type="button">
            Hủy
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary" type="button">
            {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo đơn hàng"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
