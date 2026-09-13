import { useState, useRef } from "react";
import Modal from "./Modal";
import { Sparkles, Gift, Check, Phone, User, ArrowRight, Trophy } from "lucide-react";

export interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoucher: (code: string) => void;
}

interface Slice {
  code: string;
  label: string;
  color: string;
  textColor: string;
  desc: string;
}

const SLICES: Slice[] = [
  { code: "FREESHIP", label: "Freeship Toàn Quốc", color: "#FE2C55", textColor: "#fff", desc: "Miễn phí vận chuyển cho mọi đơn hàng" },
  { code: "GIAM20K", label: "Giảm 20.000₫", color: "#4F46E5", textColor: "#fff", desc: "Giảm trực tiếp 20.000₫ cho đơn từ 299k" },
  { code: "GIAM10%", label: "Giảm 10% Bill", color: "#F59E0B", textColor: "#fff", desc: "Giảm 10% tổng tiền hàng (tối đa 40.000₫)" },
  { code: "GIAM50K", label: "Giảm 50.000₫", color: "#10B981", textColor: "#fff", desc: "Giảm 50.000₫ cho đơn hàng từ 599k" },
  { code: "PHUKIEN1K", label: "Băng Đô Lụa 1K", color: "#EC4899", textColor: "#fff", desc: "Tặng kèm Băng đô lụa Satin chỉ với 1.000₫" },
  { code: "GIAM30K", label: "Giảm 30.000₫", color: "#8B5CF6", textColor: "#fff", desc: "Giảm 30.000₫ cho đơn hàng từ 399k" },
  { code: "FREESHIP50", label: "Giảm 50% Ship", color: "#06B6D4", textColor: "#fff", desc: "Giảm 50% phí bưu tá giao tận nơi" },
  { code: "THEMLUOT", label: "Thêm Lượt Quay", color: "#EF4444", textColor: "#fff", desc: "Tặng thêm 1 lượt quay may mắn tiếp theo" },
];

export default function LuckyWheelModal({ isOpen, onClose, onApplyVoucher }: LuckyWheelModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Slice | null>(null);
  const [error, setError] = useState("");

  const wheelRef = useRef<HTMLDivElement>(null);

  function spinWheel() {
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên của bạn để nhận quà");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setError("Vui lòng nhập số điện thoại hợp lệ");
      return;
    }
    setError("");

    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    // Pick a favorable prize index (e.g. FREESHIP, GIAM20K, GIAM10%, or GIAM50K)
    const prizeIndices = [0, 1, 2, 3, 4, 5];
    const targetIndex = prizeIndices[Math.floor(Math.random() * prizeIndices.length)];
    const prize = SLICES[targetIndex];

    const sliceAngle = 360 / SLICES.length;
    // Calculate rotation: 5 full turns (1800 deg) + angle to bring target slice to top arrow (which is at 270 deg or top)
    const extraRounds = 5 * 360;
    // Top arrow points to 270deg. Slice targetIndex center: targetIndex * sliceAngle + sliceAngle/2
    const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
    const newRotation = rotation + extraRounds + targetAngle - (rotation % 360);

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(prize);
      // Save lead locally
      try {
        const leads = JSON.parse(localStorage.getItem("henr_lucky_leads") || "[]");
        leads.push({ name, phone: cleanPhone, prize: prize.code, date: new Date().toISOString() });
        localStorage.setItem("henr_lucky_leads", JSON.stringify(leads));
      } catch (e) {}
    }, 4500);
  }

  function handleApply() {
    if (winner) {
      onApplyVoucher(winner.code);
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎡 Vòng Quay May Mắn - 100% Trúng Quà!" size="md">
      <div className="space-y-4 text-center text-xs">
        {!winner ? (
          <>
            <p className="text-gray-300">
              Nhập tên và số điện thoại để quay nhận ngay <strong className="text-rose-400">Voucher giảm giá & Quà tặng lụa</strong> từ Henr.Studio!
            </p>

            {/* The SVG Wheel */}
            <div className="relative w-64 h-64 mx-auto my-2 select-none">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse" />

              {/* Indicator Arrow at Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 filter drop-shadow-md" />
              </div>

              {/* Spinning Wheel */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full overflow-hidden relative shadow-2xl transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {SLICES.map((slice, i) => {
                    const angle = 360 / SLICES.length;
                    const startAngle = (i * angle * Math.PI) / 180;
                    const endAngle = (((i + 1) * angle) * Math.PI) / 180;

                    const x1 = 50 + 50 * Math.cos(startAngle);
                    const y1 = 50 + 50 * Math.sin(startAngle);
                    const x2 = 50 + 50 * Math.cos(endAngle);
                    const y2 = 50 + 50 * Math.sin(endAngle);

                    const midAngle = ((i + 0.5) * angle * Math.PI) / 180;
                    const textX = 50 + 32 * Math.cos(midAngle);
                    const textY = 50 + 32 * Math.sin(midAngle);

                    return (
                      <g key={slice.code}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={slice.color}
                          stroke="#111827"
                          strokeWidth="0.8"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill={slice.textColor}
                          fontSize="4"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${(i + 0.5) * angle + 90}, ${textX}, ${textY})`}
                        >
                          {slice.label.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center Hub */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gray-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-inner z-10">
                  <Gift size={16} />
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-2 max-w-xs mx-auto text-left">
              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Họ và tên của bạn:</label>
                <div className="relative">
                  <User size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Ví dụ: Hoàng Mai"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={spinning}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Số điện thoại nhận mã:</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0988 123 456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={spinning}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              {error && <p className="text-rose-400 text-[11px] text-center">{error}</p>}

              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="w-full btn bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>{spinning ? "Đang quay may mắn..." : "QUAY NGAY (100% TRÚNG QUÀ)"}</span>
              </button>
            </div>
          </>
        ) : (
          /* Winning State */
          <div className="py-4 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 animate-bounce">
              <Trophy size={32} />
            </div>

            <div className="space-y-1">
              <span className="text-amber-400 font-semibold tracking-wider uppercase text-xs">Chúc mừng bạn {name}! 🎉</span>
              <h3 className="text-xl font-extrabold text-white">{winner.label}</h3>
              <p className="text-gray-400 text-xs">{winner.desc}</p>
            </div>

            <div className="bg-gray-800/80 p-3.5 rounded-xl border border-dashed border-rose-500/60 max-w-xs mx-auto">
              <p className="text-[11px] text-gray-400 mb-1">Mã voucher may mắn của bạn:</p>
              <div className="font-mono font-black text-lg text-rose-400 tracking-widest bg-gray-900 py-1 px-3 rounded-lg border border-gray-700">
                {winner.code}
              </div>
              <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center justify-center gap-1">
                <Check size={12} /> Đã sẵn sàng áp dụng vào giỏ hàng
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="btn bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <span>Áp dụng vào giỏ hàng ngay</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
