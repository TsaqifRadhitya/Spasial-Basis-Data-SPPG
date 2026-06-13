"use client";

import { useState } from "react";
import ChevronIcon from "@/components/atoms/ChevronIcon";
import type { RekomendasiFeature, RekomendasiValidasiItem } from "@/types/dashboard";

interface RekomendasiKlusterRowProps {
  feature: RekomendasiFeature;
  validasiRows: RekomendasiValidasiItem[];
  isSelected: boolean;
  onSelect: () => void;
}

export default function RekomendasiKlusterRow({
  feature,
  validasiRows,
  isSelected,
  onSelect,
}: RekomendasiKlusterRowProps) {
  const [open, setOpen] = useState(false);
  const klusterId = feature.properties.kluster_id;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        isSelected ? "border-[#1C322D] ring-2 ring-[#EBB552]/40" : "border-[#1C322D]/10"
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2.5 ${
          isSelected ? "bg-[#1C322D] text-white" : "bg-white text-[#1C322D]"
        }`}
      >
        <button onClick={onSelect} className="flex items-center gap-2 flex-1 text-left">
          <div
            className={`p-1 rounded-lg border shrink-0 ${
              isSelected ? "bg-[#EBB552]/20 border-[#EBB552]" : "bg-[#1C322D]/8 border-transparent"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3.5 h-3.5 ${isSelected ? "text-[#EBB552]" : "text-[#1C322D]"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div>
            <p className={`font-black text-xs font-sans ${isSelected ? "text-white" : "text-slate-900"}`}>
              Kluster #{klusterId + 1}
            </p>
            <p className={`text-[10px] font-medium font-sans ${isSelected ? "text-white/70" : "text-slate-500"}`}>
              {feature.properties.jumlah_sekolah} Sekolah Blank Spot
            </p>
          </div>
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`p-1.5 rounded-lg ml-2 shrink-0 transition-colors ${
            isSelected ? "hover:bg-white/10" : "hover:bg-[#1C322D]/5"
          }`}
          title={open ? "Tutup" : "Lihat sekolah"}
        >
          <ChevronIcon
            open={open}
            className={`w-3.5 h-3.5 ${isSelected ? "text-white/70" : "text-[#1C322D]/50"}`}
          />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#1C322D]/10 bg-[#F8F3EE]/60 divide-y divide-[#1C322D]/6">
          {validasiRows.length === 0 ? (
            <p className="text-[11px] text-[#1C322D]/50 italic px-3 py-2">Tidak ada data validasi.</p>
          ) : (
            validasiRows.map((v, idx) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1 h-1 rounded-full shrink-0 ${
                      v.status_validasi === "Terjangkau" ? "bg-emerald-500" : "bg-[#E0533C]"
                    }`}
                  />
                  <p className="font-semibold text-[#1C322D] font-sans leading-tight">{v.nama_sekolah}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-bold font-mono text-[10px] text-[#1C322D]">{Math.round(v.jarak_meter)} m</p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border block mt-0.5 ${
                      v.status_validasi === "Terjangkau"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]"
                    }`}
                  >
                    {v.status_validasi}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
