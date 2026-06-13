"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";

import {
  useSppgQuery,
  useSppgRoutesQuery,
  useAddSppgMutation,
  useDeleteSppgMutation,
} from "@/hooks/useSppg";
import {
  useSekolahQuery,
  useSchoolRouteQuery,
  useAddSekolahMutation,
  useDeleteSekolahMutation,
} from "@/hooks/useSekolah";
import {
  useKelurahanStatsQuery,
  useKelurahanGeojsonQuery,
} from "@/hooks/useKelurahan";
import { useCoverageStatsQuery } from "@/hooks/useCoverage";
import {
  useRekomendasiQuery,
  useRekomendasiValidasiQuery,
  useRecalculateRekomendasiMutation,
} from "@/hooks/useRekomendasi";

import SidebarHeader from "@/components/organisms/SidebarHeader";
import TabNav from "@/components/organisms/TabNav";
import MapTabPanel from "@/components/organisms/MapTabPanel";
import SppgTabPanel from "@/components/organisms/SppgTabPanel";
import SekolahTabPanel from "@/components/organisms/SekolahTabPanel";
import CoverageTabPanel from "@/components/organisms/CoverageTabPanel";
import RekomendasiTabPanel from "@/components/organisms/RekomendasiTabPanel";
import MapOverlayPanel from "@/components/organisms/MapOverlayPanel";
import DeleteConfirmModal from "@/components/organisms/DeleteConfirmModal";
import ToastContainer from "@/components/organisms/ToastContainer";

import type {
  ActiveTab,
  DeleteModalState,
  Toast,
  ToastType,
  SekolahFeature,
  GeoJSONFeature,
  KelurahanFeatureProperties,
} from "@/types/dashboard";
import type { SppgForm } from "@/modules/sppg/types";
import type { SekolahForm } from "@/modules/sekolah/types";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
      <div className="text-center text-slate-400">
        <svg
          className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="text-sm font-semibold">Memuat Peta Spasial...</span>
      </div>
    </div>
  ),
});

const SidebarSkeleton = ({ activeTab }: { activeTab: string }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {activeTab === "map" && (
        <>
          {}
          <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3 pt-2">
              <div className="h-10 bg-slate-100 rounded-xl"></div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
              <div className="h-24 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-100 rounded-xl animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "sppg" && (
        <>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="h-9 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "sekolah" && (
        <>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="h-9 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "coverage" && (
        <>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "rekomendasi" && (
        <>
          {}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
            <div className="h-12 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("map");

  const [showKelurahan, setShowKelurahan] = useState(true);
  const [showJalan, setShowJalan] = useState(true);
  const [showSppg, setShowSppg] = useState(true);
  const [showSchools, setShowSchools] = useState(true);
  const [showRekomendasi, setShowRekomendasi] = useState(true);

  const [selectedKelurahan, setSelectedKelurahan] = useState<string | null>(
    null,
  );
  const [selectedSppgId, setSelectedSppgId] = useState<string | null>(null);
  const [selectedSekolahId, setSelectedSekolahId] = useState<string | null>(
    null,
  );
  const [selectedRekomendasiId, setSelectedRekomendasiId] = useState<
    string | null
  >(null);

  const { data: sppgData = null, isLoading: isLoadingSppg } = useSppgQuery();
  const { data: sekolahData = null, isLoading: isLoadingSekolah } =
    useSekolahQuery();
  const { data: kelurahanBoundaries = null, isLoading: isLoadingBoundaries } =
    useKelurahanGeojsonQuery();
  const { data: rekomendasi = null, isLoading: isLoadingRekomendasi } =
    useRekomendasiQuery();
  const { data: kelurahanStats = [], isLoading: isLoadingKelurahanStats } =
    useKelurahanStatsQuery();
  const {
    data: coverageStats = { panjangJalan: [], drivingDistances: [] },
    isLoading: isLoadingCoverage,
  } = useCoverageStatsQuery();
  const { data: rekomendasiValidasi = [], isLoading: isLoadingValidasi } =
    useRekomendasiValidasiQuery();

  const isDataLoading =
    isLoadingSppg ||
    isLoadingSekolah ||
    isLoadingBoundaries ||
    isLoadingRekomendasi ||
    isLoadingKelurahanStats ||
    isLoadingCoverage ||
    isLoadingValidasi;

  const [activeKecamatans, setActiveKecamatans] = useState<string[]>([]);
  const [activeKelurahans, setActiveKelurahans] = useState<string[]>([]);
  const [activeJenjangs, setActiveJenjangs] = useState<string[]>([
    "SD",
    "SMP",
    "SMA",
    "SMK",
  ]);

  const allKecamatans = useMemo(() => {
    if (!kelurahanBoundaries) return [];
    return Array.from(
      new Set<string>(
        kelurahanBoundaries.features
          .filter(
            (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
              f.properties.tipe === "kecamatan",
          )
          .map(
            (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
              f.properties.nama,
          ),
      ),
    ).sort();
  }, [kelurahanBoundaries]);

  const allKelurahans = useMemo(() => {
    if (!kelurahanBoundaries) return [];
    return Array.from(
      new Set<string>(
        kelurahanBoundaries.features
          .filter(
            (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
              f.properties.tipe === "kelurahan",
          )
          .map(
            (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
              f.properties.nama,
          ),
      ),
    ).sort();
  }, [kelurahanBoundaries]);

  useEffect(() => {
    if (kelurahanBoundaries) {
      const kecs: string[] = Array.from(
        new Set<string>(
          kelurahanBoundaries.features
            .filter(
              (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
                f.properties.tipe === "kecamatan",
            )
            .map(
              (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
                f.properties.nama,
            ),
        ),
      ).sort();
      const kels: string[] = Array.from(
        new Set<string>(
          kelurahanBoundaries.features
            .filter(
              (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
                f.properties.tipe === "kelurahan",
            )
            .map(
              (f: GeoJSONFeature<KelurahanFeatureProperties>) =>
                f.properties.nama,
            ),
        ),
      ).sort();
      Promise.resolve().then(() => {
        setActiveKecamatans((prev) => (prev.length === 0 ? kecs : prev));
        setActiveKelurahans((prev) => (prev.length === 0 ? kels : prev));
      });
    }
  }, [kelurahanBoundaries]);

  const filteredKelurahan = useMemo(() => {
    if (!kelurahanBoundaries) return null;
    return {
      ...kelurahanBoundaries,
      features: kelurahanBoundaries.features.filter(
        (f: GeoJSONFeature<KelurahanFeatureProperties>) => {
          if (f.properties.tipe === "kecamatan") {
            return activeKecamatans.includes(f.properties.nama);
          } else {
            return activeKelurahans.includes(f.properties.nama);
          }
        },
      ),
    };
  }, [kelurahanBoundaries, activeKecamatans, activeKelurahans]);

  const filteredSchools = useMemo(() => {
    if (!sekolahData) return null;
    return {
      ...sekolahData,
      features: sekolahData.features.filter((f: SekolahFeature) =>
        activeJenjangs.includes(f.properties.jenjang),
      ),
    };
  }, [sekolahData, activeJenjangs]);

  useEffect(() => {
    if (selectedSekolahId && sekolahData) {
      const selectedSchool = sekolahData.features.find(
        (f: SekolahFeature) => f.properties.id === selectedSekolahId,
      );
      if (
        selectedSchool &&
        !activeJenjangs.includes(selectedSchool.properties.jenjang)
      ) {
        Promise.resolve().then(() => {
          setSelectedSekolahId(null);
        });
      }
    }
  }, [activeJenjangs, selectedSekolahId, sekolahData]);

  useEffect(() => {
    if (selectedKelurahan && !activeKelurahans.includes(selectedKelurahan)) {
      Promise.resolve().then(() => {
        setSelectedKelurahan(null);
      });
    }
  }, [activeKelurahans, selectedKelurahan]);

  const { data: sppgRoutesData = null } = useSppgRoutesQuery(selectedSppgId);
  const { data: sekolahRouteData = null } =
    useSchoolRouteQuery(selectedSekolahId);

  const [sppgForm, setSppgForm] = useState<SppgForm>({
    nama_sppg: "",
    alamat: "",
    nama_kelurahan: "",
    longitude: "",
    latitude: "",
  });

  const [sekolahForm, setSekolahForm] = useState<SekolahForm>({
    nama_sekolah: "",
    jenjang: "SD",
    alamat: "",
    nama_kelurahan: "",
    longitude: "",
    latitude: "",
  });

  const [isPickerActive, setIsPickerActive] = useState(false);

  useEffect(() => {
    setIsPickerActive(false);
  }, [activeTab]);

  const pickedLocation = useMemo(() => {
    if (
      activeTab === "sekolah" &&
      sekolahForm.latitude &&
      sekolahForm.longitude
    ) {
      const lat = parseFloat(sekolahForm.latitude);
      const lng = parseFloat(sekolahForm.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, type: "sekolah" as const };
      }
    }
    if (activeTab === "sppg" && sppgForm.latitude && sppgForm.longitude) {
      const lat = parseFloat(sppgForm.latitude);
      const lng = parseFloat(sppgForm.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, type: "sppg" as const };
      }
    }
    return null;
  }, [
    activeTab,
    sekolahForm.latitude,
    sekolahForm.longitude,
    sppgForm.latitude,
    sppgForm.longitude,
  ]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLocationPicked = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `/api/spatial/check-location?lat=${lat}&lng=${lng}`,
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        showToast(data.error || "Gagal memeriksa lokasi", "error");
        return;
      }

      if (!data.insideSumbersari) {
        showToast(
          "Gagal: Lokasi harus berada di dalam wilayah Kecamatan Sumbersari!",
          "error",
        );
        return;
      }

      if (activeTab === "sekolah") {
        setSekolahForm((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          nama_kelurahan: data.kelurahan || "",
        }));
        showToast(
          `Lokasi terpilih! Kelurahan: ${data.kelurahan || "Tidak diketahui"}`,
          "success",
        );
      } else if (activeTab === "sppg") {
        setSppgForm((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          nama_kelurahan: data.kelurahan || "",
        }));
        showToast(
          `Lokasi terpilih untuk SPPG baru! Kelurahan: ${data.kelurahan || "Tidak diketahui"}`,
          "success",
        );
      }

      setIsPickerActive(false);
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi saat memeriksa lokasi", "error");
    }
  };

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: "sppg",
    id: "",
    name: "",
  });

  const addSppgMutation = useAddSppgMutation();
  const deleteSppgMutation = useDeleteSppgMutation();
  const addSekolahMutation = useAddSekolahMutation();
  const deleteSekolahMutation = useDeleteSekolahMutation();
  const recalculateMutation = useRecalculateRekomendasiMutation();

  const formLoading =
    addSppgMutation.isPending ||
    addSekolahMutation.isPending ||
    recalculateMutation.isPending;

  const totalSppgs = sppgData?.features?.length || 0;
  const totalSchools = sekolahData?.features?.length || 0;
  const blankSpotsCount =
    sekolahData?.features?.filter((f: SekolahFeature) => !f.properties.id_sppg)
      .length || 0;
  const coveragePercent =
    totalSchools > 0
      ? Math.round(((totalSchools - blankSpotsCount) / totalSchools) * 100)
      : 0;

  const handleRecalculate = () => {
    recalculateMutation.mutate(undefined, {
      onSuccess: () => {
        showToast(
          "Berhasil mengkalkulasi ulang kluster blank spot dan rekomendasi SPPG!",
          "success",
        );
      },
      onError: (err) => {
        showToast(`Gagal: ${err.message}`, "error");
      },
    });
  };

  const handleAddSppg = (e: React.FormEvent) => {
    e.preventDefault();
    addSppgMutation.mutate(sppgForm, {
      onSuccess: () => {
        showToast("Berhasil menambah SPPG!", "success");
        setSppgForm({
          nama_sppg: "",
          alamat: "",
          nama_kelurahan: "",
          longitude: "",
          latitude: "",
        });
      },
      onError: (err) => {
        showToast(`Gagal: ${err.message}`, "error");
      },
    });
  };

  const handleAddSekolah = (e: React.FormEvent) => {
    e.preventDefault();
    addSekolahMutation.mutate(sekolahForm, {
      onSuccess: () => {
        showToast("Berhasil menambah Sekolah!", "success");
        setSekolahForm({
          nama_sekolah: "",
          jenjang: "SD",
          alamat: "",
          nama_kelurahan: "",
          longitude: "",
          latitude: "",
        });
      },
      onError: (err) => {
        showToast(`Gagal: ${err.message}`, "error");
      },
    });
  };

  const handleDeleteSppg = async (id: string) => {
    try {
      await deleteSppgMutation.mutateAsync(id);
      showToast(
        "Berhasil menghapus SPPG dan merelokasi sekolah terdampak!",
        "success",
      );
      if (selectedSppgId === id) setSelectedSppgId(null);
    } catch (err: any) {
      showToast(`Gagal menghapus SPPG: ${err.message}`, "error");
      throw err;
    }
  };

  const handleDeleteSekolah = async (id: string) => {
    try {
      await deleteSekolahMutation.mutateAsync(id);
      showToast("Berhasil menghapus sekolah!", "success");
      if (selectedSekolahId === id) setSelectedSekolahId(null);
    } catch (err: any) {
      showToast(`Gagal menghapus sekolah: ${err.message}`, "error");
      throw err;
    }
  };

  const handleSelectKelurahan = (nama: string | null) => {
    setSelectedKelurahan(nama);
    if (nama) {
      setSelectedSppgId(null);
      setSelectedSekolahId(null);
      setSelectedRekomendasiId(null);
    }
  };

  const handleSelectSppg = (id: string | null) => {
    setSelectedSppgId(id);
    if (id) {
      setSelectedSekolahId(null);
      setSelectedRekomendasiId(null);
      setSelectedKelurahan(null);
    }
  };

  const handleSelectSekolah = (id: string | null) => {
    setSelectedSekolahId(id);
    if (id) {
      setSelectedSppgId(null);
      setSelectedRekomendasiId(null);
      setSelectedKelurahan(null);
    }
  };

  const handleSelectRekomendasi = (id: string | null) => {
    setSelectedRekomendasiId(id);
    if (id) {
      setSelectedSppgId(null);
      setSelectedSekolahId(null);
      setSelectedKelurahan(null);
    }
  };

  const handleDeleteTrigger = (partial: Omit<typeof deleteModal, "isOpen">) => {
    setDeleteModal({
      isOpen: true,
      ...partial,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#F8F3EE] text-[#1C322D] antialiased font-sans">
      {}
      <aside className="w-full lg:w-[480px] h-full p-6 bg-white border-b lg:border-b-0 lg:border-r border-[#1C322D]/15 flex flex-col justify-between shrink-0 shadow-lg z-10 overflow-y-auto">
        <div>
          <SidebarHeader
            totalSppgs={totalSppgs}
            totalSchools={totalSchools}
            coveragePercent={coveragePercent}
            isLoading={isDataLoading}
          />

          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

          {}
          <div className="space-y-4 pr-1">
            {isDataLoading ? (
              <SidebarSkeleton activeTab={activeTab} />
            ) : (
              <>
                {activeTab === "map" && (
                  <MapTabPanel
                    showKelurahan={showKelurahan}
                    setShowKelurahan={setShowKelurahan}
                    showJalan={showJalan}
                    setShowJalan={setShowJalan}
                    showSppg={showSppg}
                    setShowSppg={setShowSppg}
                    showSchools={showSchools}
                    setShowSchools={setShowSchools}
                    showRekomendasi={showRekomendasi}
                    setShowRekomendasi={setShowRekomendasi}
                    kelurahanStats={kelurahanStats}
                    selectedKelurahan={selectedKelurahan}
                    onSelectKelurahan={handleSelectKelurahan}
                    activeKecamatans={activeKecamatans}
                    setActiveKecamatans={setActiveKecamatans}
                    activeKelurahans={activeKelurahans}
                    setActiveKelurahans={setActiveKelurahans}
                    activeJenjangs={activeJenjangs}
                    setActiveJenjangs={setActiveJenjangs}
                    allKecamatans={allKecamatans}
                    allKelurahans={allKelurahans}
                  />
                )}

                {activeTab === "sppg" && (
                  <SppgTabPanel
                    sppgForm={sppgForm}
                    setSppgForm={setSppgForm}
                    formLoading={formLoading}
                    handleAddSppg={handleAddSppg}
                    sppgData={sppgData}
                    selectedSppgId={selectedSppgId}
                    onSelectSppg={handleSelectSppg}
                    onDelete={handleDeleteTrigger}
                    isPickerActive={isPickerActive}
                    setIsPickerActive={setIsPickerActive}
                    onClear={() =>
                      setSppgForm({
                        nama_sppg: "",
                        alamat: "",
                        nama_kelurahan: "",
                        longitude: "",
                        latitude: "",
                      })
                    }
                  />
                )}

                {activeTab === "sekolah" && (
                  <SekolahTabPanel
                    sekolahForm={sekolahForm}
                    setSekolahForm={setSekolahForm}
                    formLoading={formLoading}
                    handleAddSekolah={handleAddSekolah}
                    sekolahData={sekolahData}
                    selectedSekolahId={selectedSekolahId}
                    onSelectSekolah={handleSelectSekolah}
                    onDelete={handleDeleteTrigger}
                    totalSchools={totalSchools}
                    isPickerActive={isPickerActive}
                    setIsPickerActive={setIsPickerActive}
                    onClear={() =>
                      setSekolahForm({
                        nama_sekolah: "",
                        jenjang: "SD",
                        alamat: "",
                        nama_kelurahan: "",
                        longitude: "",
                        latitude: "",
                      })
                    }
                  />
                )}

                {activeTab === "coverage" && (
                  <CoverageTabPanel coverageStats={coverageStats} />
                )}

                {activeTab === "rekomendasi" && (
                  <RekomendasiTabPanel
                    handleRecalculate={handleRecalculate}
                    formLoading={formLoading}
                    rekomendasi={rekomendasi}
                    rekomendasiValidasi={rekomendasiValidasi}
                    selectedRekomendasiId={selectedRekomendasiId}
                    onSelectRekomendasi={handleSelectRekomendasi}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {}
        <div className="border-t border-[#1C322D]/15 pt-4 mt-6 text-[10px] text-[#1C322D]/60 flex justify-between items-center font-mono">
          <span>Kecamatan Sumbersari GIS v1.0</span>
          <span>© 2026 Badan Gizi Nasional</span>
        </div>
      </aside>

      {}
      <main className="flex-1 h-full overflow-hidden relative p-6 flex flex-col">
        <div className="flex-1 bg-white border border-[#1C322D]/15 rounded-2xl relative overflow-hidden flex shadow-lg">
          <MapComponent
            sppgGeojson={showSppg ? sppgData : null}
            sekolahGeojson={showSchools ? filteredSchools : null}
            kelurahanGeojson={showKelurahan ? filteredKelurahan : null}
            rekomendasiGeojson={showRekomendasi ? rekomendasi : null}
            showJalan={showJalan}
            selectedKelurahan={selectedKelurahan}
            onSelectKelurahan={handleSelectKelurahan}
            sppgRoutesGeojson={sppgRoutesData}
            selectedSppgId={selectedSppgId}
            onSelectSppg={handleSelectSppg}
            sekolahRouteGeojson={sekolahRouteData}
            selectedSekolahId={selectedSekolahId}
            onSelectSekolah={handleSelectSekolah}
            selectedRekomendasiId={selectedRekomendasiId}
            onSelectRekomendasi={handleSelectRekomendasi}
            rekomendasiValidasi={rekomendasiValidasi}
            isPickerActive={isPickerActive}
            onLocationPicked={handleLocationPicked}
            pickedLocation={pickedLocation}
          />

          {}
          <MapOverlayPanel
            selectedSekolahId={selectedSekolahId}
            sekolahData={sekolahData}
            selectedSppgId={selectedSppgId}
            sppgData={sppgData}
            selectedKelurahan={selectedKelurahan}
            kelurahanStats={kelurahanStats}
            selectedRekomendasiId={selectedRekomendasiId}
            rekomendasi={rekomendasi}
            rekomendasiValidasi={rekomendasiValidasi}
            coverageStats={coverageStats}
            setSelectedSekolahId={setSelectedSekolahId}
            setSelectedSppgId={setSelectedSppgId}
            setSelectedKelurahan={setSelectedKelurahan}
            setSelectedRekomendasiId={setSelectedRekomendasiId}
            onDelete={handleDeleteTrigger}
          />
        </div>
      </main>

      {}
      <DeleteConfirmModal
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        handleDeleteSppg={handleDeleteSppg}
        handleDeleteSekolah={handleDeleteSekolah}
      />

      {}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
