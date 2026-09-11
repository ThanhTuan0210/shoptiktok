import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import OrdersWrapper from "./pages/OrdersWrapper";
import FinanceWrapper from "./pages/FinanceWrapper";
import IssuesWrapper from "./pages/IssuesWrapper";
import Customers from "./pages/Customers";
import Partners from "./pages/Partners";
import Settings from "./pages/Settings";
import { seedDatabase } from "./utils/seedData";
import { db } from "./db/database";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const prod = await db.products.toArray();
      const hasOldData = prod.some(p => p.sku.startsWith("AT-") || p.sku.startsWith("ASM-") || p.sku.startsWith("QJ-"));
      if (hasOldData) {
        await db.delete();
        window.location.reload();
        return;
      }
      await seedDatabase();
      setReady(true);
    }
    init().catch(console.error);
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#030712", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #f43f5e, #e879a0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontWeight: "bold", fontSize: "22px", fontStyle: "italic", fontFamily: "Georgia, serif" }}>H</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "white", fontWeight: "bold", fontSize: "18px", fontStyle: "italic", fontFamily: "Georgia, serif" }}>Henr.Studio</p>
          <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        
        {/* Merged Routes */}
        <Route path="/orders" element={<OrdersWrapper />} />
        <Route path="/shipping" element={<Navigate to="/orders" replace />} />
        
        <Route path="/finance" element={<FinanceWrapper />} />
        <Route path="/analytics" element={<Navigate to="/finance" replace />} />
        
        <Route path="/issues" element={<IssuesWrapper />} />
        <Route path="/returns" element={<Navigate to="/issues" replace />} />
        <Route path="/defective" element={<Navigate to="/issues" replace />} />
        
        {/* New Routes */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/partners" element={<Partners />} />
        
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
