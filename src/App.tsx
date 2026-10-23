import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import Layout from "./components/layout/Layout";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { db } from "./db/database";
import { seedDatabase, PRODUCTS } from "./utils/seedData";
import { generateShopeeOrders } from "./utils/generateShopeeOrders";
import productImages from "./product_images.json";

// Code-split pages with React.lazy
const Storefront = lazy(() => import("./pages/Storefront"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LiveStudio = lazy(() => import("./pages/LiveStudio"));
const Inventory = lazy(() => import("./pages/Inventory"));
const OrdersWrapper = lazy(() => import("./pages/OrdersWrapper"));
const FinanceWrapper = lazy(() => import("./pages/FinanceWrapper"));
const IssuesWrapper = lazy(() => import("./pages/IssuesWrapper"));
const Customers = lazy(() => import("./pages/Customers"));
const Partners = lazy(() => import("./pages/Partners"));
const Settings = lazy(() => import("./pages/Settings"));
const ShopeeCenter = lazy(() => import("./pages/ShopeeCenter"));
const ShopeeOverview = lazy(() => import("./pages/shopee/ShopeeOverview"));
const ShopeeOrders = lazy(() => import("./pages/shopee/ShopeeOrders"));
const ShopeeSPX = lazy(() => import("./pages/shopee/ShopeeSPX"));
const ShopeeFinance = lazy(() => import("./pages/shopee/ShopeeFinance"));
const ShopeeLive = lazy(() => import("./pages/shopee/ShopeeLive"));
const ShopeeMarketing = lazy(() => import("./pages/shopee/ShopeeMarketing"));
const ShopeeChat = lazy(() => import("./pages/shopee/ShopeeChat"));
const OmniDashboard = lazy(() => import("./pages/OmniDashboard"));

// Loading spinner fallback for lazy components
function PageLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8">
      <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-500">Äang táº£i...</p>
    </div>
  );
}

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

        // Sync description and tiktokVideoUrl for all products
        if (PRODUCTS) {
          for (const p of currentProducts) {
            const seed = PRODUCTS.find(s => s.sku === p.sku) as any;
            if (seed) {
              const updates: any = {};
              if (!p.description || p.description !== seed.description) {
                updates.description = seed.description;
              }
              if (!p.tiktokVideoUrl || p.tiktokVideoUrl !== seed.tiktokVideoUrl) {
                updates.tiktokVideoUrl = seed.tiktokVideoUrl;
              }
              if (Object.keys(updates).length > 0) {
                await db.products.update(p.id, updates);
              }
            }
          }
        }

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
        // Self-heal return and cancel reasons for existing orders
        const allOrders = await db.orders.toArray();
        const allReturns = await db.returns.toArray();
        const returnsByOrderId = new Map(allReturns.map(r => [r.orderId, r]));

        const returnReasonsSample = ["wrong_size", "wrong_color", "not_as_described", "changed_mind", "defective"];
        const cancelReasonsSample = [
          "KhÃ¡ch Ä‘á»•i Ã½ khÃ´ng muá»‘n mua ná»¯a",
          "TrÃ¹ng Ä‘Æ¡n / KhÃ¡ch Ä‘áº·t nháº§m 2 láº§n",
          "KhÃ´ng liÃªn láº¡c Ä‘Æ°á»£c sá»‘ Ä‘iá»‡n thoáº¡i",
          "Thá»i gian giao dá»± kiáº¿n lÃ¢u",
        ];

        for (let i = 0; i < allOrders.length; i++) {
          const ord = allOrders[i];
          if ((ord.status === "returned" || ord.status === "return_requested") && !ord.returnReason) {
            const retRecord = returnsByOrderId.get(ord.id);
            const rReason = retRecord?.reason || returnReasonsSample[i % returnReasonsSample.length];
            await db.orders.update(ord.id, { returnReason: rReason });
          } else if (ord.status === "cancelled" && !ord.cancelReason) {
            const cReason = cancelReasonsSample[i % cancelReasonsSample.length];
            await db.orders.update(ord.id, { cancelReason: cReason });
          }
        }

        // Tự động kiểm tra và thêm 65 đơn hàng Shopee vào hệ thống
        const currentShopeeOrders = allOrders.filter(o => 
          o.channel === "shopee" || 
          Boolean(o.shopeeOrderId) || 
          (o.note || "").toLowerCase().includes("shopee")
        );
        if (currentShopeeOrders.length < 50) {
          const countToAdd = 65 - currentShopeeOrders.length;
          await generateShopeeOrders(Math.max(50, countToAdd));
          console.log(`[Shopee] Đã tự động nạp sẵn ${countToAdd} đơn hàng Shopee vào cơ sở dữ liệu.`);
        }

        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#030712", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #f43f5e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: "14px", fontFamily: "sans-serif" }}>Äang táº£i Henr.Studio...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Customer Storefront (Full screen) */}
          <Route path="/shop" element={<Storefront />} />
          <Route path="/track" element={<TrackOrder />} />

          {/* Admin Panel */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
          <Route path="/orders" element={<Layout><OrdersWrapper /></Layout>} />
<Route path="/shopee" element={<Layout><ShopeeOverview /></Layout>} />
          <Route path="/shopee/orders" element={<Layout><ShopeeOrders /></Layout>} />
          <Route path="/shopee/spx" element={<Layout><ShopeeSPX /></Layout>} />
          <Route path="/shopee/finance" element={<Layout><ShopeeFinance /></Layout>} />
          <Route path="/shopee/live" element={<Layout><ShopeeLive /></Layout>} />
          <Route path="/shopee/marketing" element={<Layout><ShopeeMarketing /></Layout>} />
          <Route path="/shopee/chat" element={<Layout><ShopeeChat /></Layout>} />
          <Route path="/omni-dashboard" element={<Layout><OmniDashboard /></Layout>} />
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
      </Suspense>
    </ErrorBoundary>
  );
}

