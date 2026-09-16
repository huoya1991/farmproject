# 老乡农场 · 设备保养 H5 工程化设计（Vite + Vue 3 + TS + Vant 4 + MSW）

- 日期：2026-09-15
- 状态：分节设计已获用户批准，待用户审阅本规格文档
- 上游规格：`docs/superpowers/specs/2026-09-15-equipment-maintenance-h5-design.md`（一期功能与数据契约来源）
- 参考基线：`prototype/index.html`（迭代 3 田园风视觉、`items[]` 数据模型、`lx_maint_plans_v3` 命名空间）
- 目标：将单文件原型工程化为可长期维护的纯 H5 应用（供小程序 web-view 加载），业务功能与视觉不变，接口预留可无缝切真实后端

## 1. 目标与范围

**目标**

- 保留一期功能范围与迭代 3 田园风视觉（无功能回归、无视觉回归）。
- 建立可长期维护的目录、依赖、构建、Mock 与测试基础设施。
- 接口层按未来真实后端签名书写；Mock 只替换传输层。

**范围内**

- 保养计划四页闭环（首页 / 列表 / 表单 / 详情）。
- MSW 全量 Mock 后端；`localStorage` 命名空间保持 `lx_maint_plans_v3`。
- Vant 4 主题定制、CSS 变量与迭代 3 田园风视觉令牌落地。
- Vitest 关键单测 + `pnpm preview` 端到端手测。

**范围外**

- 点检 / 维修 / 配件三个功能的页面实现。
- 真实后端联调、生产登录中心接入、CI/CD 环境搭建、E2E 自动化。

## 2. 技术栈与关键决策

| 项 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite | 极速冷启、Rollup 生产打包、Vue 3 原生支持 |
| 框架 | Vue 3（Composition API） | 与原型迁移成本最低，社区生态成熟 |
| 语言 | TypeScript strict | 契约类型化，切换真实后端时接口签名即文档 |
| 路由 | vue-router hash 模式 | 与原型完全一致，web-view 深链最稳 |
| 状态 | Pinia | 官方推荐、SSR-friendly、体积轻 |
| UI 库 | Vant 4 | 移动端组件完备，中文文档友好，主题可 Less 变量覆盖 |
| Mock | MSW | Service Worker 层拦截真实 fetch，与后端切换零代码改动 |
| 测试 | Vitest + @vue/test-utils | 与 Vite 共享构建管道，配置最少 |
| 包管理 | pnpm | 磁盘友好，锁定文件语义清晰 |
| 目录 | 单体 SPA 平铺到根 | 一期只做保养计划，避免过度分层 |

## 3. 目录结构

```
4f4ebda4/
├─ package.json
├─ tsconfig.json / tsconfig.node.json
├─ vite.config.ts
├─ index.html
├─ .env.development
├─ .env.production
├─ public/
│  └─ mockServiceWorker.js
├─ src/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ router/index.ts
│  ├─ pages/
│  │  ├─ Home.vue          # #/home
│  │  ├─ PlanList.vue      # #/plan/list
│  │  ├─ PlanForm.vue      # #/plan/form?id=
│  │  └─ PlanDetail.vue    # #/plan/detail?id=
│  ├─ components/
│  │  ├─ TopBar.vue
│  │  ├─ Tabbar.vue
│  │  ├─ HomeSection.vue
│  │  ├─ HillsScene.vue      # 田园横幅 SVG 场景（首页/列表共用）
│  │  ├─ DeviceSvg.vue       # 按设备类型渲染农机插画
│  │  ├─ FilterBar.vue       # 列表筛选行（下拉 chip + 重置）
│  │  ├─ PlanCard.vue
│  │  ├─ ItemCard.vue
│  │  ├─ DeviceCombo.vue
│  │  ├─ EmptyState.vue
│  │  ├─ Tag.vue
│  │  └─ Chip.vue
│  ├─ api/
│  │  ├─ client.ts
│  │  ├─ maintPlan.ts
│  │  ├─ device.ts
│  │  ├─ dict.ts
│  │  └─ auth.ts
│  ├─ mock/
│  │  ├─ browser.ts
│  │  ├─ handlers.ts
│  │  ├─ seed.ts
│  │  └─ storage.ts
│  ├─ stores/
│  │  ├─ maintPlan.ts
│  │  ├─ device.ts
│  │  ├─ dict.ts
│  │  └─ auth.ts
│  ├─ types/
│  │  └─ maintPlan.ts
│  ├─ utils/
│  │  ├─ date.ts
│  │  ├─ validate.ts
│  │  └─ auth.ts
│  └─ styles/
│     ├─ tokens.css
│     ├─ vant-theme.less
│     └─ base.css
├─ prototype/               # 保留作为视觉/交互参考
├─ docs/
└─ shots/
```

## 4. 路由与 Hash 兼容

`createRouter({ history: createWebHashHistory('/') })`，路径与原型完全对齐。

| path | 组件 | query | 备注 |
|---|---|---|---|
| `/` | 重定向 → `/home` | — | 兜底 |
| `/home` | `Home.vue` | — | 首页四分区 + 底部 tabbar |
| `/plan/list` | `PlanList.vue` | — | 搜索/筛选/排序/逾期 |
| `/plan/form` | `PlanForm.vue` | `id?` | 有 `id` 编辑、无 `id` 新增 |
| `/plan/detail` | `PlanDetail.vue` | `id` | 缺失自动回列表 |
| `*` | 重定向 → `/home` | — | 未知 hash 兜底 |

**行为约定**

- `PlanForm.vue` 用 `onBeforeRouteLeave` 拦截未保存变更弹 `Dialog`。
- 点检 / 维修 / 配件三个入口不进路由，`Home.vue` 中 `@click` 直接 `showToast('功能建设中')`。
- 底部 tabbar 为「首页 / 设备 / 点检 / 维修 / 我的」：首页 → `/home`、设备 → `/plan/list` 可跳转；点检 / 维修 / 我的 toast「功能建设中」。
- 全局 `scrollBehavior: () => ({ top: 0 })`，规避 web-view 里 hash 切换保留滚动位置。

**web-view 集成桩**（`src/utils/auth.ts`）

- 应用挂载前调用 `bootstrapAuth()`：从 `location.href` 里读 `?ticket=` → `POST /api/auth/exchange` → 写入 `localStorage.lx_token` 与 `lx_user`。
- 已有 token 则跳过；纯浏览器双击运行时默认用户「王强」。
- 401 时 `apiClient` 触发 `auth-expired` 事件，`App.vue` 弹 Dialog 提示重新从小程序进入。

## 5. 数据契约与 API 层

### 5.1 类型（`src/types/maintPlan.ts`）

```ts
export type PlanStatus = 'undone' | 'done'
export type CycleUnit = string   // 运行时按 dict 校验

export interface MaintItem {
  content: string
  cycleValue: number             // >= 1 整数
  cycleUnit: CycleUnit
  nextDate: string               // yyyy-MM-dd
}

export interface Plan {
  id: string
  deviceId: string | null
  deviceName: string
  deviceCode: string
  modelSpec: string
  usage: string
  items: MaintItem[]             // 至少 1 条
  thisDate: string
  owner: string
  status: PlanStatus
  createdAt: string
  updatedAt: string
}

export interface PlanListItem extends Plan {
  planNextDate: string           // 服务端派生：min(items[].nextDate)
  overdue: boolean               // 服务端派生
  deviceType?: string            // 服务端按 deviceId/deviceCode 关联台账带出（列表类型筛选）
  deviceSvg?: string             // 同上：农机插画键（列表/详情卡片插画）
}

export interface PlanDetail extends PlanListItem {
  lastDate: string | null        // 同 deviceCode 其他记录 thisDate 最大值
}

export interface Device {
  id: string
  name: string
  code: string
  model: string
  usage: string
  owner: string
  type: string                   // 设备类型（迭代 3：列表筛选项）
  svg: string                    // 插画键（迭代 3：映射 DeviceSvg 内联插画）
  photo?: string
}

export interface DictItem { value: string; label: string; sort: number }
```

### 5.2 接口清单

统一返回 `{ code:0, data, msg }`；`code !== 0` 抛 `ApiError`。

| 方法 | 路径 | 说明 |
|---|---|---|
| `getDict(type)` | `GET /api/dict/:type` | 字典（一期用 `maint_cycle_unit`） |
| `searchDevice(keyword)` | `GET /api/device?keyword=` | 台账联动查询，最多 8 条 |
| `listPlans(params)` | `GET /api/maint-plan?keyword=&status=` | 列表，元素为 `PlanListItem` |
| `getPlan(id)` | `GET /api/maint-plan/:id` | 详情，含 `lastDate` |
| `createPlan(payload)` | `POST /api/maint-plan` | 请求体 = `Plan` 去 `id/createdAt/updatedAt` |
| `updatePlan(id, payload)` | `PUT /api/maint-plan/:id` | 同上 |
| `markComplete(id)` | `PUT /api/maint-plan/:id/status` | 请求体 `{ status:'done' }` |
| `exchangeTicket(ticket)` | `POST /api/auth/exchange` | 返回 `{ token, user }` |

### 5.3 apiClient（`src/api/client.ts`）

- 基于 `fetch` + `AbortController`，默认 10 s 超时。
- 请求头：`Authorization: Bearer <token>`（若存在）、`Content-Type: application/json`、`X-Client: h5-maintenance`。
- 错误：
  - `HTTP 401` → 触发 `emit('auth-expired')`
  - `code !== 0` → 抛 `ApiError(code, msg)`
  - HTTP 5xx / 网络错误 → 抛 `NetworkError`，页面层统一 `showFailToast(err.message)`
- 开发环境打请求/响应日志。

### 5.4 校验与派生归属

- 客户端校验（`utils/validate.ts`）：必填、`cycleValue >=1` 整数、`item.nextDate > plan.thisDate`；错误信息带「第 N 项」，滚动定位到对应 `ItemCard`。
- 服务端派生字段（`planNextDate`、`overdue`、`lastDate`）由 MSW handler 计算，作为契约一部分；前端不再重算。

## 6. 状态管理与本地缓存

**Pinia 只做页面级缓存与共享入口，不做本地持久化**。所有持久化都收敛到 `mock/storage.ts`。

`useMaintPlanStore`
- state：`list`、`detailCache`、`filter { keyword, status, type, owner }`（对应迭代 3 筛选行：搜索框 + 设备类型/保养完成情况/负责人三枚下拉 chip）、`loading`
- actions：`fetchList / fetchDetail / create / update / markComplete`
- getters：`filteredSortedList` —— 关键字（deviceName/deviceCode 包含）+ status/type/owner 过滤（type 比对 `deviceType`）；未完成在前按 `planNextDate` 升序；已完成在后按 `thisDate` 降序。`typeOptions / ownerOptions` 由设备台账去重生成。
- 写操作后乐观刷新 `list` 与 `detailCache`。

`useDeviceStore`
- state：`suggestions`、`inflight`
- actions：`search(keyword)`，去抖 200 ms，切换关键字 abort 上一请求。

`useDictStore`
- state：`cycleUnits`、`loaded`
- actions：`ensureLoaded()`，仅内存会话缓存，不落地。

`useAuthStore`
- state：`{ token, user }`
- 由 `bootstrapAuth()` 在挂载前填充。

**MSW 与 localStorage**（`src/mock/storage.ts`）

- 键：`lx_maint_plans_v3`（沿用原型，本地已有数据自动认领）。
- 启动 `seedIfEmpty(seed)`：仅在键不存在时写入种子（6 条，与原型一致：每台设备 1 条、含 1 条逾期的植保无人机、3 项保养项的拖拉机样例、2 条已完成；日期以 2026 年为基准）。
- 生产构建 `VITE_USE_MOCK !== '1'`，`main.ts` 里动态 `import('./mock/browser')` 不触发，MSW 与 seed tree-shake 掉。

## 7. 样式令牌与 Vant 主题

### 7.1 `src/styles/tokens.css`

```css
:root {
  --brand: #1FA14A;
  --brand-dark: #157A38;
  --brand-xdark: #0F5E2C;

  --success: #1FA14A;
  --warning: #E64A40;
  --danger: #D93025;

  --bg-page: #F2F7F3;
  --bg-card: #FFFFFF;
  --text-primary: #1E2B22;
  --text-secondary: #5C6B60;
  --text-tertiary: #93A297;

  --chip-brand-bg: #E3F3E8;
  --chip-brand-fg: #1FA14A;
  --tag-done-bg: #E3F3E8;   --tag-done-fg: #1FA14A;
  --tag-undone-bg: #FDECEA; --tag-undone-fg: #E64A40;
  --tag-late-bg: #D93025;   --tag-late-fg: #FFFFFF;

  --radius-card: 14px;
  --radius-btn: 12px;
  --shadow-card: 0 4px 14px rgba(30,80,50,.07);
  --divider: #E9F0EA;

  --page-max: 375px;
  --form-label-w: 96px;
}
```

田园风补充资产（随组件落地，不进 tokens）：

- `HillsScene.vue`：浅绿天空渐变 + 太阳 `#FFF3C4` + 云朵 + 三层山丘 `#A9DCB4 / #8AD09C / #6FC385` + 红顶农舍 `#E0644A / #FFF7EC` + 树木（内联 SVG，首页/列表横幅共用）。
- `DeviceSvg.vue`：拖拉机（绿车身黄轮）/ 联合收割机（红机身+割台锯齿+卸粮管）/ 旋耕机（红机体+旋耕刀组）/ 水泵（蓝蜗壳+散热电机）/ 撒肥机（绿料斗+撒播盘）/ 植保无人机（四旋翼+红机身+白药箱）；卡片 64px 圆角浅绿底（`#F2F9F3→#E2F1E6`）内展示。
- 主按钮渐变 `linear-gradient(135deg,#1FA14A,#0F5E2C)`；列表卡片三列统计（时钟/日历图标 + 上标签下数值），逾期数值红 `#D93025`。

### 7.2 `src/styles/vant-theme.less`（通过 `preprocessorOptions.less.additionalData` 注入）

```less
@van-primary-color: #1FA14A;
@van-success-color: #1FA14A;
@van-warning-color: #E64A40;
@van-danger-color:  #D93025;
@van-background:    #F2F7F3;
@van-nav-bar-background:  #FFFFFF;
@van-nav-bar-icon-color:  #1E2B22;
@van-nav-bar-title-text-color: #1E2B22;
@van-button-primary-background: linear-gradient(135deg,#1FA14A,#0F5E2C);
@van-button-primary-border-color: transparent;
@van-cell-vertical-padding: 12px;
@van-field-label-width: 96px;
```

### 7.3 排版与安全区

- 字体：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`；正文 14 px、辅助 12 px、卡标题 15 px 加粗。
- 坚持 px + 375 画布，不使用 rem。
- Tabbar 与表单/详情底部按钮条使用 `padding-bottom: calc(<base> + env(safe-area-inset-bottom))`（迭代 3 已取消悬浮 FAB，新增入口在列表横幅右上「新增」胶囊钮）。

### 7.4 按需引入

- `unplugin-vue-components` + `VantResolver` 自动 import 组件与样式。
- `Toast` / `Dialog` 使用 Vant 官方推荐的按需导入方式，避免全量样式。

## 8. 构建、Mock 切换、测试与验收

### 8.1 环境变量

| 变量 | dev | preview | prod |
|---|---|---|---|
| `VITE_USE_MOCK` | 1 | 1（可关） | 0 |
| `VITE_API_BASE` | `/api` | `/api` | `https://<占位>/api` |
| `VITE_APP_TITLE` | 老乡农场（开发） | — | 老乡农场 |

`main.ts` 顶部：

```ts
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== '1') return
  const { worker } = await import('./mock/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
enableMocking().then(async () => {
  await bootstrapAuth()
  createApp(App).use(router).use(pinia).mount('#app')
})
```

### 8.2 构建目标

- `pnpm build` → `dist/`（供 web-view 或 Nginx 静态托管）。
- `vite.config.ts`：`base: './'`，保证 web-view 任意路径下均可加载资源。
- 首屏 Gzip 目标 < 200 KB。

### 8.3 测试策略（一期只做关键单测）

| 目标 | 用例 |
|---|---|
| `utils/date.ts` | `planNextDate` 返回最小值；`isOverdue` 语义正确；`cycleText` 格式 |
| `utils/validate.ts` | 缺字段/周期非法/nextDate <= thisDate 均返回带「第 N 项」错误定位 |
| `stores/maintPlan` | `filteredSortedList` 排序符合规格 |
| `api/client` | 401 触发 `auth-expired`；`code !== 0` 抛 `ApiError` |
| `mock/handlers` | 创建后可查、`markComplete` 后 `status` 与 `overdue` 重算 |

### 8.4 浏览器验收清单（与设计文档 §7 一致）

1. 首页田园横幅（品牌/天气/拖拉机插画）+「设备保养」分区 4 图标；「保养计划」与 tabbar「设备」均可进入列表，其余 toast「功能建设中」。
2. 列表：hero 横幅（返回/标题/新增胶囊钮）、搜索、三枚筛选 chip（设备类型/保养完成情况/负责人）下拉过滤与「筛选」重置、逾期标签、按最早 `nextDate` 排序；卡片含设备 SVG 插画、编号 chip、共 N 项与三列统计（保养周期/上次保养/下次保养）；底部「共 N 条记录」；空态 🌱 引导。
3. 新增：横幅「新增」进入表单；设备名称/编号联动候选、选中后自动带出字段、上次保养提示正确。
4. 保养项添加/删除（≥1 不可删）、每项独立字段。
5. 表单校验：命中「第 N 项」错误滚动定位、toast 提示。
6. 保存回列表可见；详情 hero 卡 + 按编号卡片展示每项；标记完成二次确认后状态变更。
7. 编辑回显（上次保养提示排除自身记录）；刷新后 `localStorage` 数据保持（`lx_maint_plans_v3`）。
8. `?ticket=xxx` 时 `bootstrapAuth` 走通并写入 `lx_token`；接口带 Bearer 头。

### 8.5 `package.json` 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## 9. 迁移与回滚

- **迁移**：不改动 `prototype/index.html`；工程化产物完全独立。上线切换只需将 web-view URL 从原型 HTML 换为 `dist/index.html` 的托管路径。
- **数据兼容**：`localStorage.lx_maint_plans_v3` 与原型共用，用户在原型建立的数据在工程化版本可直接读到。
- **回滚**：如需临时回退，恢复原型 URL 即可，无数据丢失。

## 10. 后续迭代

- 点检 / 维修 / 配件三个功能页面（按需求单字段表补齐）。
- 设备管理台账 UI。
- 后台字典配置界面。
- 真实后端接口与登录中心接入，切换 `VITE_USE_MOCK=0`。
- E2E 自动化（Playwright）与 CI/CD。
- 若未来引入更多子模块，重构为 `features/` 分层或 pnpm workspaces。
