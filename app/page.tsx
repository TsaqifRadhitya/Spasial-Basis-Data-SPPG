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

  // Layer toggles
  const [showKelurahan, setShowKelurahan] = useState(true);
  const [showJalan, setShowJalan] = useState(true);
  const [showServiceArea, setShowServiceArea] = useState(true);
  const [showSchools, setShowSchools] = useState(true);
  const [showRekomendasi, setShowRekomendasi] = useState(true);

  // Form states
  const [sppgForm, setSppgForm] = useState({ nama_sppg: '', alamat: '', longitude: '', latitude: '' });
  const [sekolahForm, setSekolahForm] = useState({ nama_sekolah: '', jenjang: 'SD', alamat: '', nama_kelurahan: '', longitude: '', latitude: '' });
  const [formLoading, setFormLoading] = useState(false);

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

  // Statistics calculation
  const totalSppgs = sppgData?.features?.length || 0;
  const totalSchools = sekolahData?.features?.length || 0;
  const blankSpotsCount = sekolahData?.features?.filter((f: any) => f.properties.status === 'Blank Spot').length || 0;
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
                      Batas Kelurahan
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showJalan}
                        onChange={(e) => setShowJalan(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Jaringan Jalan
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#1C322D]/85 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showServiceArea}
                        onChange={(e) => setShowServiceArea(e.target.checked)}
                        className="rounded border-[#1C322D]/35 bg-white text-[#1C322D] focus:ring-[#1C322D] w-4 h-4"
                      />
                      Service Area SPPG (6 km Jaringan Jalan)
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
                    {kelurahanStats.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setSelectedKelurahan(selectedKelurahan === k.nama_kelurahan ? null : k.nama_kelurahan)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors font-mono ${
                          selectedKelurahan === k.nama_kelurahan
                            ? 'bg-[#1C322D] border-[#1C322D] text-white'
                            : 'bg-white border-[#1C322D]/15 hover:bg-slate-50 text-[#1C322D]'
                        }`}
                      >
                        <span className="font-semibold">{k.nama_kelurahan}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            selectedKelurahan === k.nama_kelurahan ? 'bg-[#F8F3EE] text-[#1C322D]' : 'bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]'
                          }`}>{k.terlayani_count}</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            selectedKelurahan === k.nama_kelurahan ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-[#F1CDBE] border border-[#1C322D]/15 text-[#1C322D]'
                          }`}>{k.blank_spot_count}</span>
                        </div>
                      </button>
                    ))}
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
                  {sppgData?.features?.map((f: any) => (
                    <div key={f.properties.id} className="p-3 bg-white border border-[#1C322D]/15 rounded-2xl text-xs space-y-1 shadow-sm text-[#1C322D]">
                      <h4 className="font-bold text-[#1C322D] font-sans">{f.properties.nama}</h4>
                      <p className="text-slate-650 font-serif">{f.properties.alamat}</p>
                      <div className="flex justify-between text-[10px] text-[#1C322D]/70 pt-1 font-mono">
                        <span>Node: {f.properties.node_id || '-'}</span>
                        <span className="text-[#EBB552] font-bold">Area: {f.properties.luas_coverage_km2 || '0'} km²</span>
                      </div>
                    </div>
                  ))}
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
                  {sekolahData?.features?.map((f: any) => (
                    <div key={f.properties.id} className="p-3 bg-white border border-[#1C322D]/15 rounded-2xl text-xs space-y-1 shadow-sm text-[#1C322D]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1C322D] font-sans">{f.properties.nama}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          f.properties.status === 'Blank Spot' ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-[#F8F3EE] border border-[#1C322D]/10 text-[#1C322D]'
                        }`}>
                          {f.properties.status}
                        </span>
                      </div>
                      <p className="text-slate-650 font-serif">{f.properties.alamat}</p>
                      <div className="flex justify-between text-[10px] text-[#1C322D]/70 font-mono">
                        <span>Kelurahan: {f.properties.kelurahan}</span>
                        <span>Node: {f.properties.node_id || '-'}</span>
                      </div>
                    </div>
                  ))}
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
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">SQ-02: Jarak Tempuh Jaringan Jalan</h3>
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

                {/* SQ-05 Validasi Table */}
                <div className="p-4 bg-white border border-[#1C322D]/15 rounded-2xl shadow-md text-[#1C322D]">
                  <h3 className="text-sm font-bold text-[#1C322D] mb-3 font-sans">SQ-05: Validasi Jangkauan (Buffer 6km)</h3>
                  <div className="max-h-[300px] overflow-y-auto text-[11px] space-y-2 pr-1">
                    {rekomendasiValidasi.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-[#1C322D]/15 flex justify-between items-center shadow-xs text-[#1C322D]">
                        <div>
                          <p className="font-semibold text-[#1C322D] font-sans">{item.nama_sekolah}</p>
                          <p className="text-[10px] text-[#1C322D]/70 font-mono">Kluster Centroid #{item.kluster_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#EBB552] bg-[#1C322D] px-2 py-0.5 rounded font-mono text-[9px] inline-block">{Math.round(item.jarak_meter)} m</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border mt-1 block ${
                            item.status_validasi === 'Di luar jangkauan' ? 'bg-[#F1CDBE] border-[#1C322D]/20 text-[#1C322D]' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}>
                            {item.status_validasi}
                          </span>
                        </div>
                      </div>
                    ))}
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
            sppgGeojson={sppgData}
            sekolahGeojson={sekolahData}
            serviceAreaGeojson={showServiceArea ? serviceArea : null}
            kelurahanGeojson={showKelurahan ? kelurahanBoundaries : null}
            rekomendasiGeojson={showRekomendasi ? rekomendasi : null}
            jalanGeojson={showJalan ? jalanData : null}
            selectedKelurahan={selectedKelurahan}
          />
        </div>
      </main>

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
