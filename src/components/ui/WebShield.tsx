import { useEffect, useState } from "react";
import { ShieldAlert, Lock, X } from "lucide-react";
import { DEFAULT_WEBSHIELD_SETTINGS, type WebShieldSettings } from "../../types";

interface WebShieldProps {
  shopName?: string;
}

export default function WebShield({ shopName = "Henr.Studio" }: WebShieldProps) {
  const [settings] = useState<WebShieldSettings>(() => {
    try {
      const saved = localStorage.getItem("tt_webShield");
      if (saved) return { ...DEFAULT_WEBSHIELD_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WEBSHIELD_SETTINGS;
  });

  const [toast, setToast] = useState<{ visible: boolean; message: string; sub?: string }>({
    visible: false,
    message: "",
  });

  const showShieldToast = (message: string, sub?: string) => {
    if (!settings.showToast) return;
    setToast({ visible: true, message, sub });
  };

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  useEffect(() => {
    if (!settings.enableAntiCopy) return;

    // 1. Console Warning & Security Banner
    const bannerStyle = "color: #fe2c55; font-size: 18px; font-weight: 800;";
    const subStyle = "color: #38bdf8; font-size: 12px; font-weight: 600;";
    const descStyle = "color: #94a3b8; font-size: 11px;";
    
    console.log("%c🛡️ [WEBSHIELD] BẢO VỆ BẢN QUYỀN: " + shopName.toUpperCase(), bannerStyle);
    console.log("%cHệ thống phòng thủ đa tầng kích hoạt: Chống sao chép nội dung, cào dữ liệu & dịch ngược mã nguồn.", subStyle);
    console.log("%cMọi hành vi sao chép hình ảnh, văn bản hoặc cấu trúc web đều vi phạm Luật Sở hữu trí tuệ.", descStyle);

    // 2. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow right click in input and textarea so customers can paste phone/address
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      showShieldToast(
        "🔒 Bản quyền hình ảnh & nội dung thuộc " + shopName,
        "Vui lòng không sao chép hình ảnh hoặc nội dung sản phẩm của cửa hàng."
      );
    };

    // 3. Prevent DevTools & Save Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!settings.blockShortcuts) return;

      const isF12 = e.key === "F12";
      const isInspect = e.ctrlKey && e.shiftKey && ["I", "i", "C", "c", "J", "j"].includes(e.key);
      const isViewSource = e.ctrlKey && (e.key === "u" || e.key === "U");
      const isSavePage = e.ctrlKey && (e.key === "s" || e.key === "S");

      if (isF12 || isInspect || isViewSource || isSavePage) {
        e.preventDefault();
        e.stopPropagation();
        showShieldToast(
          "🔒 Chức năng xem mã nguồn & lưu trang đã bị khóa",
          "Mã nguồn và giao diện của cửa hàng được bảo vệ bởi công nghệ WebShield."
        );
      }
    };

    // 4. Prevent Image Dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    // 5. Inject user-select CSS to protect text while preserving input fields
    const styleEl = document.createElement("style");
    styleEl.id = "webshield-guard-style";
    styleEl.innerHTML = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, select, [contenteditable="true"], .selectable-text {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      img {
        -webkit-user-drag: none !important;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(styleEl);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      const el = document.getElementById("webshield-guard-style");
      if (el) el.remove();
    };
  }, [settings, shopName]);

  if (!toast.visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-[460px] w-[92%] sm:w-auto bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl p-4 border border-rose-500/30 flex items-start gap-3.5 transition-all duration-300 animate-fade-in"
      style={{
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px -5px rgba(244,63,94,0.3)",
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-900/40">
        <ShieldAlert size={22} />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-rose-400 tracking-wide uppercase flex items-center gap-1">
            <Lock size={12} /> WebShield Bảo Vệ
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-100 mt-0.5 leading-snug">
          {toast.message}
        </p>
        {toast.sub && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {toast.sub}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setToast(prev => ({ ...prev, visible: false }))}
        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
        title="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  );
}
