import type { SekolahFeature, DeleteModalState } from "@/types/dashboard";
import DeleteIcon from "@/components/atoms/DeleteIcon";

interface SekolahListItemProps {
  feature: SekolahFeature;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (partial: Omit<DeleteModalState, "isOpen">) => void;
}

export default function SekolahListItem({ feature: f, isSelected, onSelect, onDelete }: SekolahListItemProps) {
  const isBlankSpot = !f.properties.id_sppg;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSelect}
        className={`flex-1 text-left p-3 border rounded-2xl text-xs space-y-1 shadow-sm transition-all cursor-pointer block ${
          isSelected
            ? "bg-[#1C322D] border-[#1C322D] text-white"
            : "bg-white border-[#1C322D]/15 text-[#1C322D] hover:bg-slate-50"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className={`font-bold font-sans ${isSelected ? "text-[#EBB552]" : "text-[#1C322D]"}`}>
            {f.properties.nama}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
              isBlankSpot
                ? "bg-[#F1CDBE] text-[#1C322D]"
                : isSelected
                  ? "bg-emerald-800 text-[#F8F3EE]"
                  : "bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]"
            }`}
          >
            {isBlankSpot ? "Tidak Terlayani" : "Terlayani"}
          </span>
        </div>
        <p className={`font-serif ${isSelected ? "text-white/80" : "text-slate-600"}`}>{f.properties.alamat}</p>
        <div className={`flex justify-between text-[10px] pt-1 font-mono ${isSelected ? "text-white/70" : "text-[#1C322D]/70"}`}>
          <span>Kelurahan: {f.properties.kelurahan}</span>
          <span className={`${isSelected ? "text-[#EBB552]" : "text-[#8B5CF6]"} font-bold`}>
            {isSelected ? "Terpilih - Rute Aktif" : isBlankSpot ? "Tidak Terlayani" : "Klik untuk lihat rute ke SPPG"}
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete({ type: "sekolah", id: f.properties.id, name: f.properties.nama });
        }}
        className="p-3 border border-[#1C322D]/15 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 rounded-2xl transition-all cursor-pointer shrink-0 flex items-center justify-center self-stretch w-11"
        title="Hapus Sekolah"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}
