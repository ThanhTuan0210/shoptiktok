import { useState } from "react";
import Modal from "./Modal";
import { Printer, Barcode, Tag, Check, RefreshCw } from "lucide-react";
import type { Product, ProductVariant } from "../../types";
import { formatCurrency } from "../../utils/helpers";

export interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  variants: ProductVariant[];
}

export default function PrintBarcodeModal({
  isOpen,
  onClose,
  products,
  variants,
}: PrintBarcodeModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("all");
  const [copies, setCopies] = useState<number>(10);
  const [labelSize, setLabelSize] = useState<"50x30" | "a4">("50x30");

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
  const activeVariants = variants.filter(v => v.productId === selectedProductId);

  // Print function
  function handlePrint() {
    window.print();
  }

  // Barcode pattern SVG rendering (Code 128 pseudo-pattern for realistic thermal stickers)
  function renderBarcodeSvg(sku: string) {
    const bars: boolean[] = [];
    // Generate deterministic bar widths from SKU characters
    for (let i = 0; i < sku.length; i++) {
      const code = sku.charCodeAt(i);
      bars.push(code % 2 === 0);
      bars.push(code % 3 === 0);
      bars.push(true);
      bars.push(code % 4 === 0);
      bars.push(false);
    }
    while (bars.length < 55) {
      bars.push(bars.length % 2 === 0);
    }

    return (
      <svg className="w-full h-8" viewBox="0 0 110 32" preserveAspectRatio="none">
        {bars.map((isBlack, idx) => (
          <rect
            key={idx}
            x={idx * 2}
            y="0"
            width={isBlack ? "1.6" : "0.4"}
            height="32"
            fill="#000"
          />
        ))}
      </svg>
    );
  }

  // Items to print
  const itemsToPrint = selectedVariantId === "all"
    ? activeVariants
    : activeVariants.filter(v => v.id === selectedVariantId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏷️ In Tem Nhãn Mã Vạch Dán Túi Zip Sản Phẩm" size="lg">
      <div className="space-y-4 text-xs">
        {/* Selection Form */}
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-gray-400 block mb-1">Chọn sản phẩm:</label>
            <select
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId("all");
              }}
              className="input text-xs bg-gray-900 border-gray-700"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Phân loại (Màu / Size):</label>
            <select
              value={selectedVariantId}
              onChange={e => setSelectedVariantId(e.target.value)}
              className="input text-xs bg-gray-900 border-gray-700"
            >
              <option value="all">Tất cả phân loại ({activeVariants.length})</option>
              {activeVariants.map(v => (
                <option key={v.id} value={v.id}>{v.color} - Size {v.size}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Số tem cần in / loại:</label>
            <input
              type="number"
              min={1}
              max={200}
              value={copies}
              onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="input text-xs bg-gray-900 border-gray-700 font-mono"
            />
          </div>
        </div>

        {/* Live Label Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="font-semibold flex items-center gap-1.5 text-gray-200">
              <Tag size={13} className="text-rose-400" />
              Xem trước tem dán túi zip chuẩn (Khổ 50mm x 30mm):
            </span>
            <span className="text-gray-500">Tổng cộng: {itemsToPrint.length * copies} tem nhãn</span>
          </div>

          {/* Sticker Preview Container */}
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex justify-center items-center overflow-x-auto">
            {itemsToPrint.length > 0 ? (
              <div
                className="bg-white text-black p-2 rounded shadow-xl flex flex-col justify-between"
                style={{
                  width: "200px",
                  height: "125px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header: Brand & Care */}
                <div className="flex items-center justify-between border-b border-gray-300 pb-0.5">
                  <span className="font-black text-[10px] tracking-wider">HENR.STUDIO</span>
                  <span className="text-[8px] font-bold text-gray-600 uppercase">Pyjama Cao Cấp</span>
                </div>

                {/* Body: Product & Size */}
                <div className="my-0.5">
                  <p className="font-bold text-[10px] leading-tight truncate text-black">
                    {activeProduct?.name || "Bộ Pyjama Lụa"}
                  </p>
                  <p className="text-[9px] font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                    <span>Màu: {itemsToPrint[0]?.color || "Trắng"}</span>
                    <span>• Size: <strong className="text-rose-600 font-extrabold text-[10px]">{itemsToPrint[0]?.size || "L"}</strong></span>
                  </p>
                </div>

                {/* Barcode representation */}
                <div className="text-center my-0.5">
                  {renderBarcodeSvg(itemsToPrint[0]?.sku || activeProduct?.sku || "HENR-01")}
                  <p className="font-mono text-[8px] font-bold tracking-widest text-black">
                    {itemsToPrint[0]?.sku || activeProduct?.sku}
                  </p>
                </div>

                {/* Footer: Price & Fabric Care */}
                <div className="flex items-center justify-between border-t border-gray-300 pt-0.5 text-[8px]">
                  <span className="font-extrabold text-rose-600 text-[10px]">
                    {formatCurrency(itemsToPrint[0]?.sellingPrice || activeProduct?.sellingPrice || 349000)}
                  </span>
                  <span className="text-[7px] text-gray-600 italic">Giặt nhẹ • Ủi ấm</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 py-4">Sản phẩm chưa có phân loại</p>
            )}
          </div>
        </div>

        {/* Action Buttons & Print Mode */}
        <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            💡 Tương thích máy in nhiệt Xprinter, HPRT, tem dán nhiệt A6/50x30mm
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-3 text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn bg-rose-600 hover:bg-rose-500 text-white py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-lg shadow-rose-600/30"
            >
              <Printer size={15} />
              <span>In {itemsToPrint.length * copies} Tem Nhãn</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
