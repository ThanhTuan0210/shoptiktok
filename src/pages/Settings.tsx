import { useEffect, useState } from "react";
import { db } from "../db/database";
import type { SecurityConfig, AppSettings, PromoSettings, WebShieldSettings, PaymentGatewayConfig, CourierConfig, SupabaseSyncConfig, TikTokBridgeConfig } from "../types";
import { DEFAULT_SECURITY_CONFIG, DEFAULT_PROMO_SETTINGS, DEFAULT_WEBSHIELD_SETTINGS, DEFAULT_PAYMENT_GATEWAY_CONFIG, DEFAULT_COURIER_CONFIG, DEFAULT_SUPABASE_SYNC_CONFIG, DEFAULT_TIKTOK_BRIDGE_CONFIG } from "../types";
import { Settings as SettingsIcon, Save, Lock, Download, Upload, Trash2, Database, ShieldCheck, Banknote, Gift, Ticket, Sparkles, Percent, Bell, Truck, Cloud, Video, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { testSupabaseConnection, generateSupabaseSQLSchema, performFullTwoWaySync } from "../services/supabaseSync";
import { exportDatabaseBackup } from "../utils/exportData";


const defaultSettings: AppSettings = {
  shopName: "Henr.Studio",
  currency: "VND",
  tiktokFeeRate: 1.8,
  lowStockDefault: 10,
  shippingCostPerOrder: 25000,
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbStats, setDbStats] = useState({ products: 0, orders: 0, returns: 0, expenses: 0, movements: 0 });
  const [resetting, setResetting] = useState(false);

  // Bank settings from localStorage
  const [bankName, setBankName] = useState(localStorage.getItem("tt_bankName") || "Vietcombank");
  const [bankAccount, setBankAccount] = useState(localStorage.getItem("tt_bankAccount") || "1234567890");
  const [bankOwner, setBankOwner] = useState(localStorage.getItem("tt_bankOwner") || "NGUYEN VAN A");
  const [shopPhone, setShopPhone] = useState(localStorage.getItem("tt_shopPhone") || "0988 234 567");
  const [adminPin, setAdminPin] = useState(localStorage.getItem("tt_adminPin") || "1234");
  const [staffPin, setStaffPin] = useState(localStorage.getItem("tt_staffPin") || "0000");
  const [autoLockMinutes, setAutoLockMinutes] = useState(localStorage.getItem("tt_autoLockMinutes") || "15");
  const [lastBackupDate, setLastBackupDate] = useState(localStorage.getItem("tt_lastBackupDate") || "");
  const [safeWipeInput, setSafeWipeInput] = useState("");
  const [showSafeWipeModal, setShowSafeWipeModal] = useState(false);
    const [zaloPhone, setZaloPhone] = useState(localStorage.getItem("tt_zaloPhone") || "0988 234 567");
    const [webShieldSettings, setWebShieldSettings] = useState<WebShieldSettings>(() => {
    try {
      const saved = localStorage.getItem("tt_webShield");
      if (saved) return { ...DEFAULT_WEBSHIELD_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WEBSHIELD_SETTINGS;
  });

  const toggleWebShield = (key: keyof WebShieldSettings) => {
    setWebShieldSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("tt_webShield", JSON.stringify(updated));
      return updated;
    });
  };

  // Enterprise: Payment Gateway (SePay)
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_paymentGateway");
      if (saved) return { ...DEFAULT_PAYMENT_GATEWAY_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PAYMENT_GATEWAY_CONFIG;
  });

  // Enterprise: Courier Gateway (GHN)
  const [courierConfig, setCourierConfig] = useState<CourierConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_courierConfig");
      if (saved) return { ...DEFAULT_COURIER_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_COURIER_CONFIG;
  });

  // Enterprise: Supabase Sync
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseSyncConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_supabaseConfig");
      if (saved) return { ...DEFAULT_SUPABASE_SYNC_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SUPABASE_SYNC_CONFIG;
  });
  const [supabaseTestResult, setSupabaseTestResult] = useState<string | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Enterprise: TikTok Bridge
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_securityConfig");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.maxOrdersPerWindow === 2) parsed.maxOrdersPerWindow = 5;
        return { ...DEFAULT_SECURITY_CONFIG, ...parsed };
      }
    } catch {}
    return DEFAULT_SECURITY_CONFIG;
  });

  const updateSecurity = (partial: Partial<SecurityConfig>) => {
    const updated = { ...securityConfig, ...partial };
    setSecurityConfig(updated);
    localStorage.setItem("tt_securityConfig", JSON.stringify(updated));
  };

  const [tiktokBridge, setTiktokBridge] = useState<TikTokBridgeConfig>(() => {
    try {
      const saved = localStorage.getItem("tt_tiktokBridge");
      if (saved) return { ...DEFAULT_TIKTOK_BRIDGE_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_TIKTOK_BRIDGE_CONFIG;
  });

  const saveEnterpriseSettings = () => {
    localStorage.setItem("tt_paymentGateway", JSON.stringify(paymentConfig));
    localStorage.setItem("tt_courierConfig", JSON.stringify(courierConfig));
    localStorage.setItem("tt_supabaseConfig", JSON.stringify(supabaseConfig));
    localStorage.setItem("tt_tiktokBridge", JSON.stringify(tiktokBridge));
  };

  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    const res = await testSupabaseConnection(supabaseConfig);
    setTestingSupabase(false);
    setSupabaseTestResult(res.message);
  };

  const handleFullSync = async () => {
    setSyncingSupabase(true);
    setSyncSummary(null);
    try {
      const res = await performFullTwoWaySync(supabaseConfig);
      setSyncSummary(res.message);
      if (res.success) {
        setSupabaseTestResult("✓ Kết nối & Đồng bộ đám mây thành công!");
        loadStats();
      } else {
        setSupabaseTestResult("Lỗi: " + res.message);
      }
    } catch (e: any) {
      setSyncSummary("Lỗi đồng bộ: " + (e?.message || "Không xác định"));
    } finally {
      setSyncingSupabase(false);
    }
  };

  const [promoSettings, setPromoSettings] = useState<PromoSettings>(() => {
    try {
      const savedV2 = localStorage.getItem("tt_promoSettings_v2");
      if (savedV2) return { ...DEFAULT_PROMO_SETTINGS, ...JSON.parse(savedV2) };
      const oldSaved = localStorage.getItem("tt_promoSettings");
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        parsed.enableSocialProof = true;
        localStorage.setItem("tt_promoSettings_v2", JSON.stringify(parsed));
        return { ...DEFAULT_PROMO_SETTINGS, ...parsed, enableSocialProof: true };
      }
    } catch {}
    return DEFAULT_PROMO_SETTINGS;
  });

  const togglePromo = (key: keyof PromoSettings) => {
    setPromoSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("tt_promoSettings_v2", JSON.stringify(updated));
      localStorage.setItem("tt_promoSettings", JSON.stringify(updated));
      return updated;
    });
  };

  const applyPreset = (mode: "demo" | "all_on" | "all_off") => {
    let updated: PromoSettings;
    if (mode === "demo") {
      updated = {
        enableLuckyWheel: false,
        enableVoucher: false,
        enableUpsell: false,
        enableComboDiscount: false,
        enableSocialProof: true, // Giữ thông báo mua hàng ảo
      };
    } else if (mode === "all_on") {
      updated = {
        enableLuckyWheel: true,
        enableVoucher: true,
        enableUpsell: true,
        enableComboDiscount: true,
        enableSocialProof: true,
      };
    } else {
      updated = {
        enableLuckyWheel: false,
        enableVoucher: false,
        enableUpsell: false,
        enableComboDiscount: false,
        enableSocialProof: false,
      };
    }
    setPromoSettings(updated);
    localStorage.setItem("tt_promoSettings_v2", JSON.stringify(updated));
    localStorage.setItem("tt_promoSettings", JSON.stringify(updated));
  };

  useEffect(() => { loadSettings(); loadStats(); }, []);

  async function loadSettings() {
    const s = await db.settings.toArray();
    if (s.length > 0) {
      setSettings(s[0]);
    } else {
      const initialName = localStorage.getItem("tt_shopName") || "Henr.Studio";
      setSettings({ ...defaultSettings, shopName: initialName });
    }
  }

  async function loadStats() {
    const [p, o, r, e, m] = await Promise.all([
      db.products.count(), db.orders.count(), db.returns.count(),
      db.expenses.count(), db.stockMovements.count(),
    ]);
    setDbStats({ products: p, orders: o, returns: r, expenses: e, movements: m });
  }

  async function handleSave() {
    setSaving(true);
    const existing = await db.settings.toArray();
    if (existing.length > 0) {
      await db.settings.update(existing[0].id!, settings);
    } else {
      await db.settings.add(settings);
    }

    // Sync to localStorage for Storefront
    if (settings.shopName) localStorage.setItem("tt_shopName", settings.shopName);
    localStorage.setItem("tt_shopPhone", shopPhone);
    localStorage.setItem("tt_bankName", bankName);
    localStorage.setItem("tt_bankAccount", bankAccount);
    localStorage.setItem("tt_bankOwner", bankOwner);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExportBackup() {
    const [products, variants, orders, returns, defective, expenses, movements, settings2] = await Promise.all([
      db.products.toArray(), db.productVariants.toArray(), db.orders.toArray(),
      db.returns.toArray(), db.defectiveItems.toArray(), db.expenses.toArray(),
      db.stockMovements.toArray(), db.settings.toArray(),
    ]);
    exportDatabaseBackup({ products, productVariants: variants, orders, returns, defectiveItems: defective, expenses, stockMovements: movements, settings: settings2 });
      const nowStr = new Date().toLocaleDateString("vi-VN");
      localStorage.setItem("tt_lastBackupDate", nowStr);
      setLastBackupDate(nowStr);
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Import sẽ thay thế tất cả dữ liệu hiện tại bằng dữ liệu từ file backup. Tiếp tục?")) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.transaction("rw", [db.products, db.productVariants, db.orders, db.returns, db.defectiveItems, db.expenses, db.stockMovements, db.settings], async () => {
        await Promise.all([
          db.products.clear(), db.productVariants.clear(), db.orders.clear(),
          db.returns.clear(), db.defectiveItems.clear(), db.expenses.clear(),
          db.stockMovements.clear(), db.settings.clear(),
        ]);
        if (data.products) await db.products.bulkAdd(data.products);
        if (data.productVariants) await db.productVariants.bulkAdd(data.productVariants);
        if (data.orders) await db.orders.bulkAdd(data.orders);
        if (data.returns) await db.returns.bulkAdd(data.returns);
        if (data.defectiveItems) await db.defectiveItems.bulkAdd(data.defectiveItems);
        if (data.expenses) await db.expenses.bulkAdd(data.expenses);
        if (data.stockMovements) await db.stockMovements.bulkAdd(data.stockMovements);
        if (data.settings) await db.settings.bulkAdd(data.settings);
      });
      alert("Khôi phục dữ liệu thành công!");
      loadSettings();
      loadStats();
    } catch (err) {
      alert("Lỗi khi import file: " + err);
    }
    e.target.value = "";
  }

  async function handleResetData() {
    if (!confirm("CẢNH BÁO: XÓA TOÀN BỘ DỮ LIỆU? Hành động này không thể hoàn tác!")) return;
    if (!confirm("Xác nhận lần 2: Tất cả đơn hàng, kho, doanh thu sẽ bị xóa sạch và reset lại. Tiếp tục?")) return;
    setResetting(true);
    await db.delete();
    window.location.reload();
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="page-title">Cài đặt Hệ thống</h1>
        <p className="page-subtitle">Cấu hình thông tin cửa hàng, thanh toán và quản trị dữ liệu</p>
      </div>

      {/* Shop settings */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <SettingsIcon size={18} className="text-rose-400" /> Thông tin Cửa hàng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tên cửa hàng</label>
            <input className="input" value={settings.shopName} onChange={e => setSettings(p => ({ ...p, shopName: e.target.value }))} placeholder="VD: Henr.Studio" />
          </div>
          <div>
            <label className="label">Hotline / Zalo tư vấn</label>
            <input className="input" value={shopPhone} onChange={e => setShopPhone(e.target.value)} placeholder="VD: 0988 234 567" />
          </div>
          <div>
            <label className="label">Phí TikTok Shop (%)</label>
            <input type="number" step="0.1" className="input" value={settings.tiktokFeeRate} onChange={e => setSettings(p => ({ ...p, tiktokFeeRate: Number(e.target.value) }))} />
            <p className="text-xs text-gray-500 mt-1">Phí hoa hồng nền tảng TikTok (thường từ 1.8% - 3%)</p>
          </div>
          <div>
            <label className="label">Ngưỡng cảnh báo hết hàng (bộ)</label>
            <input type="number" className="input" value={settings.lowStockDefault} onChange={e => setSettings(p => ({ ...p, lowStockDefault: Number(e.target.value) }))} />
            <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ báo động khi tồn kho ≤ số này</p>
          </div>
        </div>
      </div>

            {/* TẦNG 1: Admin Security & Role-Based Access Control */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock size={18} className="text-amber-400" /> Bảo Mật, Phân Quyền & Mã PIN (Tầng 1)
          </h2>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
            ✓ 2 Lớp phân quyền kích hoạt
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Hệ thống hỗ trợ 2 mã PIN riêng biệt: Mã Chủ shop (xem toàn bộ tài chính, CRM) và Mã Nhân viên đóng gói (chỉ thấy Đơn hàng & Kho, ẩn hoàn toàn doanh thu).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label text-rose-400 font-semibold">Mã PIN Chủ Shop (Admin - Toàn quyền)</label>
            <input
              type="password"
              maxLength={4}
              className="input font-mono tracking-widest text-base border-rose-500/40 focus:ring-rose-500"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
            />
            <p className="text-[11px] text-gray-500 mt-1">Toàn quyền xem doanh thu, P&L, cài đặt</p>
          </div>

          <div>
            <label className="label text-amber-400 font-semibold">Mã PIN Nhân Viên Kho (Staff)</label>
            <input
              type="password"
              maxLength={4}
              className="input font-mono tracking-widest text-base border-amber-500/40 focus:ring-amber-500"
              value={staffPin}
              onChange={e => setStaffPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
            />
            <p className="text-[11px] text-gray-500 mt-1">Chỉ in vận đơn A6 và quét mã đóng gói</p>
          </div>

          <div>
            <label className="label text-blue-400 font-semibold">Tự động khóa màn hình (Auto-Lock)</label>
            <select
              value={autoLockMinutes}
              onChange={e => setAutoLockMinutes(e.target.value)}
              className="input text-xs"
            >
              <option value="5">Khóa sau 5 phút không dùng</option>
              <option value="15">Khóa sau 15 phút (Khuyên dùng)</option>
              <option value="30">Khóa sau 30 phút</option>
              <option value="0">Tắt tự động khóa</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1">Tự động khóa bảo vệ khi rời bàn làm việc</p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-800">
          <label className="label">Số Zalo CSKH tư vấn trên Web</label>
          <input
            className="input max-w-sm"
            value={zaloPhone}
            onChange={e => setZaloPhone(e.target.value)}
            placeholder="VD: 0988 234 567"
          />
        </div>
      </div>

      {/* Bank settings */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Banknote size={18} className="text-blue-400" /> Thông tin Tài khoản Ngân hàng (VietQR)
        </h2>
        <p className="text-xs text-gray-400">
          Thông tin này sẽ tự động tạo mã QR VietQR chuẩn để khách quét chuyển khoản khi đặt hàng trên Website.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Ngân hàng</label>
            <select className="input" value={bankName} onChange={e => setBankName(e.target.value)}>
              {["Vietcombank", "Techcombank", "MB Bank", "VPBank", "ACB", "BIDV", "Agribank", "Sacombank", "TPBank", "VietinBank"].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Số tài khoản</label>
            <input className="input" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="VD: 1234567890" />
          </div>
          <div>
            <label className="label">Tên chủ tài khoản</label>
            <input className="input" value={bankOwner} onChange={e => setBankOwner(e.target.value)} placeholder="VD: NGUYEN VAN A" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className={`btn-primary ${saved ? "bg-emerald-600 hover:bg-emerald-500" : ""}`}>
            <Save size={16} />
            {saving ? "Đang lưu..." : saved ? "✓ Đã lưu cài đặt!" : "Lưu tất cả cài đặt"}
          </button>
        </div>
      </div>

      
      {/* TẦNG 2: Lá Chắn Bảo Vệ Bản Quyền & Chống Copy (WebShield) */}
      <div className="card space-y-4 border-cyan-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-400" /> Lá Chắn Chống Copy & Bảo Vệ Bản Quyền (WebShield)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Bảo vệ nội dung, hình ảnh sản phẩm và mã nguồn khỏi bị sao chép hoặc soi code trên trang bán hàng Storefront.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full border " + (webShieldSettings.enableAntiCopy ? "bg-emerald-900/50 text-emerald-400 border-emerald-800" : "bg-gray-800 text-gray-400 border-gray-700")}>
              {webShieldSettings.enableAntiCopy ? "✓ Đang Kích Hoạt" : "Đang Tắt"}
            </span>
            <button
              type="button"
              onClick={() => toggleWebShield("enableAntiCopy")}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (webShieldSettings.enableAntiCopy ? "bg-cyan-600" : "bg-gray-700")}
              title="Bật/Tắt toàn bộ lá chắn chống copy"
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (webShieldSettings.enableAntiCopy ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Option 1: Anti Right Click & Image Drag */}
          <div className="p-3.5 rounded-xl border bg-gray-800/40 border-gray-800 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-200">
                Chặn Chuột Phải & Kéo Thả Ảnh
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Vô hiệu hóa menu chuột phải (Lưu hình ảnh, Sao chép) và khóa kéo thả ảnh sản phẩm ra máy tính. Vẫn cho phép dán SĐT/địa chỉ trong form.
              </p>
            </div>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded font-medium shrink-0">
              Tự động
            </span>
          </div>

          {/* Option 2: Block Shortcuts (F12 / Ctrl+U) */}
          <div className="p-3.5 rounded-xl border bg-gray-800/40 border-gray-800 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-200">
                Chặn Phím Tắt Soi Code (F12, Ctrl+U, Ctrl+Shift+I)
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Ngăn người ngoài nhấn phím tắt mở DevTools hoặc xem mã nguồn HTML của trang bán hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleWebShield("blockShortcuts")}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (webShieldSettings.blockShortcuts ? "bg-cyan-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (webShieldSettings.blockShortcuts ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Option 3: Warning Toast */}
          <div className="p-3.5 rounded-xl border bg-gray-800/40 border-gray-800 flex items-start justify-between gap-3 md:col-span-2">
            <div>
              <h4 className="text-xs font-bold text-gray-200">
                Hiển Thị Cảnh Báo Bản Quyền (Toast)
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Khi ai đó cố tình bấm chuột phải hoặc phím tắt F12, hiện thông báo nhắc nhở bản quyền lịch thiệp ở đầu trang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleWebShield("showToast")}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (webShieldSettings.showToast ? "bg-cyan-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (webShieldSettings.showToast ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>
      </div>

      {/* Marketing & Promotion Feature Toggles (Demo Mode Control) */}
      <div className="card space-y-4 border-rose-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-rose-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Gift size={18} className="text-rose-400" /> Cấu Hình Chiến Dịch Marketing & Khuyến Mãi (Chế Độ Demo)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Bật/Tắt các tính năng tặng quà, giảm giá, voucher. Khi đang chạy thử nghiệm hoặc bán bình thường, bạn có thể tắt để không ảnh hưởng đến doanh thu thực tế.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset("demo")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
              title="Tắt các khuyến mãi tài chính, giữ lại thông báo mua hàng kích thích doanh số"
            >
              Chế độ Demo (Giữ Thông Báo Mua Hàng)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("all_on")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition-colors"
            >
              Bật tất cả
            </button>
            <button
              type="button"
              onClick={() => applyPreset("all_off")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-colors"
            >
              Tắt toàn bộ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Toggle 1: Lucky Wheel */}
          <div className={"p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 " + (promoSettings.enableLuckyWheel ? "bg-rose-950/30 border-rose-500/40" : "bg-gray-800/40 border-gray-800")}>
            <div className="flex items-start gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (promoSettings.enableLuckyWheel ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-500")}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  Vòng Quay May Mắn (Lucky Wheel)
                  <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (promoSettings.enableLuckyWheel ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-gray-800 text-gray-400")}>
                    {promoSettings.enableLuckyWheel ? "Đang Bật" : "Đang Tắt (Ẩn)"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Hiển thị nút quay quà tặng 100% trúng thưởng & thu thập SĐT khách hàng ở góc màn hình.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePromo('enableLuckyWheel')}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (promoSettings.enableLuckyWheel ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (promoSettings.enableLuckyWheel ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Toggle 2: Vouchers */}
          <div className={"p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 " + (promoSettings.enableVoucher ? "bg-rose-950/30 border-rose-500/40" : "bg-gray-800/40 border-gray-800")}>
            <div className="flex items-start gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (promoSettings.enableVoucher ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-500")}>
                <Ticket size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  Mã Giảm Giá & Voucher (Vouchers)
                  <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (promoSettings.enableVoucher ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-gray-800 text-gray-400")}>
                    {promoSettings.enableVoucher ? "Đang Bật" : "Đang Tắt (Ẩn)"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Hiển thị ô nhập mã voucher trong giỏ hàng (VD: HENR30K, FREESHIP) để trừ tiền hóa đơn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePromo('enableVoucher')}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (promoSettings.enableVoucher ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (promoSettings.enableVoucher ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Toggle 3: Upsell Accessories */}
          <div className={"p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 " + (promoSettings.enableUpsell ? "bg-rose-950/30 border-rose-500/40" : "bg-gray-800/40 border-gray-800")}>
            <div className="flex items-start gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (promoSettings.enableUpsell ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-500")}>
                <Gift size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  Deal Sốc Mua Kèm Phụ Kiện (Upsell)
                  <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (promoSettings.enableUpsell ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-gray-800 text-gray-400")}>
                    {promoSettings.enableUpsell ? "Đang Bật" : "Đang Tắt (Ẩn)"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Gợi ý mua kèm Băng đô lụa (+19.000₫) và Túi giặt (+29.000₫) ngay trong bảng chọn size.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePromo('enableUpsell')}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (promoSettings.enableUpsell ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (promoSettings.enableUpsell ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Toggle 4: Combo 2 sets 5% */}
          <div className={"p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 " + (promoSettings.enableComboDiscount ? "bg-rose-950/30 border-rose-500/40" : "bg-gray-800/40 border-gray-800")}>
            <div className="flex items-start gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (promoSettings.enableComboDiscount ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-500")}>
                <Percent size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  Ưu Đãi Combo Giảm 5% Khi Mua 2 Bộ
                  <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (promoSettings.enableComboDiscount ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-gray-800 text-gray-400")}>
                    {promoSettings.enableComboDiscount ? "Đang Bật" : "Đang Tắt (Ẩn)"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tự động giảm thêm 5% tổng hóa đơn khi khách chọn từ 2 bộ pyjama trở lên.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePromo('enableComboDiscount')}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (promoSettings.enableComboDiscount ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (promoSettings.enableComboDiscount ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Toggle 5: Social Proof Realtime */}
          <div className={"p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 md:col-span-2 " + (promoSettings.enableSocialProof ? "bg-rose-950/30 border-rose-500/40" : "bg-gray-800/40 border-gray-800")}>
            <div className="flex items-start gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (promoSettings.enableSocialProof ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-500")}>
                <Bell size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  Thông Báo Đơn Hàng Mới (Social Proof Popup)
                  <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (promoSettings.enableSocialProof ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-gray-800 text-gray-400")}>
                    {promoSettings.enableSocialProof ? "Đang Bật" : "Đang Tắt (Ẩn)"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Hiện popup góc dưới màn hình thông báo đơn hàng mới ("Chị Lan vừa đặt Bộ Pyjama...") kích thích tâm lý đám đông.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePromo('enableSocialProof')}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (promoSettings.enableSocialProof ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (promoSettings.enableSocialProof ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ENTERPRISE SUITE: 4 PHÂN HỆ VẬN HÀNH THỰC TẾ             */}
      {/* ======================================================== */}

      {/* 1. CỔNG NGÂN HÀNG VIETQR TỰ ĐỘNG (SEPAY / PAYOS API) */}
      <div className="card space-y-4 border-emerald-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Banknote size={18} className="text-emerald-400" /> Cổng Đối Soát Ngân Hàng VietQR Tự Động (SePay API)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Tự động bắt biến động số dư tài khoản thật. Khi khách chuyển khoản đúng mã đơn, hệ thống tự động duyệt đơn sau 3 giây.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full border " + (paymentConfig.isAutoVerifyEnabled ? "bg-emerald-900/50 text-emerald-400 border-emerald-800" : "bg-gray-800 text-gray-400 border-gray-700")}>
              {paymentConfig.isAutoVerifyEnabled ? "✓ Tự Động Duyệt Tiền" : "Duyệt Thủ Công"}
            </span>
            <button
              type="button"
              onClick={() => {
                const updated = { ...paymentConfig, isAutoVerifyEnabled: !paymentConfig.isAutoVerifyEnabled };
                setPaymentConfig(updated);
                localStorage.setItem("tt_paymentGateway", JSON.stringify(updated));
              }}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (paymentConfig.isAutoVerifyEnabled ? "bg-emerald-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (paymentConfig.isAutoVerifyEnabled ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="label text-xs">Cổng đối soát</label>
            <select
              className="input text-xs"
              value={paymentConfig.provider}
              onChange={e => {
                const updated = { ...paymentConfig, provider: e.target.value as any };
                setPaymentConfig(updated);
                localStorage.setItem("tt_paymentGateway", JSON.stringify(updated));
              }}
            >
              <option value="sepay">SePay.vn (Khuyên dùng - MB, VCB, ACB, TPB...)</option>
              <option value="payos">PayOS Open Gateway</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label text-xs flex items-center justify-between">
              <span>SePay API Token</span>
              <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px]">
                Lấy token tại SePay.vn <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              className="input text-xs font-mono"
              placeholder="VD: SP_live_928194821a8c9b2..."
              value={paymentConfig.apiToken}
              onChange={e => {
                const updated = { ...paymentConfig, apiToken: e.target.value };
                setPaymentConfig(updated);
                localStorage.setItem("tt_paymentGateway", JSON.stringify(updated));
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. CỔNG KẾT NỐI BƯU CỤC GIAO VẬN (GHN API) */}
      <div className="card space-y-4 border-amber-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Truck size={18} className="text-amber-400" /> Cổng Kết Nối Bưu Cục Giao Vận (GHN Open API)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Bấm 1 nút bắn đơn sang bưu cục GHN/Viettel Post, tự động lấy mã vận đơn chính thức và in nhãn A6 chuẩn quy cách.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full border " + (courierConfig.isSandbox ? "bg-amber-950/60 text-amber-400 border-amber-800" : "bg-emerald-950/60 text-emerald-400 border-emerald-800")}>
              {courierConfig.isSandbox ? "Môi Trường Sandbox (Test)" : "Môi Trường Thật (Production)"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="label text-xs">Đơn vị vận chuyển</label>
            <select
              className="input text-xs"
              value={courierConfig.provider}
              onChange={e => {
                const updated = { ...courierConfig, provider: e.target.value as any };
                setCourierConfig(updated);
                localStorage.setItem("tt_courierConfig", JSON.stringify(updated));
              }}
            >
              <option value="ghn">Giao Hàng Nhanh (GHN)</option>
              <option value="viettelpost">Viettel Post</option>
              <option value="ghtk">Giao Hàng Tiết Kiệm (GHTK)</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">GHN Shop ID</label>
            <input
              className="input text-xs font-mono"
              placeholder="VD: 192841"
              value={courierConfig.shopId}
              onChange={e => {
                const updated = { ...courierConfig, shopId: e.target.value };
                setCourierConfig(updated);
                localStorage.setItem("tt_courierConfig", JSON.stringify(updated));
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label text-xs flex items-center justify-between">
              <span>GHN API Token</span>
              <a href="https://sso.ghn.vn" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-1 text-[11px]">
                Lấy token tại sso.ghn.vn <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              className="input text-xs font-mono"
              placeholder="VD: 82a941-8219-410b-..."
              value={courierConfig.apiToken}
              onChange={e => {
                const updated = { ...courierConfig, apiToken: e.target.value };
                setCourierConfig(updated);
                localStorage.setItem("tt_courierConfig", JSON.stringify(updated));
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. ĐỒNG BỘ ĐÁM MÂY ĐA THIẾT BỊ (SUPABASE CLOUD SYNC) */}
      <div className="card space-y-4 border-indigo-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cloud size={18} className="text-indigo-400" /> Đồng Bộ Đám Mây Đa Thiết Bị (Supabase PostgreSQL)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Đồng bộ dữ liệu thời gian thực (Realtime) giữa máy chủ shop ở nhà, máy nhân viên CSKH và máy quét kho.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleFullSync}
              disabled={syncingSupabase || testingSupabase}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Đẩy tất cả đơn hàng & kho hàng từ máy lên đám mây, và kéo đơn mới về"
            >
              <RefreshCw size={13} className={syncingSupabase ? "animate-spin" : ""} />
              {syncingSupabase ? "Đang đồng bộ..." : "🚀 Đồng bộ 2 chiều ngay"}
            </button>
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={testingSupabase ? "animate-spin" : ""} />
              {testingSupabase ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
            </button>
          </div>
        </div>

        {supabaseTestResult && (
          <div className={"p-3 rounded-xl border text-xs flex items-center gap-2 " + (supabaseTestResult.includes("thành công") ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-red-950/40 border-red-800 text-red-300")}>
            {supabaseTestResult.includes("thành công") ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{supabaseTestResult}</span>
          </div>
        )}

        {syncSummary && (
          <div className="p-3 rounded-xl border text-xs bg-indigo-950/40 border-indigo-700 text-indigo-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{syncSummary}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="label text-xs">Supabase Project URL</label>
            <input
              className="input text-xs font-mono"
              placeholder="VD: https://xyzcompany.supabase.co"
              value={supabaseConfig.supabaseUrl}
              onChange={e => {
                const updated = { ...supabaseConfig, supabaseUrl: e.target.value };
                setSupabaseConfig(updated);
                localStorage.setItem("tt_supabaseConfig", JSON.stringify(updated));
              }}
            />
          </div>
          <div>
            <label className="label text-xs">Supabase Anon Public Key</label>
            <input
              type="password"
              className="input text-xs font-mono"
              placeholder="VD: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseConfig.supabaseAnonKey}
              onChange={e => {
                const updated = { ...supabaseConfig, supabaseAnonKey: e.target.value };
                setSupabaseConfig(updated);
                localStorage.setItem("tt_supabaseConfig", JSON.stringify(updated));
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. CẦU NỐI KHÓA TỒN KHO AN TOÀN TIKTOK SHOP */}
      <div className="card space-y-4 border-rose-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-rose-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Video size={18} className="text-rose-400" /> Cầu Nối Khóa Tồn Kho An Toàn TikTok Shop Live
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Ngăn chặn bán vượt tồn kho (Overselling) khi đang livestream bùng nổ đơn hàng.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full border " + (tiktokBridge.autoLockLiveStock ? "bg-rose-900/50 text-rose-300 border-rose-800" : "bg-gray-800 text-gray-400 border-gray-700")}>
              {tiktokBridge.autoLockLiveStock ? "✓ Khóa Tồn Kho Đang Bật" : "Đang Tắt"}
            </span>
            <button
              type="button"
              onClick={() => {
                const updated = { ...tiktokBridge, autoLockLiveStock: !tiktokBridge.autoLockLiveStock };
                setTiktokBridge(updated);
                localStorage.setItem("tt_tiktokBridge", JSON.stringify(updated));
              }}
              className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (tiktokBridge.autoLockLiveStock ? "bg-rose-600" : "bg-gray-700")}
            >
              <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (tiktokBridge.autoLockLiveStock ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="label text-xs">Ngưỡng đệm tồn kho an toàn</label>
            <input
              type="number"
              min={1}
              className="input text-xs"
              value={tiktokBridge.safetyBufferStock}
              onChange={e => {
                const updated = { ...tiktokBridge, safetyBufferStock: Number(e.target.value) };
                setTiktokBridge(updated);
                localStorage.setItem("tt_tiktokBridge", JSON.stringify(updated));
              }}
            />
            <p className="text-[11px] text-gray-500 mt-1">Tự động khóa mua trên web khi kho ≤ số này</p>
          </div>
          <div>
            <label className="label text-xs">TikTok App Key</label>
            <input
              className="input text-xs font-mono"
              placeholder="VD: 6a82194..."
              value={tiktokBridge.appKey}
              onChange={e => {
                const updated = { ...tiktokBridge, appKey: e.target.value };
                setTiktokBridge(updated);
                localStorage.setItem("tt_tiktokBridge", JSON.stringify(updated));
              }}
            />
          </div>
          <div>
            <label className="label text-xs">TikTok Shop Cipher</label>
            <input
              className="input text-xs font-mono"
              placeholder="VD: VNLCZ8194..."
              value={tiktokBridge.shopCipher}
              onChange={e => {
                const updated = { ...tiktokBridge, shopCipher: e.target.value };
                setTiktokBridge(updated);
                localStorage.setItem("tt_tiktokBridge", JSON.stringify(updated));
              }}
            />
          </div>
        </div>
      </div>

      {/* Security, Anti-Spam & Competitor Defense Center */}
      <div className="card border-emerald-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              Trung Tâm An Ninh, Chống Spam & Phòng Vệ Đối Thủ
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Bảo vệ kho hàng khỏi bot spam đơn ảo, ngăn chặn đối thủ cào dữ liệu doanh số và bảo vệ bản quyền ảnh độc quyền.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/60">
            🛡️ Lá Chắn Đang Kích Hoạt
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toggle Rate Limit */}
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-gray-200">Chặn Bot Spam Đơn (Rate Limit)</p>
                <p className="text-[10px] text-gray-400">Tối đa {securityConfig.maxOrdersPerWindow || 5} đơn / {securityConfig.rateLimitWindowMinutes || 15} phút trên mỗi thiết bị</p>
              </div>
              <button
                type="button"
                onClick={() => updateSecurity({ enableRateLimit: !securityConfig.enableRateLimit })}
                className={"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (securityConfig.enableRateLimit ? "bg-emerald-600" : "bg-gray-700")}
              >
                <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (securityConfig.enableRateLimit ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>

            {/* Toggle Stock Masking */}
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-gray-200">Mặt Nạ Tồn Kho (Stock Masking)</p>
                <p className="text-[10px] text-gray-400">Ẩn số tồn thật khỏi đối thủ soi doanh thu</p>
              </div>
              <button
                type="button"
                onClick={() => updateSecurity({ enableStockMasking: !securityConfig.enableStockMasking })}
                className={"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (securityConfig.enableStockMasking ? "bg-emerald-600" : "bg-gray-700")}
              >
                <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (securityConfig.enableStockMasking ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>

            {/* Toggle Watermark */}
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-gray-200">Đóng Dấu Chìm Ảnh (Watermark)</p>
                <p className="text-[10px] text-gray-400">Chống trộm ảnh sản phẩm độc quyền</p>
              </div>
              <button
                type="button"
                onClick={() => updateSecurity({ enableWatermark: !securityConfig.enableWatermark })}
                className={"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out " + (securityConfig.enableWatermark ? "bg-emerald-600" : "bg-gray-700")}
              >
                <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (securityConfig.enableWatermark ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label text-xs flex items-center justify-between">
                <span>Giới Hạn Đơn Chống Spam (Rate Limit)</span>
                <span className="text-emerald-400 font-bold font-mono text-[11px]">{securityConfig.maxOrdersPerWindow || 5} đơn / {securityConfig.rateLimitWindowMinutes || 15}p</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Số đơn tối đa:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="input text-xs font-mono"
                    value={securityConfig.maxOrdersPerWindow || 5}
                    onChange={e => updateSecurity({ maxOrdersPerWindow: Math.max(1, parseInt(e.target.value, 10) || 5) })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Trong khung giờ (phút):</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="input text-xs font-mono"
                    value={securityConfig.rateLimitWindowMinutes || 15}
                    onChange={e => updateSecurity({ rateLimitWindowMinutes: Math.max(1, parseInt(e.target.value, 10) || 15) })}
                    placeholder="15"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Mỗi thiết bị trình duyệt chỉ được đặt tối đa số đơn này trong khung giờ quy định.</p>
            </div>

            <div>
              <label className="label text-xs">Chữ Vân Chìm Watermark Phủ Trên Ảnh</label>
              <input
                className="input text-xs font-mono"
                value={securityConfig.watermarkText}
                onChange={e => updateSecurity({ watermarkText: e.target.value })}
                placeholder="VD: Henr.Studio • Thiết Kế Độc Quyền"
              />
              <p className="text-[10px] text-gray-400 mt-1">Watermark này tự động phủ chéo mờ trên mọi ảnh sản phẩm ở Storefront.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Ngưỡng Cảnh Báo Đơn COD Giá Trị Cao (VNĐ)</label>
              <input
                type="number"
                className="input text-xs font-mono"
                value={securityConfig.highValueCodThreshold}
                onChange={e => updateSecurity({ highValueCodThreshold: Number(e.target.value) || 500000 })}
                placeholder="500000"
              />
              <p className="text-[10px] text-gray-400 mt-1">Các đơn COD trên mức này sẽ tự động gắn cờ đỏ cảnh báo nhân viên gọi xác nhận.</p>
            </div>
          </div>

          <div>
            <label className="label text-xs flex items-center justify-between">
              <span>Danh Sách Đen Số Điện Thoại Bùng Hàng / Spam (Mỗi SĐT một dòng)</span>
              <span className="text-rose-400 text-[10px] font-bold font-mono">
                {securityConfig.phoneBlacklist.length} SĐT bị chặn/cảnh báo
              </span>
            </label>
            <textarea
              rows={3}
              className="input text-xs font-mono text-rose-300 bg-gray-900 border-rose-900/40 focus:border-rose-500"
              placeholder="0912345678&#10;0987654321&#10;0355123456"
              value={securityConfig.phoneBlacklist.join("\n")}
              onChange={e => {
                const list = e.target.value.split("\n").map(s => s.trim()).filter(Boolean);
                updateSecurity({ phoneBlacklist: list });
              }}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Khi số điện thoại nằm trong danh sách này đặt hàng, đơn hàng lập tức bị gắn cờ đỏ ⚠️ Cảnh báo bùng hàng trên danh sách đơn.
            </p>
          </div>
        </div>
      </div>

            {/* Database stats */}
      <div className="card">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <Database size={18} className="text-purple-400" /> Thống kê Cơ sở dữ liệu
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Sản phẩm", value: dbStats.products, color: "text-blue-400" },
            { label: "Đơn hàng", value: dbStats.orders, color: "text-emerald-400" },
            { label: "Đơn hoàn", value: dbStats.returns, color: "text-amber-400" },
            { label: "Chi phí", value: dbStats.expenses, color: "text-purple-400" },
            { label: "Biến động kho", value: dbStats.movements, color: "text-cyan-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="card">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <Download size={18} className="text-emerald-400" /> Sao lưu & Khôi phục Dữ liệu
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl">
            <Download size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-white text-sm">Xuất file sao lưu (Backup)</p>
              <p className="text-gray-400 text-xs mt-1">Tải về máy file JSON chứa toàn bộ dữ liệu đơn, kho, doanh thu. Dùng để lưu trữ an toàn hoặc chuyển máy khác.</p>
            </div>
            <button onClick={handleExportBackup} className="btn-success shrink-0 text-xs">
              <Download size={14} /> Tải file backup
            </button>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl">
            <Upload size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-white text-sm">Khôi phục từ file sao lưu</p>
              <p className="text-gray-400 text-xs mt-1">Nạp lại file JSON đã sao lưu trước đó để phục hồi dữ liệu vào hệ thống.</p>
            </div>
            <label className="btn-secondary shrink-0 cursor-pointer text-xs">
              <Upload size={14} /> Chọn file JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
            </label>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-900/50">
        <h2 className="text-base font-semibold text-red-400 flex items-center gap-2 mb-4">
          <Trash2 size={18} /> Vùng nguy hiểm
        </h2>
        <div className="flex items-start gap-4 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
          <Trash2 size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-white text-sm">Xóa toàn bộ dữ liệu và reset</p>
            <p className="text-gray-400 text-xs mt-1">Xóa toàn bộ dữ liệu hiện tại trong trình duyệt để đưa hệ thống về trạng thái ban đầu.</p>
          </div>
          <button onClick={handleResetData} disabled={resetting} className="btn-danger shrink-0 text-xs">
            <Trash2 size={14} /> {resetting ? "Đang xóa..." : "Xóa & Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
