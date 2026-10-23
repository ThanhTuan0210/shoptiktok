import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, Return, Expense } from "../types";
import { formatDate, getOrderStatusLabel, getReturnReasonLabel, getReturnStatusLabel } from "./helpers";

export function exportOrdersToExcel(orders: Order[], filename = "don-hang.xlsx") {
  const data = orders.map((o) => ({
    "Kênh bán": o.channel === "shopee" ? "Shopee" : o.channel === "website" ? "Website" : "TikTok Shop",
    "Mã đơn": o.shopeeOrderId || o.tiktokOrderId || o.id,
    "Ngày đặt": formatDate(o.orderDate),
    "Khách hàng": o.customerName,
    "SĐT": o.customerPhone || "",
    "Sản phẩm": o.items.map((i) => `${i.productName} (${i.variantInfo}) x${i.quantity}`).join("; "),
    "Tổng tiền hàng": o.subtotal,
    "Phí ship": o.shippingFee,
    "Giảm giá": o.sellerDiscount || o.tiktokDiscount || 0,
    "Tổng thanh toán": o.total,
    "Phí sàn (TikTok/Shopee)": o.shopeeFeeAmount || o.tiktokFeeAmount || 0,
    "Trạng thái": getOrderStatusLabel(o.status),
    "Đơn vị vận chuyển": o.shopeeCarrier || o.shippingCarrier || "",
    "Mã vận đơn": o.trackingNumber || "",
    "Ghi chú": o.note || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
  XLSX.writeFile(wb, filename);
}

export function exportReturnsToExcel(returns: Return[], filename = "hang-hoan.xlsx") {
  const data = returns.map((r) => ({
    "Mã đơn": r.orderId,
    "Ngày hoàn": formatDate(r.returnDate),
    "Khách hàng": r.customerName,
    "Sản phẩm": r.items.map((i) => `${i.productName} (${i.variantInfo}) x${i.quantity}`).join("; "),
    "Lý do": getReturnReasonLabel(r.reason),
    "Chi tiết": r.reasonDetail || "",
    "Trạng thái": getReturnStatusLabel(r.status),
    "Tiền hoàn": r.refundAmount,
    "Phí ship hoàn": r.shippingBack || 0,
    "Ghi chú": r.note || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hàng hoàn");
  XLSX.writeFile(wb, filename);
}

export function exportFinanceToExcel(
  expenses: Expense[],
  startDate: string,
  endDate: string,
  filename = "bao-cao-tai-chinh.xlsx"
) {
  const data = expenses.map((e) => ({
    "Ngày": formatDate(e.date),
    "Danh mục": e.category,
    "Mô tả": e.description,
    "Số tiền": e.amount,
    "Ghi chú": e.note || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chi phí");
  XLSX.writeFile(wb, filename);
}

export function exportReportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename = "bao-cao.pdf"
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}`, 14, 28);

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map(String)),
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [225, 29, 72] },
  });

  doc.save(filename);
}

import { parseExcelRowsToOrders } from "../workers/importWorker";

export async function importOrdersFromExcel(file: File): Promise<Partial<Order>[]> {
  // Use Web Worker if available to avoid blocking main UI thread
  if (typeof window !== "undefined" && window.Worker) {
    try {
      const buffer = await file.arrayBuffer();
      return await new Promise<Partial<Order>[]>((resolve, reject) => {
        const worker = new Worker(new URL("../workers/importWorker.ts", import.meta.url), {
          type: "module",
        });

        worker.onmessage = (e) => {
          worker.terminate();
          if (e.data.success) {
            resolve(e.data.orders);
          } else {
            reject(new Error(e.data.error || "Lỗi khi import file Excel"));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        worker.postMessage({ buffer }, [buffer]);
      });
    } catch (e) {
      console.warn("Web Worker import failed, falling back to direct parse:", e);
    }
  }

  // Fallback to synchronous/main thread FileReader with identical high-fidelity parser
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        const orders = parseExcelRowsToOrders(rows);
        resolve(orders);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function exportDatabaseBackup(data: Record<string, unknown[]>, filename = "backup-tiktok-shop.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportShopeeTemplate(filename = "mau-don-hang-shopee.xlsx") {
  const sampleData = [
    {
      "Mã đơn hàng": "241019SPX88921",
      "Thời gian đặt hàng": "2026-10-19 14:30:00",
      "Trạng thái Đơn hàng": "Chờ lấy hàng",
      "Tên người nhận": "Nguyễn Hoàng Nam",
      "Số điện thoại": "0912345678",
      "Địa chỉ nhận hàng": "Số 15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, TP. Hà Nội",
      "Tên sản phẩm": "Bộ Pyjama Lụa Cao Cấp Dài Tay Henr.Studio",
      "Tên phân loại hàng": "Hồng Pastel - Size M",
      "SKU phân loại hàng": "HENR-PJ-HONG-M",
      "Giá gốc": 350000,
      "Số lượng": 1,
      "Tổng giá trị đơn hàng (VND)": 350000,
      "Phí vận chuyển người mua trả": 22000,
      "Đơn vị vận chuyển": "SPX Express",
      "Mã vận đơn": "SPXVN038892123",
      "Phí thanh toán": 17500,
      "Phí cố định": 15750,
      "Ghi chú từ người mua": "Giao giờ hành chính giúp em"
    },
    {
      "Mã đơn hàng": "241019SPX88922",
      "Thời gian đặt hàng": "2026-10-19 16:45:00",
      "Trạng thái Đơn hàng": "Đang giao",
      "Tên người nhận": "Trần Thị Mai Anh",
      "Số điện thoại": "0987654321",
      "Địa chỉ nhận hàng": "Tổ 4, Xã Đông Hưng, Huyện Tiên Lữ, Tỉnh Hưng Yên",
      "Tên sản phẩm": "Bộ Pyjama Ca Rô Vintage Satin Henr.Studio",
      "Tên phân loại hàng": "Xanh Navy - Size L",
      "SKU phân loại hàng": "HENR-PJ-NAVY-L",
      "Giá gốc": 349000,
      "Số lượng": 2,
      "Tổng giá trị đơn hàng (VND)": 698000,
      "Phí vận chuyển người mua trả": 0,
      "Đơn vị vận chuyển": "SPX Express",
      "Mã vận đơn": "SPXVN038892124",
      "Phí thanh toán": 34900,
      "Phí cố định": 31410,
      "Ghi chú từ người mua": "Cho kiểm tra hàng trước khi nhận"
    }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DonHangShopee");
  XLSX.writeFile(wb, filename);
}
