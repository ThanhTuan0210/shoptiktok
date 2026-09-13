import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../db/database";
import type { Product, ProductVariant, StockMovement, StockMovementType } from "../types";
import {
  Package, Plus, TrendingUp, X, Edit2, ChevronDown, ChevronRight,
  Image as ImageIcon, Zap, AlertTriangle, CheckCircle2, XCircle, Video
} from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatDate, formatNumber, generateId, now, today, getStockMovementLabel } from "../utils/helpers";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  totalStock: number;
  lowStock: boolean;
  totalSold: number;
  totalRevenue: number;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Freesize"];
const CATEGORIES = [
  "Pyjama Sọc Kẻ", "Pyjama Trơn", "Pyjama Ca Rô",
  "Pyjama Ngắn Tay", "Váy Ngủ", "Áo Choàng",
  "Quần Pyjama", "Gift Set", "Khác"
];

const emptyProduct = {
  name: "", sku: "", category: CATEGORIES[0], costPrice: 0,
  sellingPrice: 0, lowStockThreshold: 10, description: "", tiktokVideoUrl: "",
  imageUrl: "", additionalImages: ["", "", ""]
};

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const queryStock = searchParams.get("stock"); // e.g. "low"

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState(queryStock === "low" ? "low" : "all");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showQuickRestock, setShowQuickRestock] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState<string | null>(null);
  const [showMovements, setShowMovements] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Quick Restock State
  const [quickRestockProduct, setQuickRestockProduct] = useState<string>("");
  const [quickRestockVariant, setQuickRestockVariant] = useState<string>("");
  const [quickRestockQty, setQuickRestockQty] = useState<number>(30);
  const [quickRestockCost, setQuickRestockCost] = useState<number>(0);
  const [quickRestockNote, setQuickRestockNote] = useState<string>("Nhập xưởng may");

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockMove, setStockMove] = useState({ type: "purchase" as StockMovementType, quantity: 1, unitCost: 0, note: "" });
  
  const [newProduct, setNewProduct] = useState({ ...emptyProduct, additionalImages: ["", "", ""] as string[] });
  const [newVariant, setNewVariant] = useState({ color: "", size: SIZES[2], stock: 0, sku: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadInventory(); }, []);

  useEffect(() => {
    if (queryStock === "low") {
      setStockFilter("low");
    }
  }, [queryStock]);

  async function loadInventory() {
    setLoading(true);
    const [prods, variants, movs, orders] = await Promise.all([
      db.products.toArray(),
      db.productVariants.toArray(),
      db.stockMovements.orderBy("date").reverse().limit(200).toArray(),
      db.orders.toArray()
    ]);
    
    const salesMap = new Map<string, { qty: number; revenue: number }>();
    orders.forEach(o => {
      if (o.status !== "cancelled" && o.status !== "returned") {
        o.items.forEach(i => {
          const curr = salesMap.get(i.productId) || { qty: 0, revenue: 0 };
          salesMap.set(i.productId, {
            qty: curr.qty + i.quantity,
            revenue: curr.revenue + (i.unitPrice * i.quantity)
          });
        });
      }
    });

    const data: ProductWithVariants[] = prods.map(p => {
      const pvs = variants.filter(v => v.productId === p.id);
      const totalStock = pvs.reduce((s, v) => s + v.stock, 0);
      const sales = salesMap.get(p.id) || { qty: 0, revenue: 0 };
      return {
        ...p, variants: pvs, totalStock,
        lowStock: totalStock <= p.lowStockThreshold,
        totalSold: sales.qty, totalRevenue: sales.revenue
      };
    });
    setProducts(data);
    setMovements(movs);
    setLoading(false);
  }

  function openAddProduct() {
    setEditingProductId(null);
    setNewProduct({ ...emptyProduct, additionalImages: ["", "", ""] });
    setShowAddProduct(true);
  }

  function openEditProduct(p: ProductWithVariants) {
    setEditingProductId(p.id);
    setNewProduct({
      name: p.name,
      sku: p.sku,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      lowStockThreshold: p.lowStockThreshold,
      description: p.description || "",
      tiktokVideoUrl: p.tiktokVideoUrl || "",
      imageUrl: p.imageUrl || "",
      additionalImages: [
        (p.additionalImages as string[])?.[0] || "",
        (p.additionalImages as string[])?.[1] || "",
        (p.additionalImages as string[])?.[2] || "",
      ]
    });
    setShowAddProduct(true);
  }

  function openQuickRestock() {
    if (products.length > 0) {
      const p = products[0];
      setQuickRestockProduct(p.id);
      setQuickRestockCost(p.costPrice);
      if (p.variants.length > 0) {
        setQuickRestockVariant(p.variants[0].id);
      } else {
        setQuickRestockVariant("");
      }
    }
    setShowQuickRestock(true);
  }

  const currentRestockProduct = useMemo(() => {
    return products.find(p => p.id === quickRestockProduct);
  }, [products, quickRestockProduct]);

  async function handleSaveQuickRestock() {
    if (!quickRestockVariant || quickRestockQty <= 0) {
      alert("Vui lòng chọn biến thể và số lượng nhập hợp lệ!");
      return;
    }
    setSaving(true);
    const v = await db.productVariants.get(quickRestockVariant);
    if (v) {
      await db.productVariants.update(v.id, {
        stock: v.stock + quickRestockQty
      });
      await db.stockMovements.add({
        id: generateId(),
        variantId: v.id,
        productId: v.productId,
        type: "purchase",
        quantity: quickRestockQty,
        unitCost: quickRestockCost,
        note: quickRestockNote || "Nhập hàng nhanh",
        date: today(),
        createdAt: now(),
      });
    }
    setSaving(false);
    setShowQuickRestock(false);
    loadInventory();
  }

  async function handleSaveProduct() {
    if (!newProduct.name || !newProduct.sku) return;
    setSaving(true);
    
    const cleanedAddImages = newProduct.additionalImages.filter(img => img.trim() !== "");
    const prodData = {
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      costPrice: newProduct.costPrice,
      sellingPrice: newProduct.sellingPrice,
      lowStockThreshold: newProduct.lowStockThreshold,
      description: newProduct.description,
      tiktokVideoUrl: newProduct.tiktokVideoUrl?.trim() || undefined,
      imageUrl: newProduct.imageUrl.trim() || undefined,
      additionalImages: cleanedAddImages,
      updatedAt: now(),
    };

    if (editingProductId) {
      await db.products.update(editingProductId, prodData);
    } else {
      await db.products.add({
        ...prodData,
        id: generateId(),
        isActive: true,
        createdAt: now(),
      });
    }
    
    setSaving(false);
    setShowAddProduct(false);
    setEditingProductId(null);
    setNewProduct({ ...emptyProduct, additionalImages: ["", "", ""] });
    loadInventory();
  }

  async function handleAddVariant() {
    if (!showAddVariant || !newVariant.color || !newVariant.size || !newVariant.sku) return;
    setSaving(true);
    const p = products.find(x => x.id === showAddVariant);
    if (!p) return;

    const variantId = generateId();
    await db.productVariants.add({
      id: variantId, productId: p.id,
      color: newVariant.color, size: newVariant.size, sku: newVariant.sku.toUpperCase(),
      stock: newVariant.stock, createdAt: now(),
    });

    if (newVariant.stock > 0) {
      await db.stockMovements.add({
        id: generateId(), variantId, productId: p.id,
        type: "purchase", quantity: newVariant.stock, unitCost: p.costPrice,
        note: "Nhập kho ban đầu", date: today(), createdAt: now(),
      });
    }

    setSaving(false);
    setShowAddVariant(null);
    setNewVariant({ color: "", size: SIZES[2], stock: 0, sku: "" });
    loadInventory();
  }

  async function handleStockMovement() {
    if (!selectedVariant || stockMove.quantity <= 0) return;
    setSaving(true);
    const qty = ["sale", "defective", "gift", "loss"].includes(stockMove.type)
      ? -Math.abs(stockMove.quantity)
      : Math.abs(stockMove.quantity);

    await db.stockMovements.add({
      id: generateId(), variantId: selectedVariant.id, productId: selectedVariant.productId,
      type: stockMove.type, quantity: qty, unitCost: stockMove.unitCost || undefined,
      note: stockMove.note, date: today(), createdAt: now(),
    });

    await db.productVariants.update(selectedVariant.id, {
      stock: Math.max(0, selectedVariant.stock + qty)
    });
    setSaving(false);
    setShowStockModal(false);
    setSelectedVariant(null);
    setStockMove({ type: "purchase", quantity: 1, unitCost: 0, note: "" });
    loadInventory();
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search
        || p.name.toLowerCase().includes(search.toLowerCase())
        || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchStock = stockFilter === "all"
        || (stockFilter === "low" && p.lowStock)
        || (stockFilter === "ok" && !p.lowStock && p.totalStock > 0)
        || (stockFilter === "zero" && p.totalStock === 0);
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const totalProds = products.length;
  const inStockCount = products.filter(p => p.totalStock > p.lowStockThreshold).length;
  const lowStockCount = products.filter(p => p.lowStock && p.totalStock > 0).length;
  const outOfStockCount = products.filter(p => p.totalStock === 0).length;
  const totalValue = products.reduce((s, p) => s + p.totalStock * p.costPrice, 0);

  const getStockClass = (stock: number, threshold: number) => {
    if (stock === 0) return "text-red-400";
    if (stock <= threshold) return "text-amber-400";
    return "text-emerald-400";
  };

  const updateAdditionalImage = (idx: number, val: string) => {
    const arr = [...newProduct.additionalImages];
    arr[idx] = val;
    setNewProduct(p => ({ ...p, additionalImages: arr }));
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sản phẩm &amp; Kho hàng</h1>
          <p className="page-subtitle">Quản lý danh sách sản phẩm, tồn kho theo màu/size và nhập xuất kho</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowMovements(true)} className="btn-secondary hidden sm:flex text-xs">
            <TrendingUp size={15} /> Lịch sử kho
          </button>
          <button onClick={openQuickRestock} className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm">
            <Zap size={15} /> Nhập hàng nhanh
          </button>
          <button onClick={openAddProduct} className="btn-primary text-xs">
            <Plus size={15} /> Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-blue-400">{formatNumber(products.length)}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng mẫu mã</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatNumber(products.reduce((s, p) => s + p.totalSold, 0))}</p>
          <p className="text-xs text-gray-400 mt-1">Đã bán toàn shop</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-amber-400">{formatNumber(lowStockCount + outOfStockCount)}</p>
          <p className="text-xs text-gray-400 mt-1">Cảnh báo tồn thấp / hết</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng giá trị tồn kho</p>
        </div>
      </div>

      {/* STOCK FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
        <button
          onClick={() => setStockFilter("all")}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            stockFilter === "all"
              ? "bg-rose-600 text-white border-rose-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700"
          }`}
        >
          Tất cả sản phẩm ({totalProds})
        </button>

        <button
          onClick={() => setStockFilter("ok")}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            stockFilter === "ok"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-emerald-300 hover:border-emerald-500/40"
          }`}
        >
          <CheckCircle2 size={13} /> Còn hàng ({inStockCount})
        </button>

        <button
          onClick={() => setStockFilter("low")}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            stockFilter === "low"
              ? "bg-amber-500 text-gray-950 font-bold border-amber-400 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-amber-300 hover:border-amber-500/40"
          }`}
        >
          <AlertTriangle size={13} /> Sắp hết hàng (&le;10) ({lowStockCount})
        </button>

        <button
          onClick={() => setStockFilter("zero")}
          className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
            stockFilter === "zero"
              ? "bg-red-600 text-white border-red-500 shadow-sm"
              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-red-300 hover:border-red-500/40"
          }`}
        >
          <XCircle size={13} /> Hết hàng (0) ({outOfStockCount})
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên sản phẩm, SKU..." />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input w-44">
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || categoryFilter !== "all" || stockFilter !== "all") && (
          <button onClick={() => { setSearch(""); setCategoryFilter("all"); setStockFilter("all"); }} className="btn-secondary text-xs">
            <X size={14} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu sản phẩm...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Không có sản phẩm nào" description="Thêm sản phẩm để bắt đầu quản lý kho" />
        ) : filtered.map(product => (
          <div key={product.id} className="card-sm hover:border-gray-700 transition-colors">
            <div
              className="flex items-start sm:items-center justify-between cursor-pointer flex-col sm:flex-row gap-4"
              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
              <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 border border-gray-700 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-base truncate">{product.name}</p>
                    <span className="badge-blue">{product.category}</span>
                    {product.tiktokVideoUrl && (
                      <a
                        href={product.tiktokVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/50 text-rose-400 border border-rose-800/80 hover:bg-rose-900/60 hover:text-rose-200 transition-colors"
                        title="Xem video TikTok"
                      >
                        <Video size={10} /> Video TikTok ↗
                      </a>
                    )}
                    {product.lowStock && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚠️ Sắp hết
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span className="font-mono text-gray-500">{product.sku}</span>
                    <span>Giá bán: <span className="text-gray-200 font-medium">{formatCurrency(product.sellingPrice)}</span></span>
                    <span>Giá vốn: <span className="text-gray-500">{formatCurrency(product.costPrice)}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-gray-800 sm:border-0 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-400">Đã bán</p>
                  <p className="font-bold text-white">{formatNumber(product.totalSold)}</p>
                </div>
                <div className="text-left sm:text-right hidden md:block">
                  <p className="text-xs text-gray-400">Doanh thu</p>
                  <p className="font-bold text-emerald-400">{formatCurrency(product.totalRevenue)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-400">Tồn kho</p>
                  <p className={`text-lg font-bold ${getStockClass(product.totalStock, product.lowStockThreshold)}`}>
                    {formatNumber(product.totalStock)}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 pl-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditProduct(product); }}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    title="Sửa sản phẩm"
                  >
                    <Edit2 size={16} />
                  </button>
                  <span className="text-gray-600">
                    {expandedProduct === product.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </span>
                </div>
              </div>
            </div>

            {expandedProduct === product.id && (
              <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    Biến thể chi tiết (Màu/Size)
                    <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Ngưỡng cảnh báo: {product.lowStockThreshold}</span>
                  </h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAddVariant(product.id); setNewVariant(p => ({ ...p, sku: `${product.sku}-NEW` })); }}
                    className="btn-secondary py-1.5 px-3 text-xs text-white border-gray-700 bg-gray-800 hover:bg-gray-700">
                    <Plus size={14} /> Thêm Màu/Size
                  </button>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Màu sắc</th>
                        <th>Size</th>
                        <th className="text-right">Tồn kho</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-gray-500 py-4">Chưa có biến thể nào</td></tr>
                      ) : product.variants.sort((a, b) => a.color.localeCompare(b.color) || SIZES.indexOf(a.size) - SIZES.indexOf(b.size)).map(v => (
                        <tr key={v.id}>
                          <td className="font-mono text-xs text-gray-400">{v.sku}</td>
                          <td className="font-medium text-white">{v.color}</td>
                          <td><span className="badge-gray">{v.size}</span></td>
                          <td className="text-right">
                            <span className={`font-bold ${getStockClass(v.stock, product.lowStockThreshold)}`}>{v.stock}</span>
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); setStockMove({ type: "purchase", quantity: 10, unitCost: product.costPrice, note: "" }); setShowStockModal(true); }}
                                className="btn-secondary text-xs py-1 px-2.5 hover:border-emerald-500 hover:text-emerald-400">
                                <TrendingUp size={12} /> Nhập / Xuất kho
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* QUICK RESTOCK MODAL (NHẬP HÀNG NHANH) */}
      <Modal isOpen={showQuickRestock} onClose={() => setShowQuickRestock(false)} title="⚡ Nhập hàng nhanh vào kho" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Chọn sản phẩm</label>
            <select
              className="input"
              value={quickRestockProduct}
              onChange={e => {
                const pid = e.target.value;
                setQuickRestockProduct(pid);
                const p = products.find(x => x.id === pid);
                if (p) {
                  setQuickRestockCost(p.costPrice);
                  if (p.variants.length > 0) {
                    setQuickRestockVariant(p.variants[0].id);
                  } else {
                    setQuickRestockVariant("");
                  }
                }
              }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Chọn Biến thể (Màu / Size)</label>
            {currentRestockProduct && currentRestockProduct.variants.length > 0 ? (
              <select
                className="input"
                value={quickRestockVariant}
                onChange={e => setQuickRestockVariant(e.target.value)}
              >
                {currentRestockProduct.variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.color} - Size {v.size} (Hiện có: {v.stock} bộ) - {v.sku}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                Sản phẩm này chưa có biến thể Màu/Size. Vui lòng thêm biến thể trước.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Số lượng nhập thêm (+)</label>
              <input
                type="number"
                min="1"
                className="input font-bold text-emerald-400"
                value={quickRestockQty}
                onChange={e => setQuickRestockQty(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="label">Giá vốn nhập (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={quickRestockCost}
                onChange={e => setQuickRestockCost(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="label">Ghi chú nguồn hàng / Xưởng may</label>
            <input
              type="text"
              className="input"
              value={quickRestockNote}
              onChange={e => setQuickRestockNote(e.target.value)}
              placeholder="Ví dụ: Xưởng may Gia Công Lô 12, Nhập thêm hàng Tết..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => setShowQuickRestock(false)} className="btn-secondary text-xs">
              Hủy
            </button>
            <button
              onClick={handleSaveQuickRestock}
              disabled={saving || !quickRestockVariant}
              className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {saving ? "Đang lưu..." : "Xác nhận nhập kho (+)"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal isOpen={showStockModal} onClose={() => { setShowStockModal(false); setSelectedVariant(null); }}
        title={`Điều chỉnh kho: ${selectedVariant?.sku}`} size="sm">
        <div className="space-y-4">
          {selectedVariant && (
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <p className="text-gray-400">Tồn kho hiện tại: <span className="text-white font-bold">{selectedVariant.stock}</span> bộ</p>
            </div>
          )}
          <div>
            <label className="label">Loại điều chỉnh</label>
            <select className="input" value={stockMove.type} onChange={e => setStockMove(p => ({ ...p, type: e.target.value as StockMovementType }))}>
              {(["purchase", "return_in", "adjustment"] as StockMovementType[]).map(t => <option key={t} value={t}>➕ {getStockMovementLabel(t)}</option>)}
              {(["sale", "defective", "gift", "loss"] as StockMovementType[]).map(t => <option key={t} value={t}>➖ {getStockMovementLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Số lượng</label>
            <input type="number" min="1" className="input" value={stockMove.quantity} onChange={e => setStockMove(p => ({ ...p, quantity: Number(e.target.value) }))} />
          </div>
          {stockMove.type === "purchase" && (
            <div>
              <label className="label">Giá nhập (VNĐ)</label>
              <input type="number" className="input" value={stockMove.unitCost || ""} onChange={e => setStockMove(p => ({ ...p, unitCost: Number(e.target.value) }))} />
            </div>
          )}
          <div>
            <label className="label">Ghi chú</label>
            <input type="text" className="input" placeholder="Lý do điều chỉnh..." value={stockMove.note} onChange={e => setStockMove(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => { setShowStockModal(false); setSelectedVariant(null); }} className="btn-secondary">Hủy</button>
            <button onClick={handleStockMovement} disabled={saving} className="btn-primary">
              {saving ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)}
        title={editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Tên sản phẩm *</label>
              <input type="text" className="input" value={newProduct.name}
                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                placeholder="Pyjama Lụa Satin Cao Cấp" />
            </div>
            <div>
              <label className="label">Mã SKU gốc *</label>
              <input type="text" className="input font-mono uppercase" value={newProduct.sku}
                onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value.toUpperCase() }))}
                placeholder="PJ-SATIN-01" />
            </div>
            <div>
              <label className="label">Danh mục</label>
              <select className="input" value={newProduct.category}
                onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cảnh báo tồn kho thấp khi &le;</label>
              <input type="number" className="input" value={newProduct.lowStockThreshold}
                onChange={e => setNewProduct(p => ({ ...p, lowStockThreshold: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Giá vốn (VNĐ)</label>
              <input type="number" className="input" value={newProduct.costPrice || ""}
                onChange={e => setNewProduct(p => ({ ...p, costPrice: Number(e.target.value) }))}
                placeholder="150000" />
            </div>
            <div>
              <label className="label">Giá bán niêm yết (VNĐ)</label>
              <input type="number" className="input" value={newProduct.sellingPrice || ""}
                onChange={e => setNewProduct(p => ({ ...p, sellingPrice: Number(e.target.value) }))}
                placeholder="299000" />
            </div>
          </div>

          <div>
            <label className="label">Ảnh đại diện sản phẩm (URL hoặc đường dẫn)</label>
            <input type="text" className="input" value={newProduct.imageUrl}
              onChange={e => setNewProduct(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://... hoặc /pj_soc_nau_main.jpg" />
          </div>

          <div>
            <label className="label">Ảnh chi tiết / màu sắc (Tối đa 3 ảnh phụ)</label>
            <div className="space-y-2">
              {[0, 1, 2].map(idx => (
                <input
                  key={idx}
                  type="text"
                  className="input text-xs"
                  placeholder={`Ảnh phụ ${idx + 1}...`}
                  value={newProduct.additionalImages[idx] || ""}
                  onChange={e => updateAdditionalImage(idx, e.target.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Mô tả sản phẩm</label>
            <textarea rows={3} className="input" value={newProduct.description}
              onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
              placeholder="Chất liệu lụa satin mềm mịn, thoáng mát..." />
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video size={14} className="text-[#fe2c55]" /> Đường link Video TikTok sản phẩm
              </span>
              <span className="text-xs text-rose-400 font-normal">Video review / Mặc thử</span>
            </label>
            <input
              type="url"
              className="input text-sm"
              value={(newProduct as any).tiktokVideoUrl || ""}
              onChange={e => setNewProduct(p => ({ ...p, tiktokVideoUrl: e.target.value }))}
              placeholder="https://www.tiktok.com/@henr.studio/video/..."
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Khách hàng xem sản phẩm sẽ thấy nút mở xem video review thực tế trên TikTok ngay dưới mô tả!
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => setShowAddProduct(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleSaveProduct} disabled={saving} className="btn-primary">
              {saving ? "Đang lưu..." : editingProductId ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Variant Modal */}
      <Modal isOpen={!!showAddVariant} onClose={() => setShowAddVariant(null)} title="Thêm Màu / Size mới" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Màu sắc *</label>
            <input type="text" className="input" value={newVariant.color}
              onChange={e => setNewVariant(p => ({ ...p, color: e.target.value }))}
              placeholder="Hồng phấn, Xanh than, Trắng kem..." />
          </div>
          <div>
            <label className="label">Kích cỡ *</label>
            <select className="input" value={newVariant.size}
              onChange={e => setNewVariant(p => ({ ...p, size: e.target.value }))}>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mã SKU biến thể *</label>
            <input type="text" className="input font-mono uppercase" value={newVariant.sku}
              onChange={e => setNewVariant(p => ({ ...p, sku: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="label">Số lượng nhập kho ban đầu</label>
            <input type="number" min="0" className="input" value={newVariant.stock}
              onChange={e => setNewVariant(p => ({ ...p, stock: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => setShowAddVariant(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleAddVariant} disabled={saving} className="btn-primary">
              {saving ? "Đang lưu..." : "Thêm biến thể"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Movements History Modal */}
      <Modal isOpen={showMovements} onClose={() => setShowMovements(false)} title="Lịch sử biến động kho hàng" size="lg">
        <div className="space-y-3">
          <div className="table-container max-h-[480px]">
            <table className="table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã SKU</th>
                  <th>Hành động</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Giá vốn</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500">Chưa có giao dịch kho nào</td></tr>
                ) : movements.map(m => {
                  const isPlus = m.quantity > 0;
                  return (
                    <tr key={m.id}>
                      <td className="text-xs whitespace-nowrap">{formatDate(m.date)}</td>
                      <td className="font-mono text-xs text-gray-300">
                        {products.flatMap(p => p.variants).find(v => v.id === m.variantId)?.sku || "—"}
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isPlus ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"
                        }`}>
                          {getStockMovementLabel(m.type)}
                        </span>
                      </td>
                      <td className={`text-right font-bold text-xs ${isPlus ? "text-emerald-400" : "text-red-400"}`}>
                        {isPlus ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="text-right text-xs text-gray-400">
                        {m.unitCost ? formatCurrency(m.unitCost) : "—"}
                      </td>
                      <td className="text-xs text-gray-400 truncate max-w-[180px]">{m.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
