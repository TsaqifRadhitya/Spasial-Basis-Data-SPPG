'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to disable SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
      <div className="text-center text-slate-400">
        <svg className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-semibold">Memuat Peta Spasial...</span>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'sppg' | 'sekolah' | 'coverage' | 'rekomendasi'>('map');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // States for GIS datasets
  const [sppgData, setSppgData] = useState<any>(null);
  const [sekolahData, setSekolahData] = useState<any>(null);
  const [serviceArea, setServiceArea] = useState<any>(null);
  const [kelurahanBoundaries, setKelurahanBoundaries] = useState<any>(null);
  const [rekomendasi, setRekomendasi] = useState<any>(null);
  const [jalanData, setJalanData] = useState<any>(null);

  // Tabular stats
  const [kelurahanStats, setKelurahanStats] = useState<any[]>([]);
  const [coverageStats, setCoverageStats] = useState<any>({ panjangJalan: [], drivingDistances: [] });
  const [rekomendasiValidasi, setRekomendasiValidasi] = useState<any[]>([]);
  const [selectedKelurahan, setSelectedKelurahan] = useState<string | null>(null);
  const [selectedSppgId, setSelectedSppgId] = useState<string | null>(null);
  const [sppgRoutesData, setSppgRoutesData] = useState<any>(null);
  const [selectedSekolahId, setSelectedSekolahId] = useState<string | null>(null);
  const [sekolahRouteData, setSekolahRouteData] = useState<any>(null);
  const [selectedRekomendasiId, setSelectedRekomendasiId] = useState<string | null>(null);

  // Layer toggles
  const [showKelurahan, setShowKelurahan] = useState(true);
  const [showJalan, setShowJalan] = useState(true);
  const [showSppg, setShowSppg] = useState(true);
  const [showSchools, setShowSchools] = useState(true);
  const [showRekomendasi, setShowRekomendasi] = useState(true);

  // Form states
  const [sppgForm, setSppgForm] = useState({ nama_sppg: '', alamat: '', longitude: '', latitude: '' });
  const [sekolahForm, setSekolahForm] = useState({ nama_sekolah: '', jenjang: 'SD', alamat: '', nama_kelurahan: '', longitude: '', latitude: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'sppg' | 'sekolah';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'sppg',
    id: '',
    name: '',
  });

  // Toast state
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch all GIS datasets
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [
          resSppg,
          resSekolah,
          resService,
          resKelurahanGeo,
          resRekomendasi,
          resKelurahanStats,
          resCoverage,
          resValidasi,
          resJalan,
        ] = await Promise.all([
          fetch('/api/sppg?format=geojson'),
          fetch('/api/sekolah?format=geojson'),
          fetch('/api/coverage/service-area'),
          fetch('/api/kelurahan/geojson'),
          fetch('/api/rekomendasi?format=geojson'),
          fetch('/api/kelurahan'),
          fetch('/api/coverage'),
          fetch('/api/rekomendasi/validasi'),
          fetch('/api/jalan'),
        ]);

        const [
          sppgGeo,
          sekolahGeo,
          serviceGeo,
          kelGeo,
          rekGeo,
          kelData,
          covData,
          valData,
          jalanGeo,
        ] = await Promise.all([
          resSppg.json(),
          resSekolah.json(),
          resService.json(),
          resKelurahanGeo.json(),
          resRekomendasi.json(),
          resKelurahanStats.json(),
          resCoverage.json(),
          resValidasi.json(),
          resJalan.json(),
        ]);

        setSppgData(sppgGeo);
        setSekolahData(sekolahGeo);
        setServiceArea(serviceGeo);
        setKelurahanBoundaries(kelGeo);
        setRekomendasi(rekGeo);
        setKelurahanStats(kelData.data || []);
        setCoverageStats(covData || { panjangJalan: [], drivingDistances: [] });
        setRekomendasiValidasi(valData.data || []);
        setJalanData(jalanGeo);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedSppgId) {
      setSppgRoutesData(null);
      return;
    }

    async function loadRoutes() {
      try {
        const res = await fetch(`/api/sppg/${selectedSppgId}/routes`);
        if (res.ok) {
          const data = await res.json();
          setSppgRoutesData(data);
        }
      } catch (err) {
        console.error('Error fetching SPPG routes:', err);
      }
    }
    loadRoutes();
  }, [selectedSppgId]);

  useEffect(() => {
    if (!selectedSekolahId) {
      setSekolahRouteData(null);
      return;
    }

    async function loadSchoolRoute() {
      try {
        const res = await fetch(`/api/sekolah/${selectedSekolahId}/routes`);
        if (res.ok) {
          const data = await res.json();
          setSekolahRouteData(data);
        }
      } catch (err) {
        console.error('Error fetching school route:', err);
      }
    }
    loadSchoolRoute();
  }, [selectedSekolahId]);

  // Recalculate Recommendations
  const handleRecalculate = async () => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/rekomendasi/generate', { method: 'POST' });
      if (res.ok) {
        showToast('Berhasil mengkalkulasi ulang kluster blank spot dan rekomendasi SPPG!', 'success');
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast('Gagal mengkalkulasi ulang.', 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Add SPPG
  const handleAddSppg = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/sppg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sppgForm),
      });
      if (res.ok) {
        showToast('Berhasil menambah SPPG!', 'success');
        setSppgForm({ nama_sppg: '', alamat: '', longitude: '', latitude: '' });
        setRefreshKey((prev) => prev + 1);
      } else {
        const err = await res.json();
        showToast(`Gagal: ${err.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Add Sekolah
  const handleAddSekolah = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/sekolah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sekolahForm),
      });
      if (res.ok) {
        showToast('Berhasil menambah Sekolah!', 'success');
        setSekolahForm({ nama_sekolah: '', jenjang: 'SD', alamat: '', nama_kelurahan: '', longitude: '', latitude: '' });
        setRefreshKey((prev) => prev + 1);
      } else {
        const err = await res.json();
        showToast(`Gagal: ${err.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete SPPG
  const handleDeleteSppg = async (id: string) => {
    try {
      const res = await fetch(`/api/sppg/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Berhasil menghapus SPPG dan merelokasi sekolah terdampak!', 'success');
        if (selectedSppgId === id) setSelectedSppgId(null);
        setRefreshKey((prev) => prev + 1);
      } else {
        const err = await res.json();
        showToast(`Gagal menghapus SPPG: ${err.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error');
    }
  };

  // Delete Sekolah
  const handleDeleteSekolah = async (id: string) => {
    try {
      const res = await fetch(`/api/sekolah/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Berhasil menghapus sekolah!', 'success');
        if (selectedSekolahId === id) setSelectedSekolahId(null);
        setRefreshKey((prev) => prev + 1);
      } else {
        const err = await res.json();
        showToast(`Gagal menghapus sekolah: ${err.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error');
    }
  };

  // Statistics calculation
  const totalSppgs = sppgData?.features?.length || 0;
  const totalSchools = sekolahData?.features?.length || 0;
  const blankSpotsCount = sekolahData?.features?.filter((f: any) => !f.properties.id_sppg).length || 0;
  const coveragePercent = totalSchools > 0 ? Math.round(((totalSchools - blankSpotsCount) / totalSchools) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F3EE] text-[#1C322D] antialiased font-sans">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-[480px] p-6 bg-white border-b lg:border-b-0 lg:border-r border-[#1C322D]/15 flex flex-col justify-between shrink-0 shadow-lg z-10">
        <div>
          {/* Brand Header */}
          <div className="mb-8">
            <span className="text-[10px] font-bold tracking-widest text-[#EBB552] bg-[#1C322D] px-2.5 py-0.5 rounded-full uppercase font-mono">Sistem Informasi Geografis</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C322D] mt-2 font-sans">Pemetaan & Cakupan SPPG</h1>
            <p className="text-xs text-[#1C322D]/70 mt-1 font-serif">Analisis Pelayanan Sekolah Negeri di Sumbersari, Jember</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-[#F8F3EE] rounded-2xl border border-[#1C322D]/15 shadow-xs hover:shadow-sm transition-all">
              <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">SPPG</span>
              <p className="text-lg font-bold text-[#EBB552] mt-0.5 font-sans">{totalSppgs}</p>
            </div>
            <div className="p-3 bg-[#F8F3EE] rounded-2xl border border-[#1C322D]/15 shadow-xs hover:shadow-sm transition-all">
              <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">Sekolah</span>
              <p className="text-lg font-bold text-[#F1CDBE] mt-0.5 font-sans">{totalSchools}</p>
            </div>
            <div className="p-3 bg-[#F8F3EE] rounded-2xl border border-[#1C322D]/15 shadow-xs hover:shadow-sm transition-all">
              <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">Cakupan</span>
              <p className="text-lg font-bold text-[#1C322D] mt-0.5 font-sans">{coveragePercent}%</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap gap-1 p-1 bg-[#F8F3EE] border border-[#1C322D]/15 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
                activeTab === 'map' ? 'bg-[#1C322D] text-white shadow-xs' : 'text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5'
              }`}
            >
              Peta
            </button>
            <button
              onClick={() => setActiveTab('sppg')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
                activeTab === 'sppg' ? 'bg-[#1C322D] text-white shadow-xs' : 'text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5'
              }`}
            >
              SPPG
            </button>
            <button
              onClick={() => setActiveTab('sekolah')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
                activeTab === 'sekolah' ? 'bg-[#1C322D] text-white shadow-xs' : 'text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5'
              }`}
            >
              Sekolah
            </button>
            <button
              onClick={() => setActiveTab('coverage')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
                activeTab === 'coverage' ? 'bg-[#1C322D] text-white shadow-xs' : 'text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5'
              }`}
            >
              Analisis
            </button>
            <button
              onClick={() => setActiveTab('rekomendasi')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors font-mono ${
                activeTab === 'rekomendasi' ? 'bg-[#1C322D] text-white shadow-xs' : 'text-[#1C322D]/70 hover:text-[#1C322D] hover:bg-[#1C322D]/5'
              }`}
            >
              Rekomendasi
            </button>
          </nav>

          {/* Dynamic Tab Contents */}
          <div className="space-y-4 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto pr-1">
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] font-sans">Layer Overlays</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showKelurahan}
                        onChange={(e) => setShowKelurahan(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Batas Wilayah Administrasi
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showJalan}
                        onChange={(e) => setShowJalan(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Jaringan Distribusi
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSppg}
                        onChange={(e) => setShowSppg(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Satuan Pelayanan Gizi (SPPG)
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSchools}
                        onChange={(e) => setShowSchools(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Sekolah Negeri
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRekomendasi}
                        onChange={(e) => setShowRekomendasi(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Rekomendasi SPPG Baru
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">Ringkasan per Kelurahan</h3>
                  <div className="space-y-2 text-xs">
                    {kelurahanStats.map((k) => {
                      const isSelected = selectedKelurahan === k.nama_kelurahan;
                      return (
                        <button
                          key={k.id}
                          onClick={() => {
                            const nextKel = isSelected ? null : k.nama_kelurahan;
                            setSelectedKelurahan(nextKel);
                            if (nextKel) {
                              setSelectedSppgId(null);
                              setSelectedSekolahId(null);
                              setSelectedRekomendasiId(null);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors font-mono ${
                            isSelected
                              ? 'bg-[#1C322D] border-[#1C322D] text-white'
                              : 'bg-white border-[#1C322D]/15 hover:bg-slate-50 text-[#1C322D]'
                          }`}
                        >
                          <span className="font-semibold">{k.nama_kelurahan}</span>
                          <div className="flex items-center gap-1.5 text-[9px]">
                            <span 
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                isSelected ? 'bg-emerald-800 text-[#F8F3EE]' : 'bg-emerald-50 border border-emerald-250 text-emerald-800'
                              }`} 
                              title="SPPG di Kelurahan"
                            >
                              SPPG: {k.sppg_count || 0}
                            </span>
                            <span 
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                isSelected ? 'bg-[#F8F3EE] text-[#1C322D]' : 'bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]'
                              }`}
                              title="Sekolah Terlayani"
                            >
                              Skl: {k.terlayani_count}
                            </span>
                            <span 
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                isSelected ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-[#F1CDBE] border border-[#1C322D]/15 text-[#1C322D]'
                              }`}
                              title="Sekolah Blank Spot"
                            >
                              BS: {k.blank_spot_count}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sppg' && (
              <div className="space-y-4">
                <form onSubmit={handleAddSppg} className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] font-sans">Tambah SPPG</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nama SPPG"
                      value={sppgForm.nama_sppg}
                      onChange={(e) => setSppgForm({ ...sppgForm, nama_sppg: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Alamat"
                      value={sppgForm.alamat}
                      onChange={(e) => setSppgForm({ ...sppgForm, alamat: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude (X)"
                        value={sppgForm.longitude}
                        onChange={(e) => setSppgForm({ ...sppgForm, longitude: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude (Y)"
                        value={sppgForm.latitude}
                        onChange={(e) => setSppgForm({ ...sppgForm, latitude: e.target.value })}
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

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#1C322D]/60 uppercase tracking-wider font-mono">Daftar SPPG Eksisting</h3>
                  {sppgData?.features?.map((f: any) => {
                    const isSelected = selectedSppgId === f.properties.id;
                    return (
                      <div key={f.properties.id} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const nextId = isSelected ? null : f.properties.id;
                            setSelectedSppgId(nextId);
                            if (nextId) {
                              setSelectedSekolahId(null);
                              setSelectedRekomendasiId(null);
                            }
                          }}
                          className={`flex-1 text-left p-3 border rounded-2xl text-xs space-y-1 shadow-sm transition-all cursor-pointer block
                            ${isSelected 
                              ? 'bg-[#1C322D] border-[#1C322D] text-white' 
                              : 'bg-white border-[#1C322D]/15 text-[#1C322D] hover:bg-slate-50'
                            }`}
                        >
                          <h4 className="font-bold font-sans">{f.properties.nama}</h4>
                          <p className={`font-serif ${isSelected ? 'text-white/80' : 'text-slate-655'}`}>{f.properties.alamat}</p>
                          <div className={`flex justify-between text-[10px] pt-1 font-mono ${isSelected ? 'text-white/70' : 'text-[#1C322D]/70'}`}>
                            <span>Node: {f.properties.node_id || '-'}</span>
                            <span className="text-[#EBB552] font-bold">
                              {isSelected ? 'Terpilih - Rute Aktif' : 'Klik untuk rute (<= 6km)'}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              type: 'sppg',
                              id: f.properties.id,
                              name: f.properties.nama,
                            });
                          }}
                          className="p-3 border border-[#1C322D]/15 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 rounded-2xl transition-all cursor-pointer shrink-0 flex items-center justify-center self-stretch w-11"
                          title="Hapus SPPG"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'sekolah' && (
              <div className="space-y-4">
                <form onSubmit={handleAddSekolah} className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl space-y-3 shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] font-sans">Tambah Sekolah</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nama Sekolah"
                      value={sekolahForm.nama_sekolah}
                      onChange={(e) => setSekolahForm({ ...sekolahForm, nama_sekolah: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={sekolahForm.jenjang}
                        onChange={(e: any) => setSekolahForm({ ...sekolahForm, jenjang: e.target.value })}
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
                        onChange={(e) => setSekolahForm({ ...sekolahForm, nama_kelurahan: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Alamat"
                      value={sekolahForm.alamat}
                      onChange={(e) => setSekolahForm({ ...sekolahForm, alamat: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude (X)"
                        value={sekolahForm.longitude}
                        onChange={(e) => setSekolahForm({ ...sekolahForm, longitude: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#1C322D]/20 rounded-lg text-[#1C322D] placeholder-[#1C322D]/40 focus:outline-none focus:border-[#EBB552]"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude (Y)"
                        value={sekolahForm.latitude}
                        onChange={(e) => setSekolahForm({ ...sekolahForm, latitude: e.target.value })}
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

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#1C322D]/60 uppercase tracking-wider font-mono">Sekolah Negeri ({totalSchools})</h3>
                  {sekolahData?.features?.map((f: any) => {
                    const isSelected = selectedSekolahId === f.properties.id;
                    return (
                      <div key={f.properties.id} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const nextId = isSelected ? null : f.properties.id;
                            setSelectedSekolahId(nextId);
                            if (nextId) {
                              setSelectedSppgId(null);
                              setSelectedRekomendasiId(null);
                            }
                          }}
                          className={`flex-1 text-left p-3 border rounded-2xl text-xs space-y-1 shadow-sm transition-all cursor-pointer block
                            ${isSelected 
                              ? 'bg-[#1C322D] border-[#1C322D] text-white' 
                              : 'bg-white border-[#1C322D]/15 text-[#1C322D] hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-bold font-sans ${isSelected ? 'text-[#EBB552]' : 'text-[#1C322D]'}`}>{f.properties.nama}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              !f.properties.id_sppg
                                ? 'bg-[#F1CDBE] text-[#1C322D]' 
                                : (isSelected ? 'bg-emerald-800 text-[#F8F3EE]' : 'bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]')
                            }`}>
                              {!f.properties.id_sppg ? 'Blank Spot' : 'Terlayani'}
                            </span>
                          </div>
                          <p className={`font-serif ${isSelected ? 'text-white/80' : 'text-slate-655'}`}>{f.properties.alamat}</p>
                          <div className={`flex justify-between text-[10px] pt-1 font-mono ${isSelected ? 'text-white/70' : 'text-[#1C322D]/70'}`}>
                            <span>Kelurahan: {f.properties.kelurahan}</span>
                            <span className={`${isSelected ? 'text-[#EBB552]' : 'text-[#8B5CF6]'} font-bold`}>
                              {isSelected ? 'Terpilih - Rute Aktif' : (!f.properties.id_sppg ? 'Blank Spot' : 'Klik untuk lihat rute ke SPPG')}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              type: 'sekolah',
                              id: f.properties.id,
                              name: f.properties.nama,
                            });
                          }}
                          className="p-3 border border-[#1C322D]/15 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 rounded-2xl transition-all cursor-pointer shrink-0 flex items-center justify-center self-stretch w-11"
                          title="Hapus Sekolah"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'coverage' && (
              <div className="space-y-4">
                {/* SQ-01 Statistics */}
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">SQ-01: Panjang Jalan Coverage</h3>
                  <div className="space-y-2">
                    {coverageStats?.panjangJalan?.map((item: any) => (
                      <div key={item.sppg_id} className="flex justify-between text-xs border-b border-[#1C322D]/10 pb-2 font-mono">
                        <span className="font-semibold text-[#1C322D]/85">{item.nama_sppg}</span>
                        <span className="font-bold text-[#1C322D]">{Math.round(item.total_panjang_meter / 1000)} km</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SQ-02 Driving distance logs */}
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">SQ-02: Jarak Tempuh Jaringan Distribusi</h3>
                  <div className="max-h-[300px] overflow-y-auto text-[11px] space-y-2 pr-1">
                    {coverageStats?.drivingDistances?.map((item: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-[#1C322D]/15 flex justify-between items-center shadow-xs text-[#1C322D]">
                        <div>
                          <p className="font-semibold text-[#1C322D] font-sans">{item.nama_sekolah}</p>
                          <p className="text-[10px] text-[#1C322D]/70 font-mono">ke: {item.nama_sppg}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1C322D] font-mono">{Math.round(item.jarak_tempuh_meter)} m</p>
                          <span className={`text-[9px] font-bold px-1 rounded font-mono border ${
                            item.status_cakupan === 'Blank Spot' ? 'bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}>
                            {item.status_cakupan}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rekomendasi' && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] font-sans">Perhitungan Sentroid (SQ-04)</h3>
                  <p className="text-xs text-[#1C322D]/80 font-serif mt-1">
                    Menghitung titik rekomendasi lokasi SPPG baru dengan mencari sentroid (`ST_Centroid`) dari kluster sekolah blank spot.
                  </p>
                  <button
                    onClick={handleRecalculate}
                    disabled={formLoading}
                    className="w-full py-2.5 bg-[#EBB552] hover:bg-[#d9a33f] text-[#1C322D] rounded-lg text-xs font-black transition-colors disabled:opacity-50 cursor-pointer font-mono mt-3 shadow-xs"
                  >
                    {formLoading ? 'Mengkalkulasi...' : 'Kalkulasi Ulang Rekomendasi'}
                  </button>
                </div>

                {/* Daftar Rekomendasi SPPG (Centroid) */}
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">Daftar Rekomendasi SPPG (Centroid)</h3>
                  <p className="text-[11px] text-[#1C322D]/70 mb-3">Pilih sentroid kluster untuk memunculkan buffer jangkauan jalan 6km dan menyorot sekolah tercakup.</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {rekomendasi?.features?.map((f: any) => {
                      const cid = String(f.properties.kluster_id);
                      const isSelected = selectedRekomendasiId === cid;
                      return (
                        <div
                          key={cid}
                          onClick={() => {
                            const nextId = isSelected ? null : cid;
                            setSelectedRekomendasiId(nextId);
                            if (nextId) {
                              setSelectedSppgId(null);
                              setSelectedSekolahId(null);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex justify-between items-center shadow-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#1C322D] text-white border-[#1C322D] ring-2 ring-[#EBB552]/40'
                              : 'bg-white border-[#1C322D]/10 hover:bg-[#1C322D]/5 text-[#1C322D]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-[#EBB552]/20 border-[#EBB552]' : 'bg-[#1C322D]/10 border-transparent'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${isSelected ? 'text-[#EBB552]' : 'text-[#1C322D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                              </svg>
                            </div>
                            <div>
                              <p className={`font-black text-xs font-sans ${isSelected ? 'text-white' : 'text-slate-900'}`}>Sentroid Kluster #{f.properties.kluster_id}</p>
                              <p className={`text-[10px] font-medium font-sans ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>Mengcover {f.properties.jumlah_sekolah} Sekolah Blank Spot</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                            isSelected ? 'bg-[#EBB552] text-[#1C322D]' : 'bg-[#1C322D] text-[#EBB552]'
                          }`}>
                            {isSelected ? 'Terpilih' : 'Pilih'}
                          </span>
                        </div>
                      );
                    })}
                    {(!rekomendasi || !rekomendasi.features || rekomendasi.features.length === 0) && (
                      <p className="text-xs text-slate-500 text-center py-4">Tidak ada data rekomendasi. Klik Kalkulasi Ulang.</p>
                    )}
                  </div>
                </div>

                {/* SQ-05 Validasi Table */}
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">SQ-05: Validasi Jangkauan (Buffer 6km)</h3>
                  <div className="max-h-[260px] overflow-y-auto text-[11px] space-y-2 pr-1">
                    {rekomendasiValidasi.map((item, idx) => {
                      const isSelected = selectedRekomendasiId === String(item.kluster_id);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            const nextId = isSelected ? null : String(item.kluster_id);
                            setSelectedRekomendasiId(nextId);
                            if (nextId) {
                              setSelectedSppgId(null);
                              setSelectedSekolahId(null);
                            }
                          }}
                          className={`p-2 rounded-lg border flex justify-between items-center shadow-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#1C322D] text-white border-[#1C322D] ring-2 ring-[#EBB552]/40'
                              : 'bg-white border-[#1C322D]/15 hover:bg-[#1C322D]/5 text-[#1C322D]'
                          }`}
                        >
                          <div>
                            <p className={`font-semibold font-sans ${isSelected ? 'text-white' : 'text-[#1C322D]'}`}>{item.nama_sekolah}</p>
                            <p className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-[#1C322D]/70'}`}>Kluster Centroid #{item.kluster_id}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold px-2 py-0.5 rounded font-mono text-[9px] inline-block ${
                              isSelected ? 'bg-[#EBB552] text-[#1C322D]' : 'bg-[#1C322D] text-[#EBB552]'
                            }`}>{Math.round(item.jarak_meter)} m</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border mt-1 block ${
                              item.status_validasi === 'Di luar jangkauan'
                                ? (isSelected ? 'bg-[#F1CDBE] text-[#1C322D] border-transparent' : 'bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]')
                                : (isSelected ? 'bg-emerald-800 text-[#F8F3EE] border-transparent' : 'bg-emerald-50 border-emerald-300 text-emerald-800')
                            }`}>
                              {item.status_validasi}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1C322D]/15 pt-4 mt-6 text-[10px] text-[#1C322D]/60 flex justify-between items-center font-mono">
          <span>Kecamatan Sumbersari GIS v1.0</span>
          <span>© 2026 Badan Gizi Nasional</span>
        </div>
      </aside>

      {/* Main Map View */}
      <main className="flex-1 min-h-[500px] lg:min-h-screen relative p-6 flex flex-col">
        <div className="flex-1 bg-white border border-[#1C322D]/15 rounded-2xl relative overflow-hidden flex shadow-lg">
          <MapComponent
            sppgGeojson={showSppg ? sppgData : null}
            sekolahGeojson={showSchools ? sekolahData : null}
            kelurahanGeojson={showKelurahan ? kelurahanBoundaries : null}
            rekomendasiGeojson={showRekomendasi ? rekomendasi : null}
            showJalan={showJalan}
            selectedKelurahan={selectedKelurahan}
            sppgRoutesGeojson={sppgRoutesData}
            selectedSppgId={selectedSppgId}
            onSelectSppg={(id) => {
              setSelectedSppgId(id);
              if (id) {
                setSelectedSekolahId(null);
                setSelectedRekomendasiId(null);
              }
            }}
            sekolahRouteGeojson={sekolahRouteData}
            selectedSekolahId={selectedSekolahId}
            onSelectSekolah={(id) => {
              setSelectedSekolahId(id);
              if (id) {
                setSelectedSppgId(null);
                setSelectedRekomendasiId(null);
              }
            }}
            selectedRekomendasiId={selectedRekomendasiId}
            onSelectRekomendasi={(id) => {
              setSelectedRekomendasiId(id);
              if (id) {
                setSelectedSppgId(null);
                setSelectedSekolahId(null);
              }
            }}
            rekomendasiValidasi={rekomendasiValidasi}
          />

          {/* Map Overlays for Selected SPPG/Sekolah */}
          {(() => {
            const schoolProps = selectedSekolahId && sekolahData?.features?.find(
              (f: any) => f.properties.id === selectedSekolahId
            )?.properties;

            const sppgProps = selectedSppgId && sppgData?.features?.find(
              (f: any) => f.properties.id === selectedSppgId
            )?.properties;

            const kelProps = selectedKelurahan && kelurahanStats?.find(
              (k: any) => k.nama_kelurahan === selectedKelurahan
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
                          setDeleteModal({
                            isOpen: true,
                            type: 'sekolah',
                            id: selectedSekolahId,
                            name: schoolProps.nama,
                          });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Sekolah"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setSelectedSekolahId(null)}
                        className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">Jenjang & Kelurahan</span>
                      <p className="font-semibold text-slate-800 font-sans mt-0.5">
                        {schoolProps.jenjang} — Kel. {schoolProps.kelurahan}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">Alamat</span>
                      <p className="font-serif text-slate-700 mt-0.5 leading-relaxed">
                        {schoolProps.alamat}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">Status Pelayanan</span>
                      <div className="mt-1">
                        {schoolProps.id_sppg ? (
                          (() => {
                            const servingSppg = sppgData?.features?.find((f: any) => f.properties.id === schoolProps.id_sppg)?.properties;
                            const distItem = coverageStats?.drivingDistances?.find((d: any) => d.nama_sekolah === schoolProps.nama);
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
                                    Jarak Tempuh: <span className="font-bold">{Math.round(distItem.jarak_tempuh_meter)} m</span>
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
                          setDeleteModal({
                            isOpen: true,
                            type: 'sppg',
                            id: selectedSppgId,
                            name: sppgProps.nama,
                          });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Hapus SPPG"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setSelectedSppgId(null)}
                        className="text-[#1C322D]/55 hover:text-[#1C322D] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono">Alamat</span>
                      <p className="font-serif text-slate-700 mt-0.5 leading-relaxed">
                        {sppgProps.alamat}
                      </p>
                    </div>

                    <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10">
                      <span className="text-[9px] text-[#1C322D]/60 font-bold uppercase font-mono">Sekolah Dilayani</span>
                      <p className="text-xs font-bold text-[#EBB552] mt-0.5 font-sans">
                        {(() => {
                          const served = sekolahData?.features?.filter((f: any) => f.properties.id_sppg === selectedSppgId) || [];
                          return served.length;
                        })()} <span className="text-[10px] font-normal text-[#1C322D]">unit</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#1C322D]/60 font-bold uppercase font-mono block mb-1">Daftar Sekolah yang Dilayani</span>
                      {(() => {
                        const served = sekolahData?.features?.filter((f: any) => f.properties.id_sppg === selectedSppgId) || [];
                        if (served.length === 0) {
                          return (
                            <p className="text-[11px] text-[#1C322D]/60 italic py-1">
                              Tidak melayani sekolah manapun dalam radius 6km.
                            </p>
                          );
                        }
                        return (
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 mt-1">
                            {served.map((item: any) => {
                              const distVal = coverageStats?.drivingDistances?.find((d: any) => d.nama_sekolah === item.properties.nama);
                              return (
                                <div 
                                  key={item.properties.id} 
                                  className="p-2 bg-[#F8F3EE]/50 border border-[#1C322D]/10 rounded-xl flex justify-between items-center hover:bg-[#F8F3EE] transition-colors cursor-pointer"
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
                                      Kel. {item.properties.kelurahan}
                                    </p>
                                  </div>
                                  {distVal && (
                                    <span className="text-[9px] font-bold bg-[#1C322D] text-[#EBB552] px-1.5 py-0.5 rounded font-mono">
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
              const servedPercent = kelProps.total_sekolah > 0 
                ? Math.round((kelProps.terlayani_count / kelProps.total_sekolah) * 100) 
                : 0;
              const schoolsInKel = sekolahData?.features?.filter(
                (f: any) => f.properties.kelurahan === selectedKelurahan
              ) || [];
              const sppgsInKel = sppgData?.features?.filter(
                (f: any) => f.properties.kelurahan === selectedKelurahan
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
                      <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">Total SPPG</span>
                      <p className="text-xs font-black text-[#1C322D] mt-1 font-mono">{kelProps.sppg_count || 0}</p>
                    </div>
                    <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
                      <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">Total Skl</span>
                      <p className="text-xs font-black text-[#1C322D] mt-1 font-mono">{kelProps.total_sekolah}</p>
                    </div>
                    <div className="p-2 bg-[#F8F3EE] rounded-xl border border-[#1C322D]/10 flex flex-col justify-between">
                      <span className="text-[8px] text-[#1C322D]/60 font-bold uppercase font-mono leading-none">Cakupan</span>
                      <p className="text-xs font-black text-emerald-800 mt-1 font-mono">{servedPercent}%</p>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-between col-span-2">
                      <span className="text-[8px] text-emerald-700 font-bold uppercase font-mono leading-none">Sekolah Terlayani</span>
                      <p className="text-xs font-black text-emerald-800 mt-1 font-mono">{kelProps.terlayani_count}</p>
                    </div>
                    <div className="p-2 bg-[#F1CDBE]/20 border border-[#F1CDBE]/40 rounded-xl flex flex-col justify-between">
                      <span className="text-[8px] text-[#E0533C] font-bold uppercase font-mono leading-none">Blank Spot</span>
                      <p className="text-xs font-black text-[#E0533C] mt-1 font-mono">{kelProps.blank_spot_count}</p>
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
                        {sppgsInKel.map((item: any) => (
                          <div 
                            key={item.properties.id} 
                            className="p-2 bg-[#EBB552]/10 border border-[#EBB552]/30 rounded-xl flex justify-between items-center hover:bg-[#EBB552]/20 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedSppgId(item.properties.id);
                              setSelectedKelurahan(null);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#1C322D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
                              </svg>
                              <p className="font-bold text-slate-800 font-sans text-[11px]">
                                {item.properties.nama}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold bg-[#1C322D] text-[#EBB552] px-1.5 py-0.5 rounded font-mono">
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
                        {schoolsInKel.map((item: any) => {
                          const isBlank = !item.properties.id_sppg;
                          return (
                            <div 
                              key={item.properties.id} 
                              className="p-2 bg-[#F8F3EE]/50 border border-[#1C322D]/10 rounded-xl flex justify-between items-center hover:bg-[#F8F3EE] transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedSekolahId(item.properties.id);
                                setSelectedKelurahan(null);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isBlank ? 'bg-[#E0533C]' : 'bg-emerald-500'}`}></span>
                                <p className="font-semibold text-slate-800 font-sans text-[11px]">
                                  {item.properties.nama}
                                </p>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                isBlank ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isBlank ? 'Blank Spot' : 'Terlayani'}
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

            return null;
          })()}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div 
          style={{ zIndex: 9999 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#1C322D]/15 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 text-[#1C322D]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#F1CDBE]/30 rounded-xl text-[#E0533C] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base font-sans">
                  Konfirmasi Hapus
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus {deleteModal.type === 'sppg' ? 'SPPG' : 'Sekolah'}{" "}
                  <span className="font-bold text-[#1C322D]">{deleteModal.name}</span>?
                  {deleteModal.type === 'sppg' && (
                    <span className="block mt-1.5 text-[10px] text-[#E0533C] bg-red-50 p-2 rounded-lg font-medium">
                      Peringatan: Menghapus SPPG ini akan merelokasi sekolah-sekolah yang dilayaninya ke SPPG terdekat lainnya secara otomatis.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-[#1C322D]/10">
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-[#1C322D]/15 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-[#1C322D]/70 font-mono"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setDeleteModal(prev => ({ ...prev, isOpen: false }));
                  if (deleteModal.type === 'sppg') {
                    await handleDeleteSppg(deleteModal.id);
                  } else {
                    await handleDeleteSekolah(deleteModal.id);
                  }
                }}
                className="px-4 py-2 bg-[#E0533C] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer font-mono"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts Container */}
      <div 
        style={{ zIndex: 99999 }}
        className="fixed top-6 right-6 flex flex-col gap-2.5 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 pointer-events-auto max-w-sm transition-all duration-300 animate-slide-in
              ${toast.type === 'success' ? 'bg-[#1C322D] border-[#1C322D] text-[#F8F3EE]' : ''}
              ${toast.type === 'error' ? 'bg-[#F1CDBE] border-[#1C322D] text-[#1C322D]' : ''}
              ${toast.type === 'info' ? 'bg-[#F8F3EE] border-[#1C322D] text-[#1C322D]' : ''}
            `}
          >
            {toast.type === 'success' && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-4 h-4 text-[#1C322D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
