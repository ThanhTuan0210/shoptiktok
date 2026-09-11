import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, Return, DefectiveItem, Expense } from "../types";
import { formatCurrency, formatDate, getOrderStatusLabel, getReturnReasonLabel, getReturnStatusLabel } from "./helpers";

export function exportOrdersToExcel(orders: Order[], filename = "don-hang.xlsx") {
  const data = orders.map((o) => ({
    "Mã đơn TikTok": o.tiktokOrderId || "",
    "Ngày đặt": formatDate(o.orderDate),
    "Khách hàng": o.customerName,
    "SĐT": o.customerPhone || "",
    "Sản phẩm": o.items.map((i) => `${i.productName} (${i.variantInfo}) x${i.quantity}`).join("; "),
    "Tổng tiền hàng": o.subtotal,
    "Phí ship": o.shippingFee,
    "Giảm giá TikTok": o.tiktokDiscount || 0,
    "Tổng thanh toán": o.total,
    "Phí TikTok": o.tiktokFeeAmount || 0,
    "Trạng thái": getOrderStatusLabel(o.status),
    "Đơn vị vận chuyển": o.shippingCarrier || "",
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

export async function importOrdersFromExcel(file: File): Promise<Partial<Order>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const orders: Partial<Order>[] = rows.map((row) => ({
          tiktokOrderId: String(row["Mã đơn TikTok"] || row["Order ID"] || row["order_id"] || ""),
          customerName: String(row["Tên khách"] || row["Customer Name"] || row["buyer_username"] || ""),
          customerPhone: String(row["SĐT"] || row["Phone"] || row["recipient_phone"] || ""),
          customerAddress: String(row["Địa chỉ"] || row["Address"] || row["shipping_address"] || ""),
          total: parseFloat(String(row["Tổng tiền"] || row["Total"] || row["order_amount"] || 0)),
          subtotal: parseFloat(String(row["Tiền hàng"] || row["Subtotal"] || 0)),
          shippingFee: parseFloat(String(row["Phí ship"] || row["Shipping"] || 0)),
          orderDate: String(row["Ngày đặt"] || row["Order Date"] || row["create_time"] || new Date().toISOString().split("T")[0]),
          status: "pending" as const,
          items: [],
        }));

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
