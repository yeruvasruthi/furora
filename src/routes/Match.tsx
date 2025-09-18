import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import quiz from '../data/quiz.json'

export default function MatchComponent() {
  const [answers, setAnswers] = useState<number[]>([])
  const step = answers.length
  const total = (quiz as any[]).length
  const q = (quiz as any[])[step]

  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('match:favs') || '[]') } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('match:favs', JSON.stringify(favs)) }, [favs])

  // Pagination
  const [visibleCount, setVisibleCount] = useState(9)

  // Modal for saved pet details
  const [selectedPet, setSelectedPet] = useState<any | null>(null)

  const score = answers.reduce((s, w) => s + w, 0)

  function choose(weight: number) { setAnswers(a => [...a, weight]) }
  function goBack() { if (answers.length > 0) setAnswers(a => a.slice(0, -1)) }
  function restart() { setAnswers([]); setPets([]); setError(null); setLoading(false); setVisibleCount(9) }

  // Fetch pets when quiz is done
  useEffect(() => {
    async function fetchPets() {
      try {
        setLoading(true)
        const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080"
        const res = await fetch(`${API_BASE}/api/pets?type=dog&limit=50`)
        
        if (!res.ok) throw new Error("Failed to fetch pets")
        const data = await res.json()
        const normalized = (data.animals || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          age: p.age,
          breed: p.breeds?.primary,
          photo: p.photos?.[0]?.medium || null,
          traits: p.tags || [],
          score: Math.floor(Math.random() * 30),
          link: p.url
        }))
        setPets(normalized)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (step >= total && pets.length === 0) fetchPets()
  }, [step, total, pets.length])

  // After quiz
  if (step >= total) {
    if (loading) return <p className="text-center py-10">Loading adoptable pets…</p>
    if (error) return <p className="text-center py-10 text-red-600">{error}</p>

    const ranked = pets
      .map((p) => ({ ...p, fit: Math.abs((p.score ?? 0) - score) }))
      .sort((a, b) => a.fit - b.fit)

    const maxFit = ranked.length ? Math.max(...ranked.map(r => r.fit)) || 1 : 1
    const results = ranked.map(r => ({
      ...r,
      matchPct: Math.round(100 - (r.fit / maxFit) * 100)
    }))

    function toggleFav(id: string) {
      setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [id, ...f])
    }

    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-3xl">Your Matches</h2>
          <button onClick={restart} className="px-3 py-1.5 rounded-card border border-black/10 text-sm hover:shadow-soft">
            Restart quiz
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.slice(0, visibleCount).map((r) => (
            <motion.div
              key={r.id}
              className="rounded-2xl overflow-hidden border border-black/10 bg-white hover:shadow-soft transition-shadow"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <div className="h-40 bg-black/5 overflow-hidden group">
  {r.photo ? (
    <img
      src={r.photo}
      alt={r.name}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
    />
  ) : (
    <div className="w-full h-full grid place-items-center text-3xl">🐾</div>
  )}
</div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-heading text-lg">{r.name}</div>
                    <div className="text-softtext text-sm">{[r.breed, r.age].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px]">
                    {isNaN(r.matchPct) ? '—' : `${r.matchPct}% match`}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.traits.slice(0, 5).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-black/5 text-[11px]">{t}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleFav(r.id)}
                    className={`px-3 py-1.5 rounded-card border text-sm transition ${
                      favs.includes(r.id)
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white border-black/10 hover:shadow-soft'
                    }`}
                  >
                    {favs.includes(r.id) ? '♥ Saved' : '♡ Save'}
                  </button>
                  <a href={r.link} target="_blank" rel="noreferrer"
                     className="text-sm underline decoration-black/30 underline-offset-4">
                    View details
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More button */}
        {visibleCount < results.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount(v => v + 9)}
              className="px-4 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm"
            >
              Load More
            </button>
          </div>
        )}

        {/* Saved gallery */}
        {favs.length > 0 && (
          <div className="mt-10">
            <h3 className="font-heading text-lg mb-3">Saved Pets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.filter(r => favs.includes(r.id)).map(r => (
                <div
                key={r.id}
                className="rounded-xl overflow-hidden border border-black/10 bg-white hover:shadow-soft relative group"
              >
                {/* Thumbnail */}
                <div
                  className="h-28 bg-black/5 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPet(r)}
                >
                  {r.photo ? (
                    <img
                      src={r.photo}
                      alt={r.name}
                      className="w-full h-full object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-2xl">🐾</div>
                  )}
                </div>
              
                {/* Info */}
                <div className="p-2 text-center">
                  <div className="font-heading text-sm">{r.name}</div>
                  <div className="text-[11px] text-softtext truncate">{r.breed}</div>
                </div>
              
                {/* Unsave button (top-right corner) */}
                <button
                  onClick={() => toggleFav(r.id)}
                  className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  Unsave
                </button>
              </div>
              
              ))}
            </div>
          </div>
        )}

        {/* Modal for saved pet */}
        <AnimatePresence>
          {selectedPet && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <button
                  onClick={() => setSelectedPet(null)}
                  className="absolute top-3 right-3 text-xl font-bold text-gray-600"
                >
                  ×
                </button>
                <div className="h-60 w-full mb-4 bg-black/5 rounded-xl overflow-hidden">
                  {selectedPet.photo ? (
                    <img src={selectedPet.photo} alt={selectedPet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-3xl">🐾</div>
                  )}
                </div>
                <h3 className="font-heading text-xl mb-2">{selectedPet.name}</h3>
                <p className="text-softtext mb-2">{[selectedPet.breed, selectedPet.age].filter(Boolean).join(' · ')}</p>
                {selectedPet.traits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPet.traits.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-black/5 text-[11px]">{t}</span>
                    ))}
                  </div>
                )}
                <a
                  href={selectedPet.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline decoration-black/30 underline-offset-4"
                >
                  View full profile
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    )
  }

  // Quiz UI
  const progress = (step / total) * 100
  const options = q?.options ?? []

  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="font-heading text-3xl mb-2">Find your match</h2>
      <p className="text-softtext mb-4">A few quick questions.</p>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-softtext mb-1">
          <span>Question {step + 1} of {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/5 overflow-hidden">
          <motion.div
            className="h-2 bg-black"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>
      </div>

      <div className="card p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={q?.id ?? step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="font-heading text-xl mb-4">{q?.prompt}</div>
            <div className="grid gap-3">
              {options.map((o: any, i: number) => (
                <motion.button
                  key={o.id}
                  onClick={() => choose(o.weight)}
                  className="px-4 py-3 rounded-card border border-black/10 hover:shadow-soft transition text-left"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-[11px] text-softtext mr-2">{i + 1}.</span>{o.label}
                </motion.button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={step === 0}
                className={`px-3 py-1.5 rounded-card border text-sm ${step===0 ? 'border-black/10 text-black/30' : 'border-black/10 hover:shadow-soft'}`}
              >
                Back
              </button>
              <div className="text-xs text-softtext">Tip: press 1–{options.length} to answer</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
