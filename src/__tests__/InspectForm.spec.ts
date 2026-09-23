import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { Button, Picker, Uploader, showToast } from 'vant'
import InspectForm from '@/pages/InspectForm.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError, NetworkError } from '@/api/client'
import * as api from '@/api/inspection'
import { searchDevices } from '@/api/device'
import { getDict } from '@/api/dict'
import type { InspectPayload, InspectRecordDerived } from '@/types/inspection'

vi.mock('@/api/inspection', () => ({
  listInspectRecords: vi.fn(), getInspectRecord: vi.fn(), createInspectRecord: vi.fn()
}))
vi.mock('@/api/device', () => ({ searchDevices: vi.fn() }))
vi.mock('@/api/dict', () => ({ getDict: vi.fn() }))
vi.mock('vant', async original => ({ ...await original<typeof import('vant')>(), showToast: vi.fn() }))
vi.mock('vant/es/button/style/index', () => ({}))
vi.mock('vant/es/picker/style/index', () => ({}))
vi.mock('vant/es/uploader/style/index', () => ({}))
vi.mock('vant/es/cell-group/style/index', () => ({}))
vi.mock('vant/es/field/style/index', () => ({}))
vi.mock('vant/es/popup/style/index', () => ({}))

const created = (payload: InspectPayload): InspectRecordDerived => ({
  ...payload, id: 'saved', createdAt: 1, status: '正常'
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

let wrapper: VueWrapper | undefined
let images: HTMLImageElement[]
let readers: { onload: (event: { target: { result: string } }) => void }[]
let errors: unknown[]

beforeEach(() => {
  vi.resetAllMocks()
  images = []
  readers = []
  errors = []
  vi.stubGlobal('Image', class {
    width = 100
    height = 100
    constructor() { images.push(this as unknown as HTMLImageElement) }
  })
  vi.stubGlobal('FileReader', class {
    onload = () => {}
    readAsDataURL() { readers.push(this) }
  })
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:photo')
    static revokeObjectURL = vi.fn()
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('photo-a')
  vi.mocked(searchDevices).mockResolvedValue([{
    id: 'd1', code: 'TR001', name: '拖拉机', owner: '张三', model: 'M', usage: '', type: '拖拉机', svg: 'tractor'
  }])
  vi.mocked(getDict).mockResolvedValue(['小时'])
  vi.mocked(api.createInspectRecord).mockImplementation(async payload => created(payload))
  vi.mocked(api.listInspectRecords).mockResolvedValue([])
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  expect(errors).toEqual([])
})

async function open() {
  const pinia = createPinia()
  useAuthStore(pinia).user = { name: '王强', role: 'device_owner' }
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/inspect/form', component: InspectForm },
    { path: '/inspect/list', component: { template: '<div>列表</div>' } }
  ] })
  await router.push('/inspect/form')
  wrapper = mount(InspectForm, { global: { plugins: [pinia, router], config: { errorHandler: error => errors.push(error) } } })
  await flushPromises()
  for (const [label, title, value] of [['设备编号', '选择设备', 'TR001'], ['车辆状态', '车辆状态', '正常']]) {
    await wrapper.findAll('.van-field').find(field => field.text().includes(label!))!.trigger('click')
    wrapper.findAllComponents(Picker).find(picker => picker.props('title') === title)!.vm.$emit('confirm', {
      selectedOptions: [{ text: value, value }]
    })
    await flushPromises()
  }
  await wrapper.get('.duration__input').setValue('5')
  return { view: wrapper, router }
}

function save(view: VueWrapper) {
  view.getComponent(Button).vm.$emit('click')
}
function choose(view: VueWrapper, count = 1) {
  const input = view.get('input[type="file"]').element as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: Array.from({ length: count }, (_, i) =>
    new File(['photo'], `photo-${i}.jpg`, { type: 'image/jpeg' })) })
  input.dispatchEvent(new Event('change', { bubbles: true }))
}
async function readFiles() {
  for (const reader of readers.splice(0)) reader.onload({ target: { result: 'data:image/jpeg;base64,original' } })
  await flushPromises()
}
async function finishPhoto(url: string) {
  vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue(url)
  const image = images.shift()!
  image.onload!.call(image, new Event('load'))
  await flushPromises()
}
async function addPhotos(view: VueWrapper, urls: string[]) {
  if (!urls.length) return
  choose(view, urls.length)
  await readFiles()
  for (const url of urls) await finishPhoto(url)
}

describe('inspection form saving', () => {
  it('blocks saving in the before-read window before uploader items exist', async () => {
    const { view } = await open()
    choose(view)
    save(view)
    expect(api.createInspectRecord).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenLastCalledWith('照片处理中，请稍候再保存')
    await readFiles()
    await finishPhoto('photo-a')
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledWith(expect.objectContaining({ photos: ['photo-a'] }))
  })

  it('marks the whole batch pending and waits for every compressed photo before POST', async () => {
    const { view } = await open()
    choose(view, 2)
    await readFiles()
    expect(view.getComponent(Uploader).props('modelValue')?.map(item => item.status)).toEqual(['uploading', 'uploading'])
    await finishPhoto('photo-a')
    save(view)
    expect(api.createInspectRecord).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenLastCalledWith('照片处理中，请稍候再保存')
    await finishPhoto('photo-b')
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledTimes(1)
    expect(api.createInspectRecord).toHaveBeenCalledWith(expect.objectContaining({ photos: ['photo-a', 'photo-b'] }))
  })

  it('keeps other photos and fields submittable after an image read fails', async () => {
    const { view } = await open()
    choose(view, 2)
    await readFiles()
    const image = images.shift()!
    image.onerror!.call(image, new Event('error'))
    await flushPromises()
    expect(showToast).toHaveBeenLastCalledWith('照片处理失败，请重试')
    await finishPhoto('photo-b')
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledWith(expect.objectContaining({
      deviceCode: 'TR001', inspector: '王强', operator: '张三', durationValue: 5, photos: ['photo-b']
    }))
  })

  it('releases the pending batch and preserves fields when canvas compression throws', async () => {
    const { view, router } = await open()
    choose(view)
    await readFiles()
    vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockImplementationOnce(() => { throw new Error('canvas failure') })
    const image = images.shift()!
    expect(() => image.onload!.call(image, new Event('load'))).not.toThrow()
    await flushPromises()
    expect(showToast).toHaveBeenLastCalledWith('照片处理失败，请重试')
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledWith(expect.objectContaining({ deviceCode: 'TR001', durationValue: 5 }))
    expect(vi.mocked(api.createInspectRecord).mock.calls[0]![0].photos).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/inspect/list')
  })

  it.each([
    { sent: [], actual: [], message: '保存成功' },
    { sent: ['photo-a', 'photo-b'], actual: ['photo-a', 'photo-b'], message: '保存成功' },
    { sent: ['photo-a', 'photo-b', 'photo-c'], actual: ['photo-a', 'photo-c'], message: '保存成功；照片过大，已忽略第2张照片' },
    { sent: ['photo-a', 'photo-b'], actual: [], message: '保存成功；照片过大，已忽略第1、2张照片' },
    { sent: ['photo-a', 'photo-a', 'photo-c'], actual: ['photo-a', 'photo-c'], message: '保存成功；照片过大，已忽略第2张照片' }
  ])('emits one final notification for sent=$sent actual=$actual', async ({ sent, actual, message }) => {
    const { view, router } = await open()
    await addPhotos(view, sent)
    vi.mocked(api.createInspectRecord).mockImplementation(async payload => ({ ...created(payload), photos: actual }))
    save(view)
    await flushPromises()
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith(message)
    expect(router.currentRoute.value.path).toBe('/inspect/list')
    expect(view.getComponent(Button).props('loading')).toBe(false)
  })

  it.each([
    [new ApiError(500, '存储空间不足'), '存储空间不足'],
    [new NetworkError(), '网络异常，请稍后重试'],
    [new Error('private stack'), '保存失败，请稍后重试']
  ])('reports POST failure safely and permits an explicit retry: %s', async (error, message) => {
    const pending = deferred<InspectRecordDerived>()
    vi.mocked(api.createInspectRecord).mockReturnValueOnce(pending.promise)
    const { view, router } = await open()
    save(view)
    save(view)
    expect(api.createInspectRecord).toHaveBeenCalledTimes(1)
    pending.reject(error)
    await flushPromises()
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith(message)
    expect(api.listInspectRecords).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/inspect/form')
    expect(view.getComponent(Button).props('loading')).toBe(false)
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.path).toBe('/inspect/list')
  })

  it('does not POST again while refreshing or after a successful save with refresh failure', async () => {
    const refresh = deferred<InspectRecordDerived[]>()
    vi.mocked(api.listInspectRecords).mockReturnValue(refresh.promise)
    const { view, router } = await open()
    await addPhotos(view, ['photo-a', 'photo-b'])
    vi.mocked(api.createInspectRecord).mockImplementation(async payload => ({ ...created(payload), photos: ['photo-b'] }))
    save(view)
    await flushPromises()
    save(view)
    expect(api.createInspectRecord).toHaveBeenCalledTimes(1)
    refresh.reject(new NetworkError())
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inspect/list')
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith('保存成功；照片过大，已忽略第1张照片；列表刷新失败，请刷新查看')
    expect(view.getComponent(Button).props('loading')).toBe(false)
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledTimes(1)
  })

  it('freezes photo additions and removals during POST and never repeats a saved POST', async () => {
    const pending = deferred<InspectRecordDerived>()
    vi.mocked(api.createInspectRecord).mockReturnValueOnce(pending.promise)
    const { view } = await open()
    await addPhotos(view, ['photo-a'])
    save(view)
    choose(view)
    await flushPromises()
    const remove = view.find('.van-uploader__preview-delete')
    if (remove.exists()) await remove.trigger('click')
    expect(view.getComponent(Uploader).props('modelValue')).toHaveLength(1)
    expect(images).toHaveLength(0)
    pending.resolve(created(vi.mocked(api.createInspectRecord).mock.calls[0]![0]))
    await flushPromises()
    save(view)
    await flushPromises()
    expect(api.createInspectRecord).toHaveBeenCalledTimes(1)
  })
})
