type StatusVariant = "terlayani" | "blank_spot" | "terjangkau" | "di_luar";

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  className?: string;
  selected?: boolean;
}

const VARIANTS: Record<StatusVariant, { base: string; selected?: string }> = {
  terlayani: {
    base: "bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]",
    selected: "bg-emerald-800 text-[#F8F3EE]",
  },
  blank_spot: {
    base: "bg-[#F1CDBE] text-[#1C322D]",
    selected: "bg-[#F1CDBE] text-[#1C322D]",
  },
  terjangkau: {
    base: "bg-emerald-50 border border-emerald-300 text-emerald-800",
  },
  di_luar: {
    base: "bg-[#F1CDBE] border border-[#1C322D]/20 text-[#1C322D]",
  },
};

export default function StatusBadge({ variant, label, className = "", selected = false }: StatusBadgeProps) {
  const v = VARIANTS[variant];
  const cls = selected && v.selected ? v.selected : v.base;
  const defaultLabel =
    variant === "terlayani" ? "Terlayani" :
    variant === "blank_spot" ? "Tidak Terlayani" :
    variant === "terjangkau" ? "Terjangkau" : "Di luar jangkauan";

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${cls} ${className}`}>
      {label ?? defaultLabel}
    </span>
  );
}
