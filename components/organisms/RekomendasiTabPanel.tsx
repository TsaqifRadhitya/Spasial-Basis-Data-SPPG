"use client";

import React from "react";
import type { RekomendasiCollection, RekomendasiValidasiItem } from "@/types/dashboard";
import RekomendasiKlusterRow from "@/components/molecules/RekomendasiKlusterRow";

interface RekomendasiTabPanelProps {
  handleRecalculate: () => void;
  formLoading: boolean;
  rekomendasi: RekomendasiCollection | null;
  rekomendasiValidasi: RekomendasiValidasiItem[];
  selectedRekomendasiId: string | null;
  onSelectRekomendasi: (id: string | null) => void;
}

export default function RekomendasiTabPanel({
  handleRecalculate,
  formLoading,
  rekomendasi,
  rekomendasiValidasi,
  selectedRekomendasiId,
  onSelectRekomendasi,
}: RekomendasiTabPanelProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] font-sans">
          Perhitungan Sentroid
        </h3>
        <p className="text-xs text-[#1C322D]/80 font-serif mt-1">
          Menghitung titik rekomendasi lokasi SPPG baru dengan mencari sentroid dari kluster sekolah tidak terlayani.
        </p>
        <button
          onClick={handleRecalculate}
          disabled={formLoading}
          className="w-full py-2.5 bg-[#EBB552] hover:bg-[#d9a33f] text-[#1C322D] rounded-lg text-xs font-black transition-colors disabled:opacity-50 cursor-pointer font-mono mt-3 shadow-xs"
        >
          {formLoading ? "Mengkalkulasi..." : "Kalkulasi Ulang Rekomendasi"}
        </button>
      </div>

      {/* Daftar Rekomendasi Centroid - Collapsible */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] mb-1 font-sans">
          Rekomendasi Lokasi SPPG
        </h3>
        <p className="text-[11px] text-[#1C322D]/70 mb-3">
          Klik baris untuk sorot di peta · Klik ▾ untuk lihat sekolah
        </p>
        <div className="space-y-1.5">
          {rekomendasi?.features?.map((f) => {
            const cid = String(f.properties.kluster_id);
            const validasiRows = rekomendasiValidasi.filter(
              (v) => String(v.kluster_id) === cid
            );
            return (
              <RekomendasiKlusterRow
                key={cid}
                feature={f}
                validasiRows={validasiRows}
                isSelected={selectedRekomendasiId === cid}
                onSelect={() =>
                  onSelectRekomendasi(selectedRekomendasiId === cid ? null : cid)
                }
              />
            );
          })}
          {(!rekomendasi || !rekomendasi.features || rekomendasi.features.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              Tidak ada data rekomendasi. Klik Kalkulasi Ulang.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
