interface SidebarHeaderProps {
  totalSppgs: number;
  totalSchools: number;
  coveragePercent: number;
  isLoading?: boolean;
}

export default function SidebarHeader({
  totalSppgs,
  totalSchools,
  coveragePercent,
  isLoading = false,
}: SidebarHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[#EBB552] bg-[#1C322D] px-2.5 py-0.5 rounded-full uppercase font-mono">
          Sistem Informasi Geografis
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#1C322D] mt-2 font-sans">
          Pemetaan & Cakupan SPPG
        </h1>
        <p className="text-xs text-[#1C322D]/70 mt-1 font-serif">
          Analisis Pelayanan Sekolah Negeri di Sumbersari, Jember
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "SPPG", value: totalSppgs, color: "text-[#EBB552]" },
          { label: "Sekolah", value: totalSchools, color: "text-[#F1CDBE]" },
          { label: "Cakupan", value: `${coveragePercent}%`, color: "text-[#1C322D]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-[#F8F3EE] rounded-2xl border border-[#1C322D]/15 shadow-xs hover:shadow-sm transition-all">
            <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">{label}</span>
            {isLoading ? (
              <div className="h-5 bg-slate-200/60 rounded animate-pulse w-3/4 mt-1.5" />
            ) : (
              <p className={`text-lg font-bold mt-0.5 font-sans ${color}`}>{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
