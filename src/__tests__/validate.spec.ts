import { describe, it, expect } from 'vitest'
import { validatePlan } from '@/utils/validate'
import type { Plan } from '@/types/maintPlan'

const base = (): Plan => ({
  id:'p', deviceId:null, deviceName:'A', deviceCode:'D01', modelSpec:'M1', usage:'耕地',
  thisDate:'2026-09-01', owner:'王强', status:'undone',
  items:[{ id:'i1', content:'换机油', cycleValue:30, cycleUnit:'天', nextDate:'2026-10-01' }],
  createdAt:0, updatedAt:0
})

describe('validatePlan', () => {
  it('accepts a valid plan', () => {
    expect(validatePlan(base()).ok).toBe(true)
  })
  it('rejects empty deviceName', () => {
    const p = base(); p.deviceName = ''
    const r = validatePlan(p)
    expect(r.ok).toBe(false)
    expect(r.errors.find(e => e.field === 'deviceName')).toBeDefined()
  })
  it('rejects empty items', () => {
    const p = base(); p.items = []
    const r = validatePlan(p)
    expect(r.ok).toBe(false)
    expect(r.errors.find(e => e.field === 'items')).toBeDefined()
  })
  it('rejects item.cycleValue < 1 or non-integer', () => {
    const p = base(); p.items[0]!.cycleValue = 0
    expect(validatePlan(p).errors.some(e => e.field === 'items.cycleValue' && e.itemIndex === 0)).toBe(true)
    p.items[0]!.cycleValue = 1.5
    expect(validatePlan(p).errors.some(e => e.field === 'items.cycleValue')).toBe(true)
  })
  it('rejects nextDate <= thisDate', () => {
    const p = base(); p.items[0]!.nextDate = '2026-09-01'
    expect(validatePlan(p).errors.some(e => e.field === 'items.nextDate' && e.itemIndex === 0)).toBe(true)
  })
  it('rejects empty item.content', () => {
    const p = base(); p.items[0]!.content = '   '
    expect(validatePlan(p).errors.some(e => e.field === 'items.content')).toBe(true)
  })
})
