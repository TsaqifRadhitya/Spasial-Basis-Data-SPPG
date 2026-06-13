"use client";

import React from "react";
import type { SekolahCollection, SekolahForm, DeleteModalState } from "@/types/dashboard";
import SekolahListItem from "@/components/molecules/SekolahListItem";

interface SekolahTabPanelProps {
  sekolahForm: SekolahForm;
  setSekolahForm: (form: SekolahForm) => void;
  formLoading: boolean;
  handleAddSekolah: (e: React.FormEvent) => void;
  sekolahData: SekolahCollection | null;
  selectedSekolahId: string | null;
  onSelectSekolah: (id: string | null) => void;
  onDelete: (partial: Omit<DeleteModalState, "isOpen">) => void;
  totalSchools: number;
  isPickerActive: boolean;
  setIsPickerActive: (active: boolean) => void;
  onClear: () => void;
}

export default function SekolahTabPanel({
  sekolahForm,
  setSekolahForm,
  formLoading,
  handleAddSekolah,
  sekolahData,
  selectedSekolahId,
  onSelectSekolah,
  onDelete,
  totalSchools,
  isPickerActive,
  setIsPickerActive,
  onClear,
}: SekolahTabPanelProps) {
  return (
    <div className="space-y-4">
      {/* Tambah Sekolah Form */}
      <form
        onSubmit={handleAddSekolah}
        className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]"
      >
        <h3 className="text-sm font-bold text-[#1C322D] font-sans">
          Tambah Sekolah
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nama Sekolah"
            value={sekolahForm.nama_sekolah}
            onChange={(e) =>
              setSekolahForm({
                ...sekolahForm,
                nama_sekolah: e.target.value,
              })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sekolahForm.jenjang}
              onChange={(e) =>
                setSekolahForm({
                  ...sekolahForm,
                  jenjang: e.target.value as "SD" | "SMP" | "SMA" | "SMK",
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] focus:outline-none focus:border-[#EBB552]"
            >
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
            </select>
            <input
              type="text"
              placeholder="Kelurahan (Terisi Otomatis)"
              value={sekolahForm.nama_kelurahan}
              readOnly
              className="w-full px-3 py-2 text-xs bg-slate-50 cursor-not-allowed border border-dashed border-[#1C322D]/20 rounded-lg text-slate-500 placeholder-slate-400 focus:outline-none"
              required
            />
          </div>
          <input
            type="text"
            placeholder="Alamat"
            value={sekolahForm.alamat}
            onChange={(e) =>
              setSekolahForm({
                ...sekolahForm,
                alamat: e.target.value,
              })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
            required
          />

          <button
            type="button"
            onClick={() => setIsPickerActive(!isPickerActive)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer font-mono
              ${isPickerActive 
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {isPickerActive ? 'Batal Pilih dari Peta' : 'Pilih dari Peta'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Longitude (X)"
              value={sekolahForm.longitude}
              onChange={(e) =>
                setSekolahForm({
                  ...sekolahForm,
                  longitude: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude (Y)"
              value={sekolahForm.latitude}
              onChange={(e) =>
                setSekolahForm({
                  ...sekolahForm,
                  latitude: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={formLoading}
          className="w-full py-2 bg-[#1C322D] hover:bg-[#1C322D]/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer font-mono flex items-center justify-center gap-1.5"
        >
          {formLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            "Simpan Sekolah"
          )}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="w-full py-2 border border-[#1C322D]/20 hover:bg-slate-50 text-[#1C322D]/70 rounded-lg text-xs font-bold transition-colors cursor-pointer font-mono mt-1"
        >
          Clear
        </button>
      </form>

      {/* Daftar Sekolah */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#1C322D]/60 uppercase tracking-wider font-mono">
          Sekolah Negeri ({totalSchools})
        </h3>
        <div className="space-y-2">
          {sekolahData?.features?.map((f) => {
            const isSelected = selectedSekolahId === f.properties.id;
            return (
              <SekolahListItem
                key={f.properties.id}
                feature={f}
                isSelected={isSelected}
                onSelect={() => onSelectSekolah(isSelected ? null : f.properties.id)}
                onDelete={onDelete}
              />
            );
          })}
          {(!sekolahData || !sekolahData.features || sekolahData.features.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              Tidak ada data sekolah.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
