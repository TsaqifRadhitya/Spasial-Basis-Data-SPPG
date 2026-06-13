"use client";

import React from "react";
import type {
  SekolahCollection,
  SppgCollection,
  KelurahanStat,
  RekomendasiCollection,
  RekomendasiValidasiItem,
  CoverageStats,
  DeleteModalState,
} from "@/types/dashboard";

interface MapOverlayPanelProps {
  selectedSekolahId: string | null;
  sekolahData: SekolahCollection | null;
  selectedSppgId: string | null;
  sppgData: SppgCollection | null;
  selectedKelurahan: string | null;
  kelurahanStats: KelurahanStat[];
  selectedRekomendasiId: string | null;
  rekomendasi: RekomendasiCollection | null;
  rekomendasiValidasi: RekomendasiValidasiItem[];
  coverageStats: CoverageStats;
  setSelectedSekolahId: (id: string | null) => void;
  setSelectedSppgId: (id: string | null) => void;
  setSelectedKelurahan: (nama: string | null) => void;
  setSelectedRekomendasiId: (id: string | null) => void;
  onDelete: (partial: Omit<DeleteModalState, "isOpen">) => void;
}

export default function MapOverlayPanel({
  selectedSekolahId,
  sekolahData,
  selectedSppgId,
  sppgData,
  selectedKelurahan,
  kelurahanStats,
  selectedRekomendasiId,
  rekomendasi,
  rekomendasiValidasi,
  coverageStats,
  setSelectedSekolahId,
  setSelectedSppgId,
  setSelectedKelurahan,
  setSelectedRekomendasiId,
  onDelete,
}: MapOverlayPanelProps) {
  const schoolProps =
    selectedSekolahId &&
    sekolahData?.features?.find(
      (f) => f.properties.id === selectedSekolahId
    )?.properties;

  const sppgProps =
    selectedSppgId &&
    sppgData?.features?.find(
      (f) => f.properties.id === selectedSppgId
    )?.properties;

  const kelProps =
    selectedKelurahan &&
    kelurahanStats?.find(
      (k) => k.nama_kelurahan === selectedKelurahan
    );

  if (schoolProps) {
    return (
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white/95 backdrop-blur-md border border-[#1C322D]/15 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-h-[85%] overflow-y-auto text-[#1C322D]"
      >
        <div className="flex items-start justify-between border-b border-[#1C322D]/10 pb-2">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-[#8B5CF6] uppercase font-mono bg-[#8B5CF6]/10 px-2 py-0.5 rounded-md">
              Detail Sekolah
            </span>
            <h3 className="font-bold text-sm text-[#1C322D] mt-1 font-sans">
              {schoolProps.nama}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                onDelete({
                  type: "sekolah",
                  id: selectedSekolahId!,
                  name: schoolProps.nama,
                });
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
              title="Hapus Sekolah"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={() => setSelectedSekolahId(null)}
              className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">
              Jenjang & Kelurahan
            </span>
            <p className="font-semibold text-slate-800 font-sans mt-0.5">
              {schoolProps.jenjang} — Kel. {schoolProps.kelurahan ?? "–"}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">
              Alamat
            </span>
            <p className="font-serif text-slate-700 mt-0.5 leading-relaxed">
              {schoolProps.alamat}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">
              Status Pelayanan
            </span>
            <div className="mt-1">
              {schoolProps.id_sppg ? (
                (() => {
                  const servingSppg = sppgData?.features?.find(
                    (f) => f.properties.id === schoolProps.id_sppg
                  )?.properties;
                  const distItem = coverageStats?.drivingDistances?.find(
                    (d) => d.nama_sekolah === schoolProps.nama
                  );
                  return (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>Terlayani oleh SPPG</span>
                      </div>
                      <p className="font-semibold text-emerald-950 font-sans text-xs">
                        {servingSppg?.nama || "SPPG Terdekat"}
                      </p>
                      {distItem && (
                        <p className="text-[10px] text-emerald-850 font-mono mt-1 pt-1 border-t border-emerald-200/50">
                          Jarak Tempuh:{" "}
                          <span className="font-bold">
                            {Math.round(distItem.jarak_tempuh_meter)} m
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-2.5 bg-[#F1CDBE]/20 border border-[#F1CDBE]/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[#E0533C] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E0533C]"></span>
                    <span>Blank Spot (Tidak Terlayani)</span>
                  </div>
                  <p className="text-[#1C322D]/85 leading-snug text-[10px]">
                    Sekolah berada di luar radius mengemudi 6 km dari semua SPPG aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sppgProps) {
    return (
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white/95 backdrop-blur-md border border-[#1C322D]/15 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-h-[85%] overflow-y-auto text-[#1C322D]"
      >
        <div className="flex items-start justify-between border-b border-[#1C322D]/10 pb-2">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-[#EBB552] uppercase font-mono bg-[#EBB552]/10 px-2 py-0.5 rounded-md">
              Detail SPPG
            </span>
            <h3 className="font-bold text-sm text-[#1C322D] mt-1 font-sans">
              {sppgProps.nama}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                onDelete({
                  type: "sppg",
                  id: selectedSppgId!,
                  name: sppgProps.nama,
                });
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
              title="Hapus SPPG"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={() => setSelectedSppgId(null)}
              className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">
              Alamat
            </span>
            <p className="font-serif text-slate-700 mt-0.5 leading-relaxed">
              {sppgProps.alamat}
            </p>
          </div>

          <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10">
            <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">
              Sekolah Dilayani
            </span>
            <p className="text-xs font-bold text-[#EBB552] mt-0.5 font-sans">
              {(() => {
                const served =
                  sekolahData?.features?.filter(
                    (f) => f.properties.id_sppg === selectedSppgId
                  ) || [];
                return served.length;
              })()}{" "}
              <span className="text-[10px] font-normal text-[#1C322D]">unit</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono block mb-1">
              Daftar Sekolah yang Dilayani
            </span>
            {(() => {
              const served =
                sekolahData?.features?.filter(
                  (f) => f.properties.id_sppg === selectedSppgId
                ) || [];
              if (served.length === 0) {
                return (
                  <p className="text-[11px] text-[#1C322D]/60 italic py-1">
                    Tidak melayani sekolah manapun dalam radius 6km.
                  </p>
                );
              }
              return (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 mt-1">
                  {served.map((item) => {
                    const distVal = coverageStats?.drivingDistances?.find(
                      (d) => d.nama_sekolah === item.properties.nama
                    );
                    return (
                      <div
                        key={item.properties.id}
                        className="p-2 bg-[#F8F3EE]/50 border border-[#1C322D]/10 rounded-xl flex justify-between items-center hover:bg-[#F8F3EE] transition-colors cursor-pointer text-left"
                        onClick={() => {
                          setSelectedSekolahId(item.properties.id);
                          setSelectedSppgId(null);
                        }}
                      >
                        <div>
                          <p className="font-semibold text-slate-800 font-sans text-[11px]">
                            {item.properties.nama}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            Kel. {item.properties.kelurahan ?? "–"}
                          </p>
                        </div>
                        {distVal && (
                          <span className="text-[9px] font-bold bg-[#1C322D] text-[#EBB552] px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                            {Math.round(distVal.jarak_tempuh_meter)} m
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  if (kelProps) {
    const servedPercent =
      kelProps.total_sekolah > 0
        ? Math.round((kelProps.terlayani_count / kelProps.total_sekolah) * 100)
        : 0;
    const schoolsInKel =
      sekolahData?.features?.filter(
        (f) => f.properties.kelurahan === selectedKelurahan
      ) || [];
    const sppgsInKel =
      sppgData?.features?.filter(
        (f) => f.properties.kelurahan === selectedKelurahan
      ) || [];

    return (
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white/95 backdrop-blur-md border border-[#1C322D]/15 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-h-[85%] overflow-y-auto text-[#1C322D]"
      >
        <div className="flex items-start justify-between border-b border-[#1C322D]/10 pb-2">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-[#EBB552] uppercase font-mono bg-[#EBB552]/10 px-2 py-0.5 rounded-md">
              Detail Kelurahan
            </span>
            <h3 className="font-bold text-sm text-[#1C322D] mt-1 font-sans">
              Kel. {kelProps.nama_kelurahan}
            </h3>
          </div>
          <button
            onClick={() => setSelectedKelurahan(null)}
            className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
            <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">
              Total SPPG
            </span>
            <p className="text-xs font-black text-[#1C322D] mt-1 font-mono">
              {kelProps.sppg_count || 0}
            </p>
          </div>
          <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
            <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">
              Total Skl
            </span>
            <p className="text-xs font-black text-[#1C322D] mt-1 font-mono">
              {kelProps.total_sekolah}
            </p>
          </div>
          <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
            <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">
              Cakupan
            </span>
            <p className="text-xs font-black text-emerald-800 mt-1 font-mono">
              {servedPercent}%
            </p>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-between col-span-2">
            <span className="text-[8px] text-emerald-700 font-bold uppercase font-mono leading-none">
              Sekolah Terlayani
            </span>
            <p className="text-xs font-black text-emerald-800 mt-1 font-mono">
              {kelProps.terlayani_count}
            </p>
          </div>
          <div className="p-2 bg-[#F1CDBE]/20 border border-[#F1CDBE]/40 rounded-xl flex flex-col justify-between">
            <span className="text-[8px] text-[#E0533C] font-bold uppercase font-mono leading-none">
              Blank Spot
            </span>
            <p className="text-xs font-black text-[#E0533C] mt-1 font-mono">
              {kelProps.blank_spot_count}
            </p>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono block mb-1">
            Daftar SPPG di Kelurahan
          </span>
          {sppgsInKel.length === 0 ? (
            <p className="text-[11px] text-[#1C322D]/60 italic py-1">
              Tidak ada SPPG di kelurahan ini.
            </p>
          ) : (
            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 mt-1 font-sans">
              {sppgsInKel.map((item) => (
                <div
                  key={item.properties.id}
                  className="p-2 bg-[#EBB552]/10 border border-[#EBB552]/30 rounded-xl flex justify-between items-center hover:bg-[#EBB552]/20 transition-colors cursor-pointer text-left"
                  onClick={() => {
                    setSelectedSppgId(item.properties.id);
                    setSelectedKelurahan(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 text-[#1C322D]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"
                      />
                    </svg>
                    <p className="font-bold text-slate-800 font-sans text-[11px]">
                      {item.properties.nama}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold bg-[#1C322D] text-[#EBB552] px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                    SPPG
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono block mb-1">
            Daftar Sekolah di Kelurahan
          </span>
          {schoolsInKel.length === 0 ? (
            <p className="text-[11px] text-[#1C322D]/60 italic py-1">
              Tidak ada sekolah terdaftar di kelurahan ini.
            </p>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 mt-1">
              {schoolsInKel.map((item) => {
                const isBlank = !item.properties.id_sppg;
                return (
                  <div
                    key={item.properties.id}
                    className="p-2 bg-[#F8F3EE]/50 border border-[#1C322D]/10 rounded-xl flex justify-between items-center hover:bg-[#F8F3EE] transition-colors cursor-pointer text-left"
                    onClick={() => {
                      setSelectedSekolahId(item.properties.id);
                      setSelectedKelurahan(null);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isBlank ? "bg-[#E0533C]" : "bg-emerald-500"}`}
                      ></span>
                      <p className="font-semibold text-slate-800 font-sans text-[11px]">
                        {item.properties.nama}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ml-2 ${
                        isBlank ? "bg-[#F1CDBE] text-[#1C322D]" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isBlank ? "Blank Spot" : "Terlayani"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedRekomendasiId) {
    const rekFeature = rekomendasi?.features?.find(
      (f) => String(f.properties.kluster_id) === selectedRekomendasiId
    );
    const validasiRows = rekomendasiValidasi.filter(
      (v) => String(v.kluster_id) === selectedRekomendasiId
    );

    return (
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white/95 backdrop-blur-md border border-[#1C322D]/15 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-h-[85%] overflow-y-auto text-[#1C322D]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#EBB552]/20 border border-[#EBB552] rounded-lg shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#EBB552]"
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
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#1C322D]/50 font-mono">
                Rekomendasi Centroid
              </span>
              <h3 className="font-black text-sm text-[#1C322D] font-sans leading-tight">
                Kluster #{parseInt(selectedRekomendasiId) + 1}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedRekomendasiId(null)}
            className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {rekFeature && (
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">
                Koordinat Sentroid
              </span>
              <p className="font-mono text-slate-700 mt-0.5 text-[11px]">
                {Number(rekFeature.properties.latitude).toFixed(6)},{" "}
                {Number(rekFeature.properties.longitude).toFixed(6)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between col-span-3">
                <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">
                  Total Sekolah Blank Spot
                </span>
                <p className="text-xs font-black text-[#1C322D] mt-1 font-mono">
                  {rekFeature.properties.jumlah_sekolah}
                </p>
              </div>
            </div>

            {validasiRows.length > 0 && (
              <div>
                <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono block mb-1">
                  Validasi Jangkauan Sekolah
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {validasiRows.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#F8F3EE]/50 border border-[#1C322D]/10 rounded-xl flex justify-between items-center"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            v.status_validasi === "Terjangkau" ? "bg-emerald-500" : "bg-[#E0533C]"
                          }`}
                        />
                        <p className="font-semibold text-slate-800 font-sans text-[11px] leading-tight">
                          {v.nama_sekolah}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold font-mono text-[10px] text-[#1C322D]">
                          {Math.round(v.jarak_meter)} m
                        </p>
                        {v.status_validasi !== "Terjangkau" && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border block mt-0.5 bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]"
                          >
                            {v.status_validasi}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
