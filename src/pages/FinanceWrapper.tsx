import { useState, useEffect } from "react";
import Finance from "./Finance";
import Analytics from "./Analytics";
import OrderProfitReport from "../components/ui/OrderProfitReport";
import { DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { db } from "../db/database";
import type { Order } from "../types";

export default function FinanceWrapper() {
  const [activeTab, setActiveTab] = useState<"finance" | "profit" | "analytics">("finance");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    db.orders.toArray().then(setOrders);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-800 flex-wrap">
        <button
          onClick={() => setActiveTab("finance")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "finance" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <DollarSign size={16} /> Dòng tiền & Sổ quỹ
        </button>
        <button
          onClick={() => setActiveTab("profit")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "profit" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <TrendingUp size={16} /> Lãi/Lỗ Từng Đơn (P&L)
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "analytics" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BarChart3 size={16} /> Phân tích & Báo cáo
        </button>
      </div>
      <div className="pt-2">
        {activeTab === "finance" && <Finance />}
        {activeTab === "profit" && <OrderProfitReport orders={orders} />}
        {activeTab === "analytics" && <Analytics />}
      </div>
    </div>
  );
}
