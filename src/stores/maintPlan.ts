import { defineStore } from 'pinia'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'
import { listPlans, getPlan, createPlan as apiCreate, updatePlan as apiUpdate, markPlanDone as apiMarkDone } from '@/api/maintPlan'

type PlanPayload = Omit<Plan,'id'|'createdAt'|'updatedAt'>

interface State {
  list: PlanWithDerived[]
  current: PlanWithDerived | null
  loading: boolean
  keyword: string
  statusFilter: 'all'|'undone'|'done'
  typeFilter: string
  ownerFilter: string
}

export const useMaintPlanStore = defineStore('maintPlan', {
  state: (): State => ({ list: [], current: null, loading: false, keyword: '', statusFilter: 'all', typeFilter: '', ownerFilter: '' }),
  getters: {
    countAll: (s) => s.list.length,
    countUndone: (s) => s.list.filter(p => p.status === 'undone').length,
    countDone: (s) => s.list.filter(p => p.status === 'done').length,
    typeOptions: (s) => [...new Set(s.list.map(p => p.deviceType).filter((t): t is string => !!t))],
    ownerOptions: (s) => [...new Set(s.list.map(p => p.owner).filter(Boolean))],
    filteredSortedList(s): PlanWithDerived[] {
      const kw = s.keyword.trim()
      const filtered = s.list.filter(p => {
        if (s.statusFilter !== 'all' && p.status !== s.statusFilter) return false
        if (s.typeFilter && p.deviceType !== s.typeFilter) return false
        if (s.ownerFilter && p.owner !== s.ownerFilter) return false
        if (kw && !(p.deviceName.includes(kw) || p.deviceCode.includes(kw))) return false
        return true
      })
      return filtered.slice().sort((a, b) => {
        if (a.status !== b.status) return a.status === 'undone' ? -1 : 1
        if (a.status === 'undone') return a.planNextDate.localeCompare(b.planNextDate)
        return b.thisDate.localeCompare(a.thisDate)
      })
    }
  },
  actions: {
    async fetchList() {
      this.loading = true
      try { this.list = await listPlans() } finally { this.loading = false }
    },
    async fetchOne(id: string) {
      this.loading = true
      try { this.current = await getPlan(id) } finally { this.loading = false }
    },
    async create(payload: PlanPayload) { return apiCreate(payload) },
    async update(id: string, payload: PlanPayload) { return apiUpdate(id, payload) },
    async markDone(id: string) {
      const updated = await apiMarkDone(id)
      if (this.current?.id === id) this.current = updated
      const idx = this.list.findIndex(p => p.id === id)
      if (idx >= 0) this.list[idx] = updated
      return updated
    }
  }
})
