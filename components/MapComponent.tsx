'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  sppgGeojson: any;
  sekolahGeojson: any;
  kelurahanGeojson: any;
  rekomendasiGeojson: any;
  jalanGeojson: any;
  selectedKelurahan: string | null;
  sppgRoutesGeojson?: any;
  selectedSppgId?: string | null;
  onSelectSppg?: (id: string | null) => void;
  sekolahRouteGeojson?: any;
  selectedSekolahId?: string | null;
  onSelectSekolah?: (id: string | null) => void;
}

export default function MapComponent({
  sppgGeojson,
  sekolahGeojson,
  kelurahanGeojson,
  rekomendasiGeojson,
  jalanGeojson,
  selectedKelurahan,
  sppgRoutesGeojson,
  selectedSppgId,
  onSelectSppg,
  sekolahRouteGeojson,
  selectedSekolahId,
  onSelectSekolah,
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

    // Initialize map centered at Sumbersari, Jember
    const map = L.map(mapContainerRef.current, {
      center: [-8.170, 113.722],
      zoom: 13,
      zoomControl: false,
    });
    mapRef.current = map;

    // Custom positioned zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Beautiful Light Voyager Map Tiles
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

  // Update Layers when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers
    Object.values(layersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    layersRef.current = {};

    // 1. Render Administrative Boundaries
    if (kelurahanGeojson) {
      layersRef.current.kelurahan = L.geoJSON(kelurahanGeojson, {
        style: (feature: any) => {
          const isSelected = selectedKelurahan === feature.properties.nama;
          const isKelurahan = feature.properties.tipe === 'kelurahan';

          if (isKelurahan) {
            // Colors list for different Kelurahans in Sumbersari
            const kelurahanColors = [
              '#F1CDBE', // Pastel Coral
              '#CBE3DB', // Sage Green
              '#D4E2F1', // Soft Blue
              '#F7E5C8', // Cream Yellow
              '#E2CBE8', // Pastel Purple
              '#F5D1D1', // Light Red
              '#D1F5DB', // Mint
              '#F5E8D1', // Sand
            ];
            // Simple string hashing to get a stable color index for each kelurahan name
            let hash = 0;
            const name = feature.properties.nama || '';
            for (let i = 0; i < name.length; i++) {
              hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIndex = Math.abs(hash) % kelurahanColors.length;
            const fillColor = kelurahanColors[colorIndex];

            return {
              fillColor: isSelected ? '#EBB552' : fillColor,
              fillOpacity: isSelected ? 0.45 : 0.25,
              color: isSelected ? '#EBB552' : '#2C4B44',
              weight: isSelected ? 3 : 1.5,
              dashArray: isSelected ? '' : '3',
            };
          } else {
            // Kecamatan style - neutral slate color
            return {
              fillColor: '#E2E8F0',
              fillOpacity: 0.05,
              color: '#64748B',
              weight: 1.2,
              dashArray: '5, 5',
            };
          }
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          if (props.tipe === 'kelurahan') {
            layer.bindPopup(`
              <div class="p-1 text-[#1C322D] font-sans">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-[#1C322D]/10 text-[#1C322D]">
                  Kelurahan (Sumbersari)
                </span>
                <h3 class="font-bold text-sm text-[#1C322D] font-sans mt-1.5">Kel. ${props.nama}</h3>
                <p class="text-xs mt-1 font-sans">Total Sekolah: <span class="font-bold text-slate-800">${props.total_sekolah}</span></p>
                <div class="flex items-center gap-2 mt-2 text-xs">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-sans">${props.terlayani_count} Terlayani</span>
                  <span class="px-1.5 py-0.5 rounded bg-[#F1CDBE] text-[#1C322D] font-bold font-sans">${props.blank_spot_count} Blank Spot</span>
                </div>
              </div>
            `);
          } else {
            layer.bindPopup(`
              <div class="p-1 text-[#1C322D] font-sans">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-[#64748B]/10 text-[#64748B]">
                  Kecamatan
                </span>
                <h3 class="font-bold text-sm text-[#1C322D] font-sans mt-1.5">Kec. ${props.nama}</h3>
              </div>
            `);
          }
        },
      }).addTo(map);
    }

    // 1.5. Render Jaringan Jalan
    if (jalanGeojson) {
      layersRef.current.jalan = L.geoJSON(jalanGeojson, {
        style: {
          color: '#2C4B44',
          weight: 1.5,
          opacity: 0.35,
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <h4 class="font-bold text-xs text-[#1C322D] font-sans">Jaringan Jalan</h4>
              <p class="text-xs text-slate-550 mt-1">ID: ${props.id || '-'}</p>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 1.8. Render Selected SPPG routes to schools (<= 6km) – legacy API routes
    if (sppgRoutesGeojson) {
      layersRef.current.sppgRoutes = L.geoJSON(sppgRoutesGeojson, {
        style: {
          color: '#E0533C',
          weight: 4.5,
          opacity: 0.9,
        },
      }).addTo(map);
    }

    // 1.9. Render Selected School route to its SPPG – legacy API route
    if (sekolahRouteGeojson) {
      layersRef.current.sekolahRoute = L.geoJSON(sekolahRouteGeojson, {
        style: {
          color: '#8B5CF6',
          weight: 5,
          opacity: 0.9,
        },
      }).addTo(map);
    }

    // 1.85. Render jalur_distribusi from GeoJSON properties
    // Case A: sekolah selected → show its own jalur_distribusi
    // Case B: sppg selected → show all jalur_distribusi of schools under that SPPG
    const distribusiFeatures: any[] = [];

    if (selectedSekolahId && sekolahGeojson) {
      const selectedSchool = sekolahGeojson.features?.find(
        (f: any) => f.properties.id === selectedSekolahId
      );
      if (selectedSchool?.properties?.jalur_distribusi) {
        distribusiFeatures.push({
          type: 'Feature',
          geometry: selectedSchool.properties.jalur_distribusi,
          properties: { sekolah_id: selectedSekolahId, mode: 'sekolah' },
        });
      }
    } else if (selectedSppgId && sekolahGeojson) {
      sekolahGeojson.features?.forEach((f: any) => {
        if (f.properties.id_sppg === selectedSppgId && f.properties.jalur_distribusi) {
          distribusiFeatures.push({
            type: 'Feature',
            geometry: f.properties.jalur_distribusi,
            properties: { sekolah_id: f.properties.id, mode: 'sppg' },
          });
        }
      });
    }

    if (distribusiFeatures.length > 0) {
      const isSppgMode = distribusiFeatures[0].properties.mode === 'sppg';
      layersRef.current.sekolahRoute = L.geoJSON(
        { type: 'FeatureCollection', features: distribusiFeatures } as any,
        {
          style: {
            color: isSppgMode ? '#E0533C' : '#8B5CF6',
            weight: isSppgMode ? 4 : 5,
            opacity: 0.92,
          },
        }
      ).addTo(map);
    }

    // 3. Render Schools
    if (sekolahGeojson) {
      layersRef.current.sekolah = L.geoJSON(sekolahGeojson, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          const props = feature.properties;
          const isBlankSpot = !props.id_sppg;
          const isSelected = selectedSekolahId === props.id;
          // Highlight if this school belongs to the selected SPPG
          const isUnderSelectedSppg = !!(selectedSppgId && props.id_sppg === selectedSppgId);

          const markerHtml = `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full border border-[#1C322D] shadow-md transition-transform hover:scale-125
              ${
                isSelected
                  ? 'bg-[#8B5CF6] text-white scale-125 border-[#1C322D] ring-4 ring-[#8B5CF6]/40'
                  : isUnderSelectedSppg
                  ? 'bg-[#E0533C] text-white scale-110 ring-4 ring-[#E0533C]/40'
                  : isBlankSpot
                  ? 'bg-[#F1CDBE] text-[#1C322D]'
                  : 'bg-[#F8F3EE] text-[#1C322D]'
              }">
              <span class="text-[9px] font-black">${props.jenjang}</span>
              ${isBlankSpot && !isSelected && !isUnderSelectedSppg ? '<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB552] opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EBB552]"></span></span>' : ''}
              ${isUnderSelectedSppg && !isSelected ? '<span class="absolute -inset-1 rounded-full border-2 border-[#E0533C]/60 animate-ping opacity-70"></span>' : ''}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-school-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker(latlng, { icon: customIcon });
          if (onSelectSekolah) {
            marker.on('click', () => {
              onSelectSekolah(isSelected ? null : props.id);
            });
          }
          return marker;
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          const isBlankSpot = !props.id_sppg;
          const servingSppg = sppgGeojson?.features?.find((f: any) => f.properties.id === props.id_sppg);
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

    // 4. Render SPPG Locations
    if (sppgGeojson) {
      layersRef.current.sppg = L.geoJSON(sppgGeojson, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          const props = feature.properties;
          const isSelected = selectedSppgId === props.id;

          const markerHtml = `
            <div class="flex items-center justify-center w-9 h-9 rounded-xl border border-[#1C322D] shadow-lg shadow-[#1C322D]/35 hover:scale-110 transition-transform
              ${isSelected ? 'bg-[#1C322D] text-[#EBB552]' : 'bg-[#EBB552] text-[#1C322D]'}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
            marker.on('click', () => {
              onSelectSppg(isSelected ? null : props.id);
            });
          }
          return marker;
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#1C322D]/10 text-[#1C322D]">
                Satuan Pelayanan Gizi
              </span>
              <h3 class="font-black text-sm text-slate-900 mt-2">${props.nama}</h3>
              <p class="text-xs text-slate-600 mt-1">${props.alamat}</p>
              <p class="text-xs text-[#EBB552] bg-[#1C322D] px-2 py-1 rounded-lg mt-2 font-bold font-mono">Luas Coverage: ${props.luas_coverage_km2 || '0'} km²</p>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 5. Render Recommendations
    if (rekomendasiGeojson) {
      layersRef.current.rekomendasi = L.geoJSON(rekomendasiGeojson, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          // Circular marker with ping animation
          const markerHtml = `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#F1CDBE] border border-[#1C322D] shadow-lg hover:scale-115 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 text-[#1C322D] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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

          return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-[#EBB552]/20 text-[#1C322D]">
                Rekomendasi SPPG Baru
              </span>
              <h3 class="font-bold text-sm text-slate-900 mt-2 font-sans">Sentroid Kluster #${props.kluster_id}</h3>
              <p class="text-xs text-slate-600 mt-1 font-sans">Mengcover: <span class="text-[#EBB552] bg-[#1C322D] px-1.5 py-0.5 rounded font-bold font-mono">${props.jumlah_sekolah} Sekolah</span></p>
              <p class="text-[10px] text-slate-400 mt-2">Dihitung otomatis via ST_Centroid basis threshold 6km.</p>
            </div>
          `);
        },
      }).addTo(map);
    }
  }, [sppgGeojson, sekolahGeojson, kelurahanGeojson, rekomendasiGeojson, jalanGeojson, selectedKelurahan, sppgRoutesGeojson, selectedSppgId, sekolahRouteGeojson, selectedSekolahId]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#F8F3EE] rounded-2xl overflow-hidden" />;
}
