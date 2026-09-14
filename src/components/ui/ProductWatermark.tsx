import React from "react";

interface ProductWatermarkProps {
  text?: string;
  className?: string;
}

export default function ProductWatermark({
  text = "Henr.Studio • Thiết Kế Độc Quyền",
  className = "",
}: ProductWatermarkProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden flex items-center justify-center z-10 ${className}`}
      aria-hidden="true"
    >
      <div className="rotate-[-25deg] transform opacity-70 transition-opacity">
        <span className="text-white font-extrabold tracking-widest text-[11px] md:text-xs uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/40 border border-white/60 rounded-md px-3 py-1 whitespace-nowrap shadow-lg">
          🛡️ {text}
        </span>
      </div>
    </div>
  );
}
