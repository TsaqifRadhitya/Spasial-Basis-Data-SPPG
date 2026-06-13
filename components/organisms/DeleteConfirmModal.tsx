"use client";

import React from "react";
import type { DeleteModalState } from "@/types/dashboard";

interface DeleteConfirmModalProps {
  deleteModal: DeleteModalState;
  setDeleteModal: (val: DeleteModalState) => void;
  handleDeleteSppg: (id: string) => Promise<void>;
  handleDeleteSekolah: (id: string) => Promise<void>;
}

export default function DeleteConfirmModal({
  deleteModal,
  setDeleteModal,
  handleDeleteSppg,
  handleDeleteSekolah,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!deleteModal.isOpen) {
      setIsDeleting(false);
    }
  }, [deleteModal.isOpen]);

  if (!deleteModal.isOpen) return null;

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[#1C322D]/15 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 text-[#1C322D]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#F1CDBE]/30 rounded-xl text-[#E0533C] shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base font-sans">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteModal.type === "sppg" ? "SPPG" : "Sekolah"}{" "}
              <span className="font-bold text-[#1C322D]">{deleteModal.name}</span>?
              {deleteModal.type === "sppg" && (
                <span className="block mt-1.5 text-[10px] text-[#E0533C] bg-red-50 p-2 rounded-lg font-medium">
                  Peringatan: Menghapus SPPG ini akan merelokasi sekolah-sekolah yang dilayaninya ke
                  SPPG terdekat lainnya secara otomatis.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-[#1C322D]/10">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            className="px-4 py-2 border border-[#1C322D]/15 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-[#1C322D]/70 font-mono disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              try {
                if (deleteModal.type === "sppg") {
                  await handleDeleteSppg(deleteModal.id);
                } else {
                  await handleDeleteSekolah(deleteModal.id);
                }
                setDeleteModal({ ...deleteModal, isOpen: false });
              } catch (err) {
                console.error(err);
              } finally {
                setIsDeleting(false);
              }
            }}
            className="px-4 py-2 bg-[#E0533C] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer font-mono flex items-center justify-center gap-1.5 disabled:opacity-50 min-w-[90px]"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Hapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
