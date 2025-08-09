export function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  export function endOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0)
  }
  export function iso(date: Date) {
    return date.toISOString().slice(0, 10)
  }
  export function sameDay(a: Date, b: Date) {
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
  }
  export function rangeDays(start: Date, end: Date) {
    const out: Date[] = []
    const cur = new Date(start)
    while (cur <= end) { out.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    return out
  }
  