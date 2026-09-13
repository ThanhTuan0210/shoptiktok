import { useState, useEffect, type ReactNode } from "react";
import { Lock, Store, AlertCircle, ShieldCheck, Clock, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function isUserAdminAuthenticated(): boolean {
  return sessionStorage.getItem("tt_adminAuth") === "true";
}

export function getAdminRole(): "admin" | "staff" {
  return (sessionStorage.getItem("tt_adminRole") as "admin" | "staff") || "admin";
}

export function lockAdmin() {
  sessionStorage.removeItem("tt_adminAuth");
  sessionStorage.removeItem("tt_adminRole");
  window.location.reload();
}

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [authed, setAuthed] = useState(() => isUserAdminAuthenticated());
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const correctAdminPin = localStorage.getItem("tt_adminPin") || "1234";
  const correctStaffPin = localStorage.getItem("tt_staffPin") || "0000";

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(s => {
        if (s <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Auto-lock on Idle (Default 15 minutes, configurable in Settings)
  useEffect(() => {
    if (!authed) return;
    const minutes = parseInt(localStorage.getItem("tt_autoLockMinutes") || "15", 10);
    if (!minutes || minutes <= 0) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.removeItem("tt_adminAuth");
        sessionStorage.removeItem("tt_adminRole");
        setAuthed(false);
        setPin("");
      }, minutes * 60 * 1000);
    };

    resetTimer();

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [authed]);

  const handleVerify = (inputPin: string) => {
    if (lockoutSeconds > 0) return;

    if (inputPin === correctAdminPin) {
      sessionStorage.setItem("tt_adminAuth", "true");
      sessionStorage.setItem("tt_adminRole", "admin");
      setAuthed(true);
      setError(false);
      setFailedAttempts(0);
    } else if (inputPin === correctStaffPin) {
      sessionStorage.setItem("tt_adminAuth", "true");
      sessionStorage.setItem("tt_adminRole", "staff");
      setAuthed(true);
      setError(false);
      setFailedAttempts(0);
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 5) {
        setLockoutSeconds(30);
      }
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleKeyClick = (digit: string) => {
    if (lockoutSeconds > 0) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutSeconds > 0) return;
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
        <p className="text-xs text-gray-400 mb-4">
          Nhập mã PIN 4 số để đăng nhập theo vai trò quản lý
        </p>

        {/* Roles Quick Guide */}
        <div className="w-full bg-gray-800/60 rounded-xl p-2.5 mb-5 border border-gray-700/80 text-[11px] flex items-center justify-around text-gray-300">
          <div className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-rose-400" />
            <span>Chủ shop: <strong className="font-mono text-white">1234</strong></span>
          </div>
          <div className="h-3 w-px bg-gray-700" />
          <div className="flex items-center gap-1">
            <UserCheck size={13} className="text-amber-400" />
            <span>Kho đóng gói: <strong className="font-mono text-white">0000</strong></span>
          </div>
        </div>

        {/* Lockout Notice */}
        {lockoutSeconds > 0 ? (
          <div className="w-full bg-rose-950/50 border border-rose-800 rounded-xl p-3 mb-6 text-xs text-rose-300 flex items-center justify-center gap-2 animate-pulse">
            <Clock size={16} />
            <span>Khóa tạm thời: Thử lại sau <strong>{lockoutSeconds}s</strong></span>
          </div>
        ) : (
          /* PIN Indicators */
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
        )}

        {error && lockoutSeconds === 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 mb-4 animate-pulse">
            <AlertCircle size={14} />
            <span>Mã PIN không đúng. Sai {failedAttempts}/5 lần!</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit => (
            <button
              key={digit}
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={() => handleKeyClick(digit)}
              className="h-14 rounded-2xl bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-xl font-semibold text-gray-100 transition-all active:scale-95 border border-gray-750 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={() => { setPin(""); setError(false); }}
            className="h-14 rounded-2xl bg-gray-850 hover:bg-gray-800 text-xs font-medium text-gray-400 transition-all border border-gray-800 disabled:opacity-30"
          >
            Xóa
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={() => handleKeyClick("0")}
            className="h-14 rounded-2xl bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-xl font-semibold text-gray-100 transition-all active:scale-95 border border-gray-750 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-gray-850 hover:bg-gray-800 text-xs font-medium text-gray-400 transition-all border border-gray-800 disabled:opacity-30"
          >
            ←
          </button>
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
