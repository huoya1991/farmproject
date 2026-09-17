import { defineStore } from 'pinia'
import type { CheckResult, InspectPayload, InspectRecordDerived } from '@/types/inspection'
import { listInspectRecords, getInspectRecord, createInspectRecord as apiCreate } from '@/api/inspection'
import { todayStr } from '@/utils/date'

interface State {
  list: InspectRecordDerived[]
  current: InspectRecordDerived | null
  loading: boolean
  keyword: string
  statusTab: 'all' | CheckResult
  dateFrom: string | null
  dateTo: string | null
}

export const useInspectionStore = defineStore('inspection', {
  state: (): State => ({
    list: [], current: null, loading: false,
    keyword: '', statusTab: 'all', dateFrom: null, dateTo: null
  }),
  getters: {
    filteredSortedList(s): InspectRecordDerived[] {
      const kw = s.keyword.trim()
      return s.list.filter(r => {
        if (s.statusTab !== 'all' && r.status !== s.statusTab) return false
        if (kw && !(r.deviceName.includes(kw) || r.deviceCode.includes(kw))) return false
        if (s.dateFrom && r.date < s.dateFrom) return false
        if (s.dateTo && r.date > s.dateTo) return false
        return true
      }).slice().sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return b.createdAt - a.createdAt
      })
    },
    monthStats(s): { total: number; normal: number; abnormal: number } {
      const month = todayStr().slice(0, 7)
      const inMonth = s.list.filter(r => r.date.startsWith(month))
      const abnormal = inMonth.filter(r => r.status === '异常').length
      return { total: inMonth.length, normal: inMonth.length - abnormal, abnormal }
    }
  },
  actions: {
    async fetchList() {
      this.loading = true
      try { this.list = await listInspectRecords() } finally { this.loading = false }
    },
    async fetchOne(id: string) {
      this.loading = true
      try { this.current = await getInspectRecord(id) } finally { this.loading = false }
    },
    async create(payload: InspectPayload) { return apiCreate(payload) }
  }
})
