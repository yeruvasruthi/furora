// Free OpenStreetMap (Overpass) client
export type SpotType = 'park' | 'cafe' | 'trail'
export type Bbox = [south: number, west: number, north: number, east: number]

// Per-type colors (use in MapView or ignore)
export const TYPE_COLOR: Record<SpotType, string> = {
  park:  '#7C8A6A',
  cafe:  '#C98B6B',
  trail: '#D8C3A5',
}

function buildQuery(bbox: Bbox, types: SpotType[]) {
  const [s, w, n, e] = bbox
  const q: string[] = []

  if (types.includes('park')) {
    q.push(`
      node["leisure"~"^(park|dog_park)$"](${s},${w},${n},${e});
      way["leisure"~"^(park|dog_park)$"](${s},${w},${n},${e});
      relation["leisure"~"^(park|dog_park)$"](${s},${w},${n},${e});
    `)
  }

  if (types.includes('cafe')) {
    // Pet-friendly bias at query level (keep if you want stricter results)
    q.push(`
      node["amenity"~"^(cafe|restaurant)$"]["outdoor_seating"~".*|yes|true|1"]["name"](${s},${w},${n},${e});
      way ["amenity"~"^(cafe|restaurant)$"]["outdoor_seating"~".*|yes|true|1"]["name"](${s},${w},${n},${e});
      node["amenity"~"^(cafe|restaurant)$"]["dogs"="yes"]["name"](${s},${w},${n},${e});
      way ["amenity"~"^(cafe|restaurant)$"]["dogs"="yes"]["name"](${s},${w},${n},${e});
    `)
  }

  if (types.includes('trail')) {
    // Trails often lack names; don't require it. Include hiking relations.
    q.push(`
      way["highway"~"^(path|footway|track)$"](${s},${w},${n},${e});
      relation["route"="hiking"](${s},${w},${n},${e});
    `)
  }

  // No global 100 limit; include centers + tags for mapping
  return `[out:json][timeout:25];(${q.join('\n')});out center tags;`
}

export type Spot = {
  id: string
  name: string
  type: SpotType
  lat: number
  lng: number
  amenities?: string[]
  tags?: string[]
  color?: string // optional, for map styling
}

export async function fetchOverpass(bbox: Bbox, types: SpotType[]): Promise<Spot[]> {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    body: buildQuery(bbox, types),
  })
  const data = await res.json()

  const out: Spot[] = []

  for (const el of data.elements || []) {
    const tags = el.tags || {}

    const center =
      el.type === 'node'
        ? { lat: el.lat, lng: el.lon }
        : el.center
        ? { lat: el.center.lat, lng: el.center.lon }
        : null
    if (!center) continue

    // ---------- Type normalization ----------
    let type: SpotType | null = null

    // Parks (includes dog parks)
    if (tags.leisure === 'park' || tags.leisure === 'dog_park') {
      type = 'park'
    }

    // Cafes / restaurants (ensure lowercase 'restaurant')
    if (tags.amenity === 'cafe' || tags.amenity === 'restaurant') {
      // keep pet-friendly bias here; loosen if you want more hits
      if (tags.outdoor_seating || tags.dogs === 'yes') {
        type = type ?? 'cafe'
      }
    }

    // Trails: ways OR hiking relations
    if (
      (el.type === 'way' && /^(path|footway|track)$/.test(tags.highway || '')) ||
      tags.route === 'hiking'
    ) {
      type = 'trail'
    }

    if (!type) continue

    // ---------- Amenities ----------
    const amenities: string[] = []
    if (tags.outdoor_seating) amenities.push('Outdoor Seating')
    if (tags.dogs === 'yes') amenities.push('Dogs Allowed')
    if (tags.drinking_water === 'yes') amenities.push('Water')

    out.push({
      id: `${el.type}:${el.id}`,
      name: tags.name || (type === 'trail' ? 'Trail' : 'Unnamed'),
      type,
      lat: center.lat,
      lng: center.lng,
      amenities,
      tags: Object.keys(tags),
      color: TYPE_COLOR[type],
    })
  }

  return out
}
