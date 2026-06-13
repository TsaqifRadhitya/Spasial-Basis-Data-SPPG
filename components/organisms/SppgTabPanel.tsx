"use client";

import React from "react";
import type { SppgCollection, SppgForm, DeleteModalState } from "@/types/dashboard";
import SppgListItem from "@/components/molecules/SppgListItem";

interface SppgTabPanelProps {
  sppgForm: SppgForm;
  setSppgForm: (form: SppgForm) => void;
  formLoading: boolean;
  handleAddSppg: (e: React.FormEvent) => void;
  sppgData: SppgCollection | null;
  selectedSppgId: string | null;
  onSelectSppg: (id: string | null) => void;
  onDelete: (partial: Omit<DeleteModalState, "isOpen">) => void;
  isPickerActive: boolean;
  setIsPickerActive: (active: boolean) => void;
  onClear: () => void;
}

export default function SppgTabPanel({
  sppgForm,
  setSppgForm,
  formLoading,
  handleAddSppg,
  sppgData,
  selectedSppgId,
  onSelectSppg,
  onDelete,
  isPickerActive,
  setIsPickerActive,
  onClear,
}: SppgTabPanelProps) {
  return (
    <div className="space-y-4">
      {/* Tambah SPPG Form */}
      <form
        onSubmit={handleAddSppg}
        className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]"
      >
        <h3 className="text-sm font-bold text-[#1C322D] font-sans">
          Tambah SPPG
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nama SPPG"
            value={sppgForm.nama_sppg}
            onChange={(e) =>
              setSppgForm({ ...sppgForm, nama_sppg: e.target.value })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
            required
          />
          <input
            type="text"
            placeholder="Kelurahan (Terisi Otomatis)"
            value={sppgForm.nama_kelurahan}
            readOnly
            className="w-full px-3 py-2 text-xs bg-slate-50 cursor-not-allowed border border-dashed border-[#1C322D]/20 rounded-lg text-slate-500 placeholder-slate-400 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Alamat"
            value={sppgForm.alamat}
            onChange={(e) =>
              setSppgForm({ ...sppgForm, alamat: e.target.value })
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
              value={sppgForm.longitude}
              onChange={(e) =>
                setSppgForm({
                  ...sppgForm,
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
              value={sppgForm.latitude}
              onChange={(e) =>
                setSppgForm({ ...sppgForm, latitude: e.target.value })
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
            "Simpan SPPG"
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

      {/* Daftar SPPG */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#1C322D]/60 uppercase tracking-wider font-mono">
          Daftar SPPG Eksisting
        </h3>
        <div className="space-y-2">
          {sppgData?.features?.map((f) => {
            const isSelected = selectedSppgId === f.properties.id;
            return (
              <SppgListItem
                key={f.properties.id}
                feature={f}
                isSelected={isSelected}
                onSelect={() => onSelectSppg(isSelected ? null : f.properties.id)}
                onDelete={onDelete}
              />
            );
          })}
          {(!sppgData || !sppgData.features || sppgData.features.length === 0) && (
            <p className="text-xs text-slate-500 text-center py-4">
              Tidak ada data SPPG.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
