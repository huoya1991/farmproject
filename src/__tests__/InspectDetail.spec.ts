import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, type LocationQueryRaw } from 'vue-router'
import InspectDetail from '@/pages/InspectDetail.vue'
import { useInspectionStore } from '@/stores/inspection'
import { ApiError, NetworkError } from '@/api/client'
import type { InspectRecordDerived } from '@/types/inspection'
import * as api from '@/api/inspection'

vi.mock('@/api/inspection', () => ({
  listInspectRecords: vi.fn(), getInspectRecord: vi.fn(), createInspectRecord: vi.fn()
}))

const record = (id: string): InspectRecordDerived => ({
  id, date: '2026-09-17', deviceCode: id, deviceName: `设备-${id}`,
  meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常', status: '正常',
  durationValue: 5, durationUnit: '小时', inspector: '王强', operator: '张三', createdAt: 1
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

let wrapper: VueWrapper | undefined
beforeEach(() => vi.resetAllMocks())
afterEach(() => { wrapper?.unmount(); wrapper = undefined })

async function open(query: LocationQueryRaw) {
  const pinia = createPinia()
  const store = useInspectionStore(pinia)
  store.current = record('previous')
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/inspect/detail', component: InspectDetail },
    { path: '/inspect/list', component: { template: '<div>列表</div>' } }
  ] })
  await router.push({ path: '/inspect/detail', query })
  wrapper = mount(InspectDetail, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { view: wrapper, router, store }
}

describe('inspection detail states', () => {
  it.each([{}, { id: ['a', 'b'] }, { id: '' }])('rejects invalid query %j without requesting or showing previous data', async query => {
    const { view, router, store } = await open(query)
    expect(view.find('.topbar').exists()).toBe(true)
    expect(view.text()).toContain('点检记录编号无效')
    expect(view.text()).not.toContain('设备-previous')
    expect(store.current).toBeNull()
    expect(api.getInspectRecord).not.toHaveBeenCalled()
    await view.get('[aria-label="返回"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inspect/list')
  })

  it('keeps navigation visible and hides previous data until loading finishes', async () => {
    const next = deferred<InspectRecordDerived>()
    vi.mocked(api.getInspectRecord).mockReturnValue(next.promise)
    const { view } = await open({ id: 'next' })
    expect(view.find('.topbar').exists()).toBe(true)
    expect(view.text()).toContain('加载中')
    expect(view.text()).not.toContain('设备-previous')
    next.resolve(record('next'))
    await flushPromises()
    expect(view.text()).toContain('设备-next')
    expect(view.text()).not.toContain('加载中')
  })

  it.each([
    [new ApiError(404, 'not found'), '点检记录不存在'],
    [new NetworkError(), '网络异常，请稍后重试'],
    [new Error('private stack'), '加载失败，请稍后重试']
  ])('shows a safe error instead of previous data: %s', async (error, message) => {
    vi.mocked(api.getInspectRecord).mockRejectedValue(error)
    const { view, store } = await open({ id: 'missing' })
    expect(view.find('.topbar').exists()).toBe(true)
    expect(view.text()).toContain(message)
    expect(view.text()).not.toContain('设备-previous')
    expect(view.text()).not.toContain('private stack')
    expect(store.current).toBeNull()
  })

  it.each(['resolve', 'reject'] as const)('keeps the latest record when the old request later %s', async outcome => {
    const old = deferred<InspectRecordDerived>()
    vi.mocked(api.getInspectRecord).mockReturnValueOnce(old.promise).mockResolvedValueOnce(record('new'))
    const { view, router, store } = await open({ id: 'old' })
    await router.push({ query: { id: 'new' } })
    await flushPromises()
    expect(view.text()).toContain('设备-new')
    if (outcome === 'resolve') old.resolve(record('old'))
    else old.reject(new NetworkError())
    await flushPromises()
    expect(view.text()).toContain('设备-new')
    expect(view.text()).not.toContain('设备-old')
    expect(store.current?.id).toBe('new')
  })

  it('invalidates in-flight data when the new query has no id and recovers on a valid id', async () => {
    const old = deferred<InspectRecordDerived>()
    vi.mocked(api.getInspectRecord).mockReturnValueOnce(old.promise).mockResolvedValueOnce(record('new'))
    const { view, router, store } = await open({ id: 'old' })
    await router.push({ query: {} })
    await flushPromises()
    old.resolve(record('old'))
    await flushPromises()
    expect(view.text()).toContain('点检记录编号无效')
    expect(view.text()).not.toContain('设备-old')
    expect(store.current).toBeNull()
    expect(api.getInspectRecord).toHaveBeenCalledTimes(1)
    await router.push({ query: { id: 'new' } })
    await flushPromises()
    expect(view.text()).toContain('设备-new')
    expect(view.text()).not.toContain('点检记录编号无效')
  })
})
