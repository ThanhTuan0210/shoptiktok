import { useState } from "react";
import { Flame, Clock, ShieldCheck, Tag, Plus } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

export default function ShopeeLive() {
  const [flashSaleSlots] = useState([
    { id: "fs-1", name: "Bộ vest công sở cao cấp Henr", originalPrice: 650000, salePrice: 489000, stock: 20, sold: 16, time: "12:00 - 14:00 (Hôm nay)" },
    { id: "fs-2", name: "Đầm xòe lụa tơ tằm thanh lịch", originalPrice: 420000, salePrice: 299000, stock: 35, sold: 28, time: "12:00 - 14:00 (Hôm nay)" },
    { id: "fs-3", name: "Áo sơ mi lụa công sở cao cấp", originalPrice: 320000, salePrice: 225000, stock: 50, sold: 44, time: "12:00 - 14:00 (Hôm nay)" },
    { id: "fs-4", name: "Quần âu nữ ống suông dáng dài", originalPrice: 380000, salePrice: 265000, stock: 25, sold: 19, time: "20:00 - 22:00 (Tối nay)" },
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Flame className="text-[#EE4D2D]" />
            Shopee Live & Flash Sale Khung Giờ Vàng
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Quản lý chiến dịch Flash Sale theo khung giờ và khóa an toàn tồn kho sản xuất may mặc.
          </p>
        </div>

        <button 
          onClick={() => alert("Chức năng tạo mới khung giờ Flash Sale Shopee đang được kết nối với API Marketing!")}
          className="px-4 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-md"
        >
          <Plus size={15} /> Thêm Sản Phẩm Flash Sale
        </button>
      </div>

      {/* Thông số Live & Safe Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-xs text-gray-400">Trạng Thái Shopee Live</span>
          <p className="text-xl font-black text-emerald-400 mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span> Sẵn Sàng Phát Sóng
          </p>
          <p className="text-xs text-gray-500 mt-1">Giao thức RTMP kết nối ứng dụng Shopee Live</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-xs text-gray-400">Khóa Kho Dự Phòng An Toàn</span>
          <p className="text-xl font-black text-white mt-2">5 bộ / biến thể</p>
          <p className="text-xs text-gray-500 mt-1">Tự động ngắt mở bán khi đạt ngưỡng giới hạn kho may</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-xs text-gray-400">Voucher Shopee Live Độc Quyền</span>
          <p className="text-xl font-black text-[#EE4D2D] mt-2">Giảm 15% tối đa 40K</p>
          <p className="text-xs text-gray-500 mt-1">Tự động gắn vào giỏ cam góc trái màn hình live</p>
        </div>
      </div>

      {/* Bảng danh sách Flash Sale */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-white text-sm mb-4">Sản Phẩm Đăng Ký Flash Sale Khung Giờ Vàng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashSaleSlots.map(item => (
            <div key={item.id} className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-xs">{item.name}</h4>
                  <span className="text-[11px] text-orange-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {item.time}
                  </span>
                </div>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                  -{Math.round((1 - item.salePrice / item.originalPrice) * 100)}%
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-[#EE4D2D]">{formatCurrency(item.salePrice)}</span>
                <span className="text-xs text-gray-500 line-through">{formatCurrency(item.originalPrice)}</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Đã bán: <strong>{item.sold}/{item.stock}</strong></span>
                  <span className="text-orange-400 font-bold">{Math.round((item.sold / item.stock) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#EE4D2D] h-full rounded-full transition-all" style={{ width: `${(item.sold / item.stock) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
