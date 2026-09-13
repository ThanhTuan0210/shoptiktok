import { useState } from "react";
import Orders from "./Orders";
import Shipping from "./Shipping";
import { ShoppingCart, Truck } from "lucide-react";

export default function OrdersWrapper() {
  const [activeTab, setActiveTab] = useState<"all" | "shipping">("all");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "all"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <ShoppingCart size={16} /> Tất cả đơn hàng
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "shipping"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Truck size={16} /> Vận chuyển & Giao hàng
        </button>
      </div>
      <div className="pt-2">
        {activeTab === "all" ? <Orders /> : <Shipping />}
      </div>
    </div>
  );
}
