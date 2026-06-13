"use client";

import React from "react";
import type { CoverageStats } from "@/types/dashboard";
import SppgCoverageRow from "@/components/molecules/SppgCoverageRow";

interface CoverageTabPanelProps {
  coverageStats: CoverageStats;
}

export default function CoverageTabPanel({ coverageStats }: CoverageTabPanelProps) {
  return (
    <div className="space-y-4">
      {/* Panjang Jalan Coverage - Collapsible */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">
          Panjang Jalan Coverage
        </h3>
        <div className="space-y-1.5">
          {coverageStats?.panjangJalan?.map((sppgItem) => (
            <SppgCoverageRow
              key={sppgItem.sppg_id}
              sppgItem={sppgItem}
              drivingDistances={coverageStats?.drivingDistances ?? []}
            />
          ))}
          {(!coverageStats?.panjangJalan || coverageStats.panjangJalan.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              Tidak ada data panjang jalan coverage.
            </p>
          )}
        </div>
      </div>

      {/* SQ-02 Driving distance logs */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">
          Jarak Tempuh Jaringan Distribusi
        </h3>
        <div className="max-h-[300px] overflow-y-auto text-[11px] space-y-2 pr-1">
          {coverageStats?.drivingDistances?.map((item, idx) => (
            <div
              key={idx}
              className="p-2 bg-white rounded-lg border border-[#1C322D]/15 flex justify-between items-center shadow-xs text-[#1C322D]"
            >
              <div>
                <p className="font-semibold text-[#1C322D] font-sans">
                  {item.nama_sekolah}
                </p>
                {item.status_cakupan !== "Blank Spot" && (
                  <p className="text-[10px] text-[#1C322D]/70 font-mono">
                    ke: {item.nama_sppg ?? "–"}
                  </p>
                )}
              </div>
              <div className="text-right">
                {item.status_cakupan !== "Blank Spot" && (
                  <p className="font-bold text-[#1C322D] font-mono">
                    {Math.round(item.jarak_tempuh_meter)} m
                  </p>
                )}
                <span
                  className={`text-[9px] font-bold px-1 rounded font-mono border ${
                    item.status_cakupan === "Blank Spot"
                      ? "bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]"
                      : "bg-emerald-50 border-emerald-300 text-emerald-800"
                  }`}
                >
                  {item.status_cakupan}
                </span>
              </div>
            </div>
          ))}
          {(!coverageStats?.drivingDistances || coverageStats.drivingDistances.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              Tidak ada data jarak tempuh.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
