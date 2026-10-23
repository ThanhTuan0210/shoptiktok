import { db } from "../db/database";
import type { Order } from "../types";

const customers = [
  { name: "Nguyễn Thị Thu Hà", phone: "0982341299", addr: "Số 15, Phố Huế, P. Hàng Bài, Hoàn Kiếm, Hà Nội" },
  { name: "Trần Minh Quang", phone: "0912445891", addr: "Tòa S2.05 Vinhome Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội" },
  { name: "Lê Hoàng Yến", phone: "0934120984", addr: "45 Lê Văn Sỹ, Phường 13, Quận 3, TP. Hồ Chí Minh" },
  { name: "Phạm Thùy Linh", phone: "0908776512", addr: "Chung cư Sunrise City, Nguyễn Hữu Thọ, Quận 7, TP. HCM" },
  { name: "Hoàng Đức Anh", phone: "0976554321", addr: "128 Nguyễn Văn Linh, Phường Nam Dương, Hải Châu, Đà Nẵng" },
  { name: "Đỗ Kim Oanh", phone: "0988112233", addr: "24 Đường 30/4, Phường Hưng Lợi, Ninh Kiều, Cần Thơ" },
  { name: "Vũ Mai Phương", phone: "0915667788", addr: "Khu đô thị Ecopark, Văn Giang, Hưng Yên" },
  { name: "Bùi Tuấn Kiệt", phone: "0933224455", addr: "78 Trần Phú, Phường Lộc Thọ, Nha Trang, Khánh Hòa" },
  { name: "Đặng Ngọc Ánh", phone: "0944556677", addr: "15 Lê Thánh Tông, Máy Tơ, Ngô Quyền, Hải Phòng" },
  { name: "Ngô Thanh Vân", phone: "0966778899", addr: "89 Hùng Vương, Phường 5, TP. Tuy Hòa, Phú Yên" }
];

const statuses: Array<Order["status"]> = [
  "pending", "pending", 
  "processing", "processing", 
  "shipping", "shipping", "shipping", 
  "delivered", "delivered", "delivered", "delivered", "delivered", 
  "returned"
];

export async function generateShopeeOrders(count = 75) {
  const allVariants = await db.productVariants.toArray();
  const allProducts = await db.products.toArray();
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  const newOrders: Order[] = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const cust = customers[i % customers.length];
    const status = statuses[i % statuses.length];
    
    // Rải ngày trong 14 ngày qua
    const dayOffset = (i % 14);
    const orderDate = new Date(now - dayOffset * 24 * 3600 * 1000 - (i * 1234567 % 43200000)).toISOString();
    
    const shopeeOrderId = "2410" + String(30000000 + i);
    const trackingNumber = "SPXVN0" + Math.floor(100000000 + Math.random() * 900000000);

    // Chọn sản phẩm thực tế từ DB
    const variant = allVariants[i % allVariants.length];
    const prod = variant ? productMap.get(variant.productId) : allProducts[0];

    const prodName = prod ? prod.name : "Bộ Pyjama Lụa Cao Cấp Henr.Studio";
    const prodPrice = prod ? prod.sellingPrice : 349000;
    const prodCost = prod ? prod.costPrice : 145000;
    const variantInfo = variant ? `${variant.color} / ${variant.size}` : "Đen / Size M";
    const qty = (i % 2) + 1;
    const total = prodPrice * qty;

    const order: Order = {
      id: "shopee_gen_" + Date.now() + "_" + i,
      orderCode: "SP-" + shopeeOrderId,
      shopeeOrderId: shopeeOrderId,
      channel: "shopee",
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.addr,
      customerWard: "Phường Trung Tâm",
      customerDistrict: "Quận Hoàn Kiếm",
      customerProvince: "Hà Nội",
      status: status,
      paymentMethod: i % 3 === 0 ? "shopeepay" : "cod",
      paymentStatus: (status === "delivered" || i % 3 === 0) ? "paid" : "unpaid",
      items: [
        {
          productId: prod?.id || "p1",
          variantId: variant?.id,
          productName: prodName,
          sku: variant?.sku || "HENR-SP-01",
          quantity: qty,
          unitPrice: prodPrice,
          unitCost: prodCost,
          variantInfo: variantInfo
        }
      ],
      total: total,
      subtotal: total,
      shippingFee: 0,
      discount: 0,
      note: "Đơn Shopee Mall - SPX Express giao hàng",
      orderDate: orderDate,
      createdAt: orderDate,
      updatedAt: new Date().toISOString(),
      shippingCarrier: "SPX Express",
      trackingNumber: trackingNumber,
      shopeeFeeRate: 9.5,
      shopeeFeeAmount: Math.round(total * 0.095)
    };

    newOrders.push(order);
  }

  await db.orders.bulkAdd(newOrders);
  return newOrders.length;
}
