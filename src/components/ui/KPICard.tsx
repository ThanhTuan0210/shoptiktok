import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/helpers";

interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  color: string;
  prefix?: string;
  suffix?: string;
  format?: "currency" | "number" | "percent" | "raw";
  subtitle?: string;
}

const colorMap: Record<string, string> = {
  rose: "bg-rose-600/20 text-rose-400",
  emerald: "bg-emerald-600/20 text-emerald-400",
  blue: "bg-blue-600/20 text-blue-400",
  purple: "bg-purple-600/20 text-purple-400",
  amber: "bg-amber-600/20 text-amber-400",
  red: "bg-red-600/20 text-red-400",
  cyan: "bg-cyan-600/20 text-cyan-400",
  indigo: "bg-indigo-600/20 text-indigo-400",
};

function formatValue(value: number, fmt: KPICardProps["format"] = "currency"): string {
  switch (fmt) {
    case "currency": return formatCurrency(value);
    case "number": return formatNumber(value);
    case "percent": return `${value.toFixed(1)}%`;
    default: return String(value);
  }
}

export default function KPICard({ title, value, change, icon: Icon, color, prefix, suffix, format = "currency", subtitle }: KPICardProps) {
  const iconClass = colorMap[color] || colorMap.rose;

  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconClass}`}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-gray-400"
          }`}>
            {change > 0 ? <TrendingUp size={14} /> : change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white truncate">
          {prefix}{formatValue(value, format)}{suffix}
        </p>
        <p className="text-sm text-gray-400 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
