import { useEffect, useState, useMemo } from "react";
import { db } from "../db/database";
import type { Product, ProductVariant, StockMovement, StockMovementType } from "../types";
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, Download, X, Edit2, Trash2, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatDate, formatNumber, generateId, now, today, getStockMovementLabel, truncate } from "../utils/helpers";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  totalStock: number;
  lowStock: boolean;
  totalSold: number;
  totalRevenue: number;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Freesize"];
const CATEGORIES = ["Pyjama Sá»c Káº»", "Pyjama TrÆ¡n", "Pyjama Ca RÃ´", "Pyjama Ngáº¯n Tay", "VÃ¡y Ngá»§", "Ão ChoÃ ng", "Quáº§n Pyjama", "Gift Set", "KhÃ¡c"];

export default function Inventory() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState<string | null>(null); // productId
  const [showMovements, setShowMovements] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockMove, setStockMove] = useState({ type: "purchase" as StockMovementType, quantity: 1, unitCost: 0, note: "" });
  
  const [newProduct, setNewProduct] = useState({
    name: "", sku: "", category: CATEGORIES[0], costPrice: 0, sellingPrice: 0,
    lowStockThreshold: 10, description: "", imageUrl: "", additionalImages: ["", "", ""]
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [newVariant, setNewVariant] = useState({ color: "", size: SIZES[2], stock: 0, sku: "" });

  const [saving, setSaving] = useState(false);

  useEffect(() => { loadInventory(); }, []);

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
        ...p, variants: pvs, totalStock, lowStock: totalStock <= p.lowStockThreshold,
        totalSold: sales.qty, totalRevenue: sales.revenue
      };
    });
    setProducts(data);
    setMovements(movs);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search
        || p.name.toLowerCase().includes(search.toLowerCase())
        || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchStock = stockFilter === "all"
        || (stockFilter === "low" && p.lowStock)
        || (stockFilter === "ok" && !p.lowStock)
        || (stockFilter === "zero" && p.totalStock === 0);
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const totalValue = products.reduce((s, p) => s + p.totalStock * p.costPrice, 0);
  const lowStockCount = products.filter(p => p.lowStock).length;

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
      imageUrl: newProduct.imageUrl || undefined,
      additionalImages: cleanedAddImages
    };

    if (editingProductId) {
      await db.products.update(editingProductId, {
        ...prodData,
        updatedAt: now()
      });
    } else {
      await db.products.add({
        ...prodData,
        id: generateId(),
        isActive: true,
        createdAt: now(),
        updatedAt: now()
      });
    }
    
    setSaving(false);
    setShowAddProduct(false);
    setEditingProductId(null);
    setNewProduct({ name: "", sku: "", category: CATEGORIES[0], costPrice: 0, sellingPrice: 0, lowStockThreshold: 10, description: "", imageUrl: "", additionalImages: ["", "", ""] });
    loadInventory();
  }
  
  function openEditProduct(p) {
    setEditingProductId(p.id);
    setNewProduct({
      name: p.name, sku: p.sku, category: p.category, 
      costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      lowStockThreshold: p.lowStockThreshold, description: p.description || "",
      imageUrl: p.imageUrl || "",
      additionalImages: [
        p.additionalImages?.[0] || "",
        p.additionalImages?.[1] || "",
        p.additionalImages?.[2] || ""
      ]
    });
    setShowAddProduct(true);
  }
  
  function openAddProduct() {
    setEditingProductId(null);
    setNewProduct({ name: "", sku: "", category: CATEGORIES[0], costPrice: 0, sellingPrice: 0, lowStockThreshold: 10, description: "", imageUrl: "", additionalImages: ["", "", ""] });
    setShowAddProduct(true);
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
        note: "Nháº­p kho ban Ä‘áº§u", date: today(), createdAt: now(),
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
    const qty = ["sale", "defective", "gift", "loss"].includes(stockMove.type) ? -Math.abs(stockMove.quantity) : Math.abs(stockMove.quantity);

    await db.stockMovements.add({
      id: generateId(), variantId: selectedVariant.id, productId: selectedVariant.productId,
      type: stockMove.type, quantity: qty, unitCost: stockMove.unitCost || undefined,
      note: stockMove.note, date: today(), createdAt: now(),
    });

    await db.productVariants.update(selectedVariant.id, { stock: Math.max(0, selectedVariant.stock + qty) });
    setSaving(false);
    setShowStockModal(false);
    setSelectedVariant(null);
    setStockMove({ type: "purchase", quantity: 1, unitCost: 0, note: "" });
    loadInventory();
  }

  const getStockClass = (stock: number, threshold: number) => {
    if (stock === 0) return "text-red-400";
    if (stock <= threshold) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sáº£n pháº©m & Kho hÃ ng</h1>
          <p className="page-subtitle">Quáº£n lÃ½ danh sÃ¡ch sáº£n pháº©m, tá»“n kho vÃ  theo dÃµi doanh sá»‘</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMovements(true)} className="btn-secondary hidden sm:flex">
            <TrendingUp size={16} /> Lá»‹ch sá»­ kho
          </button>
          <button onClick={openAddProduct} className="btn-primary">
            <Plus size={16} /> ThÃªm sáº£n pháº©m má»›i
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-blue-400">{formatNumber(products.length)}</p>
          <p className="text-xs text-gray-400 mt-1">Tá»•ng sáº£n pháº©m</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatNumber(products.reduce((s, p) => s + p.totalSold, 0))}</p>
          <p className="text-xs text-gray-400 mt-1">ÄÃ£ bÃ¡n (All time)</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-amber-400">{formatNumber(lowStockCount)}</p>
          <p className="text-xs text-gray-400 mt-1">Sáº¯p háº¿t hÃ ng</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-lg font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-gray-400 mt-1">GiÃ¡ trá»‹ tá»“n kho</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="TÃ¬m tÃªn sáº£n pháº©m, SKU..." />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input w-44">
          <option value="all">Táº¥t cáº£ danh má»¥c</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input w-40">
          <option value="all">Táº¥t cáº£ tá»“n kho</option>
          <option value="ok">CÃ²n hÃ ng</option>
          <option value="low">Sáº¯p háº¿t</option>
          <option value="zero">Háº¿t hÃ ng</option>
        </select>
        {(search || categoryFilter !== "all" || stockFilter !== "all") && (
          <button onClick={() => { setSearch(""); setCategoryFilter("all"); setStockFilter("all"); }} className="btn-secondary text-xs"><X size={14} /> XÃ³a lá»c</button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Äang táº£i...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="KhÃ´ng cÃ³ sáº£n pháº©m" description="ThÃªm sáº£n pháº©m Ä‘á»ƒ báº¯t Ä‘áº§u quáº£n lÃ½" />
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
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span className="font-mono text-gray-500">{product.sku}</span>
                    <span>GiÃ¡ bÃ¡n: <span className="text-gray-300 font-medium">{formatCurrency(product.sellingPrice)}</span></span>
                    <span>GiÃ¡ vá»‘n: <span className="text-gray-500">{formatCurrency(product.costPrice)}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t border-gray-800 sm:border-0 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-400">ÄÃ£ bÃ¡n</p>
                  <p className="font-bold text-white">{formatNumber(product.totalSold)}</p>
                </div>
                <div className="text-left sm:text-right hidden md:block">
                  <p className="text-sm text-gray-400">Doanh thu</p>
                  <p className="font-bold text-emerald-400">{formatCurrency(product.totalRevenue)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-400">Tá»“n kho</p>
                  <p className={`text-lg font-bold ${getStockClass(product.totalStock, product.lowStockThreshold)}`}>
                    {formatNumber(product.totalStock)}
                  </p>
                </div>
                <div className="shrink-0 text-gray-500 pl-2">
                  <button onClick={(e) => { e.stopPropagation(); openEditProduct(product); }} className="text-gray-400 hover:text-white p-2">
                    <Edit2 size={16} />
                  </button>
                  {expandedProduct === product.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
            </div>

            {expandedProduct === product.id && (
              <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    Biáº¿n thá»ƒ (MÃ u/Size)
                    <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Tá»“n tháº¥p: {product.lowStockThreshold}</span>
                  </h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowAddVariant(product.id); setNewVariant(p => ({ ...p, sku: `${product.sku}-NEW` })) }}
                    className="btn-secondary py-1.5 px-3 text-xs text-white border-gray-700 bg-gray-800 hover:bg-gray-700">
                    <Plus size={14} /> ThÃªm MÃ u/Size
                  </button>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>MÃ u sáº¯c</th>
                        <th>Size</th>
                        <th className="text-right">Tá»“n kho</th>
                        <th className="text-center">Thao tÃ¡c</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-gray-500 py-4">ChÆ°a cÃ³ biáº¿n thá»ƒ nÃ o</td></tr>
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
                                onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); setStockMove({ type: "purchase", quantity: 1, unitCost: product.costPrice, note: "" }); setShowStockModal(true); }}
                                className="btn-secondary text-xs py-1 px-2">
                                <TrendingUp size={12} /> Nháº­p/Xuáº¥t
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

      {/* Adjust Stock Modal */}
      <Modal isOpen={showStockModal} onClose={() => { setShowStockModal(false); setSelectedVariant(null); }}
        title={`Äiá»u chá»‰nh kho: ${selectedVariant?.sku}`} size="sm">
        <div className="space-y-4">
          {selectedVariant && (
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <p className="text-gray-400">Tá»“n kho hiá»‡n táº¡i: <span className="text-white font-bold">{selectedVariant.stock}</span></p>
            </div>
          )}
          <div>
            <label className="label">Loáº¡i Ä‘iá»u chá»‰nh</label>
            <select className="input" value={stockMove.type} onChange={e => setStockMove(p => ({ ...p, type: e.target.value as StockMovementType }))}>
              {(["purchase","return_in","adjustment"] as StockMovementType[]).map(t => <option key={t} value={t}>âž• {getStockMovementLabel(t)}</option>)}
              {(["sale","defective","gift","loss"] as StockMovementType[]).map(t => <option key={t} value={t}>âž– {getStockMovementLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sá»‘ lÆ°á»£ng</label>
            <input type="number" min="1" className="input" value={stockMove.quantity} onChange={e => setStockMove(p => ({ ...p, quantity: Number(e.target.value) }))} />
          </div>
          {stockMove.type === "purchase" && (
            <div>
              <label className="label">GiÃ¡ nháº­p (VNÄ)</label>
              <input type="number" className="input" value={stockMove.unitCost || ""} onChange={e => setStockMove(p => ({ ...p, unitCost: Number(e.target.value) }))} />
            </div>
          )}
          <div>
            <label className="label">Ghi chÃº</label>
            <input className="input" value={stockMove.note} onChange={e => setStockMove(p => ({ ...p, note: e.target.value }))} placeholder="LÃ½ do Ä‘iá»u chá»‰nh..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowStockModal(false)} className="btn-secondary">Há»§y</button>
            <button onClick={handleStockMovement} disabled={saving} className="btn-primary">
              {saving ? "Äang lÆ°u..." : "XÃ¡c nháº­n"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Variant Modal */}
      <Modal isOpen={!!showAddVariant} onClose={() => setShowAddVariant(null)} title="ThÃªm MÃ u/Size má»›i" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">MÃ u sáº¯c *</label>
            <input className="input" value={newVariant.color} onChange={e => setNewVariant(p => ({ ...p, color: e.target.value }))} placeholder="VD: Há»“ng pháº¥n" />
          </div>
          <div>
            <label className="label">Size *</label>
            <select className="input" value={newVariant.size} onChange={e => setNewVariant(p => ({ ...p, size: e.target.value }))}>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">MÃ£ SKU *</label>
            <input className="input" value={newVariant.sku} onChange={e => setNewVariant(p => ({ ...p, sku: e.target.value.toUpperCase() }))} placeholder="VD: PJ-HONG-S" />
          </div>
          <div>
            <label className="label">Tá»“n kho ban Ä‘áº§u</label>
            <input type="number" min="0" className="input" value={newVariant.stock} onChange={e => setNewVariant(p => ({ ...p, stock: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddVariant(null)} className="btn-secondary">Há»§y</button>
            <button onClick={handleAddVariant} disabled={saving || !newVariant.color || !newVariant.sku} className="btn-primary">
              {saving ? "Äang thÃªm..." : "ThÃªm biáº¿n thá»ƒ"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} title="ThÃªm sáº£n pháº©m má»›i" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">TÃªn sáº£n pháº©m *</label>
              <input className="input" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="VD: Bá»™ Pyjama lá»¥a..." />
            </div>
            <div>
              <label className="label">SKU Sáº£n pháº©m *</label>
              <input className="input" value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value.toUpperCase() }))} placeholder="VD: PJ-001" />
            </div>
            <div>
              <label className="label">Danh má»¥c</label>
              <select className="input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">GiÃ¡ vá»‘n (VNÄ)</label>
              <input type="number" className="input" value={newProduct.costPrice || ""} onChange={e => setNewProduct(p => ({ ...p, costPrice: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">GiÃ¡ bÃ¡n (VNÄ)</label>
              <input type="number" className="input" value={newProduct.sellingPrice || ""} onChange={e => setNewProduct(p => ({ ...p, sellingPrice: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">NgÆ°á»¡ng cáº£nh bÃ¡o háº¿t hÃ ng</label>
              <input type="number" className="input" value={newProduct.lowStockThreshold} onChange={e => setNewProduct(p => ({ ...p, lowStockThreshold: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddProduct(false)} className="btn-secondary">Há»§y</button>
            <button onClick={handleAddProduct} disabled={saving || !newProduct.name || !newProduct.sku} className="btn-primary">
              LÆ°u sáº£n pháº©m
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={showMovements} onClose={() => setShowMovements(false)} title="Lá»‹ch sá»­ biáº¿n Ä‘á»™ng kho" size="xl">
        <div className="table-container max-h-[60vh] overflow-y-auto">
          <table className="table">
            <thead>
              <tr>
                <th>NgÃ y</th>
                <th>Loáº¡i</th>
                <th>Biáº¿n thá»ƒ</th>
                <th className="text-right">Sá»‘ lÆ°á»£ng</th>
                <th>Ghi chÃº</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-xs">{formatDate(m.date)}</td>
                  <td>
                    <span className={m.quantity > 0 ? "badge-green" : "badge-red"}>
                      {m.quantity > 0 ? "+" : ""}{getStockMovementLabel(m.type)}
                    </span>
                  </td>
                  <td className="text-xs text-gray-400">{m.variantId.slice(-8)}</td>
                  <td className={`text-right font-bold ${m.quantity > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td className="text-xs text-gray-500">{m.note || "â€”"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
