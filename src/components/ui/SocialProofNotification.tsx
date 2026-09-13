import { useState, useEffect } from "react";
import { CheckCircle, X, ShoppingBag } from "lucide-react";

interface SocialProofNotificationProps {
  orders?: any[];
}

const SAMPLE_BUYERS = [
  { name: "Chị Ngọc Mai", city: "Hà Nội", product: "Bộ Pyjama Lụa Satin Trắng", timeAgo: "1 phút trước" },
  { name: "Chị Thu Trang", city: "TP. Hồ Chí Minh", product: "Bộ Pyjama Sọc Kẻ Đen Trắng", timeAgo: "3 phút trước" },
  { name: "Chị Bích Phương", city: "Đà Nẵng", product: "Bộ Pyjama Lụa Cao Cấp Đỏ Rượu", timeAgo: "5 phút trước" },
  { name: "Chị Hoàng Yến", city: "Hải Phòng", product: "Bộ Pyjama Cotton Thoáng Mát", timeAgo: "2 phút trước" },
  { name: "Chị Thảo My", city: "Cần Thơ", product: "Bộ Pyjama Sọc Kẻ Hồng Pastel", timeAgo: "7 phút trước" },
  { name: "Chị Khánh Linh", city: "Bình Dương", product: "Bộ Pyjama Trơn Cotton Thoải Mái", timeAgo: "4 phút trước" },
];

export default function SocialProofNotification({ orders = [] }: SocialProofNotificationProps) {
  const [current, setCurrent] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let timer: any;
    let cycleInterval: any;

    function showNext() {
      // Pick an order from real DB orders if available, else sample
      let item: any;
      if (orders && orders.length > 0) {
        const randOrder = orders[Math.floor(Math.random() * orders.length)];
        const firstName = randOrder.customerName ? randOrder.customerName.split(" ").slice(-2).join(" ") : "Khách yêu";
        const prodName = randOrder.items?.[0]?.productName || "Bộ Pyjama Lụa Satin Cao Cấp";
        const city = randOrder.customerAddress ? randOrder.customerAddress.split(",").pop()?.trim() || "Việt Nam" : "Hà Nội";
        item = {
          name: `Chị ${firstName}`,
          city: city,
          product: prodName,
          timeAgo: `${Math.floor(Math.random() * 8) + 1} phút trước`,
        };
      } else {
        item = SAMPLE_BUYERS[Math.floor(Math.random() * SAMPLE_BUYERS.length)];
      }

      setCurrent(item);
      setIsVisible(true);

      // Hide after 5.5s
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5500);
    }

    // First appearance after 4s
    const firstTimeout = setTimeout(() => {
      showNext();
      // Repeat every 18s
      cycleInterval = setInterval(showNext, 18000);
    }, 4000);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(timer);
      clearInterval(cycleInterval);
    };
  }, [orders, dismissed]);

  if (dismissed || !current || !isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 max-w-[340px] bg-white/95 backdrop-blur-md text-gray-800 rounded-2xl shadow-2xl p-3 border border-gray-100 flex items-center gap-3 transition-all duration-500 animate-fade-in"
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
        <ShoppingBag size={20} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
          <span className="truncate">{current.name}</span>
          <span className="text-[10px] font-normal text-gray-500 shrink-0">• {current.city}</span>
        </div>
        <p className="text-[11px] text-rose-600 font-medium truncate mt-0.5">
          Vừa đặt {current.product}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
          <CheckCircle size={10} className="text-emerald-500 shrink-0" />
          <span>{current.timeAgo} • Đã thanh toán</span>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        title="Đóng thông báo"
      >
        <X size={13} />
      </button>
    </div>
  );
}
