import { describe, it, expect } from 'vitest'
import { planNextDate, isOverdue, cycleText, deriveLastDate, todayStr } from '@/utils/date'
import type { Plan, MaintItem } from '@/types/maintPlan'

const item = (nextDate: string): MaintItem => ({ id:'i', content:'x', cycleValue:30, cycleUnit:'天', nextDate })
const plan = (over: Partial<Plan> = {}): Plan => ({
  id:'p', deviceId:null, deviceName:'A', deviceCode:'D01', modelSpec:'', usage:'', thisDate:'2026-09-01',
  owner:'王强', status:'undone', items:[item('2026-10-01')], createdAt:0, updatedAt:0, ...over
})

describe('date utils', () => {
  it('todayStr returns YYYY-MM-DD', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('planNextDate picks the earliest nextDate', () => {
    expect(planNextDate([item('2026-11-01'), item('2026-09-20'), item('2026-10-05')])).toBe('2026-09-20')
  })
  it('isOverdue true when undone and any nextDate < today', () => {
    expect(isOverdue(plan({ items:[item('2020-01-01')] }), '2026-09-15')).toBe(true)
  })
  it('isOverdue false when status is done', () => {
    expect(isOverdue(plan({ status:'done', items:[item('2020-01-01')] }), '2026-09-15')).toBe(false)
  })
  it('cycleText formats value + unit', () => {
    expect(cycleText(item('2026-10-01'))).toBe('每 30 天')
  })
  it('deriveLastDate picks max thisDate of other records with same deviceCode', () => {
    const cur = plan({ id:'p1', deviceCode:'D01', thisDate:'2026-09-01' })
    const others: Plan[] = [
      plan({ id:'p2', deviceCode:'D01', thisDate:'2026-06-01' }),
      plan({ id:'p3', deviceCode:'D01', thisDate:'2026-08-10' }),
      plan({ id:'p4', deviceCode:'D02', thisDate:'2026-12-01' })
    ]
    expect(deriveLastDate(cur, [cur, ...others])).toBe('2026-08-10')
  })
  it('deriveLastDate returns null when no other record', () => {
    const cur = plan({ id:'p1', deviceCode:'D01' })
    expect(deriveLastDate(cur, [cur])).toBeNull()
  })
})
