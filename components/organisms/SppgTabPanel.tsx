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
            placeholder="Alamat"
            value={sppgForm.alamat}
            onChange={(e) =>
              setSppgForm({ ...sppgForm, alamat: e.target.value })
            }
            className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
            required
          />
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
          className="w-full py-2 bg-[#1C322D] hover:bg-[#1C322D]/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer font-mono"
        >
          Simpan SPPG
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
