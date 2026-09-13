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
import TrackOrder from "./pages/TrackOrder";
import { seedDatabase } from "./utils/seedData";
import { db } from "./db/database";

// Bá»™ áº£nh Unsplash cháº¥t lÆ°á»£ng cao cho tá»«ng sáº£n pháº©m Pyjama Henr.Studio
// Má»—i sáº£n pháº©m cÃ³ 1 áº£nh chÃ­nh + 3 áº£nh phá»¥ (gÃ³c Ä‘á»™ khÃ¡c nhau)
const PRODUCT_IMAGES: Record<string, { main: string; extra: string[] }> = {
  "PJ-SOC-DEN-001": {
    main: "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1618683510526-7a8e7e1136b6?w=600&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85",
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=85",
    ]
  },
  "PJ-SOC-HON-001": {
    main: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1520108990525-4c014798c5ee?w=600&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=85",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=85",
    ]
  },
  "PJ-SOC-NAU-001": {
    main: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1434389673259-22a466453b0e?w=600&q=85",
      "https://images.unsplash.com/photo-1550614000-4b95d466f272?w=600&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85",
    ]
  },
  "PJ-SOC-XAN-001": {
    main: "https://images.unsplash.com/photo-1584474775439-d3e9c60e4dc3?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1617952739526-6f69b8d4b0c0?w=600&q=85",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=85",
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=600&q=85",
    ]
  },
  "PJ-TRON-001": {
    main: "https://images.unsplash.com/photo-1591522967160-c976938d21db?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1563178229-30790d93f7e1?w=600&q=85",
      "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=600&q=85",
      "https://images.unsplash.com/photo-1585233210069-8a09ef295d73?w=600&q=85",
    ]
  },
  "PJ-TRON-COT-001": {
    main: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=85",
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=600&q=85",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=85",
    ]
  },
  "PJ-CARO-001": {
    main: "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85",
      "https://images.unsplash.com/photo-1566479179817-1bc73ca57a71?w=600&q=85",
    ]
  },
  "PJ-CARO-FLA-001": {
    main: "https://images.unsplash.com/photo-1566479179817-1bc73ca57a71?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600&q=85",
      "https://images.unsplash.com/photo-1563234907-7e61eec3be3b?w=600&q=85",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=85",
    ]
  },
  "PJ-NGAN-001": {
    main: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=600&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=85",
    ]
  },
  "VN-LUA-001": {
    main: "https://images.unsplash.com/photo-1616880098083-957b1ef4d3bb?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1591522967160-c976938d21db?w=600&q=85",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85",
    ]
  },
  "AC-LONG-001": {
    main: "https://images.unsplash.com/photo-1585255474320-b4bdc285e687?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1434389673259-22a466453b0e?w=600&q=85",
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=85",
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=85",
    ]
  },
  "QP-LUA-001": {
    main: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=85",
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=600&q=85",
      "https://images.unsplash.com/photo-1550614000-4b95d466f272?w=600&q=85",
    ]
  },
  "GIFT-SET-001": {
    main: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&q=85",
    extra: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600&q=85",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=85",
    ]
  },
};

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

      // GÃ¡n áº£nh cháº¥t lÆ°á»£ng cao cho táº¥t cáº£ sáº£n pháº©m (ká»ƒ cáº£ Ä‘Ã£ cÃ³ áº£nh cÅ©)
      const currentProducts = await db.products.toArray();
      for (const p of currentProducts) {
        const imgData = PRODUCT_IMAGES[p.sku];
        if (imgData) {
          const needsUpdate = p.imageUrl !== imgData.main
            || JSON.stringify(p.additionalImages) !== JSON.stringify(imgData.extra);
          if (needsUpdate) {
            await db.products.update(p.id, {
              imageUrl: imgData.main,
              additionalImages: imgData.extra,
            });
          }
        } else if (!p.imageUrl) {
          // Fallback cho sáº£n pháº©m chÆ°a cÃ³ áº£nh
          await db.products.update(p.id, {
            imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85",
          });
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
          <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>Äang khá»Ÿi Ä‘á»™ng há»‡ thá»‘ng...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/shop" element={<Storefront />} />
      <Route path="/track" element={<TrackOrder />} />
      <Route path="/*" element={
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
      } />
    </Routes>
  );
}
