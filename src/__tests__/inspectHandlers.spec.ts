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
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
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

  const payload = {
    date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
    meterResult: '正常' as const, vehicleResult: '正常' as const, vehicleStatus: '正常' as const,
    durationValue: 5, durationUnit: '小时', inspector: '王强', operator: '张三'
  }

  it('POST skips an oversized photo and retains later photos that fit', async () => {
    const original = inspectStorage.read()
    const capacity = JSON.stringify(original).length + 500
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (value.length > capacity) throw new DOMException('quota', 'QuotaExceededError')
      setItem.call(this, key, value)
    })
    const created = await createInspectRecord({ ...payload, photos: ['small-1', 'large-photo'.repeat(100), 'small-3'] })
    expect(created.photos).toEqual(['small-1', 'small-3'])
    const stored = inspectStorage.read()
    expect(stored[0]!.photos).toEqual(['small-1', 'small-3'])
    expect(stored.slice(1)).toEqual(original)
  })

  it('POST saves fields without photos when no photo fits', async () => {
    const original = inspectStorage.read()
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (JSON.parse(value)[0].photos?.length) throw new DOMException('quota', 'QuotaExceededError')
      setItem.call(this, key, value)
    })
    const created = await createInspectRecord({ ...payload, photos: ['photo-1', 'photo-2'] })
    expect(created.photos ?? []).toEqual([])
    expect(inspectStorage.read()[0]).toMatchObject({ id: created.id, ...payload })
    expect(inspectStorage.read().slice(1)).toEqual(original)
  })

  it('POST returns a clear error for persistent quota without losing existing records', async () => {
    const original = inspectStorage.read()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    await expect(createInspectRecord({ ...payload, photos: ['photo'] }))
      .rejects.toMatchObject({ status: 500, message: '存储空间不足，保存失败，请清理空间后重试' })
    expect(inspectStorage.read()).toEqual(original)
  })

  it('POST does not drop photos or report success for non-quota errors', async () => {
    const original = inspectStorage.read()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('private storage stack')
    })
    await expect(createInspectRecord({ ...payload, photos: ['photo'] }))
      .rejects.toMatchObject({ status: 500, message: '保存失败，请稍后重试' })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(inspectStorage.read()).toEqual(original)
  })
})
