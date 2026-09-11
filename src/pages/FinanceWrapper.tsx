import { useState } from "react";
import Finance from "./Finance";
import Analytics from "./Analytics";
import { DollarSign, BarChart3 } from "lucide-react";

export default function FinanceWrapper() {
  const [activeTab, setActiveTab] = useState<"finance" | "analytics">("finance");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-800">
        <button onClick={() => setActiveTab("finance")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "finance" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}>
          <DollarSign size={16} /> Dòng tiền & P&L
        </button>
        <button onClick={() => setActiveTab("analytics")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "analytics" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}>
          <BarChart3 size={16} /> Phân tích & Báo cáo
        </button>
      </div>
      <div className="pt-2">
        {activeTab === "finance" ? <Finance /> : <Analytics />}
      </div>
    </div>
  );
}
