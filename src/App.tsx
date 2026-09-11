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
import Storefront from "./pages/Storefront";
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
            // TÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng gÃƒÂ¡n Ã¡ÂºÂ£nh cho cÃƒÂ¡c sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m
      const prodImages: Record<string, string> = {
        "PJ-SOC-DEN-001": "https://images.unsplash.com/photo-1618683510526-7a8e7e1136b6?w=400&q=80",
        "PJ-SOC-HON-001": "https://images.unsplash.com/photo-1520108990525-4c014798c5ee?w=400&q=80",
        "PJ-SOC-NAU-001": "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&q=80",
        "PJ-TRON-XANH-001": "https://images.unsplash.com/photo-1584474775439-d3e9c60e4dc3?w=400&q=80",
        "PJ-TRON-HONG-001": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
        "PJ-TRON-TRANG-001": "https://images.unsplash.com/photo-1563178229-30790d93f7e1?w=400&q=80",
        "PJ-CARO-BE-001": "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=400&q=80",
        "PJ-CARO-DO-001": "https://images.unsplash.com/photo-1596001170757-0b1965b82098?w=400&q=80",
        "PJ-NGAN-MAT-001": "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=400&q=80",
        "VN-LUA-TRANG-001": "https://images.unsplash.com/photo-1591522967160-c976938d21db?w=400&q=80",
        "AC-LUA-CAOCAP-001": "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=400&q=80",
        "QUAN-PJ-RO-001": "https://images.unsplash.com/photo-1601614051010-8dc0244400e9?w=400&q=80",
        "GIFT-COUPLE-001": "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&q=80"
      };
      
      const currentProducts = await db.products.toArray();
      let hasUpdates = false;
      for (const p of currentProducts) {
        if (!p.imageUrl && prodImages[p.sku]) {
          await db.products.update(p.id, { imageUrl: prodImages[p.sku] });
          hasUpdates = true;
        }
      }
      
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
          <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>Ã„Âang khÃ¡Â»Å¸i Ã„â€˜Ã¡Â»â„¢ng hÃ¡Â»â€¡ thÃ¡Â»â€˜ng...</p>
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
