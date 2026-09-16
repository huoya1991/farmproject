import type { Plan } from '@/types/maintPlan'

const KEY = 'lx_maint_plans_v3'

export const storage = {
  read(): Plan[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Plan[]) : []
    } catch { return [] }
  },
  write(plans: Plan[]): void {
    localStorage.setItem(KEY, JSON.stringify(plans))
  }
}
