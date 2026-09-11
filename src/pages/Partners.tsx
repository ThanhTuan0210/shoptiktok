import EmptyState from "../components/ui/EmptyState";
import { UserCheck } from "lucide-react";
export default function Partners() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Đối tác & KOLs</h1>
          <p className="page-subtitle">Theo dõi đơn hàng Affiliate và thanh toán hoa hồng KOC</p>
        </div>
      </div>
      <EmptyState icon={UserCheck} title="Tính năng đang phát triển" description="Theo dõi hiệu quả chiến dịch Affiliate và KOL sẽ sớm được cập nhật." />
    </div>
  );
}
