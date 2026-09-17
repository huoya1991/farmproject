import { describe, it, expect } from 'vitest'
import { deriveInspectStatus, validateInspect } from '@/utils/validateInspect'
import type { InspectPayload, CheckResult } from '@/types/inspection'

const base = (): InspectPayload => ({
  date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
  meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
  durationValue: 128.5, durationUnit: '小时', inspector: '王强', operator: '张三'
})

describe('deriveInspectStatus', () => {
  it('全正常 → 正常', () => {
    expect(deriveInspectStatus(base())).toBe('正常')
  })
  it('仪表异常 → 异常', () => {
    expect(deriveInspectStatus({ ...base(), meterResult: '异常' })).toBe('异常')
  })
  it('车况异常 → 异常', () => {
    expect(deriveInspectStatus({ ...base(), vehicleResult: '异常' })).toBe('异常')
  })
  it('车辆状态异常 → 异常', () => {
    expect(deriveInspectStatus({ ...base(), vehicleStatus: '异常' })).toBe('异常')
  })
})

describe('validateInspect', () => {
  it('accepts a valid record', () => {
    expect(validateInspect(base()).ok).toBe(true)
  })
  it('rejects missing date', () => {
    const p = base(); p.date = ''
    expect(validateInspect(p).errors.some(e => e.field === 'date')).toBe(true)
  })
  it('rejects empty deviceCode / deviceName', () => {
    const p = base(); p.deviceCode = '  '; p.deviceName = ''
    const r = validateInspect(p)
    expect(r.errors.some(e => e.field === 'deviceCode')).toBe(true)
    expect(r.errors.some(e => e.field === 'deviceName')).toBe(true)
  })
  it('rejects empty vehicleStatus', () => {
    const p = base(); p.vehicleStatus = '' as CheckResult
    expect(validateInspect(p).errors.some(e => e.field === 'vehicleStatus')).toBe(true)
  })
  it('rejects durationValue <= 0 or NaN', () => {
    const p = base(); p.durationValue = 0
    expect(validateInspect(p).errors.some(e => e.field === 'durationValue')).toBe(true)
    p.durationValue = Number('abc')
    expect(validateInspect(p).errors.some(e => e.field === 'durationValue')).toBe(true)
  })
  it('rejects durationValue with more than one decimal', () => {
    const p = base(); p.durationValue = 12.55
    expect(validateInspect(p).errors.some(e => e.field === 'durationValue')).toBe(true)
    p.durationValue = 12.5
    expect(validateInspect(p).ok).toBe(true)
  })
  it('rejects empty durationUnit / inspector / operator', () => {
    const p = base(); p.durationUnit = ''; p.inspector = ' '; p.operator = ''
    const r = validateInspect(p)
    expect(r.errors.some(e => e.field === 'durationUnit')).toBe(true)
    expect(r.errors.some(e => e.field === 'inspector')).toBe(true)
    expect(r.errors.some(e => e.field === 'operator')).toBe(true)
  })
  it('异常时 note 必填；正常时无 note 放行', () => {
    const p = base(); p.meterResult = '异常'
    expect(validateInspect(p).errors.some(e => e.field === 'note')).toBe(true)
    p.note = '油压表读数异常'
    expect(validateInspect(p).ok).toBe(true)
    expect(validateInspect(base()).ok).toBe(true)
  })
  it('rejects note longer than 200 chars', () => {
    const p = base(); p.meterResult = '异常'; p.note = 'x'.repeat(201)
    expect(validateInspect(p).errors.some(e => e.field === 'note')).toBe(true)
  })
  it('rejects more than 3 photos', () => {
    const p = base(); p.photos = ['a', 'b', 'c', 'd']
    expect(validateInspect(p).errors.some(e => e.field === 'photos')).toBe(true)
  })
})
