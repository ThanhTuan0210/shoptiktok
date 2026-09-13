import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import LiveStudio from "./pages/LiveStudio";
import Inventory from "./pages/Inventory";
import OrdersWrapper from "./pages/OrdersWrapper";
import FinanceWrapper from "./pages/FinanceWrapper";
import IssuesWrapper from "./pages/IssuesWrapper";
import Customers from "./pages/Customers";
import Partners from "./pages/Partners";
import Settings from "./pages/Settings";
import Storefront from "./pages/Storefront";
import TrackOrder from "./pages/TrackOrder";
import { db } from "./db/database";
import { seedDatabase, PRODUCTS } from "./utils/seedData";
import productImages from "./product_images.json";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const count = await db.products.count();
        if (count === 0) {
          await seedDatabase();
        }

        // Clean legacy data if exists
        let currentProducts = await db.products.toArray();
        const hasOldData = currentProducts.some(p => p.sku.startsWith("AT-") || p.sku.startsWith("ASM-") || p.sku.startsWith("QJ-"));
        if (hasOldData) {
          await db.delete();
          window.location.reload();
          return;
        }

        // Self-heal corrupted product names if any
        const hasBadName = currentProducts.some(p => /[\u00C3\u00C2\u00E1\u00C4][\x80-\xbf]/.test(p.name) || /[\u00C3\u00C2\u00E1\u00C4][\x80-\xbf]/.test(p.category || ""));
        if (hasBadName && PRODUCTS) {
          for (const p of currentProducts) {
            const seed = PRODUCTS.find(s => s.sku === p.sku);
            if (seed) {
              await db.products.update(p.id, {
                name: seed.name,
                category: seed.category,
              });
            }
          }
          currentProducts = await db.products.toArray();
        }

        // Assign clean local product photos for all 13 products
        const imgMap = productImages as Record<string, { main: string; extra: string[] }>;

        for (const p of currentProducts) {
          const imgData = imgMap[p.sku];
          if (imgData) {
            const needsUpdate = p.imageUrl !== imgData.main
              || JSON.stringify(p.additionalImages || []) !== JSON.stringify(imgData.extra);
            if (needsUpdate) {
              await db.products.update(p.id, {
                imageUrl: imgData.main,
                additionalImages: imgData.extra,
              });
            }
          }
        }
      } catch (err) {
        console.error("App init error:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#030712", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #f43f5e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: "14px", fontFamily: "sans-serif" }}>Đang tải Henr.Studio...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* Customer Storefront (Full screen) */}
      <Route path="/shop" element={<Storefront />} />
      <Route path="/track" element={<TrackOrder />} />

      {/* Admin Panel */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
      <Route path="/orders" element={<Layout><OrdersWrapper /></Layout>} />
      <Route path="/live" element={<Layout><LiveStudio /></Layout>} />
      <Route path="/shipping" element={<Navigate to="/orders" replace />} />
      <Route path="/finance" element={<Layout><FinanceWrapper /></Layout>} />
      <Route path="/analytics" element={<Navigate to="/finance" replace />} />
      <Route path="/issues" element={<Layout><IssuesWrapper /></Layout>} />
      <Route path="/returns" element={<Navigate to="/issues" replace />} />
      <Route path="/defective" element={<Navigate to="/issues" replace />} />
      <Route path="/customers" element={<Layout><Customers /></Layout>} />
      <Route path="/partners" element={<Layout><Partners /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
