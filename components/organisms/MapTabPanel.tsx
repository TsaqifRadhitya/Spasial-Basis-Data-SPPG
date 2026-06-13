"use client";

import type { KelurahanStat } from "@/types/dashboard";
import KelurahanSummaryItem from "@/components/molecules/KelurahanSummaryItem";

interface MapTabPanelProps {
  showKelurahan: boolean;
  setShowKelurahan: (val: boolean) => void;
  showJalan: boolean;
  setShowJalan: (val: boolean) => void;
  showSppg: boolean;
  setShowSppg: (val: boolean) => void;
  showSchools: boolean;
  setShowSchools: (val: boolean) => void;
  showRekomendasi: boolean;
  setShowRekomendasi: (val: boolean) => void;
  kelurahanStats: KelurahanStat[];
  selectedKelurahan: string | null;
  onSelectKelurahan: (nama: string | null) => void;
}

export default function MapTabPanel({
  showKelurahan,
  setShowKelurahan,
  showJalan,
  setShowJalan,
  showSppg,
  setShowSppg,
  showSchools,
  setShowSchools,
  showRekomendasi,
  setShowRekomendasi,
  kelurahanStats,
  selectedKelurahan,
  onSelectKelurahan,
}: MapTabPanelProps) {
  return (
    <div className="space-y-4">
      {/* Layer Overlays Card */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] font-sans">
          Layer Overlays
        </h3>
        <div className="space-y-2">
          {[
            {
              id: "showKelurahan",
              label: "Batas Wilayah Administrasi",
              checked: showKelurahan,
              onChange: setShowKelurahan,
            },
            {
              id: "showJalan",
              label: "Jaringan Distribusi",
              checked: showJalan,
              onChange: setShowJalan,
            },
            {
              id: "showSppg",
              label: "Satuan Pelayanan Gizi (SPPG)",
              checked: showSppg,
              onChange: setShowSppg,
            },
            {
              id: "showSchools",
              label: "Sekolah Negeri",
              checked: showSchools,
              onChange: setShowSchools,
            },
            {
              id: "showRekomendasi",
              label: "Rekomendasi SPPG Baru",
              checked: showRekomendasi,
              onChange: setShowRekomendasi,
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4 cursor-pointer"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {/* Kelurahan Summary Card */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">
          Ringkasan per Kelurahan
        </h3>
        <div className="space-y-2 text-xs">
          {kelurahanStats.map((k) => {
            const isSelected = selectedKelurahan === k.nama_kelurahan;
            return (
              <KelurahanSummaryItem
                key={k.id}
                kelurahan={k}
                isSelected={isSelected}
                onSelect={() => onSelectKelurahan(isSelected ? null : k.nama_kelurahan)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
