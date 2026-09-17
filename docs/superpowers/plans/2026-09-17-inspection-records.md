# 点检记录模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在老乡农场设备保养 H5 工程中新增二期「点检记录」模块：列表（tab/搜索/日期筛选/本月统计）、新增表单（九项必填+照片压缩）、只读详情三页，含 mock 与单测。

**Architecture:** 平行复用保养模块模式——`InspectRecord` 类型 + 3 个 REST 端点（MSW localStorage 持久化）+ Pinia store（前端过滤/统计）+ 3 个路由页面；`status` 与 `deviceSvg` 为 mock 端联表派生字段。视觉沿用田园风令牌与现有组件（TopBar/Tag/DeviceSvg/EmptyState/Tabbar）。

**Tech Stack:** Vite 5 + Vue 3.4 + TS strict（noUncheckedIndexedAccess + exactOptionalPropertyTypes）+ vue-router 4 hash + Pinia 2 + Vant 4（自动按需）+ MSW 2 + Vitest 2 + jsdom

**Spec:** `docs/superpowers/specs/2026-09-17-inspection-records-design.md`

## Global Constraints

- pnpm 一律经 corepack 调用：`corepack pnpm ...`（corepack enable 在本机报 EPERM，不要执行）
- git 提交一律命令级注入身份：`git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit ...`；**禁止**改 git config
- TS strict：`noUncheckedIndexedAccess`（数组/下标访问须处理 undefined）与 `exactOptionalPropertyTypes`（可选字段只能条件展开，不能显式赋 undefined）
- mock 存储键 `lx_inspect_records_v1`；不得改动 `lx_maint_plans_v3` 及保养模块任何行为
- 视觉令牌以 `src/styles/tokens.css` 为准：主色 `--color-primary:#1FA14A`、异常红 `--color-undone-bg:#FDECEA / --color-undone-fg:#E64A40`；不得新增 `:root` 级 Vant 覆盖
- UI 文案全程简体中文；SVG 资产复用 `ICONS`/`DeviceSvg`，不新增插画
- 状态标签复用现有 `Tag` 组件：正常 → `variant="done"`（浅绿底绿字），异常 → `variant="undone"`（浅红底红字 `#FDECEA/#E64A40`，恰与参考图一致）；**不修改 Tag 组件、不用 overdue 深红 variant**

---

### Task 1: 类型 + derive/validate 工具与单测

**Files:**
- Create: `src/types/inspection.ts`
- Create: `src/utils/validateInspect.ts`
- Test: `src/__tests__/inspectValidate.spec.ts`

**Interfaces:**
- Produces（后续所有任务依赖）:
  - `CheckResult = '正常' | '异常'`
  - `InspectRecord`（含 id/createdAt）、`InspectRecordDerived extends InspectRecord { status: CheckResult; deviceSvg?: string }`
  - `InspectPayload = Omit<InspectRecord,'id'|'createdAt'>`
  - `deriveInspectStatus(r: Pick<InspectRecord,'meterResult'|'vehicleResult'|'vehicleStatus'>): CheckResult`
  - `validateInspect(p: InspectPayload): { ok: boolean; errors: { field: string; message: string }[] }`

- [ ] **Step 1: 写类型文件**

创建 `src/types/inspection.ts`：

```ts
export type CheckResult = '正常' | '异常'

export interface InspectRecord {
  id: string
  date: string               // 点检日期 YYYY-MM-DD
  deviceCode: string         // 设备编号（picker 选择）
  deviceName: string         // 设备名称（选编号后带出，快照存储）
  meterResult: CheckResult   // 仪表检查
  vehicleResult: CheckResult // 车况检查
  vehicleStatus: CheckResult // 车辆状态
  durationValue: number      // 使用时长数值（>0，最多一位小数）
  durationUnit: string       // 使用时长单位（字典 usage_duration_unit）
  inspector: string          // 点检人员（默认当前登录用户，可编辑）
  operator: string           // 使用人（选设备后带出负责人，可改）
  note?: string              // 异常说明（任一异常时必填，≤200 字）
  photos?: string[]          // 现场照片 dataURL（≤3 张）
  createdAt: number
}

export interface InspectRecordDerived extends InspectRecord {
  status: CheckResult        // 派生：三项任一异常 → 异常
  deviceSvg?: string         // mock 联表 DEVICES 注入插画 kind
}

export type InspectPayload = Omit<InspectRecord, 'id' | 'createdAt'>
```

- [ ] **Step 2: 写失败测试**

创建 `src/__tests__/inspectValidate.spec.ts`：

```ts
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
```

- [ ] **Step 3: 跑测试确认失败**

Run: `corepack pnpm exec vitest run src/__tests__/inspectValidate.spec.ts`
Expected: FAIL（`@/utils/validateInspect` 模块不存在）

- [ ] **Step 4: 实现 validateInspect.ts**

创建 `src/utils/validateInspect.ts`：

```ts
import type { CheckResult, InspectPayload } from '@/types/inspection'

export interface InspectValidationError { field: string; message: string }
export interface InspectValidationResult { ok: boolean; errors: InspectValidationError[] }

type StatusSource = Pick<InspectPayload, 'meterResult' | 'vehicleResult' | 'vehicleStatus'>

export function deriveInspectStatus(r: StatusSource): CheckResult {
  return (r.meterResult === '异常' || r.vehicleResult === '异常' || r.vehicleStatus === '异常') ? '异常' : '正常'
}

// 一位小数用字符串正则判断，规避 12.55*10 的浮点误差
const ONE_DECIMAL_RE = /^\d+(\.\d)?$/

export function validateInspect(p: InspectPayload): InspectValidationResult {
  const errors: InspectValidationError[] = []
  if (!p.date) errors.push({ field: 'date', message: '请选择点检日期' })
  if (!p.deviceCode.trim()) errors.push({ field: 'deviceCode', message: '请选择设备编号' })
  if (!p.deviceName.trim()) errors.push({ field: 'deviceName', message: '设备名称不能为空' })
  if (!p.meterResult) errors.push({ field: 'meterResult', message: '请选择仪表检查结果' })
  if (!p.vehicleResult) errors.push({ field: 'vehicleResult', message: '请选择车况检查结果' })
  if (!p.vehicleStatus) errors.push({ field: 'vehicleStatus', message: '请选择车辆状态' })
  if (!Number.isFinite(p.durationValue) || p.durationValue <= 0) {
    errors.push({ field: 'durationValue', message: '使用时长必须大于 0' })
  } else if (!ONE_DECIMAL_RE.test(String(p.durationValue))) {
    errors.push({ field: 'durationValue', message: '使用时长最多一位小数' })
  }
  if (!p.durationUnit.trim()) errors.push({ field: 'durationUnit', message: '请选择使用时长单位' })
  if (!p.inspector.trim()) errors.push({ field: 'inspector', message: '请输入点检人员' })
  if (!p.operator.trim()) errors.push({ field: 'operator', message: '请选择使用人' })
  if (deriveInspectStatus(p) === '异常' && !p.note?.trim()) {
    errors.push({ field: 'note', message: '存在异常项，请填写异常说明' })
  }
  if (p.note && p.note.length > 200) errors.push({ field: 'note', message: '异常说明不能超过 200 字' })
  if ((p.photos?.length ?? 0) > 3) errors.push({ field: 'photos', message: '现场照片最多 3 张' })
  return { ok: errors.length === 0, errors }
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `corepack pnpm exec vitest run src/__tests__/inspectValidate.spec.ts`
Expected: PASS（14 个用例）

- [ ] **Step 6: 提交**

```bash
git add src/types/inspection.ts src/utils/validateInspect.ts src/__tests__/inspectValidate.spec.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(inspect): types + derive/validate utils"
```

---

### Task 2: API 层 + dict 类型扩展

**Files:**
- Create: `src/api/inspection.ts`
- Modify: `src/api/dict.ts`

**Interfaces:**
- Consumes: `apiClient.request<T>`（`src/api/client.ts`）、`InspectRecordDerived`/`InspectPayload`（Task 1）
- Produces:
  - `listInspectRecords(): Promise<InspectRecordDerived[]>`
  - `getInspectRecord(id: string): Promise<InspectRecordDerived>`
  - `createInspectRecord(payload: InspectPayload): Promise<InspectRecordDerived>`
  - `getDict(type: 'maint_cycle_unit' | 'usage_duration_unit'): Promise<string[]>`（签名放宽，Task 3 的 mock 与 Task 4 的 dict store 依赖）

- [ ] **Step 1: 扩展 dict.ts 类型联合**

将 `src/api/dict.ts` 整体替换为：

```ts
import { apiClient } from './client'
export type DictType = 'maint_cycle_unit' | 'usage_duration_unit'
export const getDict = (type: DictType) =>
  apiClient.request<string[]>({ method: 'GET', url: `/api/dict/${type}` })
```

- [ ] **Step 2: 新建 inspection API**

创建 `src/api/inspection.ts`：

```ts
import { apiClient } from './client'
import type { InspectRecordDerived, InspectPayload } from '@/types/inspection'

export const listInspectRecords = () =>
  apiClient.request<InspectRecordDerived[]>({ method: 'GET', url: '/api/inspect-records' })

export const getInspectRecord = (id: string) =>
  apiClient.request<InspectRecordDerived>({ method: 'GET', url: `/api/inspect-records/${id}` })

export const createInspectRecord = (payload: InspectPayload) =>
  apiClient.request<InspectRecordDerived>({ method: 'POST', url: '/api/inspect-records', body: payload })
```

- [ ] **Step 3: 类型检查**

Run: `corepack pnpm typecheck`
Expected: 通过（此时新 API 尚无调用方，属预期）

- [ ] **Step 4: 提交**

```bash
git add src/api/dict.ts src/api/inspection.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(inspect): api layer + dict type union"
```

---

### Task 3: MSW mock（storage/seed/handlers/browser）+ handlers 单测

**Files:**
- Create: `src/mock/inspectStorage.ts`
- Create: `src/mock/inspectSeed.ts`
- Modify: `src/mock/handlers.ts`（+import、dict 分支、+3 端点）
- Modify: `src/mock/browser.ts`（+播种）
- Test: `src/__tests__/inspectHandlers.spec.ts`

**Interfaces:**
- Consumes: `deriveInspectStatus`（Task 1）、`listInspectRecords/getInspectRecord/createInspectRecord/getDict`（Task 2）、`DEVICES`（`src/mock/devices.ts`）、`newId`（handlers.ts 内部既有函数）
- Produces:
  - `inspectStorage.read()/write()`（键 `lx_inspect_records_v1`）
  - `SEED_INSPECT_RECORDS: InspectRecord[]`（6 条 2026-09 种子：s1~s6，2 条异常）
  - 端点 `GET/POST /api/inspect-records`、`GET /api/inspect-records/:id`、dict `usage_duration_unit`

- [ ] **Step 1: 写 storage 与 seed（测试的前置依赖）**

创建 `src/mock/inspectStorage.ts`：

```ts
import type { InspectRecord } from '@/types/inspection'

const KEY = 'lx_inspect_records_v1'

export const inspectStorage = {
  read(): InspectRecord[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as InspectRecord[]) : []
    } catch { return [] }
  },
  write(records: InspectRecord[]): void {
    localStorage.setItem(KEY, JSON.stringify(records))
  }
}
```

创建 `src/mock/inspectSeed.ts`（设备名称/负责人与 `DEVICES` 台账一致；全部落在 2026-09，使本月统计 = 6/4/2）：

```ts
import type { InspectRecord } from '@/types/inspection'

const ts = (s: string) => Date.parse(s + 'T08:00:00')

export const SEED_INSPECT_RECORDS: InspectRecord[] = [
  { id: 's1', date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 128.5, durationUnit: '小时', inspector: '王强', operator: '张三',
    createdAt: ts('2026-09-17') },
  { id: 's2', date: '2026-09-16', deviceCode: 'XGJ003', deviceName: '旋耕机',
    meterResult: '异常', vehicleResult: '异常', vehicleStatus: '异常',
    durationValue: 86, durationUnit: '小时', inspector: '李四', operator: '王五',
    note: '油压表读数异常，待检修', createdAt: ts('2026-09-16') },
  { id: 's3', date: '2026-09-15', deviceCode: 'LHS002', deviceName: '联合收割机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 215, durationUnit: '公里', inspector: '王强', operator: '李四',
    createdAt: ts('2026-09-15') },
  { id: 's4', date: '2026-09-12', deviceCode: 'SB004', deviceName: '水泵',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 40, durationUnit: '小时', inspector: '赵六', operator: '赵六',
    createdAt: ts('2026-09-12') },
  { id: 's5', date: '2026-09-08', deviceCode: 'UAV006', deviceName: '植保无人机',
    meterResult: '异常', vehicleResult: '正常', vehicleStatus: '异常',
    durationValue: 12, durationUnit: '小时', inspector: '王强', operator: '王强',
    note: '电量显示跳变', createdAt: ts('2026-09-08') },
  { id: 's6', date: '2026-09-03', deviceCode: 'SFJ005', deviceName: '撒肥机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 60, durationUnit: '公里', inspector: '陈七', operator: '陈七',
    createdAt: ts('2026-09-03') }
]
```

- [ ] **Step 2: 写失败测试**

创建 `src/__tests__/inspectHandlers.spec.ts`：

```ts
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
```

- [ ] **Step 3: 跑测试确认失败**

Run: `corepack pnpm exec vitest run src/__tests__/inspectHandlers.spec.ts`
Expected: FAIL（`/api/inspect-records` 未注册 → onUnhandledRequest: error 报错；dict 返回 404）

- [ ] **Step 4: 扩展 handlers.ts**

在 `src/mock/handlers.ts` 顶部 import 区追加：

```ts
import type { InspectRecord, InspectRecordDerived } from '@/types/inspection'
import { inspectStorage } from './inspectStorage'
import { deriveInspectStatus } from '@/utils/validateInspect'
```

在 `withDerived` 函数之后追加派生函数：

```ts
function withInspectDerived(rec: InspectRecord): InspectRecordDerived {
  const dev = DEVICES.find(d => d.code === rec.deviceCode)
  return { ...rec, status: deriveInspectStatus(rec), ...(dev ? { deviceSvg: dev.svg } : {}) }
}
```

dict 分支：把既有 `http.get('/api/dict/:type', ...)` 改为：

```ts
  http.get('/api/dict/:type', ({ params }) => {
    if (params.type === 'maint_cycle_unit') return HttpResponse.json(['小时','天','公里'])
    if (params.type === 'usage_duration_unit') return HttpResponse.json(['小时','天','公里'])
    return HttpResponse.json([], { status: 404 })
  }),
```

在 `handlers` 数组末尾（`http.put('/api/maint-plan/:id/status', ...)` 之后）追加 3 个端点：

```ts
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
```

- [ ] **Step 5: browser.ts 播种**

`src/mock/browser.ts` 追加 import 与播种行，完整文件变为：

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { storage } from './storage'
import { SEED_PLANS } from './seed'
import { inspectStorage } from './inspectStorage'
import { SEED_INSPECT_RECORDS } from './inspectSeed'

export async function startMockWorker(): Promise<void> {
  if (storage.read().length === 0) storage.write(SEED_PLANS)
  if (inspectStorage.read().length === 0) inspectStorage.write(SEED_INSPECT_RECORDS)
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
```

- [ ] **Step 6: 跑测试确认通过 + 回归**

Run: `corepack pnpm exec vitest run src/__tests__/inspectHandlers.spec.ts src/__tests__/mockHandlers.spec.ts`
Expected: 全部 PASS（新 5 个 + 保养既有 6 个用例不受影响）

- [ ] **Step 7: 提交**

```bash
git add src/mock/inspectStorage.ts src/mock/inspectSeed.ts src/mock/handlers.ts src/mock/browser.ts src/__tests__/inspectHandlers.spec.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(inspect): msw storage/seed/handlers + dict branch"
```

---

### Task 4: dict store 扩展 + inspection store 与单测

**Files:**
- Modify: `src/stores/dict.ts`
- Create: `src/stores/inspection.ts`
- Test: `src/__tests__/inspectStore.spec.ts`

**Interfaces:**
- Consumes: `getDict`（Task 2）、`listInspectRecords/getInspectRecord/createInspectRecord`（Task 2）、`todayStr`（`src/utils/date.ts`）
- Produces:
  - `useDictStore`：`state.usageUnits: string[]`、`action loadUsageUnits(): Promise<string[]>`（Task 6 表单用）
  - `useInspectionStore`：state `{ list, current, loading, keyword, statusTab: 'all'|'正常'|'异常', dateFrom: string|null, dateTo: string|null }`；getters `filteredSortedList`、`monthStats: { total, normal, abnormal }`；actions `fetchList/fetchOne/create`

- [ ] **Step 1: 写失败测试**

创建 `src/__tests__/inspectStore.spec.ts`：

```ts
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

  it('monthStats counts current month and ignores filters', async () => {
    const month = todayStr().slice(0, 7)
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `corepack pnpm exec vitest run src/__tests__/inspectStore.spec.ts`
Expected: FAIL（`@/stores/inspection` 模块不存在）

- [ ] **Step 3: 实现 inspection store**

创建 `src/stores/inspection.ts`：

```ts
import { defineStore } from 'pinia'
import type { CheckResult, InspectPayload, InspectRecordDerived } from '@/types/inspection'
import { listInspectRecords, getInspectRecord, createInspectRecord as apiCreate } from '@/api/inspection'
import { todayStr } from '@/utils/date'

interface State {
  list: InspectRecordDerived[]
  current: InspectRecordDerived | null
  loading: boolean
  keyword: string
  statusTab: 'all' | CheckResult
  dateFrom: string | null
  dateTo: string | null
}

export const useInspectionStore = defineStore('inspection', {
  state: (): State => ({
    list: [], current: null, loading: false,
    keyword: '', statusTab: 'all', dateFrom: null, dateTo: null
  }),
  getters: {
    filteredSortedList(s): InspectRecordDerived[] {
      const kw = s.keyword.trim()
      return s.list.filter(r => {
        if (s.statusTab !== 'all' && r.status !== s.statusTab) return false
        if (kw && !(r.deviceName.includes(kw) || r.deviceCode.includes(kw))) return false
        if (s.dateFrom && r.date < s.dateFrom) return false
        if (s.dateTo && r.date > s.dateTo) return false
        return true
      }).slice().sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return b.createdAt - a.createdAt
      })
    },
    monthStats(s): { total: number; normal: number; abnormal: number } {
      const month = todayStr().slice(0, 7)
      const inMonth = s.list.filter(r => r.date.startsWith(month))
      const abnormal = inMonth.filter(r => r.status === '异常').length
      return { total: inMonth.length, normal: inMonth.length - abnormal, abnormal }
    }
  },
  actions: {
    async fetchList() {
      this.loading = true
      try { this.list = await listInspectRecords() } finally { this.loading = false }
    },
    async fetchOne(id: string) {
      this.loading = true
      try { this.current = await getInspectRecord(id) } finally { this.loading = false }
    },
    async create(payload: InspectPayload) { return apiCreate(payload) }
  }
})
```

- [ ] **Step 4: 扩展 dict store**

将 `src/stores/dict.ts` 整体替换为：

```ts
import { defineStore } from 'pinia'
import { getDict } from '@/api/dict'
export const useDictStore = defineStore('dict', {
  state: () => ({ cycleUnits: [] as string[], usageUnits: [] as string[] }),
  actions: {
    async loadCycleUnits() {
      if (this.cycleUnits.length) return this.cycleUnits
      this.cycleUnits = await getDict('maint_cycle_unit')
      return this.cycleUnits
    },
    async loadUsageUnits() {
      if (this.usageUnits.length) return this.usageUnits
      this.usageUnits = await getDict('usage_duration_unit')
      return this.usageUnits
    }
  }
})
```

- [ ] **Step 5: 跑测试确认通过 + 全量回归**

Run: `corepack pnpm test`
Expected: 全部 PASS（含新 3 个 store 用例，总计 27+3+5+14=49 个）

- [ ] **Step 6: 提交**

```bash
git add src/stores/dict.ts src/stores/inspection.ts src/__tests__/inspectStore.spec.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(inspect): pinia store + dict usageUnits"
```

---

### Task 5: 列表页 + 路由 + 入口打通

**Files:**
- Create: `src/pages/InspectList.vue`
- Modify: `src/router/index.ts`（+1 路由 `/inspect/list`）
- Modify: `src/components/Tabbar.vue`（点检 tab 跳路由）
- Modify: `src/pages/Home.vue`（点检记录入口跳路由）

**Interfaces:**
- Consumes: `useInspectionStore`（Task 4）、`TopBar/Tabbar/EmptyState/DeviceSvg` 现有组件、`ICONS`（`cal/search/funnel/chev/clipboard/check`）
- Produces: 路由 `/inspect/list`；Tabbar `active="inspect"` 可用

> 路由按页面逐任务注册（本任务只注册 `/inspect/list`，Task 6/7 各加一条）——Vite 构建会解析动态 import 字面量，若提前注册指向尚不存在的页面文件会导致 build 失败；逐条注册保证每个任务提交点都可独立构建。

- [ ] **Step 1: 注册列表路由**

`src/router/index.ts` 的 routes 数组中，在 `{ path: '/plan/detail', ... }` 行之后插入：

```ts
  { path: '/inspect/list', component: () => import('@/pages/InspectList.vue') },
```

- [ ] **Step 2: 创建列表页**

创建 `src/pages/InspectList.vue`：

```vue
<template>
  <div class="page page-il">
    <TopBar title="点检记录" back @back="$router.push('/home')" />

    <div class="seg">
      <button v-for="t in segTabs" :key="t.value" class="seg__btn" :class="{ on: store.statusTab === t.value }"
        @click="store.statusTab = t.value">{{ t.label }}</button>
    </div>

    <div class="searchrow">
      <div class="search">
        <span class="sic" v-html="ICONS.search"></span>
        <input v-model="store.keyword" placeholder="设备名称/编号" />
      </div>
      <button class="filterbtn" :class="{ on: showFilter }" @click="showFilter = !showFilter">
        <span class="fic" v-html="ICONS.funnel"></span>筛选
      </button>
    </div>

    <div v-if="showFilter" class="daterange">
      <input v-model="dateFromStr" type="date" aria-label="开始日期" />
      <span class="sep">至</span>
      <input v-model="dateToStr" type="date" aria-label="结束日期" />
      <button class="reset" @click="onReset">重置</button>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="t"><span class="ic" v-html="ICONS.clipboard"></span>本月点检</div>
        <div class="v">{{ store.monthStats.total }}</div>
      </div>
      <div class="stat">
        <div class="t"><span class="ic" v-html="ICONS.check"></span>正常</div>
        <div class="v ok">{{ store.monthStats.normal }}</div>
      </div>
      <div class="stat">
        <div class="t"><span class="ic bad">!</span>异常</div>
        <div class="v bad">{{ store.monthStats.abnormal }}</div>
      </div>
    </div>

    <div class="list-body">
      <div v-if="store.loading" class="list-loading">加载中…</div>
      <template v-else>
        <div v-for="r in store.filteredSortedList" :key="r.id" class="rcard"
          @click="$router.push({ path: '/inspect/detail', query: { id: r.id } })">
          <div class="rc-top">
            <span class="rc-date"><span class="cal" v-html="ICONS.cal"></span>{{ r.date }}</span>
            <span class="rc-status" :class="r.status === '异常' ? 'bad' : 'ok'">{{ r.status }}</span>
          </div>
          <div class="rc-main">
            <span class="rc-img"><DeviceSvg :kind="r.deviceSvg" /></span>
            <div class="rc-dev">
              <div class="rc-code">{{ r.deviceCode }}</div>
              <div class="rc-name">{{ r.deviceName }}</div>
            </div>
            <span class="rc-arrow" v-html="ICONS.chev"></span>
          </div>
          <div class="rc-results">
            <span>仪表检查 <b :class="r.meterResult === '异常' ? 'bad' : 'ok'">{{ r.meterResult }}</b></span>
            <i class="divider"></i>
            <span>车况检查 <b :class="r.vehicleResult === '异常' ? 'bad' : 'ok'">{{ r.vehicleResult }}</b></span>
          </div>
          <div class="rc-grid">
            <div class="g"><span class="gl">点检人</span><span class="gv">{{ r.inspector }}</span></div>
            <div class="g"><span class="gl">使用人</span><span class="gv">{{ r.operator }}</span></div>
            <div class="g"><span class="gl">使用时长</span><span class="gv">{{ r.durationValue }} {{ r.durationUnit }}</span></div>
            <div class="g"><span class="gl">车辆状态</span><span class="gv" :class="{ bad: r.vehicleStatus === '异常' }">{{ r.vehicleStatus }}</span></div>
          </div>
        </div>
        <EmptyState v-if="!store.filteredSortedList.length" text="暂无点检记录，点击右下角「＋」录入" />
      </template>
    </div>

    <button class="fab" aria-label="新增点检记录" @click="$router.push('/inspect/form')">＋</button>
    <Tabbar active="inspect" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ICONS } from '@/components/icons'
import TopBar from '@/components/TopBar.vue'
import Tabbar from '@/components/Tabbar.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useInspectionStore } from '@/stores/inspection'
import type { CheckResult } from '@/types/inspection'

const store = useInspectionStore()
const showFilter = ref(false)
const segTabs: { label: string; value: 'all' | CheckResult }[] = [
  { label: '全部', value: 'all' }, { label: '正常', value: '正常' }, { label: '异常', value: '异常' }
]

const dateFromStr = computed({ get: () => store.dateFrom ?? '', set: v => { store.dateFrom = v || null } })
const dateToStr = computed({ get: () => store.dateTo ?? '', set: v => { store.dateTo = v || null } })

function onReset() {
  store.keyword = ''; store.statusTab = 'all'; store.dateFrom = null; store.dateTo = null
}
onMounted(() => store.fetchList())
</script>

<style scoped>
.page-il{padding-bottom:76px}
.seg{display:flex;margin:12px 14px 0;background:#E7F1E9;border-radius:20px;padding:3px}
.seg__btn{flex:1;border:none;background:transparent;border-radius:17px;height:34px;font-size:14px;color:var(--color-text-2);cursor:pointer}
.seg__btn.on{background:var(--color-primary);color:#fff;font-weight:600;box-shadow:0 3px 8px rgba(21,122,56,.3)}
.searchrow{display:flex;gap:8px;margin:12px 14px 0}
.search{flex:1;position:relative}
.search input{width:100%;height:38px;border:1px solid var(--color-line);border-radius:19px;background:#F4F8F4;padding:0 14px 0 36px;font-size:13px;outline:none}
.search input::placeholder{color:#9AB0A0}
.sic{position:absolute;left:12px;top:10px;width:17px;height:17px;color:#9AB0A0;display:inline-flex}
.sic :deep(svg){width:100%;height:100%}
.filterbtn{display:flex;align-items:center;gap:4px;border:1px solid var(--color-line);background:var(--color-card);border-radius:19px;padding:0 14px;font-size:13px;color:var(--color-text-2);cursor:pointer}
.filterbtn.on{border-color:var(--color-primary);color:var(--color-primary)}
.fic{width:15px;height:15px;display:inline-flex}
.fic :deep(svg){width:100%;height:100%}
.daterange{display:flex;align-items:center;gap:6px;margin:10px 14px 0;background:var(--color-card);border:1px solid var(--color-line);border-radius:12px;padding:8px 10px}
.daterange input{flex:1;min-width:0;height:30px;border:1px solid var(--color-line);border-radius:8px;padding:0 6px;font-size:12px;color:var(--color-text);outline:none}
.sep{font-size:12px;color:var(--color-text-3)}
.reset{border:none;background:var(--color-chip-bg);color:var(--color-primary);border-radius:8px;font-size:12px;padding:6px 10px;flex-shrink:0;cursor:pointer}
.stats{display:flex;background:var(--color-card);border:1px solid var(--color-line);border-radius:14px;margin:12px 14px 0;padding:14px 8px;box-shadow:var(--shadow-card)}
.stat{flex:1;text-align:center}
.stat .t{display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:var(--color-text-3)}
.stat .ic{width:18px;height:18px;border-radius:6px;background:var(--color-done-bg);color:var(--color-primary);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.stat .ic :deep(svg){width:12px;height:12px}
.stat .ic.bad{background:var(--color-undone-bg);color:var(--color-undone-fg)}
.stat .v{font-size:20px;font-weight:800;color:var(--color-text);margin-top:6px}
.stat .v.ok{color:var(--color-primary)}
.stat .v.bad{color:var(--color-undone-fg)}
.list-body{margin-top:12px}
.list-loading{padding:24px;text-align:center;color:var(--color-text-3)}
.rcard{position:relative;background:var(--color-card);border:1px solid var(--color-line);border-radius:14px;margin:0 14px 12px;padding:12px;box-shadow:var(--shadow-card);cursor:pointer}
.rc-top{display:flex;align-items:center;justify-content:space-between}
.rc-date{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--color-text-2);font-weight:600}
.cal{width:14px;height:14px;color:var(--color-primary);display:inline-flex}
.cal :deep(svg){width:100%;height:100%}
.rc-status{border-radius:8px;padding:3px 9px;font-size:11px;font-weight:600}
.rc-status.ok{background:var(--color-done-bg);color:var(--color-done-fg)}
.rc-status.bad{background:var(--color-undone-bg);color:var(--color-undone-fg)}
.rc-main{display:flex;align-items:center;gap:10px;margin-top:10px}
.rc-img{width:52px;height:52px;border-radius:12px;background:linear-gradient(160deg,#F2F9F3,#E2F1E6);border:1px solid #E4F0E6;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:3px}
.rc-dev{flex:1;min-width:0}
.rc-code{font-size:12px;color:var(--color-text-3)}
.rc-name{font-size:16px;font-weight:700;color:var(--color-text);margin-top:2px}
.rc-arrow{width:16px;height:16px;color:var(--color-text-3);display:inline-flex;flex-shrink:0}
.rc-arrow :deep(svg){width:100%;height:100%;transform:rotate(180deg)}
.rc-results{display:flex;align-items:center;justify-content:space-around;margin-top:10px;padding:8px 0;border-top:1px dashed var(--color-line);font-size:13px;color:var(--color-text-2)}
.rc-results b{font-weight:700}
.rc-results b.ok{color:var(--color-primary)}
.rc-results b.bad{color:var(--color-undone-fg)}
.divider{width:1px;height:14px;background:var(--color-line)}
.rc-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
.g{background:#F7FAF7;border-radius:8px;padding:6px 10px;display:flex;justify-content:space-between;font-size:12px}
.gl{color:var(--color-text-3)}
.gv{color:var(--color-text);font-weight:600}
.gv.bad{color:var(--color-undone-fg)}
.fab{position:fixed;left:50%;transform:translateX(117.5px);bottom:76px;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#37B45C,#157A38);color:#fff;font-size:26px;line-height:1;box-shadow:0 8px 18px rgba(31,161,74,.4);z-index:30;cursor:pointer}
@media (max-width:375px){.fab{left:auto;right:18px;transform:none}}
</style>
```

- [ ] **Step 3: Tabbar 点检跳路由**

`src/components/Tabbar.vue` 中把 inspect 行：

```ts
  { key:'inspect', label:'点检', icon:ICONS.clipboard },
```

改为：

```ts
  { key:'inspect', label:'点检', icon:ICONS.clipboard, route:'/inspect/list' },
```

- [ ] **Step 4: Home 点检入口跳路由**

`src/pages/Home.vue` 设备保养分组中把：

```ts
    { label:'点检记录', glyph:'点', color:'g-green', toast:'功能建设中' },
```

改为：

```ts
    { label:'点检记录', glyph:'点', color:'g-green', route:'/inspect/list' },
```

- [ ] **Step 5: 类型检查 + 构建 + 冒烟**

Run: `corepack pnpm typecheck && corepack pnpm build`
Expected: 通过

dev 冒烟（可选，Task 8 有完整验收）：`corepack pnpm dev`，访问 `/#/inspect/list`，应见 6 条种子、统计 6/4/2、tab/搜索/日期筛选可用、Tabbar 点检高亮。

- [ ] **Step 6: 提交**

```bash
git add src/pages/InspectList.vue src/router/index.ts src/components/Tabbar.vue src/pages/Home.vue
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(page): inspect list + entries"
```

---

### Task 6: 表单页

**Files:**
- Create: `src/pages/InspectForm.vue`
- Modify: `src/router/index.ts`（+1 路由）

**Interfaces:**
- Consumes: `useInspectionStore.create/fetchList`（Task 4）、`useDictStore.loadUsageUnits`（Task 4）、`useAuthStore`（`src/stores/auth.ts`，mock 用户王强）、`searchDevices`（`src/api/device.ts`）、`validateInspect`（Task 1）、`todayStr`、Vant 组件（van-field/van-popup/van-picker/van-uploader/van-button/showToast，自动按需注册）
- Produces: 路由 `/inspect/form`（Task 5 列表页 fab 已指向它）

- [ ] **Step 1: 注册表单路由**

`src/router/index.ts` 在 `/inspect/list` 行之后插入：

```ts
  { path: '/inspect/form', component: () => import('@/pages/InspectForm.vue') },
```

- [ ] **Step 2: 创建表单页**

创建 `src/pages/InspectForm.vue`：

```vue
<template>
  <div class="page form">
    <TopBar title="新增点检记录" back @back="$router.push('/inspect/list')" />

    <!-- 分组 1 · 设备信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.tractorTab"></span>设备信息</div>
      <van-cell-group inset>
        <van-field v-model="draft.date" label="点检日期" type="date" required />
        <van-field :model-value="deviceText" label="设备编号" placeholder="请选择" readonly required is-link @click="showDevice = true" />
        <van-field :model-value="draft.deviceName" label="设备名称" placeholder="选择编号后自动带出" readonly required />
      </van-cell-group>
    </div>

    <!-- 分组 2 · 点检信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.clipboard"></span>点检信息</div>
      <van-cell-group inset>
        <van-field label="仪表检查" required>
          <template #input>
            <div class="toggle">
              <button v-for="o in RESULT_OPTS" :key="o" type="button"
                class="toggle__btn" :class="{ on: draft.meterResult === o, bad: o === '异常' && draft.meterResult === o }"
                @click="draft.meterResult = o">{{ o }}</button>
            </div>
          </template>
        </van-field>
        <van-field label="车况检查" required>
          <template #input>
            <div class="toggle">
              <button v-for="o in RESULT_OPTS" :key="o" type="button"
                class="toggle__btn" :class="{ on: draft.vehicleResult === o, bad: o === '异常' && draft.vehicleResult === o }"
                @click="draft.vehicleResult = o">{{ o }}</button>
            </div>
          </template>
        </van-field>
        <van-field :model-value="draft.vehicleStatus" label="车辆状态" placeholder="请选择" readonly required is-link @click="showStatus = true" />
        <van-field v-model="draft.note" label="异常说明" type="textarea" rows="3" maxlength="200" show-word-limit
          :required="hasAbnormal" :placeholder="hasAbnormal ? '存在异常项，请填写异常说明' : '选填'" />
      </van-cell-group>
      <div class="photos">
        <div class="photos__label">现场照片<span class="photos__tip">（最多 3 张）</span></div>
        <van-uploader v-model="fileList" accept="image/*" :max-count="3" :after-read="afterRead" />
      </div>
    </div>

    <!-- 分组 3 · 人员及使用信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.user"></span>人员及使用信息</div>
      <van-cell-group inset>
        <van-field v-model="draft.inspector" label="点检人员" placeholder="请输入" required />
        <van-field :model-value="draft.operator" label="使用人" placeholder="请选择" readonly required is-link @click="showOperator = true" />
        <van-field label="使用时长" required>
          <template #input>
            <div class="duration">
              <input v-model="draft.durationValue" type="number" min="0" step="0.1" placeholder="请输入" class="duration__input" />
              <button type="button" class="duration__unit" @click="showUnit = true">
                {{ draft.durationUnit || '单位' }}<span class="du-arrow" v-html="ICONS.down"></span>
              </button>
            </div>
          </template>
        </van-field>
      </van-cell-group>
    </div>

    <div class="form__bar">
      <button class="btn-ghost" @click="$router.push('/inspect/list')">取消</button>
      <van-button type="primary" class="btn-save" :loading="submitting" @click="submit">保存记录</van-button>
    </div>

    <van-popup v-model:show="showDevice" position="bottom" round>
      <van-picker :columns="deviceColumns" title="选择设备" @confirm="onPickDevice" @cancel="showDevice = false" />
    </van-popup>
    <van-popup v-model:show="showStatus" position="bottom" round>
      <van-picker :columns="statusColumns" title="车辆状态" @confirm="onPickStatus" @cancel="showStatus = false" />
    </van-popup>
    <van-popup v-model:show="showOperator" position="bottom" round>
      <van-picker :columns="ownerColumns" title="使用人" @confirm="onPickOperator" @cancel="showOperator = false" />
    </van-popup>
    <van-popup v-model:show="showUnit" position="bottom" round>
      <van-picker :columns="unitColumns" title="时长单位" @confirm="onPickUnit" @cancel="showUnit = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, type UploaderFileListItem } from 'vant'
import TopBar from '@/components/TopBar.vue'
import { ICONS } from '@/components/icons'
import { useInspectionStore } from '@/stores/inspection'
import { useDictStore } from '@/stores/dict'
import { useAuthStore } from '@/stores/auth'
import { searchDevices } from '@/api/device'
import { validateInspect, deriveInspectStatus } from '@/utils/validateInspect'
import { todayStr } from '@/utils/date'
import type { CheckResult, InspectPayload } from '@/types/inspection'
import type { Device } from '@/types/maintPlan'

const RESULT_OPTS: CheckResult[] = ['正常', '异常']

const router = useRouter()
const store = useInspectionStore()
const dict = useDictStore()
const auth = useAuthStore()

const devices = ref<Device[]>([])
const fileList = ref<UploaderFileListItem[]>([])
const submitting = ref(false)
const showDevice = ref(false)
const showStatus = ref(false)
const showOperator = ref(false)
const showUnit = ref(false)
let ownerTouched = false

const draft = reactive({
  date: todayStr(),
  deviceCode: '',
  deviceName: '',
  meterResult: '正常' as CheckResult,
  vehicleResult: '正常' as CheckResult,
  vehicleStatus: '' as CheckResult | '',
  durationValue: '',
  durationUnit: '',
  inspector: auth.user?.name ?? '',
  operator: '',
  note: ''
})

const hasAbnormal = computed(() =>
  deriveInspectStatus({
    meterResult: draft.meterResult,
    vehicleResult: draft.vehicleResult,
    vehicleStatus: draft.vehicleStatus || '正常'
  }) === '异常')

const deviceText = computed(() => draft.deviceCode)
const deviceColumns = computed(() => devices.value.map(d => ({ text: `${d.code} · ${d.name}`, value: d.code })))
const statusColumns = RESULT_OPTS.map(o => ({ text: o, value: o }))
const ownerColumns = computed(() => [...new Set(devices.value.map(d => d.owner))].map(o => ({ text: o, value: o })))
const unitColumns = computed(() => dict.usageUnits.map(u => ({ text: u, value: u })))

onMounted(async () => {
  devices.value = await searchDevices('')
  await dict.loadUsageUnits()
  if (!draft.durationUnit && dict.usageUnits.length) draft.durationUnit = dict.usageUnits[0]!
})

type PickerEvent = { selectedOptions: { text: string; value: string }[] }

function onPickDevice(ev: PickerEvent) {
  const dev = devices.value.find(d => d.code === ev.selectedOptions[0]?.value)
  if (dev) {
    draft.deviceCode = dev.code
    draft.deviceName = dev.name
    if (!ownerTouched) draft.operator = dev.owner
  }
  showDevice.value = false
}
function onPickStatus(ev: PickerEvent) {
  draft.vehicleStatus = (ev.selectedOptions[0]?.value ?? '') as CheckResult | ''
  showStatus.value = false
}
function onPickOperator(ev: PickerEvent) {
  draft.operator = ev.selectedOptions[0]?.value ?? ''
  ownerTouched = true
  showOperator.value = false
}
function onPickUnit(ev: PickerEvent) {
  draft.durationUnit = ev.selectedOptions[0]?.value ?? ''
  showUnit.value = false
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX = 1280
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) { reject(new Error('no canvas ctx')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

async function afterRead(item: UploaderFileListItem | UploaderFileListItem[]) {
  const arr = Array.isArray(item) ? item : [item]
  for (const it of arr) {
    if (!it.file) continue
    try {
      it.url = await compressImage(it.file)
      it.status = 'done'
    } catch {
      fileList.value = fileList.value.filter(f => f !== it)
      showToast('照片处理失败，请重试')
    }
  }
}

async function submit() {
  const photos = fileList.value.map(f => f.url).filter((u): u is string => !!u)
  const payload: InspectPayload = {
    date: draft.date,
    deviceCode: draft.deviceCode,
    deviceName: draft.deviceName,
    meterResult: draft.meterResult,
    vehicleResult: draft.vehicleResult,
    vehicleStatus: draft.vehicleStatus as CheckResult,
    durationValue: Number(draft.durationValue),
    durationUnit: draft.durationUnit,
    inspector: draft.inspector,
    operator: draft.operator,
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    ...(photos.length ? { photos } : {})
  }
  const res = validateInspect(payload)
  if (!res.ok) { showToast(res.errors[0]!.message); return }
  submitting.value = true
  try {
    const created = await store.create(payload)
    if (photos.length && !(created.photos?.length)) showToast('照片过大，已忽略照片')
    await store.fetchList()
    showToast('保存成功')
    await nextTick()
    router.push('/inspect/list')
  } finally { submitting.value = false }
}
</script>

<style scoped>
.form{padding-bottom:86px}
.grp{margin-top:12px}
.grp-hd{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:700;color:var(--color-text);padding:0 22px 8px;position:relative}
.grp-hd::before{content:"";width:4px;height:16px;border-radius:2px;background:var(--color-primary);position:absolute;left:14px;top:2px}
.gi{width:18px;height:18px;color:var(--color-primary);display:inline-flex}
.gi :deep(svg){width:100%;height:100%}
.toggle{display:flex;gap:8px}
.toggle__btn{border:1px solid var(--color-line);background:#F4F8F4;color:var(--color-text-2);border-radius:16px;padding:5px 18px;font-size:13px;cursor:pointer}
.toggle__btn.on{background:var(--color-done-bg);border-color:var(--color-primary);color:var(--color-primary);font-weight:600}
.toggle__btn.bad{background:var(--color-undone-bg);border-color:var(--color-undone-fg);color:var(--color-undone-fg);font-weight:600}
.photos{padding:10px 26px 4px}
.photos__label{font-size:14px;color:var(--color-text-2);margin-bottom:8px}
.photos__tip{font-size:12px;color:var(--color-text-3)}
.duration{display:flex;align-items:center;gap:8px;width:100%}
.duration__input{flex:1;min-width:0;border:none;background:transparent;font-size:14px;color:var(--color-text);outline:none;text-align:right}
.duration__unit{display:flex;align-items:center;gap:3px;border:1px solid var(--color-line);border-radius:14px;background:#F4F8F4;padding:4px 10px;font-size:13px;color:var(--color-text-2);flex-shrink:0;cursor:pointer}
.du-arrow{width:12px;height:12px;display:inline-flex}
.du-arrow :deep(svg){width:100%;height:100%}
.form__bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:375px;padding:12px 16px;background:var(--color-card);border-top:1px solid var(--color-line);display:flex;gap:10px;z-index:20}
.btn-ghost{flex:1;border:1px solid var(--color-primary);border-radius:12px;background:#fff;color:var(--color-primary);font-size:16px;font-weight:600;padding:10px 0;cursor:pointer}
.btn-save{flex:2;border-radius:12px}
</style>
```

- [ ] **Step 3: 类型检查 + 构建**

Run: `corepack pnpm typecheck && corepack pnpm build`
Expected: 通过（Vant 组件自动按需引入，无需手工注册；若 `UploaderFileListItem` 类型导入报错，确认 `vant` 版本为 4.x 并从 `'vant'` 导入）

- [ ] **Step 4: 提交**

```bash
git add src/pages/InspectForm.vue src/router/index.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(page): inspect form"
```

---

### Task 7: 详情页

**Files:**
- Create: `src/pages/InspectDetail.vue`
- Modify: `src/router/index.ts`（+1 路由）

**Interfaces:**
- Consumes: `useInspectionStore.fetchOne` + `current`（Task 4）、`TopBar/Tag/DeviceSvg`、`showImagePreview`（vant）
- Produces: 路由 `/inspect/detail?id=xxx`（Task 5 列表卡片已指向它）

- [ ] **Step 1: 注册详情路由**

`src/router/index.ts` 在 `/inspect/form` 行之后插入：

```ts
  { path: '/inspect/detail', component: () => import('@/pages/InspectDetail.vue') },
```

- [ ] **Step 2: 创建详情页**

创建 `src/pages/InspectDetail.vue`：

```vue
<template>
  <div v-if="r" class="page page-detail">
    <TopBar title="点检详情" back @back="$router.push('/inspect/list')" />

    <div class="hero">
      <div class="hero-img"><DeviceSvg :kind="r.deviceSvg" /></div>
      <div class="hero-info">
        <div class="hn">{{ r.deviceName }}</div>
        <div class="hs"><span class="dc-chip">{{ r.deviceCode }}</span>{{ r.date }}</div>
      </div>
      <div class="hero-tags">
        <Tag :variant="r.status === '异常' ? 'undone' : 'done'">{{ r.status }}</Tag>
      </div>
    </div>

    <div class="card">
      <div class="card-head">点检信息</div>
      <div class="dcell"><span class="dl">点检日期</span><span class="dv">{{ r.date }}</span></div>
      <div class="dcell"><span class="dl">仪表检查</span><span class="dv" :class="cls(r.meterResult)">{{ r.meterResult }}</span></div>
      <div class="dcell"><span class="dl">车况检查</span><span class="dv" :class="cls(r.vehicleResult)">{{ r.vehicleResult }}</span></div>
      <div class="dcell"><span class="dl">车辆状态</span><span class="dv" :class="cls(r.vehicleStatus)">{{ r.vehicleStatus }}</span></div>
      <div v-if="r.note" class="dcell"><span class="dl">异常说明</span><span class="dv">{{ r.note }}</span></div>
    </div>

    <div class="card">
      <div class="card-head">人员及使用</div>
      <div class="dcell"><span class="dl">点检人员</span><span class="dv">{{ r.inspector }}</span></div>
      <div class="dcell"><span class="dl">使用人</span><span class="dv">{{ r.operator }}</span></div>
      <div class="dcell"><span class="dl">使用时长</span><span class="dv">{{ r.durationValue }} {{ r.durationUnit }}</span></div>
    </div>

    <div v-if="r.photos?.length" class="card">
      <div class="card-head">现场照片</div>
      <div class="pgrid">
        <img v-for="(p, i) in r.photos" :key="i" :src="p" class="pgrid__img" alt="现场照片" @click="preview(i)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showImagePreview } from 'vant'
import TopBar from '@/components/TopBar.vue'
import Tag from '@/components/Tag.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import { useInspectionStore } from '@/stores/inspection'
import type { CheckResult } from '@/types/inspection'

const route = useRoute()
const store = useInspectionStore()
const r = computed(() => store.current)

const cls = (v: CheckResult) => v === '异常' ? 'bad' : 'ok'

function preview(i: number) {
  showImagePreview({ images: r.value?.photos ?? [], startPosition: i, closeable: true })
}

onMounted(async () => {
  const id = route.query.id as string
  if (id) await store.fetchOne(id)
})
</script>

<style scoped>
.page-detail{padding-bottom:24px}
.hero{background:#fff;border:1px solid var(--color-line);border-radius:14px;margin:12px 14px 0;padding:14px;box-shadow:var(--shadow-card);display:flex;gap:12px;align-items:flex-start}
.hero-img{width:64px;height:64px;border-radius:12px;background:linear-gradient(160deg,#F2F9F3,#E2F1E6);border:1px solid #E4F0E6;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:4px}
.hero-info{flex:1;min-width:0}
.hn{font-size:17px;font-weight:800}
.hs{font-size:12px;color:var(--color-text-2);margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dc-chip{background:var(--color-chip-bg);color:var(--color-chip-fg);border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600}
.hero-tags{display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0}
.card{background:#fff;border:1px solid var(--color-line);border-radius:14px;margin:10px 14px 0;box-shadow:var(--shadow-card);overflow:hidden}
.card-head{display:flex;align-items:center;font-size:15px;font-weight:700;color:var(--color-text);padding:14px 14px 8px}
.card-head::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--color-primary);margin-right:8px;box-shadow:0 0 0 3px var(--color-done-bg)}
.dcell{display:flex;padding:13px 14px;border-bottom:1px solid #F2F6F2;font-size:14px}
.dcell:last-child{border-bottom:none}
.dl{width:96px;flex-shrink:0;color:var(--color-text-3)}
.dv{flex:1;text-align:right;color:var(--color-text);white-space:pre-line}
.dv.ok{color:var(--color-primary);font-weight:600}
.dv.bad{color:var(--color-undone-fg);font-weight:600}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px 14px 14px}
.pgrid__img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;border:1px solid var(--color-line);cursor:pointer}
</style>
```

- [ ] **Step 3: 类型检查 + 构建**

Run: `corepack pnpm typecheck && corepack pnpm build`
Expected: 通过

- [ ] **Step 4: 提交**

```bash
git add src/pages/InspectDetail.vue src/router/index.ts
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "feat(page): inspect detail"
```

---

### Task 8: 端到端验收 · 打包验证

**Files:**
- 无新增（仅验证；发现问题回到对应任务修复）

**Interfaces:**
- Consumes: 全部前序任务

- [ ] **Step 1: 全量单测 + 类型检查**

Run: `corepack pnpm test && corepack pnpm typecheck`
Expected: 全部 PASS

- [ ] **Step 2: mock 版构建并启动 preview**

```bash
VITE_USE_MOCK=1 corepack pnpm exec vite build
corepack pnpm exec vite preview --port 4173
```

（`import.meta.env` 构建期固化，必须带 env 重新 build 才有 mock；preview 单独跑不会启用 mock）

- [ ] **Step 3: 浏览器验收（browser-use MCP，地址 `http://localhost:4173/#/inspect/list`）**

逐条核对，全部通过才算完成：

**场景 1 · 列表**
- Tabbar「点检」或首页「点检记录」进入列表；Tabbar 点检高亮
- 6 条种子按日期倒序（09-17 → 09-03）；统计卡 本月 6 / 正常 4 / 异常 2
- tab 切换：全部 6 / 正常 4 / 异常 2（s2 旋耕机、s5 植保无人机）
- 搜索「拖拉」命中 s1；搜索「XGJ」命中 s2；搜索无结果出空态
- 「筛选」展开日期条：开始 2026-09-10 至 2026-09-16 → 剩 s2/s3/s4；重置恢复 6 条
- 卡片字段完整：日期、状态标签（s2/s5 红）、插画、编号、名称、仪表/车况、点检人/使用人/使用时长/车辆状态

**场景 2 · 新增**
- fab「＋」进表单；点检日期默认今天（2026-09-17）；点检人员默认「王强」
- 设备编号 picker 选「TR001 · 拖拉机」→ 设备名称带出「拖拉机」、使用人带出「张三」
- 手改使用人为「李四」后重选设备 → 使用人不被覆盖（ownerTouched 守卫）
- 直接保存（未选设备）→ toast「请选择设备编号」
- 选设备后把仪表检查切「异常」，异常说明留空保存 → toast「存在异常项，请填写异常说明」
- 填说明、使用时长填 `12.55` → toast「使用时长最多一位小数」；改 `12.5` 通过
- 选 3 张照片后第 4 张被 max-count 拦截；照片显示缩略图可删除
- 保存成功 → toast「保存成功」→ 回列表，新记录在最上方（日期今天+createdAt 最新）

**场景 3 · 详情**
- 点新记录进详情：hero（插画/名称/编号 chip/日期/状态标签）、点检信息、人员及使用、照片卡齐全
- 点照片 → 预览放大可关闭
- 点 s2（异常）：异常说明「油压表读数异常，待检修」显示，无操作按钮

**场景 4 · 持久化与回归**
- 刷新页面 → `lx_inspect_records_v1` 数据保持（新记录仍在）
- 保养模块回归：`/#/plan/list` 列表/筛选/新增/详情/标记完成正常
- Tabbar 维修/我的 仍 toast「功能建设中」

- [ ] **Step 4: 视觉走查**

对照参考图 2/3 与田园风规范截图核对：segment 胶囊选中态、统计卡三列、卡片 2×2 灰底格、fab 位置、表单三分组绿竖条头、双按钮 toggle 选中态（正常绿/异常红）、底部取消/保存记录双按钮（保存为绿渐变——`:root:root` Vant 主题已生效，按钮不得为蓝色）。

- [ ] **Step 5: 生产构建还原 + 泄漏检查 + 提交**

```bash
corepack pnpm build
grep -r "lx_inspect_records_v1" dist/ ; test $? -eq 1
grep -r "mockServiceWorker" dist/ ; test $? -eq 1
```

Expected: 两条 grep 均无命中（exit 1）；首屏 Gzip < 200KB。

```bash
git -c user.name="laoxiang-dev" -c user.email="dev@laoxiang.local" commit -m "chore(release): inspect e2e acceptance + build verification" --allow-empty
```

（本任务正常无代码变更；若有修复则把修复文件加入提交，不用 --allow-empty）

---

## Self-Review 记录

- **Spec 覆盖：** §3 数据模型→Task 1；§4 API→Task 2；§5 mock→Task 3；§6 store→Task 4；§7.1/7.2/7.3 三页→Task 5/6/7；§8 入口路由→Task 5（Tabbar/Home）+5/6/7（路由）；§9 文件清单一一对应；§10 测试四组→Task 1/3/4 + Task 8 浏览器验收；§11 错误处理→Task 3（quota 降级）+Task 6（压缩失败 toast）；§12 视觉→Task 5/6/7 样式 + Task 8 走查。
- **与 spec 的 2 处显式取舍（已在本计划内说明，不算偏差）：** (1) 路由按任务逐条注册而非一次三条，保证每个任务可独立构建；(2) 详情页异常标签用 `Tag variant="undone"`（浅红底红字）而非 overdue（深红底白字），与参考图一致，见 Global Constraints。
- **类型一致性：** `InspectPayload`、`deriveInspectStatus`、`validateInspect`、`inspectStorage`、`SEED_INSPECT_RECORDS`、`useInspectionStore`（filteredSortedList/monthStats/fetchList/fetchOne/create）、`useDictStore.loadUsageUnits` 在定义任务与消费任务间名称/签名一致；picker `selectedOptions` 事件形在 Task 6 统一定义 `PickerEvent`。
