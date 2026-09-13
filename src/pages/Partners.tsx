import { useState, useEffect } from "react";
import {
  UserCheck, Plus, Search, DollarSign, ExternalLink,
  Award, TrendingUp, CheckCircle, Edit2, Trash2
} from "lucide-react";
import { formatCurrency, formatNumber, generateId, today } from "../utils/helpers";
import Modal from "../components/ui/Modal";

interface Partner {
  id: string;
  name: string;
  tiktokHandle: string;
  phone: string;
  commissionRate: number; // e.g. 10 (%)
  ordersCount: number;
  revenueGenerated: number;
  paidCommission: number;
  status: "active" | "paused";
  createdAt: string;
  notes?: string;
}

const DEFAULT_PARTNERS: Partner[] = [
  {
    id: "kol-1",
    name: "Thuỳ Linh (Pyjama Review)",
    tiktokHandle: "@linh.pyjama",
    phone: "0982 112 334",
    commissionRate: 12,
    ordersCount: 148,
    revenueGenerated: 51600000,
    paidCommission: 5500000,
    status: "active",
    createdAt: "2026-08-01",
    notes: "Review video đạt 250k views, tỷ lệ chuyển đổi cao",
  },
  {
    name: "Mai Anh Fashion",
    id: "kol-2",
    tiktokHandle: "@maianh.ootd",
    phone: "0915 223 889",
    commissionRate: 10,
    ordersCount: 92,
    revenueGenerated: 32200000,
    paidCommission: 3000000,
    status: "active",
    createdAt: "2026-08-15",
    notes: "Gắn link giỏ hàng qua Livestream thứ 6 hàng tuần",
  },
  {
    id: "kol-3",
    name: "Huyền Trang Homewear",
    tiktokHandle: "@trang.homewear",
    phone: "0977 445 112",
    commissionRate: 10,
    ordersCount: 65,
    revenueGenerated: 22750000,
    paidCommission: 2275000,
    status: "active",
    createdAt: "2026-08-20",
    notes: "Chiến dịch Set Pyjama Satin mùa thu",
  },
];

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [formName, setFormName] = useState("");
  const [formHandle, setFormHandle] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRate, setFormRate] = useState(10);
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("henr_partners");
    if (raw) {
      try { setPartners(JSON.parse(raw)); return; } catch {}
    }
    setPartners(DEFAULT_PARTNERS);
    localStorage.setItem("henr_partners", JSON.stringify(DEFAULT_PARTNERS));
  }, []);

  const saveToStorage = (list: Partner[]) => {
    setPartners(list);
    localStorage.setItem("henr_partners", JSON.stringify(list));
  };

  const openAdd = () => {
    setEditingPartner(null);
    setFormName("");
    setFormHandle("");
    setFormPhone("");
    setFormRate(10);
    setFormNotes("");
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    setFormName(p.name);
    setFormHandle(p.tiktokHandle);
    setFormPhone(p.phone);
    setFormRate(p.commissionRate);
    setFormNotes(p.notes || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPartner) {
      const updated = partners.map(p => p.id === editingPartner.id ? {
        ...p,
        name: formName,
        tiktokHandle: formHandle,
        phone: formPhone,
        commissionRate: formRate,
        notes: formNotes,
      } : p);
      saveToStorage(updated);
    } else {
      const newP: Partner = {
        id: generateId(),
        name: formName,
        tiktokHandle: formHandle.startsWith("@") ? formHandle : `@${formHandle}`,
        phone: formPhone,
        commissionRate: formRate,
        ordersCount: 0,
        revenueGenerated: 0,
        paidCommission: 0,
        status: "active",
        createdAt: today(),
        notes: formNotes,
      };
      saveToStorage([newP, ...partners]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá đối tác này?")) return;
    saveToStorage(partners.filter(p => p.id !== id));
  };

  const handlePayCommission = (id: string) => {
    const p = partners.find(x => x.id === id);
    if (!p) return;
    const totalEarned = Math.round((p.revenueGenerated * p.commissionRate) / 100);
    const pending = Math.max(0, totalEarned - p.paidCommission);
    if (pending <= 0) {
      alert("Đối tác này đã được thanh toán đầy đủ hoa hồng!");
      return;
    }
    if (confirm(`Xác nhận thanh toán ${formatCurrency(pending)} hoa hồng cho ${p.name}?`)) {
      const updated = partners.map(x => x.id === id ? { ...x, paidCommission: totalEarned } : x);
      saveToStorage(updated);
    }
  };

  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return !search || p.name.toLowerCase().includes(q) || p.tiktokHandle.toLowerCase().includes(q) || p.phone.includes(search);
  });

  const totalRevenue = partners.reduce((s, p) => s + p.revenueGenerated, 0);
  const totalCommissionEarned = partners.reduce((s, p) => s + Math.round((p.revenueGenerated * p.commissionRate) / 100), 0);
  const totalCommissionPaid = partners.reduce((s, p) => s + p.paidCommission, 0);
  const totalPending = Math.max(0, totalCommissionEarned - totalCommissionPaid);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck size={22} className="text-rose-500" /> Đối tác & KOLs Affiliate
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Theo dõi doanh số KOC / Creator tiếp thị liên kết và đối soát thanh toán hoa hồng
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Thêm Đối Tác Mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Tổng Creator / KOL</span>
            <UserCheck size={16} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{partners.length} đối tác</p>
          <p className="text-[11px] text-gray-500 mt-1">Đang gắn giỏ hàng</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Doanh thu mang lại</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Từ link affiliate</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Tổng hoa hồng</span>
            <DollarSign size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalCommissionEarned)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Theo % doanh số chốt</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Hoa hồng còn nợ</span>
            <Award size={16} className="text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Cần đối soát thanh toán</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm theo tên KOL, kênh TikTok (@username), số điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">KOL / KOC Partner</th>
                <th className="py-3 px-4">Kênh TikTok</th>
                <th className="py-3 px-4 text-center">Tỷ lệ hoa hồng</th>
                <th className="py-3 px-4 text-center">Số đơn chốt</th>
                <th className="py-3 px-4 text-right">Doanh số tạo ra</th>
                <th className="py-3 px-4 text-right">Hoa hồng nhận</th>
                <th className="py-3 px-4 text-center">Trạng thái thanh toán</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-200">
              {filtered.map(p => {
                const earned = Math.round((p.revenueGenerated * p.commissionRate) / 100);
                const pending = Math.max(0, earned - p.paidCommission);
                const isFullyPaid = pending <= 0 && earned > 0;

                return (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{p.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://www.tiktok.com/${p.tiktokHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        {p.tiktokHandle} <ExternalLink size={12} />
                      </a>
                      {p.notes && <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[180px]">{p.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                        {p.commissionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-200">
                      {p.ordersCount} đơn
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatCurrency(p.revenueGenerated)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {formatCurrency(earned)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isFullyPaid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Còn nợ {formatCurrency(pending)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {pending > 0 && (
                          <button
                            onClick={() => handlePayCommission(p.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Xác nhận thanh toán hoa hồng"
                          >
                            Chi trả
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                          title="Sửa đối tác"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors"
                          title="Xoá"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={editingPartner ? "Chỉnh sửa thông tin Đối Tác" : "Thêm Creator / KOL Đối Tác Mới"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Họ tên Creator / KOL *</label>
              <input
                required
                className="input"
                placeholder="VD: Nguyễn Thuỳ Linh"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Username TikTok *</label>
                <input
                  required
                  className="input"
                  placeholder="VD: @linh.pyjama"
                  value={formHandle}
                  onChange={e => setFormHandle(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Số điện thoại / Zalo</label>
                <input
                  className="input"
                  placeholder="VD: 0982 112 334"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Tỷ lệ hoa hồng (%) *</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                className="input"
                value={formRate}
                onChange={e => setFormRate(Number(e.target.value))}
              />
              <p className="text-[11px] text-gray-500 mt-1">Thông thường thời trang TikTok từ 8% - 15%</p>
            </div>
            <div>
              <label className="label">Ghi chú chiến dịch / thỏa thuận</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="VD: Đăng 2 video review / tuần, gắn link bio..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingPartner ? "Lưu thay đổi" : "Thêm đối tác"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
