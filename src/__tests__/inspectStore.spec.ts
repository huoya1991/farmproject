import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInspectionStore } from '@/stores/inspection'
import { todayStr } from '@/utils/date'
import type { InspectRecordDerived } from '@/types/inspection'

vi.mock('@/api/inspection', () => ({
  listInspectRecords: vi.fn(),
  getInspectRecord: vi.fn(),
  createInspectRecord: vi.fn()
}))
import * as api from '@/api/inspection'

const mk = (id: string, over: Partial<InspectRecordDerived>): InspectRecordDerived => ({
  id, date: '2026-09-01', deviceCode: 'D', deviceName: 'A',
  meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
  durationValue: 1, durationUnit: '小时', inspector: 'x', operator: 'y',
  createdAt: 0, status: '正常', ...over
})

describe('inspection store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('filteredSortedList sorts by date desc then createdAt desc', async () => {
    (api.listInspectRecords as any).mockResolvedValue([
      mk('a', { date: '2026-09-10', createdAt: 1 }),
      mk('b', { date: '2026-09-12', createdAt: 1 }),
      mk('c', { date: '2026-09-12', createdAt: 2 })
    ])
    const s = useInspectionStore()
    await s.fetchList()
    expect(s.filteredSortedList.map(r => r.id)).toEqual(['c', 'b', 'a'])
  })

  it('filters by statusTab / keyword / date range', async () => {
    (api.listInspectRecords as any).mockResolvedValue([
      mk('a', { date: '2026-09-10', status: '正常', deviceName: '拖拉机' }),
      mk('b', { date: '2026-09-12', status: '异常', deviceCode: 'XGJ003' }),
      mk('c', { date: '2026-09-15', status: '正常', deviceName: '收割机' })
    ])
    const s = useInspectionStore()
    await s.fetchList()
    s.statusTab = '异常'
    expect(s.filteredSortedList.map(r => r.id)).toEqual(['b'])
    s.statusTab = 'all'
    s.keyword = '拖拉'
    expect(s.filteredSortedList.map(r => r.id)).toEqual(['a'])
    s.keyword = 'XGJ'
    expect(s.filteredSortedList.map(r => r.id)).toEqual(['b'])
    s.keyword = ''
    s.dateFrom = '2026-09-11'; s.dateTo = '2026-09-14'
    expect(s.filteredSortedList.map(r => r.id)).toEqual(['b'])
    s.dateTo = null
    expect(s.filteredSortedList.map(r => r.id).sort()).toEqual(['b', 'c'])
  })

  it('clears the previous record immediately while fetching another record', async () => {
    const s = useInspectionStore()
    s.current = mk('old', {})
    let resolve!: (value: InspectRecordDerived) => void
    vi.mocked(api.getInspectRecord).mockReturnValue(new Promise(done => { resolve = done }))
    const request = s.fetchOne('new')
    expect(s.current).toBeNull()
    expect(s.loading).toBe(true)
    resolve(mk('new', {}))
    await request
    expect(s.current?.id).toBe('new')
    expect(s.loading).toBe(false)
  })

  it('ignores stale responses without ending the latest loading state', async () => {
    const s = useInspectionStore()
    let resolveOld!: (value: InspectRecordDerived) => void
    let resolveNew!: (value: InspectRecordDerived) => void
    vi.mocked(api.getInspectRecord)
      .mockReturnValueOnce(new Promise(done => { resolveOld = done }))
      .mockReturnValueOnce(new Promise(done => { resolveNew = done }))
    const oldRequest = s.fetchOne('old')
    const newRequest = s.fetchOne('new')
    resolveOld(mk('old', {}))
    await oldRequest
    expect(s.current).toBeNull()
    expect(s.loading).toBe(true)
    resolveNew(mk('new', {}))
    await newRequest
    expect(s.current?.id).toBe('new')
    expect(s.loading).toBe(false)
  })

  it('monthStats counts current month and ignores filters', async () => {
    const month = todayStr().slice(0, 7);
    (api.listInspectRecords as any).mockResolvedValue([
      mk('a', { date: `${month}-02`, status: '正常' }),
      mk('b', { date: `${month}-05`, status: '异常' }),
      mk('c', { date: `${month}-09`, status: '异常' }),
      mk('d', { date: '2020-01-01', status: '正常' })
    ])
    const s = useInspectionStore()
    await s.fetchList()
    s.keyword = '不存在'   // 统计不受筛选影响
    s.statusTab = '正常'
    expect(s.monthStats).toEqual({ total: 3, normal: 1, abnormal: 2 })
  })
})
