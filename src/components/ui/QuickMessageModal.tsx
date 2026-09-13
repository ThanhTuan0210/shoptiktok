import { useState } from "react";
import Modal from "./Modal";
import { MessageSquare, Copy, Check, ExternalLink, Send, Sparkles } from "lucide-react";

export interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
  tiktokOrderId?: string;
  items?: { productName: string; variantInfo?: string; quantity: number }[];
  shippingCarrier?: string;
  trackingNumber?: string;
  shopName?: string;
}

export default function QuickMessageModal({
  isOpen,
  onClose,
  customerName,
  customerPhone = "",
  orderId = "",
  tiktokOrderId = "",
  items = [],
  shippingCarrier = "GHTK",
  trackingNumber = "",
  shopName = "Henr.Studio",
}: QuickMessageModalProps) {
  const cleanPhone = customerPhone.replace(/\D/g, "");
  const orderCode = tiktokOrderId || (orderId ? orderId.slice(-8) : "—");
  const itemsText = items.length > 0
    ? items.map(i => `${i.productName} (${i.variantInfo || "Bộ"}) x${i.quantity}`).join(", ")
    : "bộ đồ ngủ pyjama cao cấp";

  const carrierName = shippingCarrier || "GHTK";
  const trackingCode = trackingNumber || `VN${Date.now().toString().slice(-8)}`;

  const templates = [
    {
      id: "confirm",
      title: "1. Xác nhận đơn mới",
      icon: "📦",
      desc: "Gửi khi vừa nhận đơn để dặn khách để ý điện thoại",
      text: `Dạ ${shopName} xin chào chị ${customerName || "khách yêu"} ạ! ❤️
Shop đã nhận được đơn hàng #${orderCode} của chị gồm:
👉 ${itemsText}

Shop đang đóng gói cẩn thận để gửi cho bưu tá ${carrierName}. Dự kiến khoảng 2-3 ngày tới là chị nhận được đồ xinh nhé ạ.
Chị vui lòng để ý điện thoại để bưu tá giao hàng thuận tiện nhất nha. Cảm ơn chị đã tin yêu ${shopName}! 🌸`,
    },
    {
      id: "shipping",
      title: "2. Báo mã vận đơn & Tra cứu",
      icon: "🚚",
      desc: "Thông báo đơn đã xuất kho kèm mã bưu tá",
      text: `Dạ chị ${customerName || "khách yêu"} ơi! Đơn hàng #${orderCode} của chị đã được đóng gói và giao cho bưu tá ${carrierName} rồi ạ.
🏷️ Mã vận đơn của chị: [${trackingCode}]

Chị có thể theo dõi hành trình bưu tá giao hoặc tra cứu đơn hàng trực tiếp tại website shop. Nếu cần hỗ trợ bất kỳ điều gì, chị cứ nhắn tin cho shop ngay nhé ạ! Chúc chị một ngày tốt lành! ✨`,
    },
    {
      id: "rescue",
      title: "3. Cứu đơn không nghe máy",
      icon: "🆘",
      desc: "Kịp thời xử lý khi bưu tá báo giao không thành công",
      text: `Dạ ${shopName} chào chị ${customerName || "khách yêu"}!
Hôm nay bưu tá ${carrierName} có liên hệ giao đơn #${orderCode} nhưng chưa gặp được chị ạ.
Chị có tiện nhận hàng vào khung giờ nào trong ngày mai không ạ, để shop nhắn bưu tá giao đúng giờ thuận tiện nhất cho chị?
Đồ ngủ xinh đang đợi chị nhận, chị nhắn lại cho shop nhé ạ! Cảm ơn chị nhiều ạ ❤️`,
    },
    {
      id: "care",
      title: "4. Chăm sóc & Hướng dẫn giặt lụa",
      icon: "✨",
      desc: "Tạo ấn tượng chuyên nghiệp sau khi giao thành công",
      text: `Dạ ${shopName} chào chị ${customerName || "khách yêu"}!
Hệ thống báo đơn #${orderCode} đã được giao thành công rồi ạ. Chị mặc thử đồ ngủ có vừa vặn và ưng ý không ạ?
💡 Mẹo nhỏ bảo quản lụa satin: Để chất vải luôn óng ả và mềm mượt, chị nên giặt tay hoặc dùng túi giặt ở chế độ nhẹ, tránh vắt mạnh và ủi ở nhiệt độ thấp chị nhé.
Nếu cần đổi size hoặc hỗ trợ gì thêm, shop luôn sẵn sàng hỗ trợ chị nha! 🥰`,
    },
    {
      id: "vip",
      title: "5. Tặng voucher tri ân",
      icon: "🎁",
      desc: "Kích thích khách mua lại lần sau",
      text: `Dạ ${shopName} thân gửi tặng chị ${customerName || "chị yêu"} mã ưu đãi đặc biệt:
🎟️ [VIP20K] - Giảm ngay 20.000đ cho đơn hàng tiếp theo trên Website shop!
Hiện shop vừa về thêm rất nhiều mẫu pyjama lụa và cotton mới cực xinh. Chị ghé xem thêm để diện đồ ngủ thật thoải mái và sang trọng nhé ạ! 💖`,
    },
  ];

  const [activeTab, setActiveTab] = useState(templates[0].id);
  const [customText, setCustomText] = useState(templates[0].text);
  const [copied, setCopied] = useState(false);

  function handleSelectTemplate(tmpl: typeof templates[0]) {
    setActiveTab(tmpl.id);
    setCustomText(tmpl.text);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = customText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const tiktokChatUrl = `https://seller-vn.tiktok.com/chat${tiktokOrderId ? `?order_id=${tiktokOrderId}` : ""}`;
  const zaloUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : "";
  const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(customText)}` : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💬 Mẫu Tin Nhắn Chăm Sóc Khách Hàng (1-Click)" size="lg">
      <div className="space-y-4 text-xs">
        {/* Recipient Info */}
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-gray-400">Gửi cho khách: </span>
            <strong className="text-white text-sm">{customerName || "Khách hàng"}</strong>
            {customerPhone && (
              <span className="ml-2 font-mono text-gray-300 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                {customerPhone}
              </span>
            )}
          </div>
          <div className="text-gray-400">
            Đơn hàng: <span className="text-rose-400 font-mono font-semibold">#{orderCode}</span>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {templates.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTemplate(t)}
              className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                activeTab === t.id
                  ? "bg-rose-500/10 border-rose-500 text-rose-300 shadow-sm"
                  : "bg-gray-800/40 border-gray-700/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <span>{t.icon}</span>
                <span className="truncate">{t.title.split(". ")[1]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Text editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400" />
              Nội dung tin nhắn (Có thể chỉnh sửa trước khi gửi):
            </span>
            <span className="text-[11px] text-gray-500">{customText.length} ký tự</span>
          </div>
          <textarea
            rows={7}
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed font-sans"
            placeholder="Nhập nội dung tin nhắn..."
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`btn text-xs py-2 px-4 flex items-center gap-1.5 font-medium transition-all ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Đã sao chép vào bộ nhớ tạm!" : "Sao chép nội dung"}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {zaloUrl && (
              <a
                href={zaloUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleCopy}
                className="btn bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3 flex items-center gap-1.5 font-medium shadow-sm"
                title="Sao chép và mở Zalo với khách"
              >
                <MessageSquare size={14} />
                <span>Mở Zalo nhắn ngay</span>
                <ExternalLink size={12} />
              </a>
            )}

            <a
              href={tiktokChatUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleCopy}
              className="btn bg-rose-600 hover:bg-rose-500 text-white text-xs py-2 px-3 flex items-center gap-1.5 font-medium shadow-sm"
              title="Sao chép và mở TikTok Shop Seller Chat"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.78 4.49 6.27 6.27 0 0 0 1.9-4.49V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-.88-.09z" />
              </svg>
              <span>Chat TikTok Shop</span>
              <ExternalLink size={12} />
            </a>

            {cleanPhone && (
              <a
                href={smsUrl}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-gray-300 hover:text-white"
                title="Gửi tin nhắn SMS trực tiếp"
              >
                <Send size={13} />
                <span>Gửi SMS</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
