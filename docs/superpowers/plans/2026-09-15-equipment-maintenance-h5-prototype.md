# 设备保养 H5 原型（一期·保养计划）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 产出单文件可运行 H5 高保真原型：首页设备保养入口 + 保养计划列表/新增编辑/详情闭环，复刻老乡农场小程序视觉风格。

**Architecture:** 单文件 `prototype/index.html`（原生 HTML/CSS/JS + hash 路由 + 4 个视图渲染函数）；mock 台账与字典常量 + localStorage 持久化；无外部依赖。

**Tech Stack:** 原生 HTML5 / CSS3 / ES6（无框架、无构建）；验证用 browser-use MCP 浏览器实测。

**Spec:** `docs/superpowers/specs/2026-09-15-equipment-maintenance-h5-design.md`

## Global Constraints

- 画布 375px 宽（`.phone` 容器居中，max-width:375px）；页面背景 #F4F6F5。
- 主色 #07C160；深绿 #00A650（分区方块/tab 选中）；首页头部渐变 #D8EFD9→#A9D8AE。
- 图标圆 52px 渐变：橙 #FBAE3C→#F2711C、绿 #4CD964→#0BA43E、蓝 #58B7E8→#1E78C8、紫 #9B8CE8→#6C5CE7；设备保养四图标依次橙/绿/蓝/紫，字形 保/点/修/配。
- 标签色：已完成 底#E8F7EC 字#07C160；未完成 底#FFF3E5 字#F2711C；已逾期 底#FDEAEA 字#E64340。
- 卡片白底圆角 12px 阴影 0 2px 8px rgba(0,0,0,.04)；正文 14px、辅助 12px；字体 -apple-system/PingFang SC/Microsoft YaHei。
- localStorage key：`lx_maint_plans`；字典常量 `SYS_DICT.maint_cycle_unit = ['小时','天','公里']`；当前用户 `CURRENT_USER='王强'`。
- 表单 10 字段全必填；日期 yyyy-MM-dd；下次保养时间必须晚于本次；保养内容 ≥1 条且每条非空；周期值 ≥1 整数。
- 上次保养时间派生不存储；本期无删除功能；点检/维修/配件点击 toast「功能建设中」。

---

### Task 1: 骨架、数据层与路由

**Files:**
- Create: `prototype/index.html`

**Interfaces:**
- Produces（后续任务全部依赖）:
  - 常量 `SYS_DICT`、`CURRENT_USER`、`DEVICES`（6 条：字段 id/name/code/model/usage/owner/photo）、`LS_KEY='lx_maint_plans'`
  - `loadPlans():Plan[]`、`savePlans(arr):void`、`seedIfEmpty():void`（预置 P1/P2/P3，见下）
  - `todayStr():'YYYY-MM-DD'`、`lastMaintDate(code, excludeId):string|null`（同 deviceCode 其他记录 thisDate 最大值）、`isOverdue(p):boolean`（undone 且 nextDate<today）、`cycleText(p):'每 N 单位'`
  - 路由：`hashchange` → `render()`；`''|#/home`→viewHome，`#/plan/list`→viewList，`#/plan/form[?id=]`→viewForm，`#/plan/detail?id=`→viewDetail；视图函数返回 HTML 注入 `#app` 后调用各自 `bind*()`
  - `toast(msg)`；CSS 类契约：`.navbar .card .cell .cell-label .req .tag .tag-done .tag-undone .tag-overdue .fab .tabbar .tabbar .on .section-title .icon-grid .icon-circle .g-orange .g-green .g-blue .g-purple .dropdown .hint-bar .content-row .btn-primary .seg .seg-item .on .err .page`
  - Plan 结构：`{id,deviceId,deviceName,deviceCode,modelSpec,usage,cycleValue,cycleUnit,contents[],thisDate,nextDate,owner,status:'undone'|'done',createdAt,updatedAt}`

种子数据（today=2026-09-15 语境）：
- P1：SB-001 轮式拖拉机 LX904 耕地整地，500 小时，contents['更换发动机机油','清洁/更换空气滤清器','检查轮胎气压与螺栓紧固']，thisDate 2026-03-02，nextDate 2026-09-10，owner 王强，undone（逾期样例）
- P2：SB-003 植保无人机 3WWDZ-16 喷洒农药，30 天，contents['检查桨叶与电机','校准喷洒流量']，thisDate 2026-08-20，nextDate 2026-09-19，owner 王强，undone
- P3：SB-002 谷轮收割机 4LZ-5 小麦/水稻收获，90 天，contents['更换割台链条润滑油','检查脱粒滚筒间隙']，thisDate 2026-08-01，nextDate 2026-10-30，owner 李建国，done

- [ ] **Step 1: 写 index.html 骨架**：`<meta viewport width=device-width>`、`.phone` 容器、`#app`、`#toast`、全局 CSS（含 Global Constraints 全部色值/类）、上述常量与数据层函数、路由与 `toast()`；四个视图函数先返回占位 `<div class="page">viewName</div>`。
- [ ] **Step 2: 浏览器验证**：browser-use `navigate_page` 打开 `file:///C:/Users/DELL/Documents/Qoder/2026-09-15/4f4ebda4/prototype/index.html`；`list_console_messages` 无报错；改 hash 到四个路由均渲染占位。
- [ ] **Step 3: 提交**（工作区非 git，跳过 commit，以文件保存为准）。

### Task 2: 首页视图 viewHome

**Files:** Modify: `prototype/index.html`

**Interfaces:** Consumes Task1 路由/类契约；Produces `viewHome()+bindHome()`：图标 `data-route` 属性驱动跳转，`data-toast` 驱动提示。

- [ ] **Step 1: 实现 viewHome**：绿色渐变头（模拟状态栏+胶囊按钮）→ 统计卡（田块总数量 534块/14796亩、当前种植面积 33.1%/4904亩、种植作物 5作物/5品种）→ 分区：农事生产（种植计划/农事上报/供货计划/专家问答/智能问答/种植标准/病虫害识别/病虫害库）、农资进销存（农资购买/农资领用/有机肥管理/农资盘点/农资入库/农资出库/农资退货/农场农资）、**设备保养（保养计划→#/plan/list；点检记录/维修记录/设备配件→toast 功能建设中）**、任务管理（4 图标占位）→ 底部 tabbar（首页选中，其余 toast）。图标用 `.icon-circle`+渐变类+白色字形（取标签首字或 供/退/Ai 式单字）。
- [ ] **Step 2: 浏览器验证**：截图比对截图风格；点「保养计划」进入 #/plan/list；点「点检记录」出现 toast；点 tabbar「地图」出现 toast。

### Task 3: 列表视图 viewList

**Files:** Modify: `prototype/index.html`

**Interfaces:** Consumes `loadPlans/isOverdue/cycleText/todayStr`；Produces `viewList()+bindList()`；状态内存变量 `listState={kw:'',tab:'all'}`。

- [ ] **Step 1: 实现 viewList**：navbar（返回→#/home + 标题保养计划）；搜索框（input 事件实时过滤 name/code 包含 kw）；tab 全部/未完成/已完成（角标=各状态计数，受 kw 影响）；卡片：设备名称加粗+编号、cycleText、`本次 thisDate → 下次 nextDate`、状态 tag、逾期加 `.tag-overdue`；排序：undone 按 nextDate 升序在前，done 按 thisDate 降序在后；空态文案「暂无保养计划，点击右下角新增」；`.fab`「＋ 新增」→`#/plan/form`；卡片 click → `#/plan/detail?id=`。
- [ ] **Step 2: 浏览器验证**：种子 3 条显示；P1 带已逾期标签且排第一；搜索「无人」只剩 P2；tab 已完成计数 1；点 FAB 进入表单路由。

### Task 4: 表单视图 viewForm（新增/编辑 + 联动查询 + 校验）

**Files:** Modify: `prototype/index.html`

**Interfaces:** Consumes `DEVICES/SYS_DICT/CURRENT_USER/lastMaintDate/loadPlans/savePlans`；Produces `viewForm(id?)+bindForm()`、`formState`、`validateForm(state):[{field,msg}]`、`renderCandidates(kw)`。

- [ ] **Step 1: 实现表单结构与联动**：分组卡 ①设备信息：设备名称/设备编号输入框（input 事件：kw≥1 字符时 `DEVICES.filter(name.includes||code.includes)` 取 8 条渲染 `.dropdown` 候选行「名称 | 编号 | 型号」；点击候选→回填 name/code/modelSpec/usage，`ownerTouched===false` 时 owner=台账 owner，记录 deviceId，收起下拉，显示 `.hint-bar`：`lastMaintDate(code)` 有值→「上次保养时间：X（自动读取该设备最近一条记录）」，无→「该设备首次保养」；kw 清空或点外部收起）；型号规格/设备用途输入框（带出后可编辑）。②保养计划：保养周期数字输入+单位 select（选项渲染自 SYS_DICT.maint_cycle_unit）；保养内容 `.content-row` 列表（textarea+删除按钮，行数=1 时删除按钮禁用）+「+ 添加保养内容」；本次/下次保养时间 `input[type=date]`。③执行信息：责任人输入（新增默认 CURRENT_USER；input 事件置 ownerTouched=true）；完成情况 `.seg` 两态默认未完成。编辑模式：按 id 回显全部字段（contents 多行、status 选中态）。
- [ ] **Step 2: 实现校验与保存**：`validateForm` 规则——10 字段非空；cycleValue 为 ≥1 整数（`/^[1-9]\d*$/`）；contents 每条 trim 非空；nextDate>thisDate 否则 msg「下次保养时间必须晚于本次保养时间」。保存按钮：有错→首个错误字段加 `.err` 红框+`toast(msg)`+`scrollIntoView`；无错→构造/更新 Plan（id 用 `Date.now()` 字符串、createdAt/updatedAt 为 now ISO）、`savePlans`、`toast('保存成功')`、`location.hash='#/plan/list'`。
- [ ] **Step 3: 浏览器验证**：新增页输入「拖」出现 SB-001 候选（台账含拖拉机）；输入「SB-00」出现多条；选中 SB-001 后型号/用途/责任人带出、hint 显示上次 2026-03-02；添加 2 条保养内容；空保存被拦截并红框；nextDate≤thisDate 被拦截；填全保存→回列表见新卡片。

### Task 5: 详情视图 viewDetail + 标记完成/编辑

**Files:** Modify: `prototype/index.html`

**Interfaces:** Consumes `loadPlans/savePlans/lastMaintDate/isOverdue/cycleText`；Produces `viewDetail(id)+bindDetail(id)`。

- [ ] **Step 1: 实现 viewDetail**：navbar 返回→#/plan/list；状态卡（状态 tag + 逾期 tag）；只读 cell 展示 10 字段 + 派生「上次保养时间」（lastMaintDate）；保养内容编号列表；底栏按钮：undone→「标记完成」（confirm 二次确认后 status='done'、updatedAt 更新、savePlans、重渲染）+「编辑」（→form?id=）；done→仅「编辑」。
- [ ] **Step 2: 浏览器验证**：P1 详情显示上次保养时间（无更早记录时为「—」或首次提示）、逾期标签；标记完成→confirm→状态变已完成、列表 tab 计数变化；编辑 P2 回显正确，改下次时间保存后列表同步。

### Task 6: 端到端验收与清理

**Files:** Modify: `prototype/index.html`（仅修复验收发现的问题）；Delete: `extract-docx.ps1`、`req.zip`、`docx-text.txt`（本会话 scratch 文件）

- [ ] **Step 1: 按 spec §7 逐条验收**（7 项全过）：首页入口/占位 toast、列表搜索筛选逾期排序、联动带出与上次提示、多条保养内容增删（剩 1 不可删）、三类校验拦截、保存→列表→详情→标记完成、编辑回显与刷新后 localStorage 持久（`navigate_page` 重新加载后数据仍在）。关键屏截图：首页、列表、表单（含下拉与 hint）、详情。
- [ ] **Step 2: 修复验收中发现的问题并复验。**
- [ ] **Step 3: 删除 scratch 文件，向用户汇报并附截图路径。**
