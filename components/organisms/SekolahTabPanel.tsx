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
              placeholder="Kelurahan"
              value={sekolahForm.nama_kelurahan}
              onChange={(e) =>
                setSekolahForm({
                  ...sekolahForm,
                  nama_kelurahan: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
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
          className="w-full py-2 bg-[#1C322D] hover:bg-[#1C322D]/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer font-mono"
        >
          Simpan Sekolah
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
