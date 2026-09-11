import { useState } from "react";
import Returns from "./Returns";
import Defective from "./Defective";
import Orders from "./Orders";
import { RotateCcw, AlertTriangle, XCircle } from "lucide-react";

export default function IssuesWrapper() {
  const [activeTab, setActiveTab] = useState<"returns" | "defective" | "cancelled">("cancelled");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-800">
        <button onClick={() => setActiveTab("cancelled")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "cancelled" ? "border-rose-500 text-rose-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}>
          <XCircle size={16} /> Đơn bị Hủy
        </button>
        <button onClick={() => setActiveTab("returns")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "returns" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}>
          <RotateCcw size={16} /> Yêu cầu Hoàn hàng
        </button>
        <button onClick={() => setActiveTab("defective")}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "defective" ? "border-amber-500 text-amber-400" : "border-transparent text-gray-400 hover:text-gray-200"
          }`}>
          <AlertTriangle size={16} /> Hàng lỗi (NSX/Kho)
        </button>
      </div>
      <div className="pt-2">
        {activeTab === "cancelled" && <Orders defaultFilter="cancelled" />}
        {activeTab === "returns" && <Returns />}
        {activeTab === "defective" && <Defective />}
      </div>
    </div>
  );
}
