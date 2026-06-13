'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  SppgCollection,
  SekolahCollection,
  GeoJSONCollection,
  RekomendasiCollection,
  RekomendasiValidasiItem,
  SekolahProperties,
  SppgProperties,
  RekomendasiProperties,
  KelurahanCollection,
  KelurahanFeatureProperties,
} from '@/types/dashboard';

// Leaflet's GeoJSON layer accepts a generic GeoJSON object; we use
// the typed collections where possible and narrow with type guards.


interface MapComponentProps {
  sppgGeojson: SppgCollection | null;
  sekolahGeojson: SekolahCollection | null;
  kelurahanGeojson: KelurahanCollection | null;
  rekomendasiGeojson: RekomendasiCollection | null;
  showJalan: boolean;
  selectedKelurahan: string | null;
  onSelectKelurahan?: (nama: string | null) => void;
  sppgRoutesGeojson?: GeoJSONCollection | null;
  selectedSppgId?: string | null;
  onSelectSppg?: (id: string | null) => void;
  sekolahRouteGeojson?: GeoJSONCollection | null;
  selectedSekolahId?: string | null;
  onSelectSekolah?: (id: string | null) => void;
  selectedRekomendasiId?: string | null;
  onSelectRekomendasi?: (id: string | null) => void;
  rekomendasiValidasi?: RekomendasiValidasiItem[];
}

export default function MapComponent({
  sppgGeojson,
  sekolahGeojson,
  kelurahanGeojson,
  rekomendasiGeojson,
  showJalan,
  selectedKelurahan,
  onSelectKelurahan,
  sppgRoutesGeojson,
  selectedSppgId,
  onSelectSppg,
  sekolahRouteGeojson,
  selectedSekolahId,
  onSelectSekolah,
  selectedRekomendasiId,
  onSelectRekomendasi,
  rekomendasiValidasi,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    kelurahan?: L.GeoJSON;
    jalan?: L.GeoJSON;
    sekolah?: L.GeoJSON;
    sppg?: L.GeoJSON;
    rekomendasi?: L.GeoJSON;
    sppgRoutes?: L.GeoJSON;
    sekolahRoute?: L.GeoJSON;
    distribusiLines?: L.GeoJSON;
  }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-8.170, 113.722],
      zoom: 13,
      zoomControl: false,
    });
    mapRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(layersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    layersRef.current = {};

    // 1. Administrative boundaries
    if (kelurahanGeojson) {
      layersRef.current.kelurahan = L.geoJSON(kelurahanGeojson as Parameters<typeof L.geoJSON>[0], {
        style: (feature) => {
          const props = feature?.properties as KelurahanFeatureProperties;
          const isSelected = selectedKelurahan === props.nama;
          const isKelurahan = props.tipe === 'kelurahan';

          if (isKelurahan) {
            const kelurahanColors = [
              '#F1CDBE', '#CBE3DB', '#D4E2F1', '#F7E5C8',
              '#E2CBE8', '#F5D1D1', '#D1F5DB', '#F5E8D1',
            ];
            let hash = 0;
            const name = props.nama || '';
            for (let i = 0; i < name.length; i++) {
              hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const fillColor = kelurahanColors[Math.abs(hash) % kelurahanColors.length];
            return {
              fillColor: isSelected ? '#EBB552' : fillColor,
              fillOpacity: isSelected ? 0.45 : 0.25,
              color: isSelected ? '#EBB552' : '#2C4B44',
              weight: isSelected ? 3 : 1.5,
              dashArray: isSelected ? '' : '3',
            };
          }
          return {
            fillColor: '#E2E8F0',
            fillOpacity: 0.05,
            color: '#64748B',
            weight: 1.2,
            dashArray: '5, 5',
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as KelurahanFeatureProperties;
          if (props.tipe === 'kelurahan') {
            layer.on('click', () => {
              onSelectKelurahan?.(selectedKelurahan === props.nama ? null : props.nama);
            });
          } else {
            layer.bindPopup(`
              <div class="p-1 text-[#1C322D] font-sans">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-[#64748B]/10 text-[#64748B]">Kecamatan</span>
                <h3 class="font-bold text-sm text-[#1C322D] font-sans mt-1.5">Kec. ${props.nama}</h3>
              </div>
            `);
          }
        },
      }).addTo(map);
    }

    // 1.5. Subtle distribution route lines (all schools)
    if (showJalan && sekolahGeojson) {
      const allRoutesFeatures = sekolahGeojson.features
        .filter((f) => f.properties.jalur_distribusi !== null)
        .map((f) => ({
          type: 'Feature' as const,
          geometry: f.properties.jalur_distribusi!,
          properties: { sekolah_id: f.properties.id, tipe: 'distribusi_subtle' },
        }));

      if (allRoutesFeatures.length > 0) {
        layersRef.current.jalan = L.geoJSON(
          { type: 'FeatureCollection', features: allRoutesFeatures } as Parameters<typeof L.geoJSON>[0],
          { style: { color: '#8B5CF6', weight: 1.2, opacity: 0.45 } }
        ).addTo(map);
      }
    }

    // 1.85. Highlighted distribution routes for selected sekolah/sppg
    type DistribusiFeature = {
      type: 'Feature';
      geometry: object;
      properties: { sekolah_id: string; mode: 'sekolah' | 'sppg' };
    };
    const distribusiFeatures: DistribusiFeature[] = [];

    if (selectedSekolahId && sekolahGeojson) {
      const sel = sekolahGeojson.features.find((f) => f.properties.id === selectedSekolahId);
      const jalur = sel?.properties.jalur_distribusi;
      if (jalur) {
        distribusiFeatures.push({ type: 'Feature', geometry: jalur, properties: { sekolah_id: selectedSekolahId, mode: 'sekolah' } });
      }
    } else if (selectedSppgId && sekolahGeojson) {
      sekolahGeojson.features.forEach((f) => {
        const jalur = f.properties.jalur_distribusi;
        if (f.properties.id_sppg === selectedSppgId && jalur) {
          distribusiFeatures.push({ type: 'Feature', geometry: jalur, properties: { sekolah_id: f.properties.id, mode: 'sppg' } });
        }
      });
    }

    if (distribusiFeatures.length > 0) {
      const isSppgMode = distribusiFeatures[0].properties.mode === 'sppg';
      layersRef.current.sekolahRoute = L.geoJSON(
        { type: 'FeatureCollection', features: distribusiFeatures } as Parameters<typeof L.geoJSON>[0],
        { style: { color: isSppgMode ? '#E0533C' : '#8B5CF6', weight: isSppgMode ? 4 : 5, opacity: 0.92 } }
      ).addTo(map);
    }

    // 3. Schools
    if (sekolahGeojson) {
      layersRef.current.sekolah = L.geoJSON(sekolahGeojson as Parameters<typeof L.geoJSON>[0], {
        pointToLayer: (feature, latlng) => {
          const props = feature.properties as SekolahProperties;
          const isBlankSpot = !props.id_sppg;
          const isSelected = selectedSekolahId === props.id;
          const isUnderSelectedSppg = !!(selectedSppgId && props.id_sppg === selectedSppgId);

          let isUnderSelectedRekomendasi = false;
          if (selectedRekomendasiId && isBlankSpot && rekomendasiValidasi) {
            isUnderSelectedRekomendasi = rekomendasiValidasi.some(
              (v) => v.nama_sekolah === props.nama && String(v.kluster_id) === selectedRekomendasiId
            );
          }

          const markerHtml = `
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full border border-[#1C322D] shadow-md transition-transform hover:scale-125
              ${
                isSelected
                  ? 'bg-[#8B5CF6] text-white scale-125 border-[#1C322D] ring-4 ring-[#8B5CF6]/40'
                  : isUnderSelectedSppg
                  ? 'bg-[#E0533C] text-white scale-110 ring-4 ring-[#E0533C]/40'
                  : isUnderSelectedRekomendasi
                  ? 'bg-[#EBB552] text-[#1C322D] scale-110 ring-4 ring-[#EBB552]/40'
                  : isBlankSpot
                  ? 'bg-[#F1CDBE] text-[#1C322D]'
                  : 'bg-[#F8F3EE] text-[#1C322D]'
              }">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m4 6 8-4 8 4" />
                <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
                <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
                <path d="M18 5v17" />
                <path d="M6 5v17" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              ${isBlankSpot && !isSelected && !isUnderSelectedSppg && !isUnderSelectedRekomendasi ? '<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB552] opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EBB552]"></span></span>' : ''}
              ${isUnderSelectedSppg && !isSelected ? '<span class="absolute -inset-1 rounded-full border-2 border-[#E0533C]/60 animate-ping opacity-70"></span>' : ''}
              ${isUnderSelectedRekomendasi && !isSelected ? '<span class="absolute -inset-1 rounded-full border-2 border-[#EBB552]/60 animate-ping opacity-70"></span>' : ''}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-school-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker(latlng, { icon: customIcon });
          if (onSelectSekolah) {
            marker.on('click', () => onSelectSekolah(isSelected ? null : props.id));
          }
          return marker;
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as SekolahProperties;
          const isBlankSpot = !props.id_sppg;
          const servingSppg = sppgGeojson?.features.find((f) => f.properties.id === props.id_sppg);
          const sppgInfoHtml = servingSppg
            ? `<div class="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                 <span class="font-bold">Dilayani Oleh:</span>
                 <p class="font-semibold text-emerald-950 mt-0.5">${servingSppg.properties.nama}</p>
               </div>`
            : `<div class="mt-2 text-xs bg-[#F1CDBE]/30 text-[#1C322D] p-2 rounded-lg border border-[#F1CDBE]/50">
                 <span class="font-bold">Status:</span> Belum terlayani SPPG (Blank Spot)
               </div>`;

          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white border border-[#1C322D]/20 text-slate-700">${props.jenjang}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${isBlankSpot ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-emerald-100 text-emerald-800'}">
                  ${isBlankSpot ? 'Blank Spot' : 'Terlayani'}
                </span>
              </div>
              <h3 class="font-bold text-sm text-slate-900 mt-2">${props.nama}</h3>
              <p class="text-xs text-slate-600 mt-1">${props.alamat}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">Kelurahan: ${props.kelurahan}</p>
              ${sppgInfoHtml}
            </div>
          `);
        },
      }).addTo(map);
    }

    // 4. SPPG locations
    if (sppgGeojson) {
      layersRef.current.sppg = L.geoJSON(sppgGeojson as Parameters<typeof L.geoJSON>[0], {
        pointToLayer: (feature, latlng) => {
          const props = feature.properties as SppgProperties;
          const isSelected = selectedSppgId === props.id;

          const markerHtml = `
            <div class="flex items-center justify-center w-9 h-9 rounded-xl border border-[#1C322D] shadow-lg shadow-[#1C322D]/35 hover:scale-110 transition-transform
              ${isSelected ? 'bg-[#1C322D] text-[#EBB552]' : 'bg-[#EBB552] text-[#1C322D]'}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-sppg-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker(latlng, { icon: customIcon });
          if (onSelectSppg) {
            marker.on('click', () => onSelectSppg(isSelected ? null : props.id));
          }
          return marker;
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as SppgProperties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#1C322D]/10 text-[#1C322D]">Satuan Pelayanan Gizi</span>
              <h3 class="font-black text-sm text-slate-900 mt-2">${props.nama}</h3>
              <p class="text-xs text-slate-600 mt-1">${props.alamat}</p>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 5. Recommendations
    if (rekomendasiGeojson) {
      layersRef.current.rekomendasi = L.geoJSON(rekomendasiGeojson as Parameters<typeof L.geoJSON>[0], {
        pointToLayer: (feature, latlng) => {
          const props = feature.properties as RekomendasiProperties;
          const isSelected =
            selectedRekomendasiId === String(props.kluster_id) ||
            selectedRekomendasiId === String(props.id);

          const markerHtml = `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#1C322D] shadow-lg hover:scale-115 transition-transform
              ${isSelected
                ? 'bg-[#1C322D] text-[#EBB552] scale-110 ring-4 ring-[#EBB552]/40 border-[#EBB552]'
                : 'bg-[#F1CDBE] text-[#1C322D]'}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span class="absolute -inset-1.5 rounded-full border border-[#EBB552]/40 animate-ping opacity-60"></span>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-rekomendasi-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker(latlng, { icon: customIcon });
          if (onSelectRekomendasi) {
            marker.on('click', () =>
              onSelectRekomendasi(isSelected ? null : String(props.kluster_id))
            );
          }

          if (isSelected) {
            const circle = L.circle(latlng, {
              radius: 6000,
              color: '#1C322D',
              fillColor: '#F1CDBE',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
              interactive: false,
            });
            return L.layerGroup([circle, marker]);
          }

          return marker;
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as RekomendasiProperties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-[#EBB552]/20 text-[#1C322D]">Rekomendasi SPPG Baru</span>
              <h3 class="font-bold text-sm text-slate-900 mt-2 font-sans">Sentroid Kluster #${props.kluster_id}</h3>
              <p class="text-xs text-slate-600 mt-1 font-sans">Mengcover: <span class="text-[#EBB552] bg-[#1C322D] px-1.5 py-0.5 rounded font-bold font-mono">${props.jumlah_sekolah} Sekolah</span></p>
              <p class="text-[10px] text-slate-400 mt-2">Dihitung otomatis via ST_Centroid basis threshold 6km.</p>
            </div>
          `);
        },
      }).addTo(map);
    }
  }, [
    sppgGeojson, sekolahGeojson, kelurahanGeojson, rekomendasiGeojson,
    showJalan, selectedKelurahan, sppgRoutesGeojson, selectedSppgId,
    sekolahRouteGeojson, selectedSekolahId, selectedRekomendasiId, rekomendasiValidasi,
    onSelectKelurahan, onSelectSppg, onSelectSekolah, onSelectRekomendasi,
  ]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#F8F3EE] rounded-2xl overflow-hidden" />;
}
