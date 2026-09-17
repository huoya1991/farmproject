# 点检记录模块 · 设计文档

日期：2026-09-17
状态：已批准方案 A（平行模块，模式复用）
前置：老乡农场设备保养 H5 工程化版本（规格 `2026-09-15-equipment-maintenance-h5-engineering.md`）已验收

## 1. 背景与目标

老乡农场小程序「设备保养」模块二期功能：**点检记录**。农场人员在移动端录入设备点检信息，含列表浏览（状态 tab + 搜索 + 本月统计）、新增录入（三段分组表单）、只读详情（含现场照片回显）。

需求源：需求文档点检记录字段表（9 列，均必填）+ 用户提供的列表/表单 UI 参考图（田园绿风格，与现有工程视觉体系一致）。

**需求原文要点：**
- 农场人员在移动端都能录入设备点检信息
- 点检人员 = 当前录入人员；使用人 = 设备负责人
- 使用时长单位：小时、天、公里，支持在后台数据库配置
- 仪表和车况标记是否异常；字段表 9 列都是必填

**字段表（9 列必填）：** 日期、设备编号、设备名称、仪表检查、使用时长、车况检查、点检人员、使用人、车辆状态

## 2. 范围

**做：**
- 点检记录列表页（全部/正常/异常 tab、搜索、日期范围筛选、本月统计卡、记录卡片、浮动新增按钮）
- 新增点检记录表单页（三段分组卡片、九项必填校验、条件必填异常说明、现场照片选图/预览/压缩存储）
- 点检记录只读详情页（含照片回显）
- 入口打通：Tabbar「点检」、首页「点检记录」图标 → 列表
- 类型 / API / MSW mock（种子+端点）/ Pinia store / 字典扩展 / 单测

**不做（本期）：**
- 编辑与删除（UI 参考图无入口；详情只读）
- 真实上传与后端联调（mock 模式 dataURL 存储；真实模式接口契约已就绪）
- 维修记录、设备配件模块
- 点检提醒/定时任务

**与 UI 参考图的偏差（以现有工程为准）：**
1. 底部 tabbar 保持现有 **5 个**（首页/设备/点检/维修/我的）；参考图列表页为 4 个，仅示意
2. 表单页右上角的「保存」不实现，以底部「取消 / 保存记录」双按钮为准
3. 参考图设备编号格式（SB-2026-018）为示意，实际使用现有 6 台设备台账编号（TR001 等）
4. 统计卡「本月点检 28 / 正常 25 / 异常 3」为示意数字，实际由种子/记录实时计算

## 3. 数据模型（`src/types/inspection.ts`）

```ts
export type CheckResult = '正常' | '异常'

export interface InspectRecord {
  id: string
  date: string              // 点检日期 YYYY-MM-DD
  deviceCode: string        // 设备编号（picker 选择）
  deviceName: string        // 设备名称（选编号后带出，快照存储）
  meterResult: CheckResult  // 仪表检查
  vehicleResult: CheckResult // 车况检查
  vehicleStatus: CheckResult // 车辆状态（选项仅 正常/异常，已确认）
  durationValue: number     // 使用时长数值（>0）
  durationUnit: string      // 使用时长单位（字典 usage_duration_unit）
  inspector: string         // 点检人员（默认当前登录用户，可编辑）
  operator: string          // 使用人（选设备后带出负责人，可改）
  note?: string             // 异常说明（任一异常时必填，≤200 字）
  photos?: string[]         // 现场照片 dataURL（≤3 张，每张压缩 ≤~200KB）
  createdAt: number         // 创建时间戳（排序tie-break）
}

export interface InspectRecordDerived extends InspectRecord {
  status: CheckResult       // 派生：三项任一异常 → 异常
  deviceSvg?: string        // 联表 DEVICES 注入插画 kind
}
```

**派生规则：** `status = (meterResult==='异常' || vehicleResult==='异常' || vehicleStatus==='异常') ? '异常' : '正常'`

**快照语义：** deviceName/operator 随记录保存快照（与保养计划一致——设备台账日后改名不影响历史记录）。

## 4. API 契约（`src/api/inspection.ts`）

| 方法 | 端点 | 说明 |
|---|---|---|
| `listInspectRecords()` | `GET /api/inspect-records` | 返回 `InspectRecordDerived[]`（mock 联表注入 deviceSvg；过滤/统计在前端 store，与保养模式一致） |
| `getInspectRecord(id)` | `GET /api/inspect-records/:id` | 单条（详情页） |
| `createInspectRecord(payload)` | `POST /api/inspect-records` | 新增；payload 为 Omit\<InspectRecord,'id'|'createdAt'\> |

字典扩展：`GET /api/dict/usage_duration_unit` → `['小时','天','公里']`（独立于 maint_cycle_unit，语义不同字段，后台可分别配置）。

## 5. MSW mock（`src/mock/`）

**存储键：** `lx_inspect_records_v1`（`src/mock/inspectStorage.ts`，模式同 plans storage）

**种子数据**（`src/mock/inspectSeed.ts`）：6 条本月（2026-09）记录，覆盖现有 6 台设备，含 2 条异常：

| id | date | 设备 | 仪表 | 车况 | 车辆状态 | 时长 | 点检人 | 使用人 | note |
|---|---|---|---|---|---|---|---|---|---|
| s1 | 2026-09-17 | TR001 拖拉机 | 正常 | 正常 | 正常 | 128.5 小时 | 王强 | 张三 | — |
| s2 | 2026-09-16 | XGJ003 旋耕机 | 异常 | 异常 | 异常 | 86 小时 | 李四 | 王五 | 油压表读数异常，待检修 |
| s3 | 2026-09-15 | LHS002 联合收割机 | 正常 | 正常 | 正常 | 215 公里 | 王强 | 李四 | — |
| s4 | 2026-09-12 | SB004 水泵 | 正常 | 正常 | 正常 | 40 小时 | 赵六 | 赵六 | — |
| s5 | 2026-09-08 | UAV006 植保无人机 | 异常 | 正常 | 异常 | 12 小时 | 王强 | 王强 | 电量显示跳变 |
| s6 | 2026-09-03 | SFJ005 撒肥机 | 正常 | 正常 | 正常 | 60 公里 | 陈七 | 陈七 | — |

统计效果：本月 6 条 / 正常 4 / 异常 2。

**handlers**（并入现有 `handlers.ts`，与保养端点同文件）：
- `GET /api/inspect-records`：读 storage（空则播种），withDerived 注入 status + deviceSvg（deviceCode 联表）
- `GET /api/inspect-records/:id`：单条，404 兜底
- `POST /api/inspect-records`：生成 `id='ir_'+ts`、`createdAt`，unshift 入 storage，返回新记录
- dict `:type === 'usage_duration_unit'` 分支

**main.ts 无需改动**（MSW 启动逻辑已有，handlers 注册合并即可）。

## 6. Pinia store（`src/stores/inspection.ts`）

```ts
state: {
  list: InspectRecordDerived[]
  current: InspectRecordDerived | null
  keyword: string                       // 设备名称/编号
  statusTab: 'all' | '正常' | '异常'     // 顶部 tab
  dateFrom: string | null               // 筛选：日期范围
  dateTo: string | null
}
getters: {
  filteredSortedList  // tab 过滤 → keyword 命中（name/code）→ 日期范围 → 按 date desc + createdAt desc
  monthStats          // 当前自然月：{ total, normal, abnormal }（基于全量 list，不受筛选影响）
}
actions: { fetchList, fetchOne, create }
```

使用时长单位字典不进 inspection store——扩展现有 `dict.ts`：`state +usageUnits: string[]`、`action +loadUsageUnits()`（读 `usage_duration_unit`，带缓存，与 `cycleUnits/loadCycleUnits` 同模式），表单页直接使用 dict store。

## 7. 页面设计

### 7.1 列表页 `src/pages/InspectList.vue`

参照图 2，复用田园风令牌与组件：

- **TopBar**：标题「点检记录」，返回 → `/home`
- **状态 tab**：全部 / 正常 / 异常（绿色胶囊选中态，自建 segment，样式照图；不用 vant tabs 以便完全贴合参考图圆角胶囊样式）
- **搜索行**：输入框 placeholder「设备名称/编号」+ 右侧「筛选」按钮（漏斗图标）；点击展开/收起日期范围条（开始日期、结束日期两个 date input + 重置）
- **统计卡**：三列——本月点检 N（绿 + clipboard 图标）/ 正常 N（绿 + ✓）/ 异常 N（红 + !）；数据来自 monthStats
- **记录卡片**（点击 → 详情）：
  - 顶行：📅 date + 右侧状态标签（正常绿底 / 异常红底）
  - 主区：左侧设备插画（DeviceSvg，联表 kind）、右侧两行「设备编号 code / 设备名称 name」
  - 结果行：仪表检查结果（正常绿字/异常红字）| 车况检查结果（同），中缝竖线分隔
  - 底行（2×2 灰底格）：点检人 / 使用人 / 使用时长（值+单位）/ 车辆状态
  - 右侧「>」箭头
- **浮动新增**：右下绿色圆形「＋」→ `/inspect/form`
- **Tabbar**：active="inspect"
- 空态：复用 EmptyState（🌱暂无点检记录，点击右下角「＋」录入）

### 7.2 表单页 `src/pages/InspectForm.vue`

参照图 3，三段分组卡片（分组头：绿竖条 + 图标 + 标题 + 田园插画背景，风格对齐保养表单分组头）：

**分组 1 · 设备信息**
- 点检日期 *：date input，默认今天
- 设备编号 *：van-picker 弹层（6 台设备，列显示 `编号 · 名称`）
- 设备名称 *：只读，选编号后带出（未选时 placeholder「选择编号后自动带出」）

**分组 2 · 点检信息**
- 仪表检查 *：双按钮 toggle（正常[选中绿底✓] / 异常），默认正常
- 车况检查 *：同上，默认正常
- 车辆状态 *：下拉（正常/异常）
- 异常说明：textarea，≤200 字带计数；**任一异常时必填**（校验规则）
- 现场照片：van-uploader（accept image/*，≤3 张）；选图后 canvas 压缩（max 边 1280px，JPEG 0.8）转 dataURL 存 draft；可删除重选

**分组 3 · 人员及使用信息**
- 点检人员 *：默认当前登录用户姓名（mock：王强），可编辑
- 使用人 *：下拉（候选 = 设备台账去重 owner 列表）；选中设备后自动带出该设备 owner，用户手改后不再覆盖（ownerTouched 守卫，同保养表单模式）
- 使用时长 *：数字输入（>0，支持一位小数）+ 单位下拉（usage_duration_unit 字典）

**底部按钮**：取消（绿描边，返回列表）/ 保存记录（绿渐变主钮）

**校验**（`validateInspect`，返回首个错误 toast）：
- 9 项必填：date / deviceCode / deviceName / meterResult / vehicleResult / vehicleStatus / durationValue / inspector / operator
- durationValue > 0
- 任一异常 → note 必填；note ≤200 字
- photos ≤3

保存成功 → toast「保存成功」→ fetchList → 跳 `/inspect/list`。

### 7.3 详情页 `src/pages/InspectDetail.vue`

只读，参照保养详情结构：
- **hero 卡**：设备插画 + 设备名称 + 编号 chip + 日期 + 状态标签（正常/异常）
- **点检信息卡**：点检日期 / 仪表检查 / 车况检查 / 车辆状态 / 异常说明（有则显示）
- **人员及使用卡**：点检人员 / 使用人 / 使用时长
- **现场照片卡**（photos 非空时）：缩略图网格，点击 van-image-preview 放大
- 无操作按钮（本期只读）

## 8. 入口与路由

**路由新增（`router/index.ts`）：**
```ts
{ path: '/inspect/list',   component: () => import('@/pages/InspectList.vue') }
{ path: '/inspect/form',   component: () => import('@/pages/InspectForm.vue') }
{ path: '/inspect/detail', component: () => import('@/pages/InspectDetail.vue') }
```
详情页记录 id 经 query 传递（`/inspect/detail?id=xxx`，与 `/plan/detail` 一致）。

**入口打通：**
- `Tabbar.vue`：点检 tab `router.push('/inspect/list')`（替换 toast）
- `Home.vue`：「点检记录」图标 → `/inspect/list`（移除 toast 配置）；「维修记录」「设备配件」保持 toast「功能建设中」

## 9. 文件清单

**新增：**
- `src/types/inspection.ts`
- `src/api/inspection.ts`
- `src/stores/inspection.ts`
- `src/mock/inspectStorage.ts`、`src/mock/inspectSeed.ts`（handlers 扩展现有 `handlers.ts`）
- `src/utils/validateInspect.ts`（独立文件，与 validate.ts 平级）
- `src/pages/InspectList.vue`、`InspectForm.vue`、`InspectDetail.vue`
- `src/__tests__/inspectValidate.spec.ts`、`inspectStore.spec.ts`、`inspectHandlers.spec.ts`

**修改：**
- `src/router/index.ts`（+3 路由）
- `src/components/Tabbar.vue`（点检跳路由）
- `src/pages/Home.vue`（点检记录入口跳路由）
- `src/mock/handlers.ts`（+3 端点 +dict 分支）
- `src/stores/dict.ts`（+usageUnits state、+loadUsageUnits action，与 cycleUnits 同模式）

## 10. 测试与验收

**单测（Vitest，TDD）：**
1. derive：`status` 派生（全正常→正常；任一异常→异常 ×3 组合）
2. validate：9 项必填逐项缺失拦截；durationValue ≤0 拦截；异常无 note 拦截；正常无 note 放行；note >200 字拦截
3. mock handlers：列表播种 6 条且派生字段齐全；POST 后列表 +1 且持久化 storage；:id 命中/404；dict usage_duration_unit
4. store：tab 过滤、keyword 命中、日期范围、排序（date desc）、monthStats 计算

**浏览器验收（mock 模式）：**
1. Tabbar/首页入口进列表：6 条种子、tab 过滤（全部 6/正常 4/异常 2）、统计卡 6/4/2、搜索命中与空态、日期范围筛选+重置
2. 新增：编号 picker 选 TR001 → 名称/使用人自动带出；点检人默认王强；三项异常 → 异常说明空保存被拦截；选图 3 张第 4 张拦截；保存成功回列表首条可见
3. 详情：字段完整、状态标签正确、照片可预览
4. 刷新后 `lx_inspect_records_v1` 数据保持；保养模块回归无影响

**工程验证：** `pnpm test`、`pnpm typecheck`、`pnpm build`（mock 不进包检查）、视觉对齐参考图 2/3。

## 11. 错误处理

- 校验失败：toast 首条错误（与保养一致，红色错误文案定位到分组）
- 照片读取/压缩失败：toast「照片处理失败，请重试」，不阻断其他字段
- localStorage 写入超限（照片体积）：压缩后仍超限时 toast「照片过大，已忽略第 N 张」，仅保存可容纳照片
- API 异常：复用 apiClient 的 ApiError/401 链路

## 12. 视觉规范

沿用既有田园风令牌（`tokens.css`）：主色 #1FA14A/#157A38/#0F5E2C、底 #F2F7F3；异常红 #E64A40/#FDECEA；状态标签复用 Tag 组件（新增 'abnormal' variant 或复用 overdue 红）；分组卡头绿竖条 + 插画背景与保养表单分组头同源；卡片圆角 14px、阴影 var(--shadow-card)。SVG 资产复用 ICONS/DeviceSvg，不新增插画。
