import { X, Ruler, CheckCircle2, Sparkles, HeartHandshake } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-[#fe2c55] to-rose-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Ruler size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Bảng Hướng Dẫn Chọn Size Chuẩn</h3>
              <p className="text-xs text-rose-100">Henr.Studio — Đồ ngủ Pyjama Lụa & Cotton cao cấp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-xs md:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-rose-50 text-gray-800 font-bold border-b border-rose-100">
                  <th className="py-3 px-3.5 text-center">Size</th>
                  <th className="py-3 px-3 text-center">Cân Nặng</th>
                  <th className="py-3 px-3 text-center">Chiều Cao</th>
                  <th className="py-3 px-3 text-center">Vòng Ngực</th>
                  <th className="py-3 px-3 text-center">Dài Quần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-rose-600 bg-rose-50/50">S</td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-900">40 – 48 kg</td>
                  <td className="py-3 px-3 text-center text-gray-600">1m50 – 1m58</td>
                  <td className="py-3 px-3 text-center text-gray-600">82 – 86 cm</td>
                  <td className="py-3 px-3 text-center text-gray-600">92 cm</td>
                </tr>
                <tr className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-rose-600 bg-rose-50/50">M</td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-900">48 – 55 kg</td>
                  <td className="py-3 px-3 text-center text-gray-600">1m55 – 1m62</td>
                  <td className="py-3 px-3 text-center text-gray-600">86 – 90 cm</td>
                  <td className="py-3 px-3 text-center text-gray-600">94 cm</td>
                </tr>
                <tr className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-rose-600 bg-rose-50/50">L</td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-900">55 – 62 kg</td>
                  <td className="py-3 px-3 text-center text-gray-600">1m60 – 1m68</td>
                  <td className="py-3 px-3 text-center text-gray-600">90 – 96 cm</td>
                  <td className="py-3 px-3 text-center text-gray-600">96 cm</td>
                </tr>
                <tr className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-rose-600 bg-rose-50/50">XL</td>
                  <td className="py-3 px-3 text-center font-semibold text-gray-900">62 – 70 kg</td>
                  <td className="py-3 px-3 text-center text-gray-600">1m65 – 1m75</td>
                  <td className="py-3 px-3 text-center text-gray-600">96 – 102 cm</td>
                  <td className="py-3 px-3 text-center text-gray-600">98 cm</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expert Advice */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <Sparkles size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-sm text-amber-950">Lời khuyên chọn size từ Henr.Studio:</p>
              <p>• Form dáng đồ ngủ được may theo chuẩn form suông rộng rãi thoải mái, không ôm bó.</p>
              <p>• Nếu số đo của bạn <strong>ở ranh giới giữa 2 size</strong> hoặc bạn thích mặc rộng thoải mái khi ngủ, hãy <strong>tăng lên 1 size</strong>.</p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="flex items-center gap-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
            <HeartHandshake size={18} className="text-emerald-600 shrink-0" />
            <span><strong>Cam kết hỗ trợ đổi size:</strong> Hỗ trợ đổi size miễn phí trong 7 ngày nếu không vừa vặn.</span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            Đã Hiểu, Quay Lại Chọn Mua
          </button>
        </div>
      </div>
    </div>
  );
}
