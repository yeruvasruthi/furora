import React, { useEffect, useMemo, useState } from 'react'
import MapView from '../modules/explore/MapView'
import type { Spot } from '../modules/explore/overpass'
import { fetchOverpass, type SpotType } from '../modules/explore/overpass'
import MOCK from '../data/spots.json'

type Checks = { park: boolean; cafe: boolean; trail: boolean }
const typesFromChecks = (c: Checks): SpotType[] =>
  (['park', 'cafe', 'trail'] as SpotType[]).filter((t) => (c as any)[t])

function bboxAround(lat: number, lng: number, meters: number): [number, number, number, number] {
  const latDelta = meters / 111_000
  const lonDelta = meters / (111_000 * Math.cos((lat * Math.PI) / 180))
  return [lat - latDelta, lng - lonDelta, lat + latDelta, lng + lonDelta]
}

const TYPE_COLOR: Record<'park'|'cafe'|'trail', string> = {
  park: '#7C8A6A',
  cafe: '#C98B6B',
  trail: '#D8C3A5',
}

function TypeBadge({ type }: { type: 'park'|'cafe'|'trail' }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-black/5 capitalize">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[type] }} />
      {type}
    </span>
  )
}

/** ---------- US states (name + ISO3166-2 code) ---------- */
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const

type CityOption = { name: string; lat: number; lon: number }

/** Fetch cities/towns for a state via Overpass (by ISO3166-2) */
async function fetchCitiesForState(iso2: string): Promise<CityOption[]> {
  const query = `
[out:json][timeout:25];
area["ISO3166-2"="US-${iso2}"]->.state;
(
  node["place"~"city|town"](area.state);
  way["place"~"city|town"](area.state);
  relation["place"~"city|town"](area.state);
);
out center tags;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  })
  const data = await res.json()
  const items: CityOption[] = (data?.elements ?? [])
    .map((el: any) => {
      const name = el.tags?.name
      const lat = el.center?.lat ?? el.lat
      const lon = el.center?.lon ?? el.lon
      return name && lat && lon ? { name, lat, lon } : null
    })
    .filter(Boolean) as CityOption[]
  const seen = new Set<string>()
  const deduped = items.filter(c => (seen.has(c.name) ? false : (seen.add(c.name), true)))
  return deduped.sort((a, b) => a.name.localeCompare(b.name))
}

/* ------- UI bits: animated toggle + tiny spinner + distance ------- */

function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 h-11 px-4 rounded-full border border-black/10 bg-white text-sm
        ${checked ? 'shadow-soft' : ''}`}
      aria-pressed={checked}
    >
      <span
        className={`relative inline-block w-9 h-5 rounded-full transition-colors
          ${checked ? 'bg-black/80' : 'bg-black/10'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
      <span className="capitalize">{label}</span>
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}

function distanceKm(a: {lat:number; lng:number}, b:{lat:number; lng:number}) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

export default function ExploreComponent() {
  // Filters/search/UI
  const [q, setQ] = useState('')
  const [checks, setChecks] = useState<Checks>({ park: true, cafe: true, trail: true })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Map/Fetch state
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null)
  const [spots, setSpots] = useState<Spot[]>(MOCK as any) // show mock first
  const [loading, setLoading] = useState(false)

  // Location & focus
  const [locating, setLocating] = useState(false)
  const [userLoc, setUserLoc] = useState<{lat:number; lng:number} | null>(null)
  const [focusBounds, setFocusBounds] = useState<[number, number, number, number] | null>(null)

  // Toast (subtle)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }

  // State → City
  const [stateCode, setStateCode] = useState<string>('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [cityName, setCityName] = useState<string>('')

  useEffect(() => {
    let alive = true
    if (!stateCode) { setCities([]); setCityName(''); return }
    ;(async () => {
      try {
        const list = await fetchCitiesForState(stateCode)
        if (!alive) return
        setCities(list)
        setCityName('')
      } catch {
        if (alive) setCities([])
      }
    })()
    return () => { alive = false }
  }, [stateCode])

  useEffect(() => {
    if (!cityName) return
    const chosen = cities.find(c => c.name === cityName)
    if (!chosen) return
    setFocusBounds(bboxAround(chosen.lat, chosen.lon, 10_000))
  }, [cityName, cities])

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation not supported')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLoc({ lat: latitude, lng: longitude })
        setFocusBounds(bboxAround(latitude, longitude, 2_500)) // tighter view
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        showToast(err?.message || 'Location permission denied')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  // Debounced, race-safe fetch when bounds or filters change
  useEffect(() => {
    if (!bbox) return
    let alive = true
    setLoading(true)

    const id = window.setTimeout(async () => {
      try {
        const live = await fetchOverpass(bbox, typesFromChecks(checks))
        if (!alive) return
        setSpots(live)
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false)
      }
    }, 500)

    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [bbox, checks])

  const filtered: Spot[] = useMemo(() => {
    const active = typesFromChecks(checks)
    return spots
      .filter((s) => active.includes(s.type))
      .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
  }, [spots, q, checks])

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h2 className="font-heading text-3xl mb-2">Explore</h2>
        <p className="text-softtext">Pet‑friendly parks, cafés, and trails</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Filters + Map */}
        <div className="md:col-span-2 space-y-4">
          {/* Controls */}
          <div className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur p-4 grid gap-3">
            {/* Row 1: search + toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name…"
                aria-label="Search by name"
                className="h-11 px-4 border border-black/10 rounded-full text-sm bg-white w-full md:flex-1
                           focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <div className="flex items-center gap-2">
                <Toggle checked={checks.park}  onChange={(v)=>setChecks(c=>({...c,park:v}))}  label="Parks" />
                <Toggle checked={checks.cafe}  onChange={(v)=>setChecks(c=>({...c,cafe:v}))}  label="Cafes" />
                <Toggle checked={checks.trail} onChange={(v)=>setChecks(c=>({...c,trail:v}))} label="Trails" />
              </div>
            </div>

            {/* Row 2: state / city / location (centered) */}
            <div className="w-full flex flex-wrap items-center justify-center gap-2">
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                aria-label="Select state"
                className="h-11 px-4 border border-black/10 rounded-full text-sm bg-white min-w-[180px]"
              >
                <option value="">Select state</option>
                {US_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>

              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                aria-label="Select city"
                disabled={!stateCode || cities.length === 0}
                className="h-11 px-4 border border-black/10 rounded-full text-sm bg-white min-w-[200px] disabled:opacity-60"
              >
                <option value="">
                  {stateCode ? (cities.length ? 'Select city' : 'Loading cities…') : 'Select state first'}
                </option>
                {cities.map(c => (
                  <option key={`${c.name}-${c.lat}-${c.lon}`} value={c.name}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={useMyLocation}
                disabled={locating}
                className="h-11 px-4 rounded-full border border-black/10 bg-white text-sm hover:shadow-soft disabled:opacity-60 whitespace-nowrap inline-flex items-center gap-2"
                title="Use my location"
              >
                {locating && <Spinner />}
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>

            {/* Quiet status */}
            {loading && <div className="text-xs text-center text-softtext">Loading…</div>}
          </div>

          {/* Map */}
          <MapView
            spots={filtered}
            selectedId={selectedId ?? undefined}
            onSelect={setSelectedId}
            onBoundsChange={setBbox}
            focusBounds={focusBounds}
          />
        </div>

        {/* Right: List */}
        <aside className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur p-4 md:p-5 md:sticky md:top-4 h-auto md:max-h-[calc(100vh-2rem)] overflow-auto">
          <h3 className="font-heading text-lg mb-3">Places</h3>
          {filtered.length === 0 ? (
            <div className="text-softtext text-sm">No places found. Try different filters.</div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((s) => {
                const active = s.id === selectedId
                const dist = userLoc ? distanceKm(userLoc, { lat: s.lat, lng: s.lng }) : null
                return (
                  <li
                    key={s.id}
                    className={`rounded-xl border border-black/5 p-3 md:p-4 transition-all cursor-pointer bg-white ${
                      active ? 'shadow-soft ring-1 ring-taupe' : 'hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium leading-tight">{s.name}</div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <TypeBadge type={s.type as any} />
                          {!!s.amenities?.length && (
                            <span className="text-xs text-softtext">{s.amenities.join(' · ')}</span>
                          )}
                          {dist != null && (
                            <span className="text-xs text-softtext">
                              · {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline decoration-taupe underline-offset-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in Maps
                      </a>

                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-black/80 text-white text-sm shadow-soft animate-fadeIn">
          {toast}
        </div>
      )}
    </section>
  )
}
