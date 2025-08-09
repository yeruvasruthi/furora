import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Spot } from './overpass'

const colors: Record<Spot['type'], string> = {
  park: '#7C8A6A',
  cafe: '#C98B6B',
  trail: '#D8C3A5',
}

// Inline SVG paw icon (color injected)
function pawSVG(fill: string) {
  return `
<svg width="30" height="30" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="${fill}">
    <circle cx="22" cy="20" r="6"/><circle cx="32" cy="16" r="6"/><circle cx="42" cy="20" r="6"/>
    <path d="M32 28c-8 0-14 5-14 11 0 5 4 9 10 9h8c6 0 10-4 10-9 0-6-6-11-14-11z"/>
  </g>
  <circle cx="32" cy="58" r="3" fill="${fill}" />
</svg>`
}

export default function MapView({
  spots,
  selectedId,
  onSelect,
  onBoundsChange,
  focusBounds, // [S,W,N,E]
}: {
  spots: Spot[]
  selectedId?: string | null
  onSelect: (id: string) => void
  onBoundsChange?: (bbox: [number, number, number, number]) => void
  focusBounds?: [number, number, number, number] | null
}) {
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markerIndex = useRef<Record<string, L.Marker>>({})

  // Init map once
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map('explore-map', { zoomControl: true, minZoom: 3 })
    mapRef.current = map

    // Single-host OSM tiles (works well with CORS)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      crossOrigin: true,
      detectRetina: true,
      maxZoom: 19,
    }).addTo(map)

    // Start over USA; parent will drive via focusBounds after
    const usa = L.latLngBounds([24.5, -124.8], [49.5, -66.9])
    map.fitBounds(usa, { padding: [40, 40] })

    const layer = L.layerGroup().addTo(map)
    layerRef.current = layer

    // Emit bounds on move end
    map.on('moveend', () => {
      const b = map.getBounds()
      onBoundsChange?.([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()])
    })

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markerIndex.current = {}
    }
  }, [onBoundsChange])

  // Jump to provided bounds (e.g., city search or user location)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusBounds) return
    const [S, W, N, E] = focusBounds
    map.flyToBounds(L.latLngBounds([[S, W], [N, E]]), { padding: [40, 40] })
  }, [focusBounds])

  // Draw markers for spots (paw icons, store refs for selection)
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    markerIndex.current = {}
    layer.clearLayers()

    spots.forEach((s) => {
      const icon = L.divIcon({
        className: 'paw-marker', // styled via CSS (optional)
        html: pawSVG(colors[s.type] ?? '#666'),
        iconSize: [30, 30],
        iconAnchor: [15, 28],
        popupAnchor: [0, -28],
      })

      const m = L.marker([s.lat, s.lng], { icon })
        .on('click', () => onSelect?.(s.id))
        .bindTooltip(s.name, { direction: 'top', offset: [0, -8] })

      // bounce-in on add
      m.on('add', () => {
        const el = (m as any)._icon as HTMLElement | null
        if (el) el.style.animation = 'pawBounce 450ms ease-out'
      })

      m.addTo(layer)
      markerIndex.current[s.id] = m
    })
  }, [spots, onSelect])

  // Highlight + pan to selected marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const m = markerIndex.current[selectedId]
    if (!m) return
    const el = (m as any)._icon as HTMLElement | null
    if (el) {
      el.classList.add('paw-selected') // subtle pulse class
      setTimeout(() => el.classList.remove('paw-selected'), 600)
    }
    map.flyTo(m.getLatLng(), Math.max(14, map.getZoom()), { duration: 0.6 })
  }, [selectedId])

  return (
    <div
      id="explore-map"
      className="w-full h-[472px] rounded-2xl border border-black/5 shadow-soft overflow-hidden"
    />
  )
}
