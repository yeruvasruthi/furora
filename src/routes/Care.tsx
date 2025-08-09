import React, { useEffect, useMemo, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import {
  useLocalStorage,
  type Routine,
  type Expense,
  iso,
  startOfMonth,
  endOfMonth,
  sameDay,
  rangeDays,
} from '../modules/care'
type Priority = 'Low' | 'Normal' | 'High'

// Extend the Routine coming from ../modules/care
type RoutinePlus = Routine & {
  priority?: Priority
  daysOfWeek?: number[]   // for weekly repeats
}
type Repeat = 'daily' | 'weekly' | 'monthly' | 'once'

type HealthVisit = { id: string; date: string; vet?: string; reason?: string }
type Vaccination = { id: string; date: string; name: string; expires?: string }
type Medication = { id: string; name: string; dose?: string; start: string; end?: string; notes?: string }
type WeightEntry = { id: string; date: string; kg: number }

type Meal = { id: string; date: string; time?: string; food: string; portion?: string }

type ExpenseTemplate = {
  id: string
  category: Expense['category']
  amount: number
  note?: string
  /** day of month (1-31) to generate on */
  dom: number
}

const todayIso = iso(new Date())

const TABS = ['Routines', 'Calendar', 'Expenses', 'Health', 'Meals'] as const
type Tab = (typeof TABS)[number]

/* ========================= Root ========================= */

export default function Care() {
  const [tab, setTab] = useState<Tab>('Routines')

  const [profile, setProfile] = useLocalStorage('care:profile', {
    name: 'PawPal',
    photoUrl: '',
    breed: '',
    birthdate: '',
  })

 // state
const [routines, setRoutines] = useLocalStorage<RoutinePlus[]>('care:routines', [
  { id:'r1', title:'Morning walk',  repeat:'daily', time:'07:30', startDate: todayIso, completedOn:[], priority: 'Normal' },
  { id:'r2', title:'Joint supplement', repeat:'daily', time:'08:00', startDate: todayIso, completedOn:[], priority: 'High' },
])


  const [expenses, setExpenses] = useLocalStorage<Expense[]>('care:expenses', [])
  const [expenseTemplates, setExpenseTemplates] = useLocalStorage<ExpenseTemplate[]>('care:expenseTemplates', [])
  const [lastGenMonth, setLastGenMonth] = useLocalStorage<string>('care:expenses:lastGen', '')

  const [healthVisits, setHealthVisits] = useLocalStorage<HealthVisit[]>('care:health:visits', [])
  const [vaccinations, setVaccinations] = useLocalStorage<Vaccination[]>('care:health:vax', [])
  const [medications, setMedications] = useLocalStorage<Medication[]>('care:health:meds', [])
  const [weights, setWeights] = useLocalStorage<WeightEntry[]>('care:health:weights', [])

  const [meals, setMeals] = useLocalStorage<Meal[]>('care:meals', [])

  // Auto-generate recurring expenses once per new month
  useEffect(() => {
    const mk = new Date().toISOString().slice(0, 7) // YYYY-MM
    if (lastGenMonth === mk || expenseTemplates.length === 0) return
    const toAdd: Expense[] = []
    for (const t of expenseTemplates) {
      const day = Math.min(t.dom, daysInMonth(new Date()))
      const date = `${mk}-${String(day).padStart(2, '0')}`
      toAdd.push({ id: crypto.randomUUID(), category: t.category, amount: t.amount, note: t.note, date })
    }
    if (toAdd.length) setExpenses((prev) => [...toAdd, ...prev])
    setLastGenMonth(mk)
  }, [expenseTemplates, lastGenMonth, setExpenses, setLastGenMonth])

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* Profile header */}
      <header className="mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="Pet" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🐾</span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-3xl">{profile.name || 'Care'}</h2>
          <p className="text-softtext text-sm">
            {profile.breed ? profile.breed + ' · ' : ''}{profile.birthdate ? `Born ${profile.birthdate}` : 'Add details to personalize'}
          </p>
        </div>
        {/* quick edit */}
        <button
          onClick={() => {
            const name = prompt('Pet name', profile.name || '') ?? profile.name
            const photoUrl = prompt('Photo URL (optional)', profile.photoUrl || '') ?? profile.photoUrl
            const breed = prompt('Breed (optional)', profile.breed || '') ?? profile.breed
            const birthdate = prompt('Birthdate (YYYY-MM-DD, optional)', profile.birthdate || '') ?? profile.birthdate
            setProfile({ name, photoUrl, breed, birthdate })
          }}
          className="px-3 py-1.5 rounded-card border border-black/10 text-sm hover:shadow-soft"
        >
          Edit
        </button>
      </header>

      <p className="text-softtext mb-3">Keep routines, schedule, health, meals, and costs in one calm view.</p>
      
      {/* Tabs */}
      <LayoutGroup>
        <div className="relative inline-flex gap-1 p-1 rounded-full border border-black/10 bg-white/80 backdrop-blur mb-4">
          {TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative z-10 px-4 py-2 rounded-full text-sm transition-colors ${active ? 'text-black' : 'text-black/60'}`}
              >
                {t}
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-soft"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      {tab === 'Routines' && (
        <RoutinesPane routines={routines} setRoutines={setRoutines} />
      )}
      {tab === 'Calendar' && (
        <CalendarPane
          routines={routines}
          setRoutines={setRoutines}
          expenses={expenses}
          healthDates={{
            visitDates: new Set(healthVisits.map((v) => v.date)),
            vaxDates: new Set(vaccinations.map((v) => v.date)),
          }}
        />
      )}
      {tab === 'Expenses' && (
        <ExpensesPane
          expenses={expenses}
          setExpenses={setExpenses}
          templates={expenseTemplates}
          setTemplates={setExpenseTemplates}
        />
      )}
      {tab === 'Health' && (
        <HealthPane
          visits={healthVisits} setVisits={setHealthVisits}
          vaccinations={vaccinations} setVaccinations={setVaccinations}
          meds={medications} setMeds={setMedications}
          weights={weights} setWeights={setWeights}
        />
      )}
      {tab === 'Meals' && (
        <MealsPane meals={meals} setMeals={setMeals} />
      )}
    </section>
  )
}

/* ========================= Helpers ========================= */

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}
function formatTimeLabel(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
const priorityDot: Record<Priority, string> = {
  Low: 'bg-emerald-500',
  Normal: 'bg-sky-500',
  High: 'bg-rose-500',
}

/* ========================= Routines ========================= */

function RoutinesPane({
  routines, setRoutines
}:{ routines:Routine[]; setRoutines:React.Dispatch<React.SetStateAction<Routine[]>> }) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState<string>('')          // optional HH:MM
  const [date, setDate] = useState<string>(todayIso)    // start date
  const [repeat, setRepeat] = useState<'daily'|'weekly'|'monthly'|'once'>('daily')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [priority, setPriority] = useState<'Low'|'Normal'|'High'>('Normal')
  const [q, setQ] = useState('')

  // Edit dialog state
  const [editing, setEditing] = useState<null | (Routine & {
    priority?: 'Low'|'Normal'|'High'
    daysOfWeek?: number[]
  })>(null)

  // Undo toast state
  const [lastDeleted, setLastDeleted] = useState<Routine | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const toastTimerRef = React.useRef<number | null>(null)

  const doneToday = routines.filter(r => r.completedOn.includes(todayIso)).length

  function toggleDone(id: string, dateIso = todayIso) {
    setRoutines(list => list.map(r => r.id !== id ? r : ({
      ...r,
      completedOn: r.completedOn.includes(dateIso)
        ? r.completedOn.filter(d => d !== dateIso)
        : [...r.completedOn, dateIso]
    })))
  }

  function addRoutine() {
    if (!title.trim()) return
    setRoutines(list => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        repeat,
        time: time || undefined,
        startDate: date,
        completedOn: [],
        // @ts-ignore – allow extra field locally
        priority,
        // @ts-ignore
        daysOfWeek: repeat === 'weekly' ? daysOfWeek : undefined,
      } as any,
      ...list
    ])
    setTitle(''); setTime(''); setDate(todayIso); setRepeat('daily'); setDaysOfWeek([]); setPriority('Normal')
  }

  function formatTime(t?: string) {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const d = new Date(); d.setHours(h, m, 0, 0)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  // Delete + Undo
  function deleteRoutine(id: string) {
    setRoutines(list => {
      const target = list.find(r => r.id === id) || null
      if (target) {
        setLastDeleted(target)
        setToastOpen(true)
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = window.setTimeout(() => setToastOpen(false), 5000) as unknown as number
      }
      return list.filter(r => r.id !== id)
    })
  }
  function undoDelete() {
    if (!lastDeleted) return
    setRoutines(list => [lastDeleted, ...list])
    setLastDeleted(null)
    setToastOpen(false)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }

  // Edit save
  function saveEdit() {
    if (!editing) return
    setRoutines(list => list.map(r => r.id === editing.id ? editing : r))
    setEditing(null)
  }

  // search + nice sort
  const filtered = routines.filter(r => r.title.toLowerCase().includes(q.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    const ta = (a as any).time ? parseInt((a as any).time.replace(':',''), 10) : Infinity
    const tb = (b as any).time ? parseInt((b as any).time.replace(':',''), 10) : Infinity
    if (ta !== tb) return ta - tb
    return a.title.localeCompare(b.title)
  })

  return (
    <>
      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">
        {/* Today list */}
        <div className="xl:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h3 className="font-heading text-lg">Today</h3>
              <div className="text-xs text-softtext">{doneToday}/{routines.length} done</div>
            </div>
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Search routines..."
              className="px-3 py-1.5 border border-black/10 rounded-card text-sm"
            />
          </div>

          <ul className="space-y-2">
            {sorted.map(r => {
              const done = r.completedOn.includes(todayIso)
              const notToday = !sameDay(new Date(r.startDate), new Date())

              // Overdue cue: if due today and not done
              const isOverdue = isDue(r as any, new Date()) && !done

              return (
                <li
                  key={r.id}
                  className={`flex items-center justify-between rounded-xl border bg-white p-3 ${done ? 'opacity-70' : ''} ${isOverdue ? 'border-rose-300/70 ring-1 ring-rose-200' : 'border-black/5'}`}
                >
                  <div>
                    <div className="font-medium mb-1 flex items-center gap-2">
                      {/* tiny priority dot if present */}
                      {(r as any).priority && (
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          (r as any).priority==='High' ? 'bg-rose-500' :
                          (r as any).priority==='Low' ? 'bg-emerald-500' : 'bg-sky-500'
                        }`} />
                      )}
                      {r.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(r as any).time && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 text-[11px] text-black/80">
                          <svg width="12" height="12" viewBox="0 0 24 24" className="opacity-70">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          {formatTime((r as any).time)}
                        </span>
                      )}
                      {notToday && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 text-[11px] text-black/60">
                          {r.startDate}
                        </span>
                      )}
                      {(r as any).repeat === 'weekly' && (r as any).daysOfWeek?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 text-[11px] text-black/60">
                          {((r as any).daysOfWeek as number[]).map(d=>['Su','Mo','Tu','We','Th','Fr','Sa'][d]).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={()=>setEditing(r as any)}
                      className="px-2 py-1 rounded-card border border-black/10 text-xs hover:shadow-soft"
                    >
                      Edit
                    </button>
                    <button
                      onClick={()=>toggleDone(r.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border border-black/10 ${done ? 'bg-black text-white' : 'bg-white hover:shadow-soft'}`}
                    >
                      {done ? 'Done' : 'Mark done'}
                    </button>
                    <button
                      onClick={()=>deleteRoutine(r.id)}
                      className="px-2 py-1 rounded-card border border-black/10 text-xs hover:shadow-soft"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
            {sorted.length === 0 && <div className="text-sm text-softtext">No routines match your search.</div>}
          </ul>
        </div>

        {/* Add routine */}
        <div className="card p-4">
          <h3 className="font-heading text-lg mb-3">Add routine</h3>

          <div className="grid grid-cols-1 gap-2">
            <input
              value={title}
              onChange={e=>setTitle(e.target.value)}
              placeholder="e.g., Evening brush"
              className="px-3 py-2 border border-black/10 rounded-card text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}
                    className="px-3 py-2 border border-black/10 rounded-card text-sm" />
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                    className="px-3 py-2 border border-black/10 rounded-card text-sm" />
              <select value={priority} onChange={e=>setPriority(e.target.value as any)}
                      className="px-3 py-2 border border-black/10 rounded-card text-sm">
                <option>Low</option><option>Normal</option><option>High</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <select value={repeat} onChange={e=>setRepeat(e.target.value as any)}
                      className="px-3 py-2 border border-black/10 rounded-card text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="once">Once</option>
              </select>

              {repeat === 'weekly' && (
                <div className="flex gap-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((lbl, idx)=>(
                    <button key={lbl}
                            onClick={()=>setDaysOfWeek(d=> d.includes(idx) ? d.filter(x=>x!==idx) : [...d, idx])}
                            className={`px-2 py-1 rounded-card border text-xs ${daysOfWeek.includes(idx) ? 'bg-black text-white' : 'bg-white border-black/10'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={addRoutine} className="mt-2 px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h4 className="font-heading text-lg mb-3">Edit routine</h4>
            <div className="grid grid-cols-1 gap-2">
              <input
                value={editing.title}
                onChange={e=>setEditing({...editing, title:e.target.value})}
                className="px-3 py-2 border border-black/10 rounded-card text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="time" value={(editing as any).time || ''} onChange={e=>setEditing({...editing, time:e.target.value||undefined} as any)}
                       className="px-3 py-2 border border-black/10 rounded-card text-sm" />
                <input type="date" value={editing.startDate} onChange={e=>setEditing({...editing, startDate:e.target.value})}
                       className="px-3 py-2 border border-black/10 rounded-card text-sm" />
                <select value={(editing as any).priority || 'Normal'} onChange={e=>setEditing({...editing, priority:e.target.value as any} as any)}
                        className="px-3 py-2 border border-black/10 rounded-card text-sm">
                  <option>Low</option><option>Normal</option><option>High</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={editing.repeat as any} onChange={e=>setEditing({...editing, repeat: e.target.value as any})}
                        className="px-3 py-2 border border-black/10 rounded-card text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="once">Once</option>
                </select>
                {(editing.repeat === 'weekly') && (
                  <div className="flex gap-1">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map((lbl, idx)=>(
                      <button key={lbl}
                              onClick={()=>{
                                const cur = (editing as any).daysOfWeek || []
                                const next = cur.includes(idx) ? cur.filter((x:number)=>x!==idx) : [...cur, idx]
                                setEditing({...editing, daysOfWeek: next} as any)
                              }}
                              className={`px-2 py-1 rounded-card border text-xs ${((editing as any).daysOfWeek||[]).includes(idx) ? 'bg-black text-white' : 'bg-white border-black/10'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setEditing(null)} className="px-3 py-2 rounded-card border border-black/10 text-sm">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {toastOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-3 py-2 rounded-full text-sm shadow-lg flex items-center gap-3">
          <span>Routine deleted</span>
          <button onClick={undoDelete} className="underline">Undo</button>
        </div>
      )}
    </>
  )
}

/* ========================= Calendar ========================= */

function CalendarPane({
  routines, setRoutines, expenses, healthDates
}:{
  routines: Routine[]
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>
  expenses: Expense[]
  healthDates: { visitDates: Set<string>; vaxDates: Set<string> }
}) {
  const [month, setMonth] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [showDue, setShowDue] = useState(true)
  const [showExpenses, setShowExpenses] = useState(true)
  const [showHealth, setShowHealth] = useState(true)

  const daysAll = useMemo(() => rangeDays(startOfMonth(month), endOfMonth(month)), [month])
  const weekDays = useMemo(() => {
    const d = new Date(month); // anchor week around selected month 1st
    const ref = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const offset = ref.getDay()
    const start = new Date(ref); start.setDate(ref.getDate() - offset)
    return rangeDays(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
  }, [month])

  const days = view === 'month' ? daysAll : weekDays

  const changeMonth = (delta:number) => setMonth(d => new Date(d.getFullYear(), d.getMonth()+delta, 1))

  function dueCountOn(day: Date) {
    const dayIso = iso(day)
    return routines.filter(r => isDue(r, day) && !r.completedOn.includes(dayIso)).length
  }
  function expensesSumOn(day: Date) {
    const k = iso(day)
    return expenses.filter(e => e.date === k).reduce((s, e) => s + e.amount, 0)
  }

  function handleAddForDate(dateIso: string) {
    const title = window.prompt(`Add routine for ${dateIso}`, '')
    if (!title || !title.trim()) return
    setRoutines(list => [
      { id: crypto.randomUUID(), title: title.trim(), repeat: 'once', startDate: dateIso, completedOn: [] } as Routine,
      ...list,
    ])
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <button onClick={()=>changeMonth(-1)} className="px-3 py-1.5 rounded-card border border-black/10 text-sm">Prev</button>
          <div className="font-heading">{month.toLocaleString(undefined,{ month:'long', year:'numeric'})}</div>
          <button onClick={()=>changeMonth(1)} className="px-3 py-1.5 rounded-card border border-black/10 text-sm">Next</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setView(v=> v==='month'?'week':'month')}
                  className="px-3 py-1.5 rounded-card border border-black/10 text-sm">
            {view === 'month' ? 'Week view' : 'Month view'}
          </button>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={showDue} onChange={e=>setShowDue(e.target.checked)} /> Routines</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={showExpenses} onChange={e=>setShowExpenses(e.target.checked)} /> Expenses</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={showHealth} onChange={e=>setShowHealth(e.target.checked)} /> Health</label>
        </div>
      </div>

      <div className={`grid ${view === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-2`}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
          <div key={d} className="text-xs text-softtext text-center mb-1">{d}</div>
        ))}

        {days.map(d=>{
          const dIso = iso(d)
          const isToday = sameDay(d, new Date())
          const due = showDue ? dueCountOn(d) : 0
          const exp = showExpenses ? expensesSumOn(d) : 0
          const hasHealth = showHealth && (healthDates.visitDates.has(dIso) || healthDates.vaxDates.has(dIso))

          return (
            <div key={dIso}
                 className={`group h-24 rounded-xl border border-black/5 bg-white p-2 text-xs relative ${isToday ? 'ring-1 ring-taupe' : ''} ${hasHealth ? 'outline outline-1 outline-emerald-400' : ''}`}>
              <div className="font-medium">{d.getDate()}</div>

              {/* badges */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {due > 0 && (
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-black/5">{due} due</div>
                )}
                {exp > 0 && (
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">${exp.toFixed(0)}</div>
                )}
                {hasHealth && (
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">health</div>
                )}
              </div>

              {/* hover-only add button */}
              <button
                aria-label="Add"
                onClick={() => handleAddForDate(dIso)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function isDue(r: Routine, day: Date) {
  const start = new Date((r as any).startDate)
  if (day < start) return false
  if ((r as any).repeat === 'daily')   return true
  if ((r as any).repeat === 'weekly')  return (r as any).daysOfWeek?.includes(day.getDay())
  if ((r as any).repeat === 'monthly') return new Date((r as any).startDate).getDate() === day.getDate()
  return sameDay(day, start) // 'once'
}

/* ========================= Expenses ========================= */

function ExpensesPane({
  expenses, setExpenses, templates, setTemplates
}:{
  expenses: Expense[]
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  templates: ExpenseTemplate[]
  setTemplates: React.Dispatch<React.SetStateAction<ExpenseTemplate[]>>
}) {
  const [form, setForm] = useState<{amount:string; category:Expense['category']; date:string; note:string; recurring:boolean; dom:number}>({
    amount:'', category:'Food', date: iso(new Date()), note:'', recurring:false, dom:new Date().getDate()
  })
  const [budget, setBudget] = useLocalStorage<number>('care:expenses:budget', 0)

  const monthKey = new Date().toISOString().slice(0,7)
  const monthly = useMemo(()=> expenses.filter(e => e.date.startsWith(monthKey)), [expenses, monthKey])
  const total = monthly.reduce((s,e)=>s+e.amount,0)

  function addExpense() {
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt<=0) return
    const entry: Expense = { id: crypto.randomUUID(), amount: amt, category: form.category, date: form.date, note: form.note || undefined }
    setExpenses(list => [entry, ...list])

    if (form.recurring) {
      setTemplates(list => [
        ...list,
        { id: crypto.randomUUID(), amount: amt, category: form.category, note: form.note || undefined, dom: form.dom }
      ])
    }
    setForm({ amount:'', category:'Food', date: iso(new Date()), note:'', recurring:false, dom:new Date().getDate() })
  }

  function exportCSV() {
    const rows = [['id','date','category','amount','note'], ...expenses.map(e=>[e.id,e.date,e.category,String(e.amount),e.note||''])]
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-heading text-lg mb-1">This month</h3>
            <div className="text-softtext mb-3">{monthKey} · ${total.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <label className="text-xs text-softtext block">Budget</label>
            <div className="flex items-center gap-2">
              <input type="number" value={budget||0} onChange={e=>setBudget(parseFloat(e.target.value)||0)}
                     className="w-28 px-2 py-1 border border-black/10 rounded-card text-sm" />
              <button onClick={exportCSV} className="px-3 py-1.5 rounded-card border border-black/10 text-sm hover:shadow-soft">Export CSV</button>
            </div>
            {budget>0 && total>budget && (
              <div className="mt-1 text-xs text-rose-600">Over budget by ${(total-budget).toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* simple bar rows */}
        <div className="space-y-1 mb-4 mt-4">
          {(['Food','Vet','Grooming','Toys','Other'] as Expense['category'][]).map(cat=>{
            const subtotal = monthly.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)
            const pct = total ? Math.round((subtotal/total)*100) : 0
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs"><span>{cat}</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-2 bg-black/30" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <ul className="space-y-2">
          {monthly.map(e=>(
            <li key={e.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
              <div className="text-sm">
                <div className="font-medium">${e.amount.toFixed(2)} · {e.category}</div>
                <div className="text-xs text-softtext">{e.date}{e.note ? ` · ${e.note}` : ''}</div>
              </div>
            </li>
          ))}
          {monthly.length===0 && <div className="text-sm text-softtext">No expenses this month.</div>}
        </ul>
      </div>

      {/* Add expense + templates */}
      <div className="card p-4">
        <h3 className="font-heading text-lg mb-3">Add expense</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                 placeholder="Amount" className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-1" />
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as Expense['category']}))}
                  className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-1">
            {(['Food','Vet','Grooming','Toys','Other'] as Expense['category'][]).map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-1" />
          <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                 placeholder="Note (optional)" className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-1" />
        </div>

        {/* recurring */}
        <div className="mt-2 flex items-center gap-3">
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={form.recurring} onChange={e=>setForm(f=>({...f,recurring:e.target.checked}))}/>
            Recurring monthly
          </label>
          {form.recurring && (
            <div className="flex items-center gap-2 text-sm">
              <span>on day</span>
              <input type="number" min={1} max={31} value={form.dom}
                     onChange={e=>setForm(f=>({...f, dom: Math.max(1, Math.min(31, parseInt(e.target.value)||1))}))}
                     className="w-16 px-2 py-1 border border-black/10 rounded-card" />
            </div>
          )}
        </div>

        <button onClick={addExpense} className="mt-3 px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm">
          Add
        </button>

        {/* Templates list */}
        {templates.length>0 && (
          <>
            <h4 className="font-heading text-sm mt-5 mb-2">Recurring templates</h4>
            <ul className="space-y-1">
              {templates.map(t=>(
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.category} · ${t.amount.toFixed(2)} · day {t.dom}{t.note ? ` · ${t.note}`:''}</span>
                  <button onClick={()=>setTemplates(list=>list.filter(x=>x.id!==t.id))}
                          className="text-xs px-2 py-0.5 border border-black/10 rounded-card">Remove</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

/* ========================= Health ========================= */

function HealthPane(props:{
  visits: HealthVisit[]; setVisits: React.Dispatch<React.SetStateAction<HealthVisit[]>>
  vaccinations: Vaccination[]; setVaccinations: React.Dispatch<React.SetStateAction<Vaccination[]>>
  meds: Medication[]; setMeds: React.Dispatch<React.SetStateAction<Medication[]>>
  weights: WeightEntry[]; setWeights: React.Dispatch<React.SetStateAction<WeightEntry[]>>
}) {
  const { visits, setVisits, vaccinations, setVaccinations, meds, setMeds, weights, setWeights } = props

  // forms
  const [vForm, setVForm] = useState<HealthVisit>({ id:'', date: todayIso, vet:'', reason:'' })
  const [xForm, setXForm] = useState<Vaccination>({ id:'', date: todayIso, name:'', expires:'' })
  const [mForm, setMForm] = useState<Medication>({ id:'', name:'', dose:'', start: todayIso, end:'', notes:'' })
  const [wForm, setWForm] = useState<WeightEntry>({ id:'', date: todayIso, kg: 0 })

  function addVisit() {
    if (!vForm.date) return
    setVisits(list=>[{...vForm, id: crypto.randomUUID()}, ...list]); setVForm({ id:'', date: todayIso, vet:'', reason:'' })
  }
  function addVax() {
    if (!xForm.name.trim()) return
    setVaccinations(list=>[{...xForm, id: crypto.randomUUID()}, ...list]); setXForm({ id:'', date: todayIso, name:'', expires:'' })
  }
  function addMed() {
    if (!mForm.name.trim()) return
    setMeds(list=>[{...mForm, id: crypto.randomUUID()}, ...list]); setMForm({ id:'', name:'', dose:'', start: todayIso, end:'', notes:'' })
  }
  function addWeight() {
    if (!wForm.kg || wForm.kg<=0) return
    setWeights(list=>[{...wForm, id: crypto.randomUUID()}, ...list]); setWForm({ id:'', date: todayIso, kg: 0 })
  }

  // tiny inline chart for weights (last 10)
  const lastWeights = [...weights].sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)
  const wMax = Math.max(...lastWeights.map(w=>w.kg), 1)
  const wMin = Math.min(...lastWeights.map(w=>w.kg), 0)
  const span = Math.max(wMax - wMin, 1)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Visits & Vaccinations */}
      <div className="card p-4">
        <h3 className="font-heading text-lg mb-3">Vet visits</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="date" value={vForm.date} onChange={e=>setVForm(f=>({...f,date:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input placeholder="Vet (optional)" value={vForm.vet} onChange={e=>setVForm(f=>({...f,vet:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input placeholder="Reason (optional)" value={vForm.reason} onChange={e=>setVForm(f=>({...f,reason:e.target.value}))}
                 className="col-span-2 px-3 py-2 border border-black/10 rounded-card text-sm" />
        </div>
        <button onClick={addVisit} className="px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm mb-3">Add visit</button>
        <ul className="space-y-1">
          {visits.map(v=>(
            <li key={v.id} className="text-sm flex justify-between">
              <span>{v.date} · {v.vet || '—'} · {v.reason || ''}</span>
              <button onClick={()=>setVisits(list=>list.filter(x=>x.id!==v.id))} className="text-xs px-2 py-0.5 border border-black/10 rounded-card">Remove</button>
            </li>
          ))}
          {visits.length===0 && <div className="text-sm text-softtext">No visits yet.</div>}
        </ul>

        <h3 className="font-heading text-lg mt-6 mb-3">Vaccinations</h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input placeholder="Name" value={xForm.name} onChange={e=>setXForm(f=>({...f,name:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="date" value={xForm.date} onChange={e=>setXForm(f=>({...f,date:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="date" value={xForm.expires} onChange={e=>setXForm(f=>({...f,expires:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
        </div>
        <button onClick={addVax} className="px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm mb-3">Add vaccination</button>
        <ul className="space-y-1">
          {vaccinations.map(v=>(
            <li key={v.id} className="text-sm flex justify-between">
              <span>{v.name} · {v.date}{v.expires?` → expires ${v.expires}`:''}</span>
              <button onClick={()=>setVaccinations(list=>list.filter(x=>x.id!==v.id))} className="text-xs px-2 py-0.5 border border-black/10 rounded-card">Remove</button>
            </li>
          ))}
          {vaccinations.length===0 && <div className="text-sm text-softtext">No vaccinations yet.</div>}
        </ul>
      </div>

      {/* Meds & Weight */}
      <div className="card p-4">
        <h3 className="font-heading text-lg mb-3">Medications</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input placeholder="Name" value={mForm.name} onChange={e=>setMForm(f=>({...f,name:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input placeholder="Dose" value={mForm.dose} onChange={e=>setMForm(f=>({...f,dose:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="date" value={mForm.start} onChange={e=>setMForm(f=>({...f,start:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="date" value={mForm.end} onChange={e=>setMForm(f=>({...f,end:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input placeholder="Notes (optional)" value={mForm.notes} onChange={e=>setMForm(f=>({...f,notes:e.target.value}))}
                 className="col-span-2 px-3 py-2 border border-black/10 rounded-card text-sm" />
        </div>
        <button onClick={addMed} className="px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm mb-4">Add medication</button>
        <ul className="space-y-1 mb-6">
          {meds.map(m=>(
            <li key={m.id} className="text-sm flex justify-between">
              <span>{m.name} {m.dose?`· ${m.dose}`:''} · {m.start}{m.end?` → ${m.end}`:''}</span>
              <button onClick={()=>setMeds(list=>list.filter(x=>x.id!==m.id))} className="text-xs px-2 py-0.5 border border-black/10 rounded-card">Remove</button>
            </li>
          ))}
          {meds.length===0 && <div className="text-sm text-softtext">No medications yet.</div>}
        </ul>

        <h3 className="font-heading text-lg mb-2">Weight tracker</h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input type="date" value={wForm.date} onChange={e=>setWForm(f=>({...f,date:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="number" step="0.01" placeholder="kg" value={wForm.kg || ''} onChange={e=>setWForm(f=>({...f,kg:parseFloat(e.target.value)||0}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <button onClick={addWeight} className="px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm">Add</button>
        </div>

        {/* tiny inline SVG chart */}
        <div className="h-24 bg-black/5 rounded-xl p-2 flex items-end">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              points={
                lastWeights.map((w,i)=>{
                  const x = (i / Math.max(lastWeights.length-1,1)) * 100
                  const y = 40 - ((w.kg - wMin)/span)*36 - 2
                  return `${x},${y}`
                }).join(' ')
              }
            />
          </svg>
        </div>
        <div className="mt-2 text-xs text-softtext">
          {lastWeights.length ? `Latest: ${lastWeights[lastWeights.length-1].kg.toFixed(1)} kg` : 'Add entries to see a trend'}
        </div>
      </div>
    </div>
  )
}

/* ========================= Meals ========================= */

function MealsPane({ meals, setMeals }:{
  meals: Meal[]
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>
}) {
  const [form, setForm] = useState<Meal>({ id:'', date: todayIso, time:'', food:'', portion:'' })
  const todayMeals = meals.filter(m=>m.date===todayIso).sort((a,b)=>{
    const ta = a.time ? parseInt(a.time.replace(':','')) : Infinity
    const tb = b.time ? parseInt(b.time.replace(':','')) : Infinity
    return ta - tb
  })

  function addMeal() {
    if (!form.food.trim()) return
    setMeals(list=>[{...form, id: crypto.randomUUID()}, ...list])
    setForm({ id:'', date: todayIso, time:'', food:'', portion:'' })
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h3 className="font-heading text-lg mb-2">Today’s meals</h3>
        <ul className="space-y-2">
          {todayMeals.map(m=>(
            <li key={m.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
              <div className="text-sm">
                <div className="font-medium flex items-center gap-2">
                  {m.time && <span className="px-2 py-0.5 rounded-full bg-black/5 text-[11px]">{formatTimeLabel(m.time)}</span>}
                  {m.food}
                </div>
                {(m.portion || m.date!==todayIso) && (
                  <div className="text-xs text-softtext">{m.portion ? `Portion: ${m.portion}` : ''}{m.date!==todayIso?` ${m.date}`:''}</div>
                )}
              </div>
              <button onClick={()=>setMeals(list=>list.filter(x=>x.id!==m.id))}
                      className="text-xs px-2 py-1 border border-black/10 rounded-card">Remove</button>
            </li>
          ))}
          {todayMeals.length===0 && <div className="text-sm text-softtext">No meals yet today.</div>}
        </ul>
      </div>

      <div className="card p-4">
        <h3 className="font-heading text-lg mb-3">Add meal</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm" />
          <input placeholder="Food" value={form.food} onChange={e=>setForm(f=>({...f,food:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-2" />
          <input placeholder="Portion (e.g., 1 cup)" value={form.portion} onChange={e=>setForm(f=>({...f,portion:e.target.value}))}
                 className="px-3 py-2 border border-black/10 rounded-card text-sm col-span-2" />
        </div>
        <button onClick={addMeal} className="mt-3 px-3 py-2 rounded-card border border-black/10 hover:shadow-soft text-sm">
          Add
        </button>
      </div>
    </div>
  )
}
