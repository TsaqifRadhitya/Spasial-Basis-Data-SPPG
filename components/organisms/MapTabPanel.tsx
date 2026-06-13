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
  activeKecamatans: string[];
  setActiveKecamatans: (val: string[]) => void;
  activeKelurahans: string[];
  setActiveKelurahans: (val: string[]) => void;
  activeJenjangs: string[];
  setActiveJenjangs: (val: string[]) => void;
  allKecamatans: string[];
  allKelurahans: string[];
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
  activeKecamatans,
  setActiveKecamatans,
  activeKelurahans,
  setActiveKelurahans,
  activeJenjangs,
  setActiveJenjangs,
  allKecamatans,
  allKelurahans,
}: MapTabPanelProps) {
  return (
    <div className="space-y-4">
      {/* Map Customize & Layer Overlays Card */}
      <div className="p-5 bg-white border border-[#1C322D]/15 rounded-2xl space-y-4 shadow-md text-[#1C322D]">
        <div className="flex items-center gap-2 border-b border-[#1C322D]/10 pb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-[#EBB552]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <h3 className="text-sm font-black text-[#1C322D] font-sans uppercase tracking-wider">
            Layer Customizer
          </h3>
        </div>

        <div className="space-y-4">
          {/* Section 1: Batas Wilayah Administrasi */}
          <div className="border border-[#1C322D]/10 rounded-xl overflow-hidden bg-[#F8F3EE]/40">
            <div className="flex items-center justify-between p-3 bg-[#F8F3EE]/80 border-b border-[#1C322D]/10">
              <label className="flex items-center gap-2.5 text-xs text-[#1C322D] font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showKelurahan}
                  onChange={(e) => setShowKelurahan(e.target.checked)}
                  className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4 cursor-pointer"
                />
                Batas Wilayah Administrasi
              </label>
            </div>
            
            {showKelurahan && (
              <div className="p-3.5 space-y-4">
                {/* Kecamatan Sub-group */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#1C322D]/60 uppercase tracking-widest">
                      Kecamatan (Batas Luar)
                    </span>
                    <div className="flex gap-2 text-[10px] text-[#1C322D]/60">
                      <button
                        type="button"
                        onClick={() => setActiveKecamatans(allKecamatans)}
                        className="hover:text-[#EBB552] transition-colors font-bold cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setActiveKecamatans([])}
                        className="hover:text-red-500 transition-colors font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allKecamatans.map((kec) => (
                      <label
                        key={kec}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#1C322D]/85 hover:text-[#1C322D] select-none"
                      >
                        <input
                          type="checkbox"
                          checked={activeKecamatans.includes(kec)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActiveKecamatans([...activeKecamatans, kec]);
                            } else {
                              setActiveKecamatans(activeKecamatans.filter((k) => k !== kec));
                            }
                          }}
                          className="rounded border-[#1C322D]/25 bg-white text-[#1C322D] focus:ring-[#1C322D] w-3.5 h-3.5 cursor-pointer"
                        />
                        {kec}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kelurahan Sub-group */}
                <div className="space-y-2 border-t border-[#1C322D]/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#1C322D]/60 uppercase tracking-widest">
                      Kelurahan (Sumbersari)
                    </span>
                    <div className="flex gap-2 text-[10px] text-[#1C322D]/60">
                      <button
                        type="button"
                        onClick={() => setActiveKelurahans(allKelurahans)}
                        className="hover:text-[#EBB552] transition-colors font-bold cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setActiveKelurahans([])}
                        className="hover:text-red-500 transition-colors font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {allKelurahans.map((kel) => (
                      <label
                        key={kel}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#1C322D]/85 hover:text-[#1C322D] select-none"
                      >
                        <input
                          type="checkbox"
                          checked={activeKelurahans.includes(kel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActiveKelurahans([...activeKelurahans, kel]);
                            } else {
                              setActiveKelurahans(activeKelurahans.filter((k) => k !== kel));
                            }
                          }}
                          className="rounded border-[#1C322D]/25 bg-white text-[#1C322D] focus:ring-[#1C322D] w-3.5 h-3.5 cursor-pointer"
                        />
                        {kel}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Sekolah Negeri */}
          <div className="border border-[#1C322D]/10 rounded-xl overflow-hidden bg-[#F8F3EE]/40">
            <div className="flex items-center justify-between p-3 bg-[#F8F3EE]/80 border-b border-[#1C322D]/10">
              <label className="flex items-center gap-2.5 text-xs text-[#1C322D] font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSchools}
                  onChange={(e) => setShowSchools(e.target.checked)}
                  className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4 cursor-pointer"
                />
                Sekolah Negeri
              </label>
            </div>

            {showSchools && (
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-[#1C322D]/60 uppercase tracking-widest">
                    Jenjang Pendidikan
                  </span>
                  <div className="flex gap-2 text-[10px] text-[#1C322D]/60">
                    <button
                      type="button"
                      onClick={() => setActiveJenjangs(["SD", "SMP", "SMA", "SMK"])}
                      className="hover:text-[#EBB552] transition-colors font-bold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setActiveJenjangs([])}
                      className="hover:text-red-500 transition-colors font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["SD", "SMP", "SMA", "SMK"].map((jenjang) => (
                    <label
                      key={jenjang}
                      className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#1C322D]/85 hover:text-[#1C322D] select-none"
                    >
                      <input
                        type="checkbox"
                        checked={activeJenjangs.includes(jenjang)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveJenjangs([...activeJenjangs, jenjang]);
                          } else {
                            setActiveJenjangs(activeJenjangs.filter((j) => j !== jenjang));
                          }
                        }}
                        className="rounded border-[#1C322D]/25 bg-white text-[#1C322D] focus:ring-[#1C322D] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#1C322D]/5 border border-[#1C322D]/10">
                        {jenjang}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Other Layers */}
          <div className="border border-[#1C322D]/10 rounded-xl p-3.5 bg-[#F8F3EE]/20 space-y-3">
            <span className="text-[10px] font-black text-[#1C322D]/60 uppercase tracking-widest block mb-1">
              Layer Operasional Lainnya
            </span>
            <div className="space-y-2.5">
              {[
                {
                  id: "showSppg",
                  label: "Satuan Pelayanan Gizi (SPPG)",
                  checked: showSppg,
                  onChange: setShowSppg,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#EBB552]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ),
                },
                {
                  id: "showJalan",
                  label: "Jaringan Distribusi (Jalan)",
                  checked: showJalan,
                  onChange: setShowJalan,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4 19h16M4 5h16M12 5v14" />
                    </svg>
                  ),
                },
                {
                  id: "showRekomendasi",
                  label: "Rekomendasi SPPG Baru",
                  checked: showRekomendasi,
                  onChange: setShowRekomendasi,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                    </svg>
                  ),
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
                  <div className="flex items-center gap-1.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kelurahan Summary Card */}
      <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
        <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">
          Ringkasan per Kelurahan
        </h3>
        <div className="space-y-2 text-xs">
          {kelurahanStats
            .filter((k) => activeKelurahans.includes(k.nama_kelurahan))
            .map((k) => {
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
