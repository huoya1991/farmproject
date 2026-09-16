import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMaintPlanStore } from '@/stores/maintPlan'
import type { PlanWithDerived } from '@/types/maintPlan'

vi.mock('@/api/maintPlan', () => ({
  listPlans: vi.fn(),
  getPlan: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  markPlanDone: vi.fn()
}))
import * as api from '@/api/maintPlan'

const mk = (id: string, over: Partial<PlanWithDerived>): PlanWithDerived => ({
  id, deviceId:null, deviceName:'A', deviceCode:'D', modelSpec:'', usage:'', thisDate:'2026-01-01', owner:'x',
  status:'undone', items:[], createdAt:0, updatedAt:0, planNextDate:'2026-01-01', overdue:false, lastDate:null, ...over
})

describe('maintPlan store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('fetchList populates list and counters', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { status:'undone' }), mk('b', { status:'done' }), mk('c', { status:'undone' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    expect(s.list.length).toBe(3)
    expect(s.countUndone).toBe(2)
    expect(s.countDone).toBe(1)
  })

  it('filteredSortedList sorts undone by planNextDate asc, done by thisDate desc', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('u1', { status:'undone', planNextDate:'2026-10-01' }),
      mk('d1', { status:'done', thisDate:'2026-05-01' }),
      mk('u2', { status:'undone', planNextDate:'2026-09-15' }),
      mk('d2', { status:'done', thisDate:'2026-08-01' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    const ids = s.filteredSortedList.map(p => p.id)
    expect(ids).toEqual(['u2','u1','d2','d1'])
  })

  it('filteredSortedList filters by keyword and status', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { deviceName:'拖拉机', status:'undone' }),
      mk('b', { deviceName:'收割机', status:'done' }),
      mk('c', { deviceCode:'X-拖拉', status:'undone' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    s.keyword = '拖拉'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.statusFilter = 'undone'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.statusFilter = 'done'
    expect(s.filteredSortedList).toEqual([])
  })

  it('filteredSortedList filters by deviceType and owner; options derived from list', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { deviceType:'拖拉机', owner:'张三' }),
      mk('b', { deviceType:'收割机', owner:'李四' }),
      mk('c', { deviceType:'拖拉机', owner:'王五' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    expect(s.typeOptions).toEqual(['拖拉机','收割机'])
    expect(s.ownerOptions).toEqual(['张三','李四','王五'])
    s.typeFilter = '拖拉机'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.ownerFilter = '王五'
    expect(s.filteredSortedList.map(p => p.id)).toEqual(['c'])
  })
})
