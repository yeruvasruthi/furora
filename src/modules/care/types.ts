export type Repeat = 'once' | 'daily' | 'weekly' | 'monthly'

export type Routine = {
  id: string
  title: string
  notes?: string
  time?: string        // "08:30"
  repeat: Repeat
  daysOfWeek?: number[] // 0..6 (Sun..Sat) if weekly
  startDate: string    // ISO date
  completedOn: string[]// ISO dates (YYYY-MM-DD) when done
}

export type Expense = {
  id: string
  date: string // ISO
  amount: number
  category: 'Food' | 'Vet' | 'Grooming' | 'Toys' | 'Other'
  note?: string
}
