import { db } from "../db/database";
import { generateId, now } from "./helpers";
import { subDays, format } from "date-fns";

// ============================================================
// HENR.STUDIO — Đồ ngủ Pyjama cao cấp
// ============================================================

const PRODUCTS = [
  // --- Bộ Pyjama Sọc Kẻ ---
  {
    name: "Bộ Pyjama Sọc Kẻ Đen Trắng Lụa Satin",
    sku: "PJ-SOC-DEN-001",
    category: "Pyjama Sọc Kẻ",
    costPrice: 145000,
    sellingPrice: 349000,
    colors: ["Đen - Sọc Trắng", "Trắng - Sọc Đen"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bộ Pyjama Sọc Kẻ Hồng Satin",
    sku: "PJ-SOC-HON-001",
    category: "Pyjama Sọc Kẻ",
    costPrice: 145000,
    sellingPrice: 349000,
    colors: ["Hồng Pastel - Sọc Trắng", "Trắng - Sọc Hồng"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bộ Pyjama Sọc Kẻ Nâu Đỏ Satin",
    sku: "PJ-SOC-NAU-001",
    category: "Pyjama Sọc Kẻ",
    costPrice: 145000,
    sellingPrice: 349000,
    colors: ["Nâu Đỏ - Sọc Trắng", "Bordeaux - Sọc Be"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bộ Pyjama Sọc Kẻ Xanh Navy Satin",
    sku: "PJ-SOC-XAN-001",
    category: "Pyjama Sọc Kẻ",
    costPrice: 145000,
    sellingPrice: 349000,
    colors: ["Xanh Navy - Sọc Trắng", "Xanh Dương - Sọc Trắng"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Bộ Pyjama Trơn ---
  {
    name: "Bộ Pyjama Trơn Lụa Cao Cấp",
    sku: "PJ-TRON-001",
    category: "Pyjama Trơn",
    costPrice: 130000,
    sellingPrice: 319000,
    colors: ["Hồng", "Đỏ", "Xanh Dương", "Be Kem", "Trắng", "Xanh Mint", "Tím Lavender"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bộ Pyjama Trơn Cotton Thoáng Mát",
    sku: "PJ-TRON-COT-001",
    category: "Pyjama Trơn",
    costPrice: 115000,
    sellingPrice: 279000,
    colors: ["Hồng Nhạt", "Xanh Bạc Hà", "Vàng Nhạt", "Trắng Sữa"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Bộ Pyjama Ca Rô ---
  {
    name: "Bộ Pyjama Ca Rô Vintage Satin",
    sku: "PJ-CARO-001",
    category: "Pyjama Ca Rô",
    costPrice: 155000,
    sellingPrice: 369000,
    colors: ["Hồng Ca Rô", "Đỏ Ca Rô", "Xanh Ca Rô", "Be Ca Rô"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bộ Pyjama Kẻ Ca Rô Flannel Mùa Đông",
    sku: "PJ-CARO-FLA-001",
    category: "Pyjama Ca Rô",
    costPrice: 170000,
    sellingPrice: 399000,
    colors: ["Đỏ - Đen Ca Rô", "Xanh - Đen Ca Rô"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Pyjama Ngắn Tay ---
  {
    name: "Set Pyjama Ngắn Tay Lụa Satin",
    sku: "PJ-NGAN-001",
    category: "Pyjama Ngắn Tay",
    costPrice: 120000,
    sellingPrice: 289000,
    colors: ["Hồng", "Trắng", "Xanh Pastel", "Vàng Chanh"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Váy Ngủ ---
  {
    name: "Váy Ngủ Lụa Satin Cổ Chữ V",
    sku: "VN-LUA-001",
    category: "Váy Ngủ",
    costPrice: 95000,
    sellingPrice: 229000,
    colors: ["Hồng", "Đen", "Trắng Kem", "Tím"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Áo Choàng ---
  {
    name: "Áo Choàng Tắm Lông Cừu Cao Cấp",
    sku: "AC-LONG-001",
    category: "Áo Choàng",
    costPrice: 200000,
    sellingPrice: 469000,
    colors: ["Trắng", "Hồng", "Xám"],
    sizes: ["M-L", "L-XL"],
  },
  // --- Quần Pyjama Rời ---
  {
    name: "Quần Pyjama Lụa Satin Rời",
    sku: "QP-LUA-001",
    category: "Quần Pyjama",
    costPrice: 75000,
    sellingPrice: 179000,
    colors: ["Đen Sọc Trắng", "Hồng Sọc Trắng", "Trơn Trắng", "Trơn Đen"],
    sizes: ["S", "M", "L", "XL"],
  },
  // --- Set Quà Tặng ---
  {
    name: "Gift Set Pyjama Henr.Studio - Hộp Quà",
    sku: "GIFT-SET-001",
    category: "Gift Set",
    costPrice: 290000,
    sellingPrice: 649000,
    colors: ["Hồng Premium", "Đen Premium"],
    sizes: ["S-M", "M-L", "L-XL"],
  },
];

const CARRIERS = ["J&T Express", "GHN", "GHTK", "Viettel Post", "SPX Express"];
const CUSTOMER_NAMES = [
  "Nguyễn Thị Hoa", "Trần Thị Mai", "Lê Thị Lan", "Phạm Thị Thu",
  "Hoàng Thị Ngọc", "Vũ Thị Hằng", "Đỗ Thị Linh", "Bùi Thị Phương",
  "Đặng Thị Hường", "Lý Thị Bích", "Trịnh Thị Thúy", "Mai Thị Trang",
  "Cao Thị Quỳnh", "Dương Thị Nhung", "Tô Thị Loan", "Hồ Thị Yến",
  "Ngô Thị Diệu", "Phan Thị Kim", "Đinh Thị Thảo", "Lưu Thị Hạnh",
  "Nguyễn Thị Mỹ Linh", "Trần Khánh Linh", "Lê Ngọc Anh", "Phạm Hà My",
  "Hoàng Thu Hương", "Vũ Minh Châu", "Đỗ Bảo Ngọc", "Bùi Thanh Hà",
];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)];
}
function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

export async function seedDatabase() {
  const existing = await db.products.count();
  if (existing > 0) return;

  // Supplier
  const supplierId = generateId();
  await db.suppliers.add({
    id: supplierId,
    name: "Xưởng May HENR STUDIO",
    phone: "0909123456",
    address: "Hà Nội, Việt Nam",
    note: "Nhà cung cấp chính của Henr.Studio",
    createdAt: now(),
  });

  // Create products & variants
  const allVariantData: Array<{
    variantId: string; productId: string; costPrice: number;
    stock: number; color: string; size: string;
  }> = [];

  for (const p of PRODUCTS) {
    const productId = generateId();
    await db.products.add({
      id: productId,
      name: p.name,
      sku: p.sku,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      lowStockThreshold: 15,
      supplierId,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    });

    for (const color of p.colors) {
      for (const size of p.sizes) {
        const variantId = generateId();
        const stock = rnd(10, 120);
        const colorCode = color.slice(0, 3).replace(/\s/g, "").toUpperCase();
        await db.productVariants.add({
          id: variantId,
          productId,
          color,
          size,
          sku: `${p.sku}-${colorCode}-${size.replace("-", "")}`,
          stock,
          createdAt: now(),
        });

        // Stock movement: initial purchase
        await db.stockMovements.add({
          id: generateId(),
          variantId,
          productId,
          type: "purchase",
          quantity: stock + rnd(30, 80),
          unitCost: p.costPrice,
          note: "Nhập kho ban đầu từ xưởng",
          date: dateStr(90),
          createdAt: now(),
        });

        allVariantData.push({ variantId, productId, costPrice: p.costPrice, stock, color, size });
      }
    }
  }

  // Re-fetch for order generation
  const allVariants = await db.productVariants.toArray();
  const allProducts = await db.products.toArray();
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  // Generate 250+ orders over 90 days
  // Henr.Studio style: more orders on weekends, peaks around sales
  let totalOrders = 0;
  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    // TikTok shop pattern: weekends get more orders, livestream days spike
    const isWeekend = [0, 6].includes(new Date(Date.now() - daysAgo * 86400000).getDay());
    const isLivestream = daysAgo % 7 === 0; // Livestream weekly
    const baseOrders = isLivestream ? rnd(8, 18) : isWeekend ? rnd(5, 12) : rnd(2, 7);

    for (let o = 0; o < baseOrders; o++) {
      const itemCount = rnd(1, 2); // Pyjama orders usually 1-2 items
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const v = pick(allVariants);
        const prod = productMap.get(v.productId);
        if (!prod) continue;
        const qty = rnd(1, 2); // Usually buy 1-2 sets
        const price = prod.sellingPrice;
        items.push({
          productId: v.productId,
          variantId: v.id,
          productName: prod.name,
          variantInfo: `${v.color} / ${v.size}`,
          sku: v.sku,
          quantity: qty,
          unitPrice: price,
          unitCost: prod.costPrice,
        });
        subtotal += price * qty;
      }
      if (items.length === 0) continue;

      const shippingFee = rnd(0, 35000);
      // TikTok vouchers are common
      const hasVoucher = Math.random() < 0.4;
      const discount = hasVoucher ? rnd(20000, 80000) : 0;
      const total = Math.max(subtotal + shippingFee - discount, subtotal * 0.5);

      // Status logic
      let status: string;
      if (daysAgo > 14) {
        const r = Math.random();
        if (r < 0.06) status = "returned";
        else if (r < 0.02) status = "cancelled";
        else status = "delivered";
      } else if (daysAgo > 7) {
        const r = Math.random();
        if (r < 0.7) status = "delivered";
        else if (r < 0.9) status = "shipping";
        else status = "return_requested";
      } else if (daysAgo > 3) {
        const r = Math.random();
        if (r < 0.5) status = "shipping";
        else if (r < 0.7) status = "delivered";
        else if (r < 0.85) status = "processing";
        else status = "return_requested";
      } else {
        const r = Math.random();
        if (r < 0.35) status = "pending";
        else if (r < 0.65) status = "processing";
        else status = "shipping";
      }

      const orderId = generateId();
      const carrier = pick(CARRIERS);
      const ordDate = dateStr(daysAgo);

      await db.orders.add({
        id: orderId,
        tiktokOrderId: `TT${format(new Date(), "yyyyMMdd")}${rnd(10000000, 99999999)}`,
        customerName: pick(CUSTOMER_NAMES),
        customerPhone: `0${pick(["9","8","7","3","5"])}${rnd(10000000, 99999999)}`,
        customerAddress: pick([
          "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
          "Bình Dương", "Đồng Nai", "Nha Trang", "Huế", "Vũng Tàu",
        ]),
        items,
        status: status as any,
        orderDate: ordDate,
        shippingDate: ["shipping","delivered","returned"].includes(status) ? dateStr(Math.max(0, daysAgo - 1)) : undefined,
        deliveredDate: status === "delivered" ? dateStr(Math.max(0, daysAgo - rnd(2, 5))) : undefined,
        subtotal,
        shippingFee,
        tiktokDiscount: discount,
        sellerDiscount: 0,
        total,
        shippingCarrier: carrier,
        trackingNumber: `${carrier.slice(0,2).toUpperCase()}${rnd(100000000, 999999999)}`,
        tiktokFeeRate: 1.8, // TikTok Vietnam rate
        tiktokFeeAmount: Math.round(total * 0.018),
        note: isLivestream && Math.random() < 0.3 ? "Đơn từ livestream" : undefined,
        createdAt: now(),
        updatedAt: now(),
      });

      // Create return records
      if (status === "returned" || status === "return_requested") {
        const reasons: any[] = ["wrong_size", "wrong_color", "not_as_described", "changed_mind", "defective", "damaged_shipping"];
        const weights = [0.35, 0.15, 0.2, 0.15, 0.1, 0.05]; // wrong_size most common for pyjama
        let r2 = Math.random(), cumWeight = 0;
        let reason = reasons[0];
        for (let i = 0; i < reasons.length; i++) {
          cumWeight += weights[i];
          if (r2 < cumWeight) { reason = reasons[i]; break; }
        }
        await db.returns.add({
          id: generateId(),
          orderId,
          tiktokOrderId: `TT${rnd(100000000, 999999999)}`,
          customerName: items[0] ? pick(CUSTOMER_NAMES) : "Khách hàng",
          items,
          reason,
          reasonDetail: reason === "wrong_size"
            ? pick(["Mặc hơi chật, đổi size lớn hơn", "Size to hơn mong đợi", "Không vừa, cần đổi size"])
            : reason === "not_as_described"
            ? pick(["Màu sắc khác hình ảnh", "Chất liệu không như quảng cáo"])
            : undefined,
          status: daysAgo > 10 ? pick(["received", "restocked", "disposed"]) : "pending",
          returnDate: dateStr(Math.max(0, daysAgo - rnd(1, 3))),
          receivedDate: daysAgo > 10 ? dateStr(Math.max(0, daysAgo - rnd(4, 8))) : undefined,
          refundAmount: total,
          shippingBack: rnd(25000, 45000),
          createdAt: now(),
          updatedAt: now(),
        });
      }

      totalOrders++;
    }
  }

  // Defective items (quality issues in pyjama production)
  const defVariants = allVariants.slice(0, 30);
  const defDescriptions = [
    "Đường may bị lỗi, chỉ thừa nhiều",
    "Cúc áo bị vỡ/rơi",
    "Màu vải bị phai sau khi giặt",
    "Kích thước không đều giữa các size",
    "Vải bị dính bẩn khó tẩy",
    "Đường viền cổ áo bị tuột chỉ",
    "Nút cổ tay bị lỏng",
    "Vải có lỗ nhỏ do máy may",
  ];
  for (let i = 0; i < 30; i++) {
    const v = pick(defVariants);
    const prod = productMap.get(v.productId);
    if (!prod) continue;
    const qty = rnd(1, 5);
    await db.defectiveItems.add({
      id: generateId(),
      productId: v.productId,
      variantId: v.id,
      productName: prod.name,
      variantInfo: `${v.color} / ${v.size}`,
      quantity: qty,
      type: pick(["manufacturing", "manufacturing", "storage", "shipping"]) as any,
      description: pick(defDescriptions),
      costValue: prod.costPrice * qty,
      date: dateStr(rnd(0, 75)),
      createdAt: now(),
    });
  }

  // Expenses — realistic for a TikTok fashion shop
  const expenses = [
    // Tháng này
    { category: "tiktok_fee", description: "Phí hoa hồng TikTok Shop tháng 9/2026", amount: 2800000, date: dateStr(5) },
    { category: "advertising", description: "TikTok Ads - Boost video pyjama sọc", amount: 1500000, date: dateStr(8) },
    { category: "advertising", description: "TikTok Ads - Remarketing khách cũ", amount: 800000, date: dateStr(3) },
    { category: "livestream", description: "Chi phí setup livestream - Đèn ring light", amount: 2200000, date: dateStr(30) },
    { category: "livestream", description: "Voucher livestream - Mã giảm giá cho viewer", amount: 3000000, date: dateStr(7) },
    { category: "livestream", description: "Thuê stylist set đồ cho livestream", amount: 1000000, date: dateStr(14) },
    { category: "labor", description: "Lương nhân viên đóng gói tháng 9", amount: 6000000, date: dateStr(5) },
    { category: "labor", description: "Lương quản lý shop tháng 9", amount: 8000000, date: dateStr(5) },
    { category: "packaging", description: "Túi đựng hộp Henr.Studio in logo", amount: 1800000, date: dateStr(20) },
    { category: "packaging", description: "Hộp gift set + ruy băng + thiệp cảm ơn", amount: 2500000, date: dateStr(25) },
    { category: "packaging", description: "Băng keo, bong bóng khí, túi nilon chống thấm", amount: 650000, date: dateStr(12) },
    { category: "warehouse", description: "Thuê kho hàng tháng 9", amount: 5000000, date: dateStr(5) },
    { category: "other", description: "Phí chụp ảnh sản phẩm mùa mới", amount: 3500000, date: dateStr(18) },
    { category: "other", description: "Chi phí in tem mác, nhãn mác Henr.Studio", amount: 900000, date: dateStr(22) },
    // Tháng trước
    { category: "tiktok_fee", description: "Phí hoa hồng TikTok Shop tháng 8/2026", amount: 2400000, date: dateStr(35) },
    { category: "advertising", description: "TikTok Ads tháng 8 - Tổng", amount: 2200000, date: dateStr(35) },
    { category: "livestream", description: "KOL review sản phẩm pyjama", amount: 4000000, date: dateStr(40) },
    { category: "labor", description: "Lương nhân viên tháng 8", amount: 14000000, date: dateStr(35) },
    { category: "packaging", description: "Nguyên liệu đóng gói tháng 8", amount: 1900000, date: dateStr(40) },
    { category: "warehouse", description: "Thuê kho hàng tháng 8", amount: 5000000, date: dateStr(35) },
    { category: "other", description: "Phí vận hành website/app quản lý", amount: 500000, date: dateStr(45) },
    { category: "other", description: "Chi phí điện nước kho hàng Q8", amount: 1200000, date: dateStr(50) },
  ];

  for (const e of expenses) {
    await db.expenses.add({
      id: generateId(),
      category: e.category as any,
      description: e.description,
      amount: e.amount,
      date: e.date,
      createdAt: now(),
    });
  }

  // Settings for Henr.Studio
  await db.settings.add({
    shopName: "Henr.Studio — Đồ Ngủ Cao Cấp",
    currency: "VND",
    tiktokFeeRate: 1.8,
    lowStockDefault: 15,
    shippingCostPerOrder: 30000,
  });

  console.log(`[Henr.Studio] Seed complete: ${PRODUCTS.length} sản phẩm, ${totalOrders} đơn hàng`);
}
