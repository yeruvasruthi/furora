import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import quiz from '../data/quiz.json'
import pets from '../data/pets.json'

export default function MatchComponent() {
  // track chosen weights so we can go back correctly
  const [answers, setAnswers] = useState<number[]>([])
  const step = answers.length
  const total = (quiz as any[]).length
  const q = (quiz as any[])[step]

  // favorites persisted
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('match:favs') || '[]') } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('match:favs', JSON.stringify(favs)) }, [favs])

  // keyboard shortcuts: 1..n to choose option, Backspace to go back
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (step < total) {
        const opts = (quiz as any[])[step]?.options || []
        const idx = parseInt(e.key, 10) - 1
        if (idx >= 0 && idx < opts.length) {
          choose(opts[idx].weight)
        }
      }
      if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  const score = answers.reduce((s, w) => s + w, 0)

  function choose(weight: number) {
    setAnswers(a => [...a, weight])
  }

  function goBack() {
    if (answers.length === 0) return
    setAnswers(a => a.slice(0, -1))
  }

  function restart() {
    setAnswers([])
  }

  if (step >= total) {
    // compute fit for ALL pets; then compute a relative match % using max fit
    const ranked = (pets as any[])
      .map((p) => ({ ...p, fit: Math.abs((p.score ?? 0) - score) }))
      .sort((a, b) => a.fit - b.fit)

    const maxFit = ranked.length ? Math.max(...ranked.map(r => r.fit)) || 1 : 1
    const results = ranked.slice(0, 6).map(r => ({
      ...r,
      matchPct: Math.round(100 - (r.fit / maxFit) * 100) // 100% is best in this relative group
    }))

    function toggleFav(id: string) {
      setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [id, ...f])
    }

    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-3xl">Your Matches</h2>
          <div className="flex items-center gap-2">
            <button onClick={restart} className="px-3 py-1.5 rounded-card border border-black/10 text-sm hover:shadow-soft">
              Restart quiz
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((r) => (
            <motion.div
              key={r.id}
              className="rounded-2xl overflow-hidden border border-black/10 bg-white shadow-soft/0 hover:shadow-soft transition-shadow"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              {/* photo (if present) */}
              <div className="h-40 bg-black/5 overflow-hidden">
                {r.photo ? (
                  <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
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

                {Array.isArray(r.traits) && r.traits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.traits.slice(0, 5).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-black/5 text-[11px]">{t}</span>
                    ))}
                  </div>
                )}

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
                  <a
                    href={r.link || '#'}
                    className="text-sm underline decoration-black/30 underline-offset-4"
                    onClick={(e) => { if (!r.link) e.preventDefault() }}
                  >
                    View details
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {favs.length > 0 && (
          <div className="mt-8">
            <h3 className="font-heading text-lg mb-2">Saved</h3>
            <div className="text-sm text-softtext">
              {favs.length} saved match{favs.length>1?'es':''}. You can find them again next time on this device.
            </div>
          </div>
        )}
      </section>
    )
  }

  // in-quiz UI
  const progress = (step / total) * 100
  const options = q?.options ?? []

  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="font-heading text-3xl mb-2">Find your match</h2>
      <p className="text-softtext mb-4">A few quick questions.</p>

      {/* progress bar */}
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
                  <span className="text-[11px] text-softtext mr-2">{i+1}.</span>{o.label}
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
