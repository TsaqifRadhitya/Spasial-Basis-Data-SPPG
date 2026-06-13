import type { SppgFeature, DeleteModalState } from "@/types/dashboard";
import DeleteIcon from "@/components/atoms/DeleteIcon";

interface SppgListItemProps {
  feature: SppgFeature;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (partial: Omit<DeleteModalState, "isOpen">) => void;
}

export default function SppgListItem({ feature: f, isSelected, onSelect, onDelete }: SppgListItemProps) {
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
        <h4 className="font-bold font-sans">{f.properties.nama}</h4>
        <p className={`font-serif ${isSelected ? "text-white/80" : "text-slate-600"}`}>{f.properties.alamat}</p>
        <div className={`flex justify-between text-[10px] pt-1 font-mono ${isSelected ? "text-white/70" : "text-[#1C322D]/70"}`}>
          <span>Node: {f.properties.node_id ?? "–"}</span>
          <span className="text-[#EBB552] font-bold">
            {isSelected ? "Terpilih - Rute Aktif" : "Klik untuk rute kurang dari atau sama dengan 6 km"}
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete({ type: "sppg", id: f.properties.id, name: f.properties.nama });
        }}
        className="p-3 border border-[#1C322D]/15 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 rounded-2xl transition-all cursor-pointer shrink-0 flex items-center justify-center self-stretch w-11"
        title="Hapus SPPG"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}
