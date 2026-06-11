'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  sppgGeojson: any;
  sekolahGeojson: any;
  serviceAreaGeojson: any;
  kelurahanGeojson: any;
  rekomendasiGeojson: any;
  selectedKelurahan: string | null;
}

export default function MapComponent({
  sppgGeojson,
  sekolahGeojson,
  serviceAreaGeojson,
  kelurahanGeojson,
  rekomendasiGeojson,
  selectedKelurahan,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    kelurahan?: L.GeoJSON;
    serviceArea?: L.GeoJSON;
    sekolah?: L.GeoJSON;
    sppg?: L.GeoJSON;
    rekomendasi?: L.GeoJSON;
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

    // 1. Render Kelurahan Boundaries
    if (kelurahanGeojson) {
      layersRef.current.kelurahan = L.geoJSON(kelurahanGeojson, {
        style: (feature: any) => {
          const isSelected = selectedKelurahan === feature.properties.nama;
          return {
            fillColor: isSelected ? '#EBB552' : '#F1CDBE',
            fillOpacity: isSelected ? 0.35 : 0.12,
            color: isSelected ? '#EBB552' : '#1C322D',
            weight: isSelected ? 3 : 1.5,
            dashArray: isSelected ? '' : '3',
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <h3 class="font-bold text-sm text-[#1C322D] font-sans">Kel. ${props.nama}</h3>
              <p class="text-xs mt-1 font-sans">Total Sekolah: <span class="font-bold text-slate-800">${props.total_sekolah}</span></p>
              <div class="flex items-center gap-2 mt-2 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-sans">${props.terlayani_count} Terlayani</span>
                <span class="px-1.5 py-0.5 rounded bg-[#F1CDBE] text-[#1C322D] font-bold font-sans">${props.blank_spot_count} Blank Spot</span>
              </div>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 2. Render Service Areas
    if (serviceAreaGeojson) {
      layersRef.current.serviceArea = L.geoJSON(serviceAreaGeojson, {
        style: (feature: any) => {
          // Color based on SPPG ID
          const colors = ['#EBB552', '#F1CDBE', '#2C4B44'];
          const color = colors[feature.properties.sppg_id % colors.length] || '#EBB552';
          return {
            fillColor: color,
            fillOpacity: 0.15,
            color: color,
            weight: 2,
            dashArray: '5, 5',
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <h4 class="font-bold text-xs text-emerald-800 font-sans">Cakupan Pelayanan</h4>
              <p class="text-sm font-semibold text-slate-900 mt-1">${feature.properties.nama}</p>
              <p class="text-xs text-slate-600 mt-0.5">Jangkauan Jalan: ~${feature.properties.max_cost_meter / 1000} km</p>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 3. Render Schools
    if (sekolahGeojson) {
      layersRef.current.sekolah = L.geoJSON(sekolahGeojson, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          const props = feature.properties;
          const isBlankSpot = props.status === 'Blank Spot';

          const markerHtml = `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full border border-[#1C322D] shadow-md transition-transform hover:scale-125
              ${isBlankSpot ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-[#F8F3EE] text-[#1C322D]'}">
              <span class="text-[9px] font-black">${props.jenjang}</span>
              ${isBlankSpot ? '<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB552] opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EBB552]"></span></span>' : ''}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-school-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties;
          const isBlankSpot = props.status === 'Blank Spot';
          layer.bindPopup(`
            <div class="p-1 text-[#1C322D] font-sans">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white border border-[#1C322D]/20 text-slate-700">${props.jenjang}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${isBlankSpot ? 'bg-[#F1CDBE] text-[#1C322D]' : 'bg-emerald-100 text-emerald-800'}">
                  ${props.status}
                </span>
              </div>
              <h3 class="font-bold text-sm text-slate-900 mt-2">${props.nama}</h3>
              <p class="text-xs text-slate-600 mt-1">${props.alamat}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">Kelurahan: ${props.kelurahan}</p>
            </div>
          `);
        },
      }).addTo(map);
    }

    // 4. Render SPPG Locations
    if (sppgGeojson) {
      layersRef.current.sppg = L.geoJSON(sppgGeojson, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          const markerHtml = `
            <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EBB552] border border-[#1C322D] shadow-lg shadow-[#1C322D]/35 hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#1C322D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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

          return L.marker(latlng, { icon: customIcon });
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

          // Draw a 6km buffer zone circle around this point
          L.circle(latlng, {
            radius: 6000,
            color: '#EBB552',
            fillColor: '#EBB552',
            fillOpacity: 0.04,
            weight: 1.5,
            dashArray: '4, 6',
          }).addTo(map);

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
  }, [sppgGeojson, sekolahGeojson, serviceAreaGeojson, kelurahanGeojson, rekomendasiGeojson, selectedKelurahan]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#F8F3EE] rounded-2xl overflow-hidden" />;
}
