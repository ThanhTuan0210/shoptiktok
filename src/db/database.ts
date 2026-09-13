import Dexie, { type EntityTable } from "dexie";
import type {
  Product, ProductVariant, StockMovement, Supplier,
  Order, Return, DefectiveItem, Expense, AppSettings,
} from "../types";

export class TikTokShopDB extends Dexie {
  products!: EntityTable<Product, "id">;
  productVariants!: EntityTable<ProductVariant, "id">;
  stockMovements!: EntityTable<StockMovement, "id">;
  suppliers!: EntityTable<Supplier, "id">;
  orders!: EntityTable<Order, "id">;
  returns!: EntityTable<Return, "id">;
  defectiveItems!: EntityTable<DefectiveItem, "id">;
  expenses!: EntityTable<Expense, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("TikTokShopDB");
    this.version(1).stores({
      products: "id, sku, name, category, isActive, createdAt",
      productVariants: "id, productId, sku, color, size, createdAt",
      stockMovements: "id, variantId, productId, type, date, referenceId, createdAt",
      suppliers: "id, name, createdAt",
      orders: "id, tiktokOrderId, status, orderDate, customerName, createdAt",
      returns: "id, orderId, status, returnDate, createdAt",
      defectiveItems: "id, productId, variantId, type, date, returnId, createdAt",
      expenses: "id, category, date, createdAt",
      settings: "++id",
    });
  }
}

export const db = new TikTokShopDB();
