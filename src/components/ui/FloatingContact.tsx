import { useState } from "react";
import { MessageCircle, Phone, X, Headphones, Check, Sparkles } from "lucide-react";

interface FloatingContactProps {
  hotline?: string;
  zaloPhone?: string;
  shopName?: string;
}

export default function FloatingContact({
  hotline = "0988 234 567",
  zaloPhone = "0988234567",
  shopName = "Henr.Studio"
}: FloatingContactProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyZalo = () => {
    navigator.clipboard?.writeText(zaloPhone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Popover Menu */}
      {open && (
        <div className="mb-3 w-72 bg-white rounded-3xl shadow-2xl border border-rose-100 p-5 animate-scale-up text-gray-800">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#fe2c55]">
                <Headphones size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 leading-tight">Hỗ Trợ & Tư Vấn Size</h4>
                <p className="text-[11px] text-gray-500">{shopName} 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Zalo Button */}
            <a
              href={`https://zalo.me/${zaloPhone.replace(/\s+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 transition-all border border-blue-100 font-medium text-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                Zalo
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 group-hover:text-blue-700 text-xs">Chat Zalo Tư Vấn</p>
                <p className="text-[11px] text-gray-500">Tư vấn size & gửi thêm ảnh thật</p>
              </div>
            </a>

            {/* Hotline Call Button */}
            <a
              href={`tel:${hotline.replace(/\s+/g, "")}`}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 transition-all border border-rose-100 font-medium text-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#fe2c55] text-white flex items-center justify-center shadow-sm">
                <Phone size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 group-hover:text-[#fe2c55] text-xs">Gọi Hotline Đặt Hàng</p>
                <p className="text-[11px] font-mono font-bold text-[#fe2c55]">{hotline}</p>
              </div>
            </a>

            {/* Quick Copy Phone */}
            <button
              type="button"
              onClick={handleCopyZalo}
              className="w-full text-center py-2 text-[11px] text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-1"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Đã sao chép SĐT Zalo</span>
                </>
              ) : (
                <span>Sao chép SĐT: <strong className="text-gray-700">{hotline}</strong></span>
              )}
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>Phục vụ từ 8:00 – 22:30 hàng ngày</span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Tư vấn khách hàng"
        className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-rose-500 to-[#fe2c55] text-white font-bold text-xs shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle size={18} />
        <span className="hidden sm:inline">Tư Vấn Size & Đặt Hàng</span>
        <span className="sm:hidden">Tư Vấn</span>
      </button>
    </div>
  );
}
