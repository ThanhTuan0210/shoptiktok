import EmptyState from "../components/ui/EmptyState";
import { Users } from "lucide-react";
export default function Customers() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Khách hàng thân thiết (CRM)</h1>
          <p className="page-subtitle">Quản lý khách mua lại, gửi mã giảm giá remarketing</p>
        </div>
      </div>
      <EmptyState icon={Users} title="Tính năng đang phát triển" description="Hệ thống tự động gom nhóm khách hàng mua từ 2 lần trở lên sẽ sớm ra mắt." />
    </div>
  );
}
