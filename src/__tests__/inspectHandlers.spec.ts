import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mock/handlers'
import { inspectStorage } from '@/mock/inspectStorage'
import { SEED_INSPECT_RECORDS } from '@/mock/inspectSeed'
import { apiClient } from '@/api/client'
import { listInspectRecords, getInspectRecord, createInspectRecord } from '@/api/inspection'
import { getDict } from '@/api/dict'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  inspectStorage.write(structuredClone(SEED_INSPECT_RECORDS))
  apiClient.setToken('mock')
})

describe('inspect mock handlers', () => {
  it('GET /api/dict/usage_duration_unit returns array', async () => {
    expect(await getDict('usage_duration_unit')).toEqual(['小时', '天', '公里'])
  })

  it('GET /api/inspect-records attaches derived status and deviceSvg', async () => {
    const list = await listInspectRecords()
    expect(list.length).toBe(6)
    const s1 = list.find(r => r.id === 's1')!
    expect(s1.status).toBe('正常')
    expect(s1.deviceSvg).toBe('tractor')
    expect(list.find(r => r.id === 's2')!.status).toBe('异常')
    expect(list.find(r => r.id === 's5')!.status).toBe('异常')
    expect(list.find(r => r.id === 's5')!.deviceSvg).toBe('drone')
  })

  it('GET /api/inspect-records/:id hit and 404', async () => {
    const rec = await getInspectRecord('s3')
    expect(rec.deviceName).toBe('联合收割机')
    await expect(getInspectRecord('nope')).rejects.toMatchObject({ status: 404 })
  })

  it('POST /api/inspect-records persists, derives, unshifts', async () => {
    const created = await createInspectRecord({
      date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
      meterResult: '正常', vehicleResult: '异常', vehicleStatus: '正常',
      durationValue: 5, durationUnit: '小时', inspector: '王强', operator: '张三',
      note: '异响', photos: ['data:image/jpeg;base64,xx']
    })
    expect(created.id).toBeTruthy()
    expect(created.status).toBe('异常')
    expect(created.deviceSvg).toBe('tractor')
    const stored = inspectStorage.read()
    expect(stored.length).toBe(7)
    expect(stored[0]!.id).toBe(created.id)
    expect((await listInspectRecords()).length).toBe(7)
  })

  it('POST degrades to no-photo save when localStorage quota exceeded', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw new DOMException('quota', 'QuotaExceededError') })
    const created = await createInspectRecord({
      date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
      meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
      durationValue: 5, durationUnit: '小时', inspector: '王强', operator: '张三',
      photos: ['data:image/jpeg;base64,xx']
    })
    expect(created.photos).toBeUndefined()
    expect(inspectStorage.read().find(r => r.id === created.id)).toBeDefined()
    spy.mockRestore()
  })
})
