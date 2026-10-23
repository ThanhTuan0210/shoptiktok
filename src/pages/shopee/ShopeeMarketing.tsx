import { useState } from "react";
import { Tag, Plus, Copy, Check, Ticket, Gift } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

export default function ShopeeMarketing() {
  const [vouchers] = useState([
    { code: "HENRSHOPEE10", name: "Voucher Toàn Shop Giảm 10%", minOrder: 300000, discount: "10% tối đa 50K", used: 142, limit: 200, status: "active" },
    { code: "FREESHIPXTRA", name: "Gói Freeship Xtra Toàn Sàn", minOrder: 45000, discount: "Freeship 15K - 70K", used: 310, limit: 500, status: "active" },
    { code: "COMBO2GIAM5", name: "Mua 2 Giảm Thêm 5%", minOrder: 0, discount: "Giảm 5% khi mua 2 sản phẩm", used: 88, limit: 100, status: "active" },
    { code: "FOLLOWSHOP20K", name: "Mã Ưu Đãi Người Theo Dõi Mới", minOrder: 250000, discount: "Giảm 20K trực tiếp", used: 75, limit: 150, status: "active" },
  ]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="text-[#EE4D2D]" />
            Kênh Marketing & Voucher Shopee
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Thiết lập mã giảm giá toàn shop, combo khuyến mãi và chương trình theo dõi gian hàng.
          </p>
        </div>

        <button
          onClick={() => alert("Chức năng tạo Voucher mới đang kết nối với Trung Tâm Khuyến Mãi Shopee!")}
          className="px-4 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-md"
        >
          <Plus size={15} /> Tạo Mã Khuyến Mãi Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((v, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-base text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                  {v.code}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Đang diễn ra
                </span>
              </div>
              <h4 className="font-bold text-white text-sm mt-3">{v.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{v.discount} • Đơn tối thiểu {formatCurrency(v.minOrder)}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-500">
                Đã dùng: <strong className="text-white">{v.used}</strong> / {v.limit} lượt
              </span>
              <button 
                onClick={() => copyCode(v.code)}
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
              >
                {copiedCode === v.code ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check size={12} /> Đã chép</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy size={12} /> Sao chép</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
