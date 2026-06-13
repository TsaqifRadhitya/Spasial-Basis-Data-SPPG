"use client";

import { useState } from "react";
import ChevronIcon from "@/components/atoms/ChevronIcon";
import type { PanjangJalanItem, DrivingDistanceItem } from "@/types/dashboard";

interface SppgCoverageRowProps {
  sppgItem: PanjangJalanItem;
  drivingDistances: DrivingDistanceItem[];
}

export default function SppgCoverageRow({ sppgItem, drivingDistances }: SppgCoverageRowProps) {
  const [open, setOpen] = useState(false);
  const sekolahDilayani = drivingDistances.filter(
    (d) => d.sppg_id === sppgItem.sppg_id && d.status_cakupan !== "Blank Spot"
  );

  return (
    <div className="border border-[#1C322D]/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono hover:bg-[#F8F3EE] transition-colors"
      >
        <span className="font-semibold text-[#1C322D]/85 text-left">{sppgItem.nama_sppg}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-black text-[#1C322D]">
            {Math.round(sppgItem.total_panjang_meter / 1000)} km
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1C322D]/10 bg-[#F8F3EE]/60 divide-y divide-[#1C322D]/6">
          {sekolahDilayani.length === 0 ? (
            <p className="text-[11px] text-[#1C322D]/50 italic px-3 py-2">Tidak ada data sekolah.</p>
          ) : (
            sekolahDilayani.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <p className="font-semibold text-[#1C322D] font-sans leading-tight">{d.nama_sekolah}</p>
                </div>
                <span className="font-bold font-mono text-[#1C322D] shrink-0 ml-2">
                  {Math.round(d.jarak_tempuh_meter)} m
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
