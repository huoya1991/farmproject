import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mock/handlers'
import { storage } from '@/mock/storage'
import { SEED_PLANS } from '@/mock/seed'
import { apiClient } from '@/api/client'
import { listPlans, getPlan, createPlan, updatePlan, markPlanDone } from '@/api/maintPlan'
import { getDict } from '@/api/dict'
import { searchDevices } from '@/api/device'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  storage.write(structuredClone(SEED_PLANS))
  apiClient.setToken('mock')
})

describe('mock handlers', () => {
  it('GET /api/dict/maint_cycle_unit returns array', async () => {
    const units = await getDict('maint_cycle_unit')
    expect(units).toEqual(['小时','天','公里'])
  })

  it('GET /api/device filters by keyword', async () => {
    const list = await searchDevices('拖拉')
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]!.name).toContain('拖拉')
  })

  it('GET /api/maint-plan attaches derived fields', async () => {
    const list = await listPlans()
    const p1 = list.find(p => p.id === '1')!
    expect(p1.planNextDate).toBe('2026-10-10')
    expect(p1.deviceType).toBe('拖拉机')
    expect(p1.deviceSvg).toBe('tractor')
    const p6 = list.find(p => p.id === '6')!
    expect(p6.overdue).toBe(true)
  })

  it('POST /api/maint-plan persists and returns derived', async () => {
    const created = await createPlan({
      deviceId:null, deviceName:'新设备', deviceCode:'X-9', modelSpec:'M', usage:'U',
      thisDate:'2026-09-01', owner:'王强', status:'undone',
      items:[{ id:'i1', content:'x', cycleValue:10, cycleUnit:'天', nextDate:'2026-09-20' }]
    })
    expect(created.id).toBeTruthy()
    expect(created.planNextDate).toBe('2026-09-20')
    expect(storage.read().find(p => p.id === created.id)).toBeDefined()
  })

  it('PUT /api/maint-plan/:id/status marks done', async () => {
    const updated = await markPlanDone('1')
    expect(updated.status).toBe('done')
    expect(updated.overdue).toBe(false)
  })

  it('PUT /api/maint-plan/:id updates full record', async () => {
    const p = await getPlan('1')
    p.owner = '新责任人'
    const updated = await updatePlan('1', {
      deviceId:p.deviceId, deviceName:p.deviceName, deviceCode:p.deviceCode, modelSpec:p.modelSpec, usage:p.usage,
      thisDate:p.thisDate, owner:p.owner, status:p.status, items:p.items
    })
    expect(updated.owner).toBe('新责任人')
  })
})
