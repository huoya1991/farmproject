import { http, HttpResponse } from 'msw'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'
import { storage } from './storage'
import { DEVICES } from './devices'
import { planNextDate, isOverdue, deriveLastDate } from '@/utils/date'
import type { InspectRecord, InspectRecordDerived } from '@/types/inspection'
import { inspectStorage } from './inspectStorage'
import { deriveInspectStatus } from '@/utils/validateInspect'

function withDerived(plan: Plan, all: Plan[]): PlanWithDerived {
  const dev = DEVICES.find(d => d.id === plan.deviceId) ?? DEVICES.find(d => d.code === plan.deviceCode)
  return {
    ...plan,
    planNextDate: planNextDate(plan.items),
    overdue: isOverdue(plan),
    lastDate: deriveLastDate(plan, all),
    ...(dev ? { deviceType: dev.type, deviceSvg: dev.svg } : {})
  }
}

function newId(prefix: string) { return prefix + '_' + Math.random().toString(36).slice(2, 9) }

function withInspectDerived(rec: InspectRecord): InspectRecordDerived {
  const dev = DEVICES.find(d => d.code === rec.deviceCode)
  return { ...rec, status: deriveInspectStatus(rec), ...(dev ? { deviceSvg: dev.svg } : {}) }
}

export const handlers = [
  http.post('/api/auth/exchange', async () =>
    HttpResponse.json({ token: 'mock-token', user: { name: '王强', role: 'device_owner' } })),

  http.get('/api/dict/:type', ({ params }) => {
    if (params.type === 'maint_cycle_unit') return HttpResponse.json(['小时','天','公里'])
    if (params.type === 'usage_duration_unit') return HttpResponse.json(['小时','天','公里'])
    return HttpResponse.json([], { status: 404 })
  }),

  http.get('/api/device', ({ request }) => {
    const kw = new URL(request.url).searchParams.get('keyword')?.trim() ?? ''
    const list = kw ? DEVICES.filter(d => d.name.includes(kw) || d.code.includes(kw)) : DEVICES
    return HttpResponse.json(list.slice(0, 8))
  }),

  http.get('/api/maint-plan', ({ request }) => {
    const url = new URL(request.url)
    const kw = url.searchParams.get('keyword')?.trim() ?? ''
    const status = url.searchParams.get('status') as 'undone'|'done'|null
    const all = storage.read()
    const filtered = all.filter(p => {
      if (kw && !(p.deviceName.includes(kw) || p.deviceCode.includes(kw))) return false
      if (status && p.status !== status) return false
      return true
    })
    return HttpResponse.json(filtered.map(p => withDerived(p, all)))
  }),

  http.get('/api/maint-plan/:id', ({ params }) => {
    const all = storage.read()
    const plan = all.find(p => p.id === params.id)
    if (!plan) return HttpResponse.json({ message: 'not found' }, { status: 404 })
    return HttpResponse.json(withDerived(plan, all))
  }),

  http.post('/api/maint-plan', async ({ request }) => {
    const body = await request.json() as Omit<Plan,'id'|'createdAt'|'updatedAt'>
    const now = Date.now()
    const plan: Plan = { ...body, id: newId('p'), createdAt: now, updatedAt: now }
    const all = [...storage.read(), plan]
    storage.write(all)
    return HttpResponse.json(withDerived(plan, all), { status: 201 })
  }),

  http.put('/api/maint-plan/:id', async ({ params, request }) => {
    const body = await request.json() as Omit<Plan,'id'|'createdAt'|'updatedAt'>
    const all = storage.read()
    const idx = all.findIndex(p => p.id === params.id)
    if (idx < 0) return HttpResponse.json({ message: 'not found' }, { status: 404 })
    const prev = all[idx]!
    const updated: Plan = { ...body, id: prev.id, createdAt: prev.createdAt, updatedAt: Date.now() }
    all[idx] = updated
    storage.write(all)
    return HttpResponse.json(withDerived(updated, all))
  }),

  http.put('/api/maint-plan/:id/status', async ({ params, request }) => {
    const body = await request.json() as { status: 'undone'|'done' }
    const all = storage.read()
    const idx = all.findIndex(p => p.id === params.id)
    if (idx < 0) return HttpResponse.json({ message: 'not found' }, { status: 404 })
    all[idx] = { ...all[idx]!, status: body.status, updatedAt: Date.now() }
    storage.write(all)
    return HttpResponse.json(withDerived(all[idx]!, all))
  })
  ,

  http.get('/api/inspect-records', () =>
    HttpResponse.json(inspectStorage.read().map(withInspectDerived))),

  http.get('/api/inspect-records/:id', ({ params }) => {
    const rec = inspectStorage.read().find(r => r.id === params.id)
    if (!rec) return HttpResponse.json({ message: 'not found' }, { status: 404 })
    return HttpResponse.json(withInspectDerived(rec))
  }),

  http.post('/api/inspect-records', async ({ request }) => {
    const body = await request.json() as Omit<InspectRecord, 'id' | 'createdAt'>
    const rec: InspectRecord = { ...body, id: newId('ir'), createdAt: Date.now() }
    const all = [rec, ...inspectStorage.read()]
    try {
      inspectStorage.write(all)
    } catch {
      // localStorage 超限（照片体积）：降级为无照片保存，响应体现实际落库内容
      delete rec.photos
      inspectStorage.write(all)
    }
    return HttpResponse.json(withInspectDerived(rec), { status: 201 })
  })
]
