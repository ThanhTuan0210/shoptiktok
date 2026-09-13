import { useState, useEffect, type ReactNode } from "react";
import { ShieldCheck, Lock, ArrowRight, Store, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function isUserAdminAuthenticated(): boolean {
  return sessionStorage.getItem("tt_adminAuth") === "true";
}

export function lockAdmin() {
  sessionStorage.removeItem("tt_adminAuth");
  window.location.reload();
}

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [authed, setAuthed] = useState(() => isUserAdminAuthenticated());
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const correctPin = localStorage.getItem("tt_adminPin") || "1234";

  const handleVerify = (inputPin: string) => {
    if (inputPin === correctPin) {
      sessionStorage.setItem("tt_adminAuth", "true");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleKeyClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white select-none">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Logo / Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#fe2c55] to-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Khu Vực Quản Trị Henr.Studio</h1>
        <p className="text-xs text-gray-400 mb-6">
          Vui lòng nhập mã PIN 4 số để truy cập bảng điều khiển shop
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error
                  ? "bg-red-500 animate-bounce"
                  : pin.length > i
                  ? "bg-[#fe2c55] scale-110 shadow-md shadow-rose-500/50"
                  : "bg-gray-800 border border-gray-700"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 mb-4 animate-pulse">
            <AlertCircle size={14} />
            <span>Mã PIN không chính xác. Vui lòng thử lại!</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-14 rounded-2xl bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-xl font-semibold text-gray-100 transition-all active:scale-95 border border-gray-750"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setPin(""); setError(false); }}
            className="h-14 rounded-2xl bg-gray-850 hover:bg-gray-800 text-xs font-medium text-gray-400 transition-all border border-gray-800"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick("0")}
            className="h-14 rounded-2xl bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-xl font-semibold text-gray-100 transition-all active:scale-95 border border-gray-750"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-gray-850 hover:bg-gray-800 text-xs font-medium text-gray-400 transition-all border border-gray-800"
          >
            ←
          </button>
        </div>

        <div className="text-[11px] text-gray-500 mb-6">
          Gợi ý: Mã PIN mặc định là <span className="text-gray-300 font-mono font-bold">1234</span>
        </div>

        {/* Back to store */}
        <Link
          to="/shop"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-300 text-xs font-medium transition-all"
        >
          <Store size={14} />
          <span>Về Cửa Hàng Bán Lẻ (Khách Mua)</span>
        </Link>
      </div>
    </div>
  );
}
