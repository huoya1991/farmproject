import type { Plan, MaintItem } from '@/types/maintPlan'

export function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
}

export function planNextDate(items: MaintItem[]): string {
  if (!items.length) return ''
  return items.map(i => i.nextDate).sort()[0]!
}

export function isOverdue(plan: Plan, today: string = todayStr()): boolean {
  if (plan.status === 'done') return false
  return plan.items.some(i => i.nextDate < today)
}

export function cycleText(item: MaintItem): string {
  return `每 ${item.cycleValue} ${item.cycleUnit}`
}

export function deriveLastDate(current: Plan, all: Plan[]): string | null {
  const others = all.filter(p => p.id !== current.id && p.deviceCode === current.deviceCode)
  if (!others.length) return null
  return others.map(p => p.thisDate).sort().reverse()[0]!
}
