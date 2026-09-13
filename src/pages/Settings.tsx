import { useEffect, useState } from "react";
import { db } from "../db/database";
import type { AppSettings } from "../types";
import { Settings as SettingsIcon, Save, Download, Upload, Trash2, Database, ShieldCheck, Banknote } from "lucide-react";
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
