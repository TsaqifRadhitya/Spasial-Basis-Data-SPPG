import type { ActiveTab } from "@/types/dashboard";

interface TabNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "map", label: "Peta" },
  { id: "sppg", label: "SPPG" },
  { id: "sekolah", label: "Sekolah" },
  { id: "coverage", label: "Analisis" },
  { id: "rekomendasi", label: "Rekomendasi" },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-[#F8F3EE] border border-[#1C322D]/15 rounded-xl mb-6">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
            activeTab === id
              ? "bg-[#1C322D] text-white shadow-xs"
              : "text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
