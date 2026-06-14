import type { KelurahanStat } from "@/types/dashboard";

interface KelurahanSummaryItemProps {
  kelurahan: KelurahanStat;
  isSelected: boolean;
  onSelect: () => void;
}

export default function KelurahanSummaryItem({ kelurahan: k, isSelected, onSelect }: KelurahanSummaryItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors font-mono ${
        isSelected
          ? "bg-[#1C322D] border-[#1C322D] text-white"
          : "bg-white border-[#1C322D]/15 hover:bg-slate-50 text-[#1C322D]"
      }`}
    >
      <span className="font-semibold">{k.nama_kelurahan}</span>
      <div className="flex items-center gap-1.5 text-[9px]">
        <span
          className={`px-1.5 py-0.5 rounded font-bold ${
            isSelected ? "bg-emerald-800 text-[#F8F3EE]" : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
          title="SPPG di Kelurahan"
        >
          SPPG: {k.sppg_count || 0}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded font-bold ${
            isSelected ? "bg-[#F8F3EE] text-[#1C322D]" : "bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]"
          }`}
          title="Sekolah Terlayani"
        >
          Skl: {k.terlayani_count}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded font-bold ${
            isSelected ? "bg-[#F1CDBE] text-[#1C322D]" : "bg-[#F1CDBE] border border-[#1C322D]/15 text-[#1C322D]"
          }`}
          title="Sekolah Tidak Terlayani"
        >
          TT: {k.blank_spot_count}
        </span>
      </div>
    </button>
  );
}
