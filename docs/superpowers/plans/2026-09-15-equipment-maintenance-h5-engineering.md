# 设备保养 H5 工程化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `prototype/index.html` 的单文件 H5 原型工程化为 Vite + Vue 3 + TypeScript(strict) + Vant 4 + MSW 的可维护 SPA，业务与视觉不变，接口预留可无缝切真实后端。

**Architecture:** 单体 SPA，平铺到根目录；`prototype/` 保留作视觉基准。`vue-router` hash 模式保留原型路径；Pinia 只做会话缓存，MSW 独占 `localStorage.lx_maint_plans_v3` 持久化;API 层按未来真实后端签名书写，MSW 只替换传输层。视觉通过 CSS 变量 + Vant Less 主题双轨落地迭代 3 田园风设计。

**Tech Stack:** Vite 5 · Vue 3.4 · TypeScript strict · vue-router 4（hash） · Pinia 2 · Vant 4 · MSW 2 · Vitest + @vue/test-utils · pnpm · Less

**Spec:** `docs/superpowers/specs/2026-09-15-equipment-maintenance-h5-engineering.md`

## Global Constraints

- 目录布局：平铺到根目录，源码在 `src/`，`prototype/`、`docs/`、`shots/` 保留原样。
- 路由：`vue-router` 使用 `createWebHashHistory('/')`，路径 `/home`、`/plan/list`、`/plan/form`、`/plan/detail` 与原型一致；未知 hash 兜底 `/home`。
- 视觉锚点：主绿 `#1FA14A` / 深绿 `#157A38` / 墨绿 `#0F5E2C`；页面背景 `#F2F7F3`；卡片圆角 `14px`、1px 边线 `#E9F0EA`、阴影 `0 4px 14px rgba(30,80,50,.07)`；状态标签 未完成 `#FDECEA/#E64A40`、已完成 `#E3F3E8/#1FA14A`、已逾期 `#D93025/#fff`；首页/列表共用田园横幅（`HillsScene`：山丘 `#A9DCB4/#8AD09C/#6FC385` + 红顶农舍 + 拖拉机插画）；列表页 = 横幅（返回/标题/新增胶囊钮）+ 白色 sheet 叠层 + 搜索 + 筛选行（设备类型/保养完成情况/负责人 chip + 筛选重置）+ 设备卡片（`DeviceSvg` 插画 + 三信息行 + 三列统计）+「共 N 条记录」；tabbar = 首页/设备/点检/维修/我的。
- 数据契约：`Plan.items[]` 至少 1 条；`item.cycleValue` 必须匹配 `/^[1-9]\d*$/`；`item.nextDate > plan.thisDate`；派生字段 `planNextDate = min(items[].nextDate)`、`overdue = status==='undone' && items.some(i => i.nextDate < today)`、`lastDate = max(其他记录 thisDate) where deviceCode 相等`；`deviceType/deviceSvg` 由服务端按 deviceId/deviceCode 关联台账带出；派生/关联字段由服务端/MSW 计算，前端不重算。
- 持久化命名空间：`localStorage.lx_maint_plans_v3`；Pinia 不落地。
- Mock 开关：`VITE_USE_MOCK === '1'` 才动态 `import('./mock/browser')`；生产构建须 tree-shake 掉 `mock/*` 与 MSW。
- 视口画布 375px，坚持 px（不用 rem）；正文 14px、辅助 12px、卡标题 15px 加粗；字体栈 `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`。
- 包管理器：pnpm；npm 源 `https://mirrors.cloud.tencent.com/npm/`（默认源与 npmmirror/taobao 曾在本机失败）。
- 平台：Windows + Git Bash；命令用 POSIX 语法。

---

## 文件结构（一次性映射）

**创建：**

- 根：`.gitignore`、`.npmrc`、`package.json`、`tsconfig.json`、`tsconfig.node.json`、`vite.config.ts`、`vitest.config.ts`、`index.html`、`.env.development`、`.env.production`
- `src/`：`main.ts`、`App.vue`
- `src/router/`：`index.ts`
- `src/pages/`：`Home.vue`、`PlanList.vue`、`PlanForm.vue`、`PlanDetail.vue`
- `src/components/`：`TopBar.vue`、`Tabbar.vue`、`HomeSection.vue`、`HillsScene.vue`、`DeviceSvg.vue`、`FilterBar.vue`、`PlanCard.vue`、`ItemCard.vue`、`DeviceCombo.vue`、`EmptyState.vue`、`Tag.vue`、`Chip.vue`
- `src/api/`：`client.ts`、`maintPlan.ts`、`device.ts`、`dict.ts`、`auth.ts`
- `src/mock/`：`browser.ts`、`handlers.ts`、`seed.ts`、`storage.ts`、`devices.ts`
- `src/stores/`：`maintPlan.ts`、`device.ts`、`dict.ts`、`auth.ts`
- `src/types/`：`maintPlan.ts`
- `src/utils/`：`date.ts`、`validate.ts`、`auth.ts`
- `src/styles/`：`tokens.css`、`vant-theme.less`、`base.css`
- `src/__tests__/`：单测文件
- `public/mockServiceWorker.js`（由 `pnpm dlx msw init public/ --save` 生成）

**保留不动：** `prototype/`、`docs/`（除新增 plan 外）、`shots/`

---

## Task 概览

| # | 任务 | 独立可测形态 |
|---|---|---|
| 1 | 项目骨架初始化 | `pnpm typecheck`、`pnpm build`、`pnpm dev` 冒烟通过 |
| 2 | 样式令牌 · Vant 主题 · 基础布局组件 | 冒烟：TopBar/Tabbar/EmptyState 视觉正确 |
| 3 | 类型 · date/validate 工具与单测 | Vitest 全绿 |
| 4 | apiClient 与 API 层 | Vitest 全绿（含 401 事件） |
| 5 | MSW handlers · storage · seed 与 handler 单测 | Vitest 全绿 + 浏览器 `fetch('/api/...')` 命中 |
| 6 | Pinia stores 与排序测试 | Vitest 全绿 |
| 7 | 首页 · 路由 · bootstrapAuth | 浏览器：田园横幅 + 首页四分区 + tabbar（首页/设备可跳），保养计划可跳转 |
| 8 | 保养计划列表页 · PlanCard · FilterBar | 浏览器：hero 横幅、列表、搜索、筛选行、逾期标签、排序、三列统计、空态 |
| 9 | 保养计划表单页 · DeviceCombo · ItemCard | 浏览器：联动、多保养项增删、校验、保存/编辑闭环 |
| 10 | 保养计划详情页 · 标记完成 | 浏览器：字段完整、每项卡片、标记完成状态变更 |
| 11 | 端到端复测 · 打包验证 | 浏览器 8 项验收清单全过，生产包不含 MSW |

---

### Task 1: 项目骨架初始化

**Files:**
- Create: `.gitignore`, `.npmrc`, `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.env.development`, `.env.production`, `src/main.ts`, `src/App.vue`, `src/vite-env.d.ts`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces:
  - `pnpm` 脚本：`dev`、`build`、`preview`、`typecheck`、`test`
  - Vite 别名 `@` → `src`
  - 环境变量 `VITE_USE_MOCK`（`.env.development=1`、`.env.production=0`）
  - `src/main.ts` 导出 `bootstrap()`（暂时空实现，占位以便后续 Task 7 扩展）

- [ ] **Step 1: 写 `.npmrc` 锁定镜像**

```
registry=https://mirrors.cloud.tencent.com/npm/
auto-install-peers=true
```

- [ ] **Step 2: 写 `.gitignore`**

```
node_modules
dist
.DS_Store
*.log
.env.local
```

- [ ] **Step 3: 写 `package.json`**

```json
{
  "name": "laoxiang-farm-maint-h5",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview --port 4173",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "msw:init": "msw init public/ --save"
  },
  "dependencies": {
    "vue": "^3.4.38",
    "vue-router": "^4.4.3",
    "pinia": "^2.2.2",
    "vant": "^4.9.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.3",
    "@vant/auto-import-resolver": "^1.2.1",
    "unplugin-vue-components": "^0.27.4",
    "typescript": "^5.5.4",
    "vue-tsc": "^2.1.6",
    "vite": "^5.4.5",
    "less": "^4.2.0",
    "msw": "^2.4.5",
    "vitest": "^2.1.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.0"
  },
  "msw": { "workerDirectory": "public" }
}
```

- [ ] **Step 4: 写 `tsconfig.json`（strict）**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "jsx": "preserve",
    "types": ["vite/client"],
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/**/*.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 写 `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 6: 写 `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import path from 'node:path'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VantResolver()] })],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/vant-theme.less";`,
        javascriptEnabled: true
      }
    }
  },
  server: { port: 5173, host: '127.0.0.1' }
})
```

- [ ] **Step 7: 写 `vitest.config.ts`**

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: { environment: 'jsdom', globals: false, include: ['src/__tests__/**/*.spec.ts'] }
}))
```

- [ ] **Step 8: 写 `.env.development` 与 `.env.production`**

`.env.development`:
```
VITE_USE_MOCK=1
```
`.env.production`:
```
VITE_USE_MOCK=0
```

- [ ] **Step 9: 写 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=375, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>老乡农场 · 设备保养</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 10: 写 `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_USE_MOCK: '0' | '1' }
interface ImportMeta { readonly env: ImportMetaEnv }
```

- [ ] **Step 11: 写 `src/App.vue` 与 `src/main.ts`（占位）**

`src/App.vue`:
```vue
<template><div class="app-root">skeleton</div></template>
<script setup lang="ts"></script>
<style>.app-root{padding:24px;font-family:-apple-system,"PingFang SC",sans-serif}</style>
```

`src/main.ts`:
```ts
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

- [ ] **Step 12: 装依赖 + 冒烟**

```bash
pnpm install
pnpm typecheck
pnpm build
```
预期：`typecheck` 无错，`build` 生成 `dist/`。

- [ ] **Step 13: 提交**

```bash
git init
git add -A
git commit -m "chore: bootstrap Vite + Vue 3 + TS strict skeleton"
```

---

### Task 2: 样式令牌 · Vant 主题 · 基础布局组件

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/vant-theme.less`, `src/components/TopBar.vue`, `src/components/Tabbar.vue`, `src/components/EmptyState.vue`, `src/components/Tag.vue`, `src/components/Chip.vue`, `src/components/icons.ts`, `src/components/HillsScene.vue`, `src/components/DeviceSvg.vue`
- Modify: `src/main.ts`, `src/App.vue`

**Interfaces:**
- Consumes: Task 1 骨架
- Produces:
  - CSS 变量：`--color-primary/#1FA14A`, `--color-primary-dark/#157A38`, `--color-primary-xdark/#0F5E2C`, `--color-bg/#F2F7F3`, `--radius-card/14px`, `--shadow-card/0 4px 14px rgba(30,80,50,.07)`
  - 组件 `<TopBar title back? />`（emits `back`）、`<Tabbar active />`、`<EmptyState text />`、`<Tag variant="done|undone|overdue" />`、`<Chip>slot</Chip>`
  - 田园资产：`ICONS` 常量（`src/components/icons.ts`）、`<HillsScene height? />`（山丘横幅场景）、`<DeviceSvg kind? />`（设备插画，未知 kind 兜底 generic）

- [ ] **Step 1: 写 `src/styles/tokens.css`**

```css
:root{
  --color-primary:#1FA14A;
  --color-primary-dark:#157A38;
  --color-primary-xdark:#0F5E2C;
  --color-bg:#F2F7F3;
  --color-card:#FFFFFF;
  --color-text:#1E2B22;
  --color-text-2:#5C6B60;
  --color-text-3:#93A297;
  --color-line:#E9F0EA;
  --color-chip-bg:#E3F3E8;  --color-chip-fg:#1FA14A;
  --color-done-bg:#E3F3E8;   --color-done-fg:#1FA14A;
  --color-undone-bg:#FDECEA; --color-undone-fg:#E64A40;
  --color-overdue-bg:#D93025;--color-overdue-fg:#FFFFFF;
  --radius-card:14px;
  --radius-chip:6px;
  --shadow-card:0 4px 14px rgba(30,80,50,.07);
  --font-body:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
}
```

- [ ] **Step 2: 写 `src/styles/base.css`**

```css
*,*::before,*::after{box-sizing:border-box}
html,body,#app{margin:0;padding:0;background:var(--color-bg);color:var(--color-text);font:14px/1.5 var(--font-body);-webkit-font-smoothing:antialiased}
button{font-family:inherit}
a{color:inherit;text-decoration:none}
.page{max-width:375px;margin:0 auto;min-height:100vh;padding-bottom:60px}

/* 田园插画资产（v-html 注入的 svg 不受 scoped 样式影响，须全局规则） */
.hills-scene{position:absolute;left:0;right:0;bottom:-2px;width:100%;pointer-events:none}
.hills-scene svg{width:100%;height:100%;display:block}
.devsvg{display:block}
.devsvg svg{width:100%;height:100%;display:block}
```

- [ ] **Step 3: 写 `src/styles/vant-theme.less`**

```less
@van-primary-color:#1FA14A;
@van-button-primary-background:linear-gradient(135deg,#1FA14A,#0F5E2C);
@van-button-primary-border-color:transparent;
@van-tabbar-item-active-color:#1FA14A;
@van-nav-bar-background:#FFFFFF;
@van-nav-bar-title-text-color:#1E2B22;
@van-tab-active-text-color:#1FA14A;
@van-tabs-bottom-bar-color:#1FA14A;
@van-cell-value-color:#1E2B22;
@van-field-label-width:96px;
@van-cell-vertical-padding:13px;
```

- [ ] **Step 4: 写 `TopBar.vue`**

```vue
<template>
  <header class="topbar">
    <button v-if="back" class="topbar__back" @click="$emit('back')" aria-label="返回">‹</button>
    <h1 class="topbar__title">{{ title }}</h1>
  </header>
</template>
<script setup lang="ts">
defineProps<{ title: string; back?: boolean }>()
defineEmits<{ back: [] }>()
</script>
<style scoped>
.topbar{height:44px;display:flex;align-items:center;padding:0 12px;background:var(--color-card);border-bottom:1px solid var(--color-line);position:sticky;top:0;z-index:10}
.topbar__back{border:0;background:transparent;font-size:24px;color:var(--color-primary-dark);padding:0 8px;cursor:pointer}
.topbar__title{flex:1;text-align:center;font-size:16px;font-weight:600;margin:0}
</style>
```

- [ ] **Step 5: 写 `Tabbar.vue`（迭代 3：首页/设备/点检/维修/我的）**

```vue
<template>
  <nav class="tabbar">
    <button v-for="t in tabs" :key="t.key" class="tabbar__item" :class="{active:t.key===active}" @click="onTap(t)">
      <span class="tabbar__ico" v-html="t.icon" />
      <span class="tabbar__label">{{ t.label }}</span>
    </button>
  </nav>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { ICONS } from '@/components/icons'

defineProps<{ active: 'home'|'device'|'inspect'|'repair'|'me' }>()
const router = useRouter()
// icon 为内联 SVG 字符串，与 prototype/index.html 的 ICONS 保持一致
const tabs = [
  { key:'home',    label:'首页', icon:ICONS.home,      route:'/home' },
  { key:'device',  label:'设备', icon:ICONS.tractorTab, route:'/plan/list' },
  { key:'inspect', label:'点检', icon:ICONS.clipboard },
  { key:'repair',  label:'维修', icon:ICONS.wrench },
  { key:'me',      label:'我的', icon:ICONS.user }
] as const
function onTap(t: typeof tabs[number]){ if ('route' in t && t.route) router.push(t.route); else showToast('功能建设中') }
</script>
<style scoped>
.tabbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:375px;height:56px;display:flex;background:var(--color-card);border-top:1px solid var(--color-line);padding-bottom:env(safe-area-inset-bottom)}
.tabbar__item{flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--color-text-3);gap:2px;cursor:pointer}
.tabbar__item.active{color:var(--color-primary);font-weight:600}
.tabbar__ico{width:22px;height:22px}
.tabbar__ico :deep(svg){width:100%;height:100%}
.tabbar__label{font-size:11px}
</style>
```

图标字符串集中在 `src/components/icons.ts` 导出（`ICONS.home / tractorTab / clipboard / wrench / user / chev / search / funnel / check / clock / cal / leaf`），内容直接移植原型 `ICONS`。

- [ ] **Step 6: 写 `EmptyState.vue` / `Tag.vue` / `Chip.vue`**

`EmptyState.vue`:
```vue
<template><div class="empty"><div class="empty__ico">🌱</div><p class="empty__text">{{ text }}</p></div></template>
<script setup lang="ts">defineProps<{ text: string }>()</script>
<style scoped>
.empty{padding:64px 24px;text-align:center;color:var(--color-text-3)}
.empty__ico{font-size:40px;margin-bottom:8px}
.empty__text{margin:0;font-size:14px}
</style>
```

`Tag.vue`:
```vue
<template><span class="tag" :class="`tag--${variant}`"><slot /></span></template>
<script setup lang="ts">defineProps<{ variant: 'done'|'undone'|'overdue' }>()</script>
<style scoped>
.tag{display:inline-block;padding:3px 9px;border-radius:8px;font-size:11px;font-weight:600;line-height:16px;white-space:nowrap}
.tag--done{background:var(--color-done-bg);color:var(--color-done-fg)}
.tag--undone{background:var(--color-undone-bg);color:var(--color-undone-fg)}
.tag--overdue{background:var(--color-overdue-bg);color:var(--color-overdue-fg)}
</style>
```

`Chip.vue`:
```vue
<template><span class="chip"><slot /></span></template>
<style scoped>
.chip{display:inline-block;padding:2px 8px;border-radius:var(--radius-chip);background:var(--color-chip-bg);color:var(--color-chip-fg);font-size:12px;line-height:18px}
</style>
```

- [ ] **Step 6b: 写 `icons.ts` / `HillsScene.vue` / `DeviceSvg.vue`（田园资产）**

SVG 字符串逐字移植 `prototype/index.html` 的 `ICONS` / `HILLS` / `DEV_SVG` 常量（原型是唯一事实源，禁止改写路径数据）。

`src/components/icons.ts`:
```ts
// 值逐字拷贝 prototype/index.html 的 ICONS（含 chev/search/funnel/down/clock/cal/check/leaf/home/tractorTab/clipboard/wrench/user）
export const ICONS = {
  chev: '...', search: '...', funnel: '...', down: '...', clock: '...', cal: '...',
  check: '...', leaf: '...', home: '...', tractorTab: '...', clipboard: '...', wrench: '...', user: '...'
} as const
```

`src/components/HillsScene.vue`（山丘横幅场景；父容器须 `position:relative`，高度由 prop 控制——首页 128px、列表 122px）:
```vue
<template><div class="hills-scene" :style="{ height }" v-html="HILLS" /></template>
<script setup lang="ts">
const HILLS = '...'   // 逐字拷贝 prototype/index.html 的 HILLS
withDefaults(defineProps<{ height?: string }>(), { height: '128px' })
</script>
```

`src/components/DeviceSvg.vue`（设备插画；未知 kind 兜底 generic；尺寸由父容器约束）:
```vue
<template><span class="devsvg" v-html="svg" /></template>
<script setup lang="ts">
import { computed } from 'vue'
// 值逐字拷贝 prototype/index.html 的 DEV_SVG
const DEV_SVG: Record<string, string> = { tractor:'...', harvester:'...', tiller:'...', pump:'...', spreader:'...', drone:'...', generic:'...' }
const props = defineProps<{ kind?: string }>()
const svg = computed(() => DEV_SVG[props.kind ?? ''] ?? DEV_SVG.generic)
</script>
```

- [ ] **Step 7: 修改 `src/main.ts` 引入样式**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'
createApp(App).mount('#app')
```

- [ ] **Step 8: 冒烟 `App.vue` 展示三种 Tag**

```vue
<template>
  <div class="page">
    <TopBar title="骨架冒烟" back @back="()=>{}" />
    <div style="padding:16px;display:flex;gap:8px">
      <Tag variant="done">已完成</Tag>
      <Tag variant="undone">未完成</Tag>
      <Tag variant="overdue">已逾期</Tag>
    </div>
    <EmptyState text="暂无数据" />
    <Tabbar active="home" />
  </div>
</template>
<script setup lang="ts">
import TopBar from '@/components/TopBar.vue'
import Tabbar from '@/components/Tabbar.vue'
import EmptyState from '@/components/EmptyState.vue'
import Tag from '@/components/Tag.vue'
</script>
```

- [ ] **Step 9: 浏览器冒烟**

```bash
pnpm dev
```
预期：可见 TopBar + 三种 Tag + 空态 + Tabbar；tab「首页/设备」可跳转对应路由，其余 toast「功能建设中」。

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "feat(ui): tokens, vant theme, layout primitives"
```

---

### Task 3: 类型 · date/validate 工具与单测（TDD）

**Files:**
- Create: `src/types/maintPlan.ts`, `src/utils/date.ts`, `src/utils/validate.ts`, `src/__tests__/date.spec.ts`, `src/__tests__/validate.spec.ts`

**Interfaces:**
- Consumes: 无（纯函数）
- Produces:
  - `type MaintItem = { id: string; content: string; cycleValue: number; cycleUnit: '小时'|'天'|'公里'; nextDate: string }`
  - `type Plan = { id: string; deviceId: string|null; deviceName: string; deviceCode: string; modelSpec: string; usage: string; thisDate: string; owner: string; status: 'undone'|'done'; items: MaintItem[]; createdAt: number; updatedAt: number }`
  - `type PlanWithDerived = Plan & { planNextDate: string; overdue: boolean; lastDate: string|null; deviceType?: string; deviceSvg?: string }`
  - `todayStr(): string` `YYYY-MM-DD`
  - `planNextDate(items: MaintItem[]): string` — 最早 nextDate
  - `isOverdue(plan: Plan, today?: string): boolean`
  - `cycleText(item: MaintItem): string` — 展示如「每 30 天」
  - `deriveLastDate(current: Plan, all: Plan[]): string|null` — 同 deviceCode 其他记录 thisDate 最大值
  - `validatePlan(input: Plan): { ok: boolean; errors: Array<{ field: string; message: string; itemIndex?: number }> }`

- [ ] **Step 1: 写 `src/types/maintPlan.ts`**

```ts
export type CycleUnit = '小时' | '天' | '公里'

export interface MaintItem {
  id: string
  content: string
  cycleValue: number
  cycleUnit: CycleUnit
  nextDate: string  // YYYY-MM-DD
}

export interface Plan {
  id: string
  deviceId: string | null
  deviceName: string
  deviceCode: string
  modelSpec: string
  usage: string
  thisDate: string   // YYYY-MM-DD
  owner: string
  status: 'undone' | 'done'
  items: MaintItem[]
  createdAt: number
  updatedAt: number
}

export interface PlanWithDerived extends Plan {
  planNextDate: string
  overdue: boolean
  lastDate: string | null
  /** 服务端联表设备台账注入（列表卡片筛选与插画用），手动录入设备时为空 */
  deviceType?: string
  deviceSvg?: string
}

export interface Device {
  id: string; name: string; code: string; model: string; usage: string; owner: string
  type: string   // 设备类型（列表筛选用，如「拖拉机」）
  svg: string    // 插画键（DeviceSvg 组件按此渲染）
  photo?: string
}
```

- [ ] **Step 2: 写失败测试 `src/__tests__/date.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { planNextDate, isOverdue, cycleText, deriveLastDate, todayStr } from '@/utils/date'
import type { Plan, MaintItem } from '@/types/maintPlan'

const item = (nextDate: string): MaintItem => ({ id:'i', content:'x', cycleValue:30, cycleUnit:'天', nextDate })
const plan = (over: Partial<Plan> = {}): Plan => ({
  id:'p', deviceId:null, deviceName:'A', deviceCode:'D01', modelSpec:'', usage:'', thisDate:'2026-09-01',
  owner:'王强', status:'undone', items:[item('2026-10-01')], createdAt:0, updatedAt:0, ...over
})

describe('date utils', () => {
  it('todayStr returns YYYY-MM-DD', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('planNextDate picks the earliest nextDate', () => {
    expect(planNextDate([item('2026-11-01'), item('2026-09-20'), item('2026-10-05')])).toBe('2026-09-20')
  })
  it('isOverdue true when undone and any nextDate < today', () => {
    expect(isOverdue(plan({ items:[item('2020-01-01')] }), '2026-09-15')).toBe(true)
  })
  it('isOverdue false when status is done', () => {
    expect(isOverdue(plan({ status:'done', items:[item('2020-01-01')] }), '2026-09-15')).toBe(false)
  })
  it('cycleText formats value + unit', () => {
    expect(cycleText(item('2026-10-01'))).toBe('每 30 天')
  })
  it('deriveLastDate picks max thisDate of other records with same deviceCode', () => {
    const cur = plan({ id:'p1', deviceCode:'D01', thisDate:'2026-09-01' })
    const others: Plan[] = [
      plan({ id:'p2', deviceCode:'D01', thisDate:'2026-06-01' }),
      plan({ id:'p3', deviceCode:'D01', thisDate:'2026-08-10' }),
      plan({ id:'p4', deviceCode:'D02', thisDate:'2026-12-01' })
    ]
    expect(deriveLastDate(cur, [cur, ...others])).toBe('2026-08-10')
  })
  it('deriveLastDate returns null when no other record', () => {
    const cur = plan({ id:'p1', deviceCode:'D01' })
    expect(deriveLastDate(cur, [cur])).toBeNull()
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

```bash
pnpm test
```
预期：所有 date 测试 fail（模块未定义）。

- [ ] **Step 4: 实现 `src/utils/date.ts`**

```ts
import type { Plan, MaintItem } from '@/types/maintPlan'

export function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
}

export function planNextDate(items: MaintItem[]): string {
  if (!items.length) return ''
  return items.map(i => i.nextDate).sort()[0]!
}

export function isOverdue(plan: Plan, today: string = todayStr()): boolean {
  if (plan.status === 'done') return false
  return plan.items.some(i => i.nextDate < today)
}

export function cycleText(item: MaintItem): string {
  return `每 ${item.cycleValue} ${item.cycleUnit}`
}

export function deriveLastDate(current: Plan, all: Plan[]): string | null {
  const others = all.filter(p => p.id !== current.id && p.deviceCode === current.deviceCode)
  if (!others.length) return null
  return others.map(p => p.thisDate).sort().reverse()[0]!
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
pnpm test
```
预期：date.spec 全绿。

- [ ] **Step 6: 写失败测试 `src/__tests__/validate.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { validatePlan } from '@/utils/validate'
import type { Plan } from '@/types/maintPlan'

const base = (): Plan => ({
  id:'p', deviceId:null, deviceName:'A', deviceCode:'D01', modelSpec:'M1', usage:'耕地',
  thisDate:'2026-09-01', owner:'王强', status:'undone',
  items:[{ id:'i1', content:'换机油', cycleValue:30, cycleUnit:'天', nextDate:'2026-10-01' }],
  createdAt:0, updatedAt:0
})

describe('validatePlan', () => {
  it('accepts a valid plan', () => {
    expect(validatePlan(base()).ok).toBe(true)
  })
  it('rejects empty deviceName', () => {
    const p = base(); p.deviceName = ''
    const r = validatePlan(p)
    expect(r.ok).toBe(false)
    expect(r.errors.find(e => e.field === 'deviceName')).toBeDefined()
  })
  it('rejects empty items', () => {
    const p = base(); p.items = []
    const r = validatePlan(p)
    expect(r.ok).toBe(false)
    expect(r.errors.find(e => e.field === 'items')).toBeDefined()
  })
  it('rejects item.cycleValue < 1 or non-integer', () => {
    const p = base(); p.items[0]!.cycleValue = 0
    expect(validatePlan(p).errors.some(e => e.field === 'items.cycleValue' && e.itemIndex === 0)).toBe(true)
    p.items[0]!.cycleValue = 1.5
    expect(validatePlan(p).errors.some(e => e.field === 'items.cycleValue')).toBe(true)
  })
  it('rejects nextDate <= thisDate', () => {
    const p = base(); p.items[0]!.nextDate = '2026-09-01'
    expect(validatePlan(p).errors.some(e => e.field === 'items.nextDate' && e.itemIndex === 0)).toBe(true)
  })
  it('rejects empty item.content', () => {
    const p = base(); p.items[0]!.content = '   '
    expect(validatePlan(p).errors.some(e => e.field === 'items.content')).toBe(true)
  })
})
```

- [ ] **Step 7: 运行测试确认失败**

```bash
pnpm test
```

- [ ] **Step 8: 实现 `src/utils/validate.ts`**

```ts
import type { Plan } from '@/types/maintPlan'

export interface ValidationError { field: string; message: string; itemIndex?: number }
export interface ValidationResult { ok: boolean; errors: ValidationError[] }

const CYCLE_RE = /^[1-9]\d*$/

export function validatePlan(p: Plan): ValidationResult {
  const errors: ValidationError[] = []
  if (!p.deviceName.trim()) errors.push({ field:'deviceName', message:'请输入设备名称' })
  if (!p.deviceCode.trim()) errors.push({ field:'deviceCode', message:'请输入设备编号' })
  if (!p.modelSpec.trim()) errors.push({ field:'modelSpec', message:'请输入型号规格' })
  if (!p.usage.trim()) errors.push({ field:'usage', message:'请输入设备用途' })
  if (!p.thisDate) errors.push({ field:'thisDate', message:'请选择本次保养时间' })
  if (!p.owner.trim()) errors.push({ field:'owner', message:'请输入责任人' })
  if (!p.items.length) errors.push({ field:'items', message:'至少 1 项保养' })
  p.items.forEach((it, idx) => {
    if (!it.content.trim()) errors.push({ field:'items.content', message:`第 ${idx+1} 项保养内容不能为空`, itemIndex: idx })
    if (!CYCLE_RE.test(String(it.cycleValue))) errors.push({ field:'items.cycleValue', message:`第 ${idx+1} 项保养周期必须为正整数`, itemIndex: idx })
    if (!it.nextDate) errors.push({ field:'items.nextDate', message:`第 ${idx+1} 项请选择下次保养时间`, itemIndex: idx })
    else if (p.thisDate && it.nextDate <= p.thisDate) errors.push({ field:'items.nextDate', message:`第 ${idx+1} 项下次保养时间需晚于本次保养时间`, itemIndex: idx })
  })
  return { ok: errors.length === 0, errors }
}
```

- [ ] **Step 9: 运行测试确认全绿**

```bash
pnpm test
pnpm typecheck
```

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "feat(core): types + date/validate utils with tests"
```

---

### Task 4: apiClient 与 API 层

**Files:**
- Create: `src/api/client.ts`, `src/api/maintPlan.ts`, `src/api/device.ts`, `src/api/dict.ts`, `src/api/auth.ts`, `src/__tests__/apiClient.spec.ts`

**Interfaces:**
- Consumes: `Plan`, `PlanWithDerived`, `Device`, `MaintItem` from Task 3
- Produces:
  - `ApiError extends Error { status:number; code?:string; requestId?:string }`
  - `NetworkError extends Error`
  - `apiClient.request<T>(input: { method:'GET'|'POST'|'PUT'|'DELETE'; url:string; body?:unknown; params?:Record<string,string|number|undefined> }): Promise<T>`
  - `apiClient.on('auth-expired', handler:()=>void): ()=>void`
  - `apiClient.setToken(token:string|null): void`
  - `listPlans(params?:{ keyword?:string; status?:'undone'|'done' }): Promise<PlanWithDerived[]>`
  - `getPlan(id:string): Promise<PlanWithDerived>`
  - `createPlan(payload: Omit<Plan,'id'|'createdAt'|'updatedAt'>): Promise<PlanWithDerived>`
  - `updatePlan(id:string, payload: Omit<Plan,'id'|'createdAt'|'updatedAt'>): Promise<PlanWithDerived>`
  - `markPlanDone(id:string): Promise<PlanWithDerived>`
  - `searchDevices(keyword:string): Promise<Device[]>`
  - `getDict(type:'maint_cycle_unit'): Promise<string[]>`
  - `exchangeTicket(ticket:string): Promise<{ token:string; user:{ name:string; role:string } }>`

- [ ] **Step 1: 写失败测试 `src/__tests__/apiClient.spec.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError, NetworkError } from '@/api/client'

describe('apiClient', () => {
  beforeEach(() => { apiClient.setToken('t123') })

  it('sends Authorization header and returns JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok:1 }), { status:200, headers:{ 'content-type':'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await apiClient.request<{ ok:number }>({ method:'GET', url:'/api/ping' })
    expect(data.ok).toBe(1)
    const call = fetchMock.mock.calls[0]!
    expect(call[1].headers.Authorization).toBe('Bearer t123')
  })

  it('throws ApiError with status on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message:'bad' }), { status:400, headers:{ 'content-type':'application/json' } })))
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(ApiError)
  })

  it('emits auth-expired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status:401 })))
    const handler = vi.fn()
    apiClient.on('auth-expired', handler)
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalled()
  })

  it('wraps network failure as NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(NetworkError)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- apiClient
```

- [ ] **Step 3: 实现 `src/api/client.ts`**

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public requestId?: string) { super(message) }
}
export class NetworkError extends Error {
  constructor(message = '网络异常，请稍后重试') { super(message) }
}

type Listener = () => void
type Events = 'auth-expired'

class ApiClient {
  private token: string | null = null
  private listeners = new Map<Events, Set<Listener>>()

  setToken(t: string | null) { this.token = t }
  on(evt: Events, fn: Listener) {
    const set = this.listeners.get(evt) ?? new Set()
    set.add(fn); this.listeners.set(evt, set)
    return () => set.delete(fn)
  }
  private emit(evt: Events) { this.listeners.get(evt)?.forEach(fn => fn()) }

  async request<T>(input: { method: 'GET'|'POST'|'PUT'|'DELETE'; url: string; body?: unknown; params?: Record<string, string|number|undefined> }): Promise<T> {
    const qs = input.params
      ? '?' + Object.entries(input.params).filter(([,v]) => v!==undefined && v!=='').map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
      : ''
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    if (input.body !== undefined) headers['Content-Type'] = 'application/json'
    let res: Response
    try {
      res = await fetch(input.url + qs, { method: input.method, headers, body: input.body === undefined ? undefined : JSON.stringify(input.body) })
    } catch {
      throw new NetworkError()
    }
    if (res.status === 401) { this.emit('auth-expired'); throw new ApiError(401, '登录已过期') }
    const ct = res.headers.get('content-type') ?? ''
    const payload = ct.includes('application/json') ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) {
      const p = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}
      throw new ApiError(res.status, (p.message as string) ?? `HTTP ${res.status}`, p.code as string | undefined)
    }
    return payload as T
  }
}

export const apiClient = new ApiClient()
```

- [ ] **Step 4: 运行测试确认全绿**

```bash
pnpm test -- apiClient
```

- [ ] **Step 5: 实现 `src/api/maintPlan.ts`**

```ts
import { apiClient } from './client'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'

type PlanPayload = Omit<Plan, 'id'|'createdAt'|'updatedAt'>

export const listPlans = (params?: { keyword?: string; status?: 'undone'|'done' }) =>
  apiClient.request<PlanWithDerived[]>({ method:'GET', url:'/api/maint-plan', params: params ?? {} })

export const getPlan = (id: string) =>
  apiClient.request<PlanWithDerived>({ method:'GET', url:`/api/maint-plan/${id}` })

export const createPlan = (payload: PlanPayload) =>
  apiClient.request<PlanWithDerived>({ method:'POST', url:'/api/maint-plan', body: payload })

export const updatePlan = (id: string, payload: PlanPayload) =>
  apiClient.request<PlanWithDerived>({ method:'PUT', url:`/api/maint-plan/${id}`, body: payload })

export const markPlanDone = (id: string) =>
  apiClient.request<PlanWithDerived>({ method:'PUT', url:`/api/maint-plan/${id}/status`, body: { status:'done' } })
```

- [ ] **Step 6: 实现 `device.ts` / `dict.ts` / `auth.ts`**

`src/api/device.ts`:
```ts
import { apiClient } from './client'
import type { Device } from '@/types/maintPlan'
export const searchDevices = (keyword: string) =>
  apiClient.request<Device[]>({ method:'GET', url:'/api/device', params:{ keyword } })
```

`src/api/dict.ts`:
```ts
import { apiClient } from './client'
export const getDict = (type: 'maint_cycle_unit') =>
  apiClient.request<string[]>({ method:'GET', url:`/api/dict/${type}` })
```

`src/api/auth.ts`:
```ts
import { apiClient } from './client'
export const exchangeTicket = (ticket: string) =>
  apiClient.request<{ token: string; user: { name: string; role: string } }>({ method:'POST', url:'/api/auth/exchange', body:{ ticket } })
```

- [ ] **Step 7: typecheck 通过**

```bash
pnpm typecheck
```

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat(api): client + endpoints with auth-expired event"
```

---

### Task 5: MSW handlers · storage · seed 与 handler 单测

**Files:**
- Create: `src/mock/browser.ts`, `src/mock/handlers.ts`, `src/mock/seed.ts`, `src/mock/storage.ts`, `src/mock/devices.ts`, `src/__tests__/mockHandlers.spec.ts`
- Run: `pnpm dlx msw init public/ --save` — 生成 `public/mockServiceWorker.js`
- Modify: `src/main.ts` — 条件启动 MSW

**Interfaces:**
- Consumes: 类型 `Plan`, `Device`, `PlanWithDerived`；工具 `planNextDate`, `isOverdue`, `deriveLastDate`, `todayStr`
- Produces:
  - `storage.read(): Plan[]` / `storage.write(plans: Plan[]): void` — 读写 `localStorage.lx_maint_plans_v3`
  - `withDerived(plan: Plan, all: Plan[]): PlanWithDerived`
  - `startMockWorker(): Promise<void>`
  - MSW handlers 覆盖：`GET /api/auth/exchange`（POST）、`GET /api/dict/:type`、`GET /api/device`、`GET /api/maint-plan`、`GET /api/maint-plan/:id`、`POST /api/maint-plan`、`PUT /api/maint-plan/:id`、`PUT /api/maint-plan/:id/status`

- [ ] **Step 1: 生成 Service Worker**

```bash
pnpm dlx msw@latest init public/ --save
```

- [ ] **Step 2: 写 `src/mock/devices.ts`（台账 mock）**

```ts
import type { Device } from '@/types/maintPlan'
export const DEVICES: Device[] = [
  { id:'D001', name:'拖拉机',     code:'TR001',  model:'约翰迪尔 6B-1204', usage:'耕地作业', owner:'张三', type:'拖拉机',  svg:'tractor'   },
  { id:'D002', name:'联合收割机', code:'LHS002', model:'沃得 4LZ-5.0',    usage:'粮食收割', owner:'李四', type:'收割机',  svg:'harvester' },
  { id:'D003', name:'旋耕机',     code:'XGJ003', model:'东风 1GQN-200',   usage:'土地旋耕', owner:'王五', type:'旋耕机',  svg:'tiller'    },
  { id:'D004', name:'水泵',       code:'SB004',  model:'新界 80QZ-60',    usage:'农田灌溉', owner:'赵六', type:'水泵',    svg:'pump'      },
  { id:'D005', name:'撒肥机',     code:'SFJ005', model:'中联 2F-1000',    usage:'施肥作业', owner:'陈七', type:'撒肥机',  svg:'spreader'  },
  { id:'D006', name:'植保无人机', code:'UAV006', model:'大疆 T40',        usage:'植保喷洒', owner:'王强', type:'无人机',  svg:'drone'     }
]
```

- [ ] **Step 3: 写 `src/mock/storage.ts`**

```ts
import type { Plan } from '@/types/maintPlan'

const KEY = 'lx_maint_plans_v3'

export const storage = {
  read(): Plan[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Plan[]) : []
    } catch { return [] }
  },
  write(plans: Plan[]): void {
    localStorage.setItem(KEY, JSON.stringify(plans))
  }
}
```

- [ ] **Step 4: 写 `src/mock/seed.ts`**

```ts
import type { Plan } from '@/types/maintPlan'

const ts = (s: string) => Date.parse(s + 'T08:00:00')

export const SEED_PLANS: Plan[] = [
  {
    id:'1', deviceId:'D001', deviceName:'拖拉机', deviceCode:'TR001', modelSpec:'约翰迪尔 6B-1204', usage:'耕地作业',
    thisDate:'2026-08-10', owner:'张三', status:'undone',
    items:[
      { id:'i1', content:'更换机油与机滤', cycleValue:250, cycleUnit:'小时', nextDate:'2026-10-10' },
      { id:'i2', content:'检查轮胎气压与螺栓紧固', cycleValue:30, cycleUnit:'天', nextDate:'2026-10-25' },
      { id:'i3', content:'清洁空气滤清器', cycleValue:500, cycleUnit:'小时', nextDate:'2026-12-20' }
    ],
    createdAt: ts('2026-08-10'), updatedAt: ts('2026-08-10')
  },
  {
    id:'2', deviceId:'D002', deviceName:'联合收割机', deviceCode:'LHS002', modelSpec:'沃得 4LZ-5.0', usage:'粮食收割',
    thisDate:'2026-08-15', owner:'李四', status:'done',
    items:[
      { id:'i1', content:'割台链条润滑与张紧', cycleValue:200, cycleUnit:'小时', nextDate:'2026-09-30' },
      { id:'i2', content:'脱粒滚筒间隙检查', cycleValue:400, cycleUnit:'小时', nextDate:'2026-11-15' }
    ],
    createdAt: ts('2026-08-15'), updatedAt: ts('2026-08-15')
  },
  {
    id:'3', deviceId:'D003', deviceName:'旋耕机', deviceCode:'XGJ003', modelSpec:'东风 1GQN-200', usage:'土地旋耕',
    thisDate:'2026-08-01', owner:'王五', status:'undone',
    items:[{ id:'i1', content:'旋耕刀片检查更换', cycleValue:100, cycleUnit:'小时', nextDate:'2026-10-01' }],
    createdAt: ts('2026-08-01'), updatedAt: ts('2026-08-01')
  },
  {
    id:'4', deviceId:'D004', deviceName:'水泵', deviceCode:'SB004', modelSpec:'新界 80QZ-60', usage:'农田灌溉',
    thisDate:'2026-07-20', owner:'赵六', status:'undone',
    items:[{ id:'i1', content:'轴承润滑与密封检查', cycleValue:500, cycleUnit:'小时', nextDate:'2026-12-20' }],
    createdAt: ts('2026-07-20'), updatedAt: ts('2026-07-20')
  },
  {
    id:'5', deviceId:'D005', deviceName:'撒肥机', deviceCode:'SFJ005', modelSpec:'中联 2F-1000', usage:'施肥作业',
    thisDate:'2026-08-12', owner:'陈七', status:'done',
    items:[{ id:'i1', content:'撒播链条张紧与润滑', cycleValue:300, cycleUnit:'小时', nextDate:'2026-11-12' }],
    createdAt: ts('2026-08-12'), updatedAt: ts('2026-08-12')
  },
  {
    id:'6', deviceId:'D006', deviceName:'植保无人机', deviceCode:'UAV006', modelSpec:'大疆 T40', usage:'植保喷洒',
    thisDate:'2026-06-10', owner:'王强', status:'undone',
    items:[
      { id:'i1', content:'桨叶检查更换', cycleValue:60, cycleUnit:'天', nextDate:'2026-09-10' },  // 逾期
      { id:'i2', content:'喷洒系统校准', cycleValue:90, cycleUnit:'天', nextDate:'2026-11-01' }
    ],
    createdAt: ts('2026-06-10'), updatedAt: ts('2026-06-10')
  }
]
```

- [ ] **Step 5: 写失败测试 `src/__tests__/mockHandlers.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mock/handlers'
import { storage } from '@/mock/storage'
import { SEED_PLANS } from '@/mock/seed'
import { apiClient } from '@/api/client'
import { listPlans, getPlan, createPlan, updatePlan, markPlanDone } from '@/api/maintPlan'
import { getDict } from '@/api/dict'
import { searchDevices } from '@/api/device'

const server = setupServer(...handlers)

beforeEach(() => {
  localStorage.clear()
  storage.write(structuredClone(SEED_PLANS))
  apiClient.setToken('mock')
})

describe('mock handlers', () => {
  it.each([[true]])('boots once', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    server.resetHandlers()
  })

  it('GET /api/dict/maint_cycle_unit returns array', async () => {
    server.listen()
    const units = await getDict('maint_cycle_unit')
    expect(units).toEqual(['小时','天','公里'])
    server.close()
  })

  it('GET /api/device filters by keyword', async () => {
    server.listen()
    const list = await searchDevices('拖拉')
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]!.name).toContain('拖拉')
    server.close()
  })

  it('GET /api/maint-plan attaches derived fields', async () => {
    server.listen()
    const list = await listPlans()
    const p1 = list.find(p => p.id === '1')!
    expect(p1.planNextDate).toBe('2026-10-10')
    expect(p1.deviceType).toBe('拖拉机')
    expect(p1.deviceSvg).toBe('tractor')
    const p6 = list.find(p => p.id === '6')!
    expect(p6.overdue).toBe(true)
    server.close()
  })

  it('POST /api/maint-plan persists and returns derived', async () => {
    server.listen()
    const created = await createPlan({
      deviceId:null, deviceName:'新设备', deviceCode:'X-9', modelSpec:'M', usage:'U',
      thisDate:'2026-09-01', owner:'王强', status:'undone',
      items:[{ id:'i1', content:'x', cycleValue:10, cycleUnit:'天', nextDate:'2026-09-20' }]
    })
    expect(created.id).toBeTruthy()
    expect(created.planNextDate).toBe('2026-09-20')
    expect(storage.read().find(p => p.id === created.id)).toBeDefined()
    server.close()
  })

  it('PUT /api/maint-plan/:id/status marks done', async () => {
    server.listen()
    const updated = await markPlanDone('1')
    expect(updated.status).toBe('done')
    expect(updated.overdue).toBe(false)
    server.close()
  })

  it('PUT /api/maint-plan/:id updates full record', async () => {
    server.listen()
    const p = await getPlan('1')
    p.owner = '新责任人'
    const updated = await updatePlan('1', {
      deviceId:p.deviceId, deviceName:p.deviceName, deviceCode:p.deviceCode, modelSpec:p.modelSpec, usage:p.usage,
      thisDate:p.thisDate, owner:p.owner, status:p.status, items:p.items
    })
    expect(updated.owner).toBe('新责任人')
    server.close()
  })
})
```

- [ ] **Step 6: 运行测试确认失败**

```bash
pnpm test -- mockHandlers
```

- [ ] **Step 7: 实现 `src/mock/handlers.ts`**

```ts
import { http, HttpResponse } from 'msw'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'
import { storage } from './storage'
import { DEVICES } from './devices'
import { planNextDate, isOverdue, deriveLastDate } from '@/utils/date'

function withDerived(plan: Plan, all: Plan[]): PlanWithDerived {
  const dev = DEVICES.find(d => d.id === plan.deviceId) ?? DEVICES.find(d => d.code === plan.deviceCode)
  return {
    ...plan,
    planNextDate: planNextDate(plan.items),
    overdue: isOverdue(plan),
    lastDate: deriveLastDate(plan, all),
    deviceType: dev?.type,
    deviceSvg: dev?.svg
  }
}

function newId(prefix: string) { return prefix + '_' + Math.random().toString(36).slice(2, 9) }

export const handlers = [
  http.post('/api/auth/exchange', async () =>
    HttpResponse.json({ token: 'mock-token', user: { name: '王强', role: 'device_owner' } })),

  http.get('/api/dict/:type', ({ params }) => {
    if (params.type === 'maint_cycle_unit') return HttpResponse.json(['小时','天','公里'])
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
]
```

- [ ] **Step 8: 写 `src/mock/browser.ts`**

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { storage } from './storage'
import { SEED_PLANS } from './seed'

export async function startMockWorker(): Promise<void> {
  if (storage.read().length === 0) storage.write(SEED_PLANS)
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
```

- [ ] **Step 9: 修改 `src/main.ts` 条件启动**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    const { startMockWorker } = await import('./mock/browser')
    await startMockWorker()
  }
  createApp(App).mount('#app')
}

bootstrap()
```

- [ ] **Step 10: 运行 handler 单测**

```bash
pnpm test -- mockHandlers
```
预期：全绿。

- [ ] **Step 11: 浏览器验证**

```bash
pnpm dev
```
在 DevTools Console 执行：
```js
await fetch('/api/dict/maint_cycle_unit').then(r=>r.json())
await fetch('/api/maint-plan').then(r=>r.json())
```
预期：分别返回单位数组与 6 条种子计划（含 id=6 植保无人机逾期，且记录带 deviceType/deviceSvg）。

- [ ] **Step 12: 提交**

```bash
git add -A
git commit -m "feat(mock): MSW handlers, storage, seed with tests"
```

---

### Task 6: Pinia stores 与排序测试

**Files:**
- Create: `src/stores/maintPlan.ts`, `src/stores/device.ts`, `src/stores/dict.ts`, `src/stores/auth.ts`, `src/__tests__/maintPlanStore.spec.ts`
- Modify: `src/main.ts` — `createPinia()` 注入

**Interfaces:**
- Consumes: API 层（Task 4）+ 类型（Task 3）
- Produces:
  - `useMaintPlanStore()`：state `list: PlanWithDerived[]`, `current: PlanWithDerived|null`, `loading: boolean`, `keyword: string`, `statusFilter: 'all'|'undone'|'done'`, `typeFilter: string`（'' = 全部）, `ownerFilter: string`（'' = 全部）
    - actions: `fetchList()`, `fetchOne(id)`, `create(payload)`, `update(id, payload)`, `markDone(id)`
    - getters: `filteredSortedList: PlanWithDerived[]` — 关键字（deviceName/deviceCode 包含）+ 状态 + 设备类型（deviceType）+ 负责人（owner）过滤；未完成在前按 `planNextDate` 升序，已完成在后按 `thisDate` 降序
    - getters: `typeOptions: string[]`（list 中 deviceType 去重）、`ownerOptions: string[]`（list 中 owner 去重）— 供 FilterBar 下拉
    - counters: `countAll`, `countUndone`, `countDone`
  - `useDeviceStore()`：`search(keyword): Promise<Device[]>`（不缓存）
  - `useDictStore()`：`cycleUnits: string[]`；`loadCycleUnits()`（懒加载，缓存）
  - `useAuthStore()`：`token`, `user`, `bootstrap(ticket?: string)`；bootstrap 调 `exchangeTicket` 并 `apiClient.setToken`

- [ ] **Step 1: 写失败测试 `src/__tests__/maintPlanStore.spec.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMaintPlanStore } from '@/stores/maintPlan'
import type { PlanWithDerived } from '@/types/maintPlan'

vi.mock('@/api/maintPlan', () => ({
  listPlans: vi.fn(),
  getPlan: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  markPlanDone: vi.fn()
}))
import * as api from '@/api/maintPlan'

const mk = (id: string, over: Partial<PlanWithDerived>): PlanWithDerived => ({
  id, deviceId:null, deviceName:'A', deviceCode:'D', modelSpec:'', usage:'', thisDate:'2026-01-01', owner:'x',
  status:'undone', items:[], createdAt:0, updatedAt:0, planNextDate:'2026-01-01', overdue:false, lastDate:null, ...over
})

describe('maintPlan store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('fetchList populates list and counters', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { status:'undone' }), mk('b', { status:'done' }), mk('c', { status:'undone' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    expect(s.list.length).toBe(3)
    expect(s.countUndone).toBe(2)
    expect(s.countDone).toBe(1)
  })

  it('filteredSortedList sorts undone by planNextDate asc, done by thisDate desc', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('u1', { status:'undone', planNextDate:'2026-10-01' }),
      mk('d1', { status:'done', thisDate:'2026-05-01' }),
      mk('u2', { status:'undone', planNextDate:'2026-09-15' }),
      mk('d2', { status:'done', thisDate:'2026-08-01' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    const ids = s.filteredSortedList.map(p => p.id)
    expect(ids).toEqual(['u2','u1','d2','d1'])
  })

  it('filteredSortedList filters by keyword and status', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { deviceName:'拖拉机', status:'undone' }),
      mk('b', { deviceName:'收割机', status:'done' }),
      mk('c', { deviceCode:'X-拖拉', status:'undone' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    s.keyword = '拖拉'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.statusFilter = 'undone'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.statusFilter = 'done'
    expect(s.filteredSortedList).toEqual([])
  })

  it('filteredSortedList filters by deviceType and owner; options derived from list', async () => {
    (api.listPlans as any).mockResolvedValue([
      mk('a', { deviceType:'拖拉机', owner:'张三' }),
      mk('b', { deviceType:'收割机', owner:'李四' }),
      mk('c', { deviceType:'拖拉机', owner:'王五' })
    ])
    const s = useMaintPlanStore()
    await s.fetchList()
    expect(s.typeOptions).toEqual(['拖拉机','收割机'])
    expect(s.ownerOptions).toEqual(['张三','李四','王五'])
    s.typeFilter = '拖拉机'
    expect(s.filteredSortedList.map(p => p.id).sort()).toEqual(['a','c'])
    s.ownerFilter = '王五'
    expect(s.filteredSortedList.map(p => p.id)).toEqual(['c'])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- maintPlanStore
```

- [ ] **Step 3: 实现 `src/stores/maintPlan.ts`**

```ts
import { defineStore } from 'pinia'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'
import { listPlans, getPlan, createPlan as apiCreate, updatePlan as apiUpdate, markPlanDone as apiMarkDone } from '@/api/maintPlan'

type PlanPayload = Omit<Plan,'id'|'createdAt'|'updatedAt'>

interface State {
  list: PlanWithDerived[]
  current: PlanWithDerived | null
  loading: boolean
  keyword: string
  statusFilter: 'all'|'undone'|'done'
  typeFilter: string
  ownerFilter: string
}

export const useMaintPlanStore = defineStore('maintPlan', {
  state: (): State => ({ list: [], current: null, loading: false, keyword: '', statusFilter: 'all', typeFilter: '', ownerFilter: '' }),
  getters: {
    countAll: (s) => s.list.length,
    countUndone: (s) => s.list.filter(p => p.status === 'undone').length,
    countDone: (s) => s.list.filter(p => p.status === 'done').length,
    typeOptions: (s) => [...new Set(s.list.map(p => p.deviceType).filter((t): t is string => !!t))],
    ownerOptions: (s) => [...new Set(s.list.map(p => p.owner).filter(Boolean))],
    filteredSortedList(s): PlanWithDerived[] {
      const kw = s.keyword.trim()
      const filtered = s.list.filter(p => {
        if (s.statusFilter !== 'all' && p.status !== s.statusFilter) return false
        if (s.typeFilter && p.deviceType !== s.typeFilter) return false
        if (s.ownerFilter && p.owner !== s.ownerFilter) return false
        if (kw && !(p.deviceName.includes(kw) || p.deviceCode.includes(kw))) return false
        return true
      })
      return filtered.slice().sort((a, b) => {
        if (a.status !== b.status) return a.status === 'undone' ? -1 : 1
        if (a.status === 'undone') return a.planNextDate.localeCompare(b.planNextDate)
        return b.thisDate.localeCompare(a.thisDate)
      })
    }
  },
  actions: {
    async fetchList() {
      this.loading = true
      try { this.list = await listPlans() } finally { this.loading = false }
    },
    async fetchOne(id: string) {
      this.loading = true
      try { this.current = await getPlan(id) } finally { this.loading = false }
    },
    async create(payload: PlanPayload) { return apiCreate(payload) },
    async update(id: string, payload: PlanPayload) { return apiUpdate(id, payload) },
    async markDone(id: string) {
      const updated = await apiMarkDone(id)
      if (this.current?.id === id) this.current = updated
      const idx = this.list.findIndex(p => p.id === id)
      if (idx >= 0) this.list[idx] = updated
      return updated
    }
  }
})
```

- [ ] **Step 4: 实现另外三个 store**

`src/stores/device.ts`:
```ts
import { defineStore } from 'pinia'
import { searchDevices } from '@/api/device'
import type { Device } from '@/types/maintPlan'
export const useDeviceStore = defineStore('device', {
  state: () => ({ results: [] as Device[] }),
  actions: {
    async search(keyword: string) {
      this.results = keyword ? await searchDevices(keyword) : []
      return this.results
    }
  }
})
```

`src/stores/dict.ts`:
```ts
import { defineStore } from 'pinia'
import { getDict } from '@/api/dict'
export const useDictStore = defineStore('dict', {
  state: () => ({ cycleUnits: [] as string[] }),
  actions: {
    async loadCycleUnits() {
      if (this.cycleUnits.length) return this.cycleUnits
      this.cycleUnits = await getDict('maint_cycle_unit')
      return this.cycleUnits
    }
  }
})
```

`src/stores/auth.ts`:
```ts
import { defineStore } from 'pinia'
import { apiClient } from '@/api/client'
import { exchangeTicket } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '' as string, user: null as null | { name: string; role: string } }),
  actions: {
    async bootstrap(ticket?: string) {
      if (import.meta.env.VITE_USE_MOCK === '1') {
        apiClient.setToken('mock-token')
        this.token = 'mock-token'; this.user = { name: '王强', role: 'device_owner' }
        return
      }
      if (!ticket) return
      const res = await exchangeTicket(ticket)
      this.token = res.token; this.user = res.user
      apiClient.setToken(res.token)
    }
  }
})
```

- [ ] **Step 5: 修改 `src/main.ts` 注入 Pinia**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    const { startMockWorker } = await import('./mock/browser')
    await startMockWorker()
  }
  const app = createApp(App)
  app.use(createPinia())
  app.mount('#app')
}

bootstrap()
```

- [ ] **Step 6: 运行测试 + typecheck**

```bash
pnpm test
pnpm typecheck
```
预期：全绿。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(store): pinia stores with sort/filter tests"
```

---

### Task 7: 首页 · 路由 · bootstrapAuth

**Files:**
- Create: `src/router/index.ts`, `src/pages/Home.vue`, `src/pages/PlanList.vue`(占位), `src/pages/PlanForm.vue`(占位), `src/pages/PlanDetail.vue`(占位), `src/components/HomeSection.vue`
- Modify: `src/App.vue`, `src/main.ts`

**Interfaces:**
- Consumes: 组件 `<TopBar>`, `<Tabbar>`；store `useAuthStore`
- Produces:
  - `router`：`createWebHashHistory('/')`, 路由 `/home`（默认）、`/plan/list`、`/plan/form`、`/plan/detail`；catch-all → `/home`
  - `<HomeSection title>` slot 图标宫格（分区标题 = 渐变竖条 + 加粗标题，无卡片底）；首页 = 田园横幅（`HillsScene` 山丘 + 小程序胶囊占位 + 品牌行「老乡农场/数字化农场管理平台」+ 拖拉机插画）+ 三日天气条 + 统计卡浮层（田块总数量/当前种植面积/种植作物，-42px 上叠）+ 农事生产（8 图标）/农资进销存（8 图标）/设备保养（4 图标）/任务管理（4 图标）分区
  - 图标行为：保养计划「保」→ `/plan/list`；点检记录「点」/维修记录「修」/设备配件「配」→ `showToast('功能建设中')`；其余分区全部图标 → `showToast('原型仅开放设备保养模块')`

- [ ] **Step 1: 写 `src/router/index.ts`**

```ts
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/pages/Home.vue') },
  { path: '/plan/list', component: () => import('@/pages/PlanList.vue') },
  { path: '/plan/form', component: () => import('@/pages/PlanForm.vue') },
  { path: '/plan/detail', component: () => import('@/pages/PlanDetail.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

export const router = createRouter({ history: createWebHashHistory('/'), routes })
```

- [ ] **Step 2: 写 `src/components/HomeSection.vue`**

```vue
<template>
  <div class="section-title">{{ title }}</div>
  <div class="icon-grid"><slot /></div>
</template>
<script setup lang="ts">defineProps<{ title: string }>()</script>
<style scoped>
.section-title{display:flex;align-items:center;margin:24px 16px 14px;font-size:15px;font-weight:700;color:var(--color-text)}
.section-title::before{content:"";width:4px;height:14px;border-radius:2px;background:linear-gradient(180deg,#37B45C,#157A38);margin-right:8px}
.icon-grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:20px;padding:0 10px}
</style>
```

- [ ] **Step 3: 写 `src/pages/Home.vue`**

```vue
<template>
  <div class="page page-home">
    <div class="home-head">
      <HillsScene height="128px" />
      <div class="capsule"><span>•••</span><span>◎</span></div>
      <div class="brand">
        <span class="logo" v-html="ICONS.leaf"></span>
        <div><div class="bn">老乡农场</div><div class="bs">数字化农场管理平台</div></div>
        <div class="htr"><DeviceSvg kind="tractor" /></div>
      </div>
      <div class="weather">
        <div class="wtile" v-for="w in weather" :key="w.d">
          <span class="cl">☁</span>
          <span><div class="d1">{{ w.w }}</div><div class="d2">{{ w.d }}</div></span>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat" v-for="s in stats" :key="s.t">
        <div class="t"><span class="ic">{{ s.ic }}</span>{{ s.t }}</div>
        <div class="v1">{{ s.v1 }}</div>
        <div class="v2">{{ s.v2 }}</div>
      </div>
    </div>

    <HomeSection v-for="sec in sections" :key="sec.title" :title="sec.title">
      <button v-for="it in sec.items" :key="it.label" class="icon-item" @click="onIcon(it)">
        <span class="icon-circle" :class="it.color">{{ it.glyph }}</span>
        <span class="lb">{{ it.label }}</span>
      </button>
    </HomeSection>

    <Tabbar active="home" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { ICONS } from '@/components/icons'
import HillsScene from '@/components/HillsScene.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import HomeSection from '@/components/HomeSection.vue'
import Tabbar from '@/components/Tabbar.vue'

const router = useRouter()

const WEEK = ['周日','周一','周二','周三','周四','周五','周六']
const weather = [0,1,2].map(i => {
  const d = new Date(Date.now() + i * 86400e3)
  const p = (n: number) => String(n).padStart(2, '0')
  return { w: WEEK[d.getDay()]!, d: `${p(d.getMonth()+1)}/${p(d.getDate())}` }
})

const stats = [
  { ic:'田', t:'田块总数量', v1:'534块', v2:'14796 亩' },
  { ic:'苗', t:'当前种植面积', v1:'33.1%', v2:'4904 亩' },
  { ic:'穗', t:'种植作物', v1:'5作物', v2:'5 品种' }
]

interface HomeIcon { label: string; glyph: string; color: string; route?: string; toast?: string }
const sections: { title: string; items: HomeIcon[] }[] = [
  { title:'农事生产', items:[
    { label:'种植计划', glyph:'计', color:'g-orange' }, { label:'农事上报', glyph:'报', color:'g-green' },
    { label:'供货计划', glyph:'供', color:'g-orange' }, { label:'专家问答', glyph:'问', color:'g-blue' },
    { label:'智能问答', glyph:'Ai', color:'g-green' }, { label:'种植标准', glyph:'标', color:'g-teal' },
    { label:'病虫害识别', glyph:'虫', color:'g-purple' }, { label:'病虫害库', glyph:'库', color:'g-blue' } ] },
  { title:'农资进销存', items:[
    { label:'农资购买', glyph:'购', color:'g-green' }, { label:'农资领用', glyph:'领', color:'g-green' },
    { label:'有机肥管理', glyph:'肥', color:'g-green' }, { label:'农资盘点', glyph:'盘', color:'g-blue' },
    { label:'农资入库', glyph:'入', color:'g-gold' }, { label:'农资出库', glyph:'出', color:'g-teal' },
    { label:'农资退货', glyph:'退', color:'g-orange' }, { label:'农场农资', glyph:'场', color:'g-purple' } ] },
  { title:'设备保养', items:[
    { label:'保养计划', glyph:'保', color:'g-orange', route:'/plan/list' },
    { label:'点检记录', glyph:'点', color:'g-green', toast:'功能建设中' },
    { label:'维修记录', glyph:'修', color:'g-blue', toast:'功能建设中' },
    { label:'设备配件', glyph:'配', color:'g-purple', toast:'功能建设中' } ] },
  { title:'任务管理', items:[
    { label:'任务下达', glyph:'任', color:'g-gold' }, { label:'巡田', glyph:'巡', color:'g-blue' },
    { label:'巡检', glyph:'检', color:'g-purple' }, { label:'任务上报', glyph:'报', color:'g-green' } ] }
]

function onIcon(it: HomeIcon) {
  if (it.route) router.push(it.route)
  else showToast(it.toast ?? '原型仅开放设备保养模块')
}
</script>

<style scoped>
.page-home{padding-bottom:70px}
.home-head{position:relative;overflow:hidden;background:linear-gradient(180deg,#BCE0F2 0%,#D6EDD9 52%,#BFE3C4 100%);padding:12px 16px 72px}
.capsule{position:absolute;top:10px;right:12px;background:rgba(255,255,255,.55);border-radius:15px;height:30px;display:flex;align-items:center;padding:0 12px;gap:10px;font-size:13px;color:#33543F;z-index:3}
.brand{position:relative;z-index:2;display:flex;align-items:center;gap:10px;margin-top:30px}
.brand .logo{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(30,80,50,.14);flex-shrink:0}
.brand .logo :deep(svg){width:26px;height:26px}
.bn{font-size:21px;font-weight:800;color:var(--color-primary-xdark);letter-spacing:1px}
.bs{font-size:11px;color:#3E6B4C;margin-top:3px}
.htr{margin-left:auto;width:96px;height:66px;flex-shrink:0}
.weather{display:flex;gap:8px;margin-top:16px;position:relative;z-index:2}
.wtile{flex:1;background:rgba(255,255,255,.6);border-radius:12px;padding:9px 10px;display:flex;align-items:center;gap:8px}
.wtile .cl{font-size:20px}
.wtile .d1{font-size:13px;color:var(--color-text);font-weight:600}
.wtile .d2{font-size:11px;color:var(--color-text-3)}
.stats{background:#fff;border:1px solid var(--color-line);border-radius:16px;margin:-42px 16px 0;padding:16px 8px;display:flex;position:relative;z-index:3;box-shadow:var(--shadow-card)}
.stat{flex:1;text-align:center}
.stat .t{display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:var(--color-text-3)}
.stat .ic{width:20px;height:20px;border-radius:6px;background:var(--color-done-bg);color:var(--color-primary);font-size:12px;display:flex;align-items:center;justify-content:center}
.stat .v1{font-size:17px;font-weight:700;color:var(--color-text);margin-top:8px}
.stat .v2{font-size:12px;font-weight:600;color:var(--color-primary);margin-top:5px}
.icon-item{display:flex;flex-direction:column;align-items:center;gap:7px;border:none;background:none;cursor:pointer}
.icon-circle{width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 5px 12px rgba(30,80,50,.16)}
.lb{font-size:12px;color:var(--color-text-2)}
.g-orange{background:linear-gradient(135deg,#F6B352,#E8833A)}
.g-green{background:linear-gradient(135deg,#43C465,#1FA14A)}
.g-blue{background:linear-gradient(135deg,#5FB9E8,#2A7FC1)}
.g-purple{background:linear-gradient(135deg,#A493EE,#7459E0)}
.g-teal{background:linear-gradient(135deg,#4CCBB6,#25A08C)}
.g-gold{background:linear-gradient(135deg,#F2C14E,#DE9B23)}
</style>
```

- [ ] **Step 4: 写占位页面（Task 8/9/10 会替换）**

`src/pages/PlanList.vue`:
```vue
<template><div class="page"><TopBar title="保养计划" back @back="$router.back()" /><p style="padding:16px">列表页占位</p></div></template>
<script setup lang="ts">import TopBar from '@/components/TopBar.vue'</script>
```

`src/pages/PlanForm.vue`:
```vue
<template><div class="page"><TopBar title="保养计划" back @back="$router.back()" /><p style="padding:16px">表单页占位</p></div></template>
<script setup lang="ts">import TopBar from '@/components/TopBar.vue'</script>
```

`src/pages/PlanDetail.vue`:
```vue
<template><div class="page"><TopBar title="保养详情" back @back="$router.back()" /><p style="padding:16px">详情页占位</p></div></template>
<script setup lang="ts">import TopBar from '@/components/TopBar.vue'</script>
```

- [ ] **Step 5: 修改 `src/App.vue` 挂 `<router-view>`**

```vue
<template><router-view /></template>
<script setup lang="ts"></script>
```

- [ ] **Step 6: 修改 `src/main.ts` 注册路由并 bootstrap auth**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { apiClient } from './api/client'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    const { startMockWorker } = await import('./mock/browser')
    await startMockWorker()
  }
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)

  const { useAuthStore } = await import('./stores/auth')
  const auth = useAuthStore()
  const params = new URLSearchParams(location.search)
  await auth.bootstrap(params.get('ticket') ?? undefined)

  apiClient.on('auth-expired', () => { location.reload() })

  app.mount('#app')
}

bootstrap()
```

- [ ] **Step 7: 浏览器冒烟**

```bash
pnpm dev
```
预期：进入 `#/home` 可见田园横幅（山丘场景+品牌行+三日天气条）、统计卡浮层、4 分区图标宫格、tabbar；点「保」→ `#/plan/list`；「点/修/配」→ toast「功能建设中」；其余分区图标 → toast「原型仅开放设备保养模块」；未匹配 hash 兜回首页。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat(page): home + router + auth bootstrap"
```

---

### Task 8: 保养计划列表页 · PlanCard · FilterBar

**Files:**
- Create: `src/components/PlanCard.vue`, `src/components/FilterBar.vue`
- Modify: `src/pages/PlanList.vue`

**Interfaces:**
- Consumes: `useMaintPlanStore`（含 typeFilter/ownerFilter/typeOptions/ownerOptions）, 组件 `<HillsScene>`, `<DeviceSvg>`, `<Tag>`, `<EmptyState>`, `<Tabbar>`, `ICONS`
- Produces:
  - `<PlanCard :plan="p" @click />` — 卡片解剖：64px `DeviceSvg` 插画 + 行1（名称 nowrap 省略 / 编号 chip / 共 N 项）+ 三信息行（型号规格/设备用途/负责人）+ 右侧标签列（未完成|已完成 + 已逾期 + ›）+ 三列统计（保养周期=最早项 `cycleValue cycleUnit` / 上次保养 thisDate / 下次保养 planNextDate，逾期红）
  - `<FilterBar v-model:type v-model:status v-model:owner :type-options :owner-options @reset />` — 三枚筛选 chip（设备类型/保养完成情况/负责人）+「筛选」重置钮；点击 chip 展开单一下拉面板（含「全部」+ 选项，当前项 ✓ 高亮），再点同 chip 或点击页外收起
  - `PlanList.vue` — 田园横幅（返回/标题/新增胶囊钮 + 品牌行 + 拖拉机插画）+ 白色 sheet 叠层（-22px 上叠、20px 圆角）+ 搜索框 + FilterBar + 卡片列表 +「共 N 条记录」+ tabbar（设备高亮）；**无 FAB**

- [ ] **Step 1: 写 `PlanCard.vue`**

```vue
<template>
  <article class="dvcard" @click="$emit('click')">
    <div class="dc-top">
      <div class="dc-img"><DeviceSvg :kind="plan.deviceSvg" /></div>
      <div class="dc-main">
        <div class="dc-line1">
          <span class="dc-name">{{ plan.deviceName }}</span>
          <span class="dc-chip">{{ plan.deviceCode }}</span>
          <span class="dc-cnt">共 {{ plan.items.length }} 项</span>
        </div>
        <div class="dc-row">型号规格：{{ plan.modelSpec }}</div>
        <div class="dc-row">设备用途：{{ plan.usage }}</div>
        <div class="dc-row">负责人：{{ plan.owner }}</div>
      </div>
      <div class="dc-side">
        <div class="dc-tags">
          <Tag :variant="plan.status==='done' ? 'done' : 'undone'">{{ plan.status==='done' ? '已完成' : '未完成' }}</Tag>
          <Tag v-if="plan.overdue" variant="overdue">已逾期</Tag>
        </div>
        <span class="dc-arrow">›</span>
      </div>
    </div>
    <div class="dc-stats">
      <div class="ds">
        <span class="ds-ic" v-html="ICONS.clock"></span>
        <span class="ds-tx"><span class="ds-lb">保养周期</span><span class="ds-vl">{{ nextItemCycle }}</span></span>
      </div>
      <div class="ds">
        <span class="ds-ic" v-html="ICONS.cal"></span>
        <span class="ds-tx"><span class="ds-lb">上次保养</span><span class="ds-vl">{{ plan.thisDate }}</span></span>
      </div>
      <div class="ds">
        <span class="ds-ic" v-html="ICONS.cal"></span>
        <span class="ds-tx"><span class="ds-lb">下次保养</span><span class="ds-vl" :class="{ late: plan.overdue }">{{ plan.planNextDate }}</span></span>
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { PlanWithDerived } from '@/types/maintPlan'
import { ICONS } from '@/components/icons'
import DeviceSvg from '@/components/DeviceSvg.vue'
import Tag from '@/components/Tag.vue'

const props = defineProps<{ plan: PlanWithDerived }>()
defineEmits<{ click: [] }>()

const nextItemCycle = computed(() => {
  const ni = props.plan.items.slice().sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0]
  return ni ? `${ni.cycleValue} ${ni.cycleUnit}` : '-'
})
</script>
<style scoped>
.dvcard{background:#fff;border:1px solid var(--color-line);border-radius:14px;margin:0 14px 12px;padding:12px 12px 0;box-shadow:var(--shadow-card);cursor:pointer}
.dc-top{display:flex;gap:10px}
.dc-img{width:64px;height:64px;border-radius:12px;background:linear-gradient(160deg,#F2F9F3,#E2F1E6);border:1px solid #E4F0E6;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:4px}
.dc-main{flex:1;min-width:0}
.dc-line1{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dc-name{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dc-chip{background:var(--color-chip-bg);color:var(--color-chip-fg);border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600}
.dc-cnt{font-size:11px;color:var(--color-text-3);margin-left:auto;flex-shrink:0}
.dc-row{font-size:12px;color:var(--color-text-2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;flex-shrink:0;padding-bottom:2px}
.dc-arrow{color:#C2CCC4;font-size:18px;line-height:1;font-family:serif}
.dc-tags{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.dc-stats{display:flex;border-top:1px solid #F0F5F0;margin-top:10px;padding:9px 0 11px}
.ds{flex:1;display:flex;align-items:center;gap:6px;justify-content:center;min-width:0}
.ds+.ds{border-left:1px solid #F0F5F0}
.ds-ic{width:15px;height:15px;color:#8FB89B;flex-shrink:0}
.ds-ic :deep(svg){width:100%;height:100%}
.ds-tx{display:flex;flex-direction:column;min-width:0}
.ds-lb{font-size:10px;color:var(--color-text-3)}
.ds-vl{font-size:13px;font-weight:700;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ds-vl.late{color:var(--color-overdue-bg)}
</style>
```

注意：`.dc-name` 的 `nowrap+ellipsis` 与 `.dc-line1` 的 `flex-wrap:wrap` 是原型缺陷修复点（名称过长时标签挤压导致逐字竖排），移植时不可省略。

- [ ] **Step 2: 写 `FilterBar.vue`**

```vue
<template>
  <div class="filter-row">
    <button v-for="f in defs" :key="f.key" class="fchip" :class="{ on: !isAll(f.key) }" @click.stop="toggle(f.key)">
      <span class="cv">{{ chipLabel(f.key) }}</span>
      <span class="fi" v-html="ICONS.down"></span>
    </button>
    <button class="freset" @click.stop="$emit('reset')"><span class="fi" v-html="ICONS.funnel"></span>筛选</button>
    <div v-if="openKey" class="fdrop" @click.stop>
      <div v-for="opt in openOptions" :key="opt.value || 'all'" class="opt" :class="{ on: opt.value === props[openKey] }" @click="choose(openKey, opt.value)">
        {{ opt.label }}
        <span v-if="opt.value === props[openKey]" class="ck" v-html="ICONS.check"></span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ICONS } from '@/components/icons'

type FilterKey = 'type' | 'status' | 'owner'
const props = defineProps<{
  type: string                              // '' = 全部
  status: 'all' | 'undone' | 'done'
  owner: string                             // '' = 全部
  typeOptions: string[]
  ownerOptions: string[]
}>()
const emit = defineEmits<{
  'update:type': [string]
  'update:status': ['all' | 'undone' | 'done']
  'update:owner': [string]
  reset: []
}>()

const defs = [
  { key: 'type',   all: '设备类型' },
  { key: 'status', all: '保养完成情况' },
  { key: 'owner',  all: '负责人' }
] as const

const openKey = ref<FilterKey | null>(null)
const allValue = (k: FilterKey) => (k === 'status' ? 'all' : '')
const isAll = (k: FilterKey) => props[k] === allValue(k)
const optLabel = (k: FilterKey, v: string) => k === 'status' ? (v === 'done' ? '已完成' : '未完成') : v
const chipLabel = (k: FilterKey) => isAll(k) ? defs.find(d => d.key === k)!.all : optLabel(k, props[k])
const optionsFor = (k: FilterKey): string[] =>
  k === 'type' ? props.typeOptions : k === 'status' ? ['undone', 'done'] : props.ownerOptions
const openOptions = computed(() => {
  const k = openKey.value
  if (!k) return []
  return [{ value: allValue(k), label: '全部' }, ...optionsFor(k).map(v => ({ value: v, label: optLabel(k, v) }))]
})

function toggle(k: FilterKey) { openKey.value = openKey.value === k ? null : k }
function choose(k: FilterKey, v: string) {
  if (k === 'status') emit('update:status', v as 'all' | 'undone' | 'done')
  else if (k === 'type') emit('update:type', v)
  else emit('update:owner', v)
  openKey.value = null
}
const close = () => { openKey.value = null }
onMounted(() => document.addEventListener('click', close))
onBeforeUnmount(() => document.removeEventListener('click', close))
</script>
<style scoped>
.filter-row{display:flex;gap:8px;margin:0 14px 4px;position:relative;align-items:center}
.fchip{border:1px solid var(--color-line);background:#fff;border-radius:8px;padding:7px 8px;font-size:12px;color:var(--color-text-2);display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer}
.fchip .cv{max-width:60px;overflow:hidden;text-overflow:ellipsis}
.fchip.on{border-color:var(--color-primary);color:var(--color-primary);font-weight:600;background:#F2FAF4}
.fi{width:10px;height:10px;flex-shrink:0;display:inline-flex}
.fi :deep(svg){width:100%;height:100%}
.freset{margin-left:auto;border:1px solid var(--color-line);background:#fff;border-radius:8px;padding:7px 10px;font-size:12px;color:var(--color-text-2);display:flex;align-items:center;gap:4px;flex-shrink:0;cursor:pointer}
.freset .fi{width:13px;height:13px}
.fdrop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border-radius:12px;box-shadow:0 10px 28px rgba(20,60,35,.16);z-index:35;overflow:hidden;border:1px solid var(--color-line)}
.opt{padding:11px 14px;font-size:13px;color:var(--color-text);display:flex;align-items:center;border-bottom:1px solid #F2F6F2;cursor:pointer}
.opt:last-child{border-bottom:none}
.opt.on{color:var(--color-primary);font-weight:600}
.opt .ck{margin-left:auto;color:var(--color-primary);width:14px;height:14px;display:inline-flex}
.opt .ck :deep(svg){width:100%;height:100%}
</style>
```

- [ ] **Step 3: 实现 `src/pages/PlanList.vue`**

```vue
<template>
  <div class="page page-list">
    <div class="hero-banner">
      <HillsScene height="122px" />
      <div class="hb-nav">
        <button class="hb-back" aria-label="返回" @click="$router.push('/home')"><span class="fi" v-html="ICONS.chev"></span></button>
        <span class="hb-title">保养计划</span>
        <button class="hb-add" @click="$router.push('/plan/form')">新增</button>
      </div>
      <div class="hb-brand">
        <span class="hb-logo" v-html="ICONS.leaf"></span>
        <div><div class="hb-name">老乡农场</div><div class="hb-slogan">设备保养 · 让农机更高效</div></div>
      </div>
      <div class="hb-tractor"><DeviceSvg kind="tractor" /></div>
    </div>

    <div class="sheet">
      <div class="search">
        <span class="sic" v-html="ICONS.search"></span>
        <input v-model="store.keyword" placeholder="请输入设备名称或设备编号查询" />
      </div>
      <FilterBar
        v-model:type="store.typeFilter"
        v-model:status="store.statusFilter"
        v-model:owner="store.ownerFilter"
        :type-options="store.typeOptions"
        :owner-options="store.ownerOptions"
        @reset="onReset"
      />
      <div class="list-body">
        <div v-if="store.loading" class="list-loading">加载中…</div>
        <template v-else>
          <PlanCard v-for="p in store.filteredSortedList" :key="p.id" :plan="p"
            @click="$router.push({ path: '/plan/detail', query: { id: p.id } })" />
          <EmptyState v-if="!store.filteredSortedList.length" text="暂无保养计划，点击右上角「新增」录入第一条计划" />
        </template>
      </div>
      <div v-if="store.filteredSortedList.length" class="list-count">共 {{ store.filteredSortedList.length }} 条记录</div>
    </div>

    <Tabbar active="device" />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { ICONS } from '@/components/icons'
import HillsScene from '@/components/HillsScene.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import FilterBar from '@/components/FilterBar.vue'
import PlanCard from '@/components/PlanCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Tabbar from '@/components/Tabbar.vue'
import { useMaintPlanStore } from '@/stores/maintPlan'

const store = useMaintPlanStore()
function onReset() {
  store.keyword = ''; store.typeFilter = ''; store.statusFilter = 'all'; store.ownerFilter = ''
}
onMounted(() => store.fetchList())
</script>
<style scoped>
.page-list{padding-bottom:0}
.hero-banner{position:relative;height:186px;overflow:hidden;background:linear-gradient(180deg,#BCE0F2 0%,#D8EEDA 58%,#C6E7CA 100%)}
.hb-nav{position:relative;z-index:5;display:flex;align-items:center;height:48px;padding:0 12px;gap:8px}
.hb-back{width:32px;height:32px;border:none;background:rgba(255,255,255,.65);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);flex-shrink:0;cursor:pointer}
.hb-back .fi{width:19px;height:19px;display:inline-flex}
.hb-back .fi :deep(svg){width:100%;height:100%}
.hb-title{flex:1;text-align:center;font-size:17px;font-weight:700;color:var(--color-text)}
.hb-add{border:none;background:var(--color-primary);color:#fff;font-size:13px;font-weight:600;border-radius:16px;padding:7px 15px;box-shadow:0 4px 10px rgba(21,122,56,.35);flex-shrink:0;cursor:pointer}
.hb-brand{position:relative;z-index:4;display:flex;align-items:center;gap:10px;padding:8px 16px 0}
.hb-logo{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(30,80,50,.14);flex-shrink:0}
.hb-logo :deep(svg){width:24px;height:24px}
.hb-name{font-size:19px;font-weight:800;color:var(--color-primary-xdark);letter-spacing:1px}
.hb-slogan{font-size:11px;color:#3E6B4C;margin-top:3px}
.hb-tractor{position:absolute;right:2px;bottom:12px;width:158px;height:104px;z-index:3}
.sheet{position:relative;z-index:6;margin-top:-22px;background:#fff;border-radius:20px 20px 0 0;padding:14px 0 76px;min-height:calc(100vh - 164px)}
.search{margin:0 14px 10px;position:relative}
.search input{width:100%;height:38px;border:1px solid var(--color-line);border-radius:19px;background:#F4F8F4;padding:0 14px 0 36px;font-size:13px;outline:none}
.search input::placeholder{color:#9AB0A0}
.sic{position:absolute;left:12px;top:10px;width:17px;height:17px;color:#9AB0A0;display:inline-flex}
.sic :deep(svg){width:100%;height:100%}
.list-body{margin-top:10px}
.list-loading{padding:24px;text-align:center;color:var(--color-text-3)}
.list-count{text-align:center;font-size:12px;color:var(--color-text-3);padding:0 0 18px}
</style>
```

- [ ] **Step 4: 浏览器验收**

```bash
pnpm dev
```
预期：
- 田园横幅（山丘 + 返回/标题/新增胶囊 + 品牌行 + 拖拉机插画）+ 白色 sheet 叠层 + tabbar「设备」高亮
- 6 条种子计划显示：未完成 4 条在前按最早 nextDate 升序（UAV006 无人机 2026-09-10 逾期红标居首 → 旋耕机 → 拖拉机 → 水泵），已完成 2 条在后按 thisDate 降序（收割机 → 撒肥机）；卡片含设备插画、三信息行、三列统计；底部「共 6 条记录」
- 搜索「拖拉」只剩 1 条；清空恢复
- 筛选行：设备类型选「拖拉机」只剩 1 条；负责人选「王强」只剩 1 条（无人机）；保养完成情况选「已完成」剩 2 条；再点同 chip 或点击页外收起下拉；点「筛选」重置恢复 6 条
- 横幅右上「新增」跳 `/plan/form`（占位页）；无 FAB
- 空态引导（搜索词无结果时可见）

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(page): plan list + PlanCard + FilterBar"
```

---

### Task 9: 保养计划表单页 · DeviceCombo · ItemCard

**Files:**
- Create: `src/components/DeviceCombo.vue`, `src/components/ItemCard.vue`
- Modify: `src/pages/PlanForm.vue`

**Interfaces:**
- Consumes: `useMaintPlanStore`, `useDeviceStore`, `useDictStore`, `useAuthStore`, `validatePlan`, `todayStr`
- Produces:
  - `<DeviceCombo v-model:name="" v-model:code="" @pick="(dev: Device)=>void" />` — 名称/编号任一输入触发候选下拉；点击候选一次性回填 name/code 并 emit `pick`
  - `<ItemCard :modelValue="MaintItem" :units="string[]" :index="number" :error?" @update:modelValue @remove="" :removable="boolean" />` — 一项保养的可编辑卡片
  - `PlanForm.vue` 表单闭环：新增 / 编辑（`?id=xxx`）

- [ ] **Step 1: 写 `DeviceCombo.vue`**

```vue
<template>
  <div class="combo">
    <van-cell-group inset>
      <van-field :model-value="name" @update:model-value="onName" label="设备名称" placeholder="请输入" required />
      <van-field :model-value="code" @update:model-value="onCode" label="设备编号" placeholder="请输入" required />
    </van-cell-group>
    <ul v-if="candidates.length" class="combo__dd">
      <li v-for="d in candidates" :key="d.id" @click="pick(d)">
        <strong>{{ d.name }}</strong>
        <span>{{ d.code }} · {{ d.model }}</span>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDeviceStore } from '@/stores/device'
import type { Device } from '@/types/maintPlan'

const props = defineProps<{ name: string; code: string }>()
const emit = defineEmits<{ 'update:name':[string]; 'update:code':[string]; pick:[Device] }>()

const ds = useDeviceStore()
const candidates = ref<Device[]>([])
const keyword = ref('')

async function query(kw: string) {
  keyword.value = kw
  candidates.value = kw ? await ds.search(kw) : []
}
function onName(v: string) { emit('update:name', v); query(v) }
function onCode(v: string) { emit('update:code', v); query(v) }
function pick(d: Device) {
  emit('update:name', d.name); emit('update:code', d.code)
  emit('pick', d); candidates.value = []
}

watch(() => [props.name, props.code], ([n, c]) => { if (!n && !c) candidates.value = [] })
</script>
<style scoped>
.combo{position:relative}
.combo__dd{position:absolute;left:12px;right:12px;top:100%;background:var(--color-card);border:1px solid var(--color-line);border-radius:12px;box-shadow:var(--shadow-card);max-height:240px;overflow:auto;list-style:none;margin:4px 0;padding:4px;z-index:10}
.combo__dd li{padding:8px 12px;cursor:pointer;display:flex;flex-direction:column;border-radius:8px}
.combo__dd li:hover{background:var(--color-chip-bg)}
.combo__dd strong{font-size:14px;color:var(--color-text)}
.combo__dd span{font-size:12px;color:var(--color-text-3)}
</style>
```

- [ ] **Step 2: 写 `ItemCard.vue`**

```vue
<template>
  <div class="ic" :class="{ 'ic--err': !!error }">
    <header class="ic__head">
      <span class="ic__idx">保养项 #{{ index + 1 }}</span>
      <button v-if="removable" class="ic__del" @click="$emit('remove')">删除</button>
    </header>
    <van-cell-group inset>
      <van-field
        :model-value="modelValue.content"
        @update:model-value="update('content', $event)"
        label="保养内容"
        type="textarea"
        rows="2"
        autosize
        placeholder="如：更换机油机滤"
        required
      />
      <van-field label="保养周期" required>
        <template #input>
          <div class="ic__cycle">
            <input class="ic__num" type="number" min="1" step="1"
                   :value="modelValue.cycleValue"
                   @input="update('cycleValue', Number(($event.target as HTMLInputElement).value))" />
            <select class="ic__unit" :value="modelValue.cycleUnit" @change="update('cycleUnit', ($event.target as HTMLSelectElement).value)">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </template>
      </van-field>
      <van-field
        :model-value="modelValue.nextDate"
        @update:model-value="update('nextDate', $event)"
        label="下次保养时间"
        type="date"
        required
      />
    </van-cell-group>
    <p v-if="error" class="ic__errtxt">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import type { MaintItem, CycleUnit } from '@/types/maintPlan'
const props = defineProps<{ modelValue: MaintItem; units: string[]; index: number; removable: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue':[MaintItem]; remove:[] }>()
function update<K extends keyof MaintItem>(key: K, value: MaintItem[K] | string) {
  const next: MaintItem = { ...props.modelValue, [key]: value as MaintItem[K] }
  if (key === 'cycleUnit') next.cycleUnit = value as CycleUnit
  emit('update:modelValue', next)
}
</script>
<style scoped>
.ic{background:var(--color-card);border-radius:var(--radius-card);box-shadow:var(--shadow-card);margin:12px;padding:12px 0 4px}
.ic--err{outline:1px solid var(--color-overdue-fg)}
.ic__head{display:flex;justify-content:space-between;align-items:center;padding:0 16px 8px}
.ic__idx{font-size:13px;color:var(--color-primary-dark);font-weight:600}
.ic__del{border:0;background:transparent;color:var(--color-overdue-fg);font-size:12px;cursor:pointer}
.ic__cycle{display:flex;gap:8px;width:100%}
.ic__num{flex:1;border:1px solid var(--color-line);border-radius:8px;padding:4px 8px;font-size:14px;font-family:inherit;color:var(--color-text)}
.ic__unit{border:1px solid var(--color-line);border-radius:8px;padding:4px 8px;font-size:14px;font-family:inherit;color:var(--color-text);background:#fff}
.ic__errtxt{margin:6px 16px 8px;color:var(--color-overdue-fg);font-size:12px}
</style>
```

- [ ] **Step 3: 实现 `src/pages/PlanForm.vue`**

```vue
<template>
  <div class="page form">
    <TopBar :title="isEdit ? '编辑保养计划' : '新增保养计划'" back @back="$router.back()" />

    <p v-if="lastHint" class="form__hint">{{ lastHint }}</p>

    <DeviceCombo v-model:name="draft.deviceName" v-model:code="draft.deviceCode" @pick="onPick" />

    <van-cell-group inset>
      <van-field v-model="draft.modelSpec" label="型号规格" placeholder="请输入" required />
      <van-field v-model="draft.usage" label="设备用途" placeholder="请输入" required />
      <van-field v-model="draft.thisDate" label="本次保养时间" type="date" required />
      <van-field v-model="draft.owner" label="责任人" placeholder="请输入" required />
      <van-field label="完成情况" required>
        <template #input>
          <van-radio-group v-model="draft.status" direction="horizontal">
            <van-radio name="undone">未完成</van-radio>
            <van-radio name="done">已完成</van-radio>
          </van-radio-group>
        </template>
      </van-field>
    </van-cell-group>

    <ItemCard
      v-for="(it, idx) in draft.items"
      :key="it.id"
      :model-value="it"
      :units="units"
      :index="idx"
      :removable="draft.items.length > 1"
      :error="itemErrors[idx]"
      @update:model-value="draft.items[idx] = $event"
      @remove="removeItem(idx)"
    />

    <button class="form__add" @click="addItem">＋ 添加保养项</button>

    <div class="form__bar">
      <van-button type="primary" block :loading="submitting" @click="submit">保存</van-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import TopBar from '@/components/TopBar.vue'
import DeviceCombo from '@/components/DeviceCombo.vue'
import ItemCard from '@/components/ItemCard.vue'
import { useMaintPlanStore } from '@/stores/maintPlan'
import { useDictStore } from '@/stores/dict'
import { useAuthStore } from '@/stores/auth'
import { getPlan } from '@/api/maintPlan'
import { validatePlan } from '@/utils/validate'
import { todayStr } from '@/utils/date'
import { searchDevices } from '@/api/device'
import type { Plan, MaintItem, Device } from '@/types/maintPlan'

const route = useRoute()
const router = useRouter()
const editId = computed(() => (route.query.id as string) || '')
const isEdit = computed(() => !!editId.value)

const store = useMaintPlanStore()
const dict = useDictStore()
const auth = useAuthStore()

const units = ref<string[]>(['小时','天','公里'])
const submitting = ref(false)
const lastHint = ref('')
const itemErrors = ref<Record<number, string>>({})
let ownerTouched = false

const newItem = (): MaintItem => ({ id: 'i_'+Math.random().toString(36).slice(2,7), content:'', cycleValue:30, cycleUnit:'天', nextDate:'' })

const draft = reactive<Plan>({
  id:'', deviceId:null, deviceName:'', deviceCode:'', modelSpec:'', usage:'',
  thisDate: todayStr(), owner: auth.user?.name ?? '', status:'undone',
  items: [newItem()], createdAt:0, updatedAt:0
})

onMounted(async () => {
  units.value = await dict.loadCycleUnits()
  if (isEdit.value) {
    const p = await getPlan(editId.value)
    Object.assign(draft, p)
    ownerTouched = true
    lastHint.value = p.lastDate ? `上次保养时间：${p.lastDate}` : '该设备首次保养'
  }
})

async function onPick(dev: Device) {
  draft.deviceId = dev.id
  draft.modelSpec = dev.model
  draft.usage = dev.usage
  if (!ownerTouched) draft.owner = dev.owner
  const all = await import('@/api/maintPlan').then(m => m.listPlans())
  const others = all.filter(p => p.deviceCode === dev.code && p.id !== draft.id)
  lastHint.value = others.length ? `上次保养时间：${others.map(p => p.thisDate).sort().reverse()[0]}` : '该设备首次保养'
}

function addItem() { draft.items.push(newItem()) }
function removeItem(i: number) { if (draft.items.length > 1) draft.items.splice(i, 1) }

async function submit() {
  itemErrors.value = {}
  const res = validatePlan(draft)
  if (!res.ok) {
    const first = res.errors[0]!
    if (first.itemIndex !== undefined) itemErrors.value[first.itemIndex] = first.message
    showToast(first.message)
    return
  }
  submitting.value = true
  try {
    const payload = { deviceId: draft.deviceId, deviceName: draft.deviceName, deviceCode: draft.deviceCode,
      modelSpec: draft.modelSpec, usage: draft.usage, thisDate: draft.thisDate, owner: draft.owner,
      status: draft.status, items: draft.items }
    if (isEdit.value) await store.update(editId.value, payload)
    else await store.create(payload)
    await store.fetchList()
    showToast('保存成功')
    await nextTick()
    router.push('/plan/list')
  } finally { submitting.value = false }
}
</script>
<style scoped>
.form{padding-bottom:80px}
.form__hint{margin:10px 14px 0;padding:10px 12px;background:var(--color-done-bg);color:var(--color-primary-xdark);border-radius:10px;font-size:12px}
.form__add{display:block;margin:12px auto;padding:8px 16px;background:transparent;border:1px dashed var(--color-primary);color:var(--color-primary);border-radius:8px;font-size:13px;cursor:pointer}
.form__bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:375px;padding:12px;background:var(--color-card);border-top:1px solid var(--color-line);z-index:20}
</style>
```

- [ ] **Step 4: 浏览器验收**

```bash
pnpm dev
```
预期：
- 输入设备名 `拖拉` → 下拉出 `拖拉机`；点选后带出编号 TR001/型号/用途/责任人张三；提示条显示「上次保养时间：2026-08-10」
- 添加保养项 → 出现第二张 ItemCard；单元下拉从字典渲染；仅剩 1 项时删除按钮消失
- 试保存 cycleValue=0 → toast「第 N 项保养周期必须为正整数」并高亮该 ItemCard
- 试 nextDate ≤ thisDate → 拦截
- 正常保存 → toast「保存成功」→ 回列表可见新增
- `?id=1` → 字段回显；保存写入不新增

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(page): plan form with device combo & multi items"
```

---

### Task 10: 保养计划详情页 · 标记完成

**Files:**
- Modify: `src/pages/PlanDetail.vue`

**Interfaces:**
- Consumes: `useMaintPlanStore`, `<TopBar>`, `<Tag>`, `<DeviceSvg>`, `cycleText`, `todayStr`
- Produces: 无新导出；详情页闭环（hero 卡 + 设备信息/保养计划/执行信息三卡 + 保养项编号卡（逾期项红字）+ 标记完成二次确认 + 编辑跳转）

- [ ] **Step 1: 实现 `src/pages/PlanDetail.vue`**

```vue
<template>
  <div v-if="p" class="page page-detail">
    <TopBar title="保养计划详情" back @back="$router.push('/plan/list')" />

    <div class="hero">
      <div class="hero-img"><DeviceSvg :kind="p.deviceSvg" /></div>
      <div class="hero-info">
        <div class="hn">{{ p.deviceName }}</div>
        <div class="hs"><span class="dc-chip">{{ p.deviceCode }}</span>{{ p.modelSpec }}</div>
        <div class="hs">{{ p.usage }} · {{ p.owner }}</div>
      </div>
      <div class="hero-tags">
        <Tag :variant="p.status==='done' ? 'done' : 'undone'">{{ p.status==='done' ? '已完成' : '未完成' }}</Tag>
        <Tag v-if="p.overdue" variant="overdue">已逾期</Tag>
      </div>
    </div>

    <div class="card">
      <div class="card-head">设备信息</div>
      <div class="dcell"><span class="dl">设备名称</span><span class="dv">{{ p.deviceName }}</span></div>
      <div class="dcell"><span class="dl">设备编号</span><span class="dv">{{ p.deviceCode }}</span></div>
      <div class="dcell"><span class="dl">型号规格</span><span class="dv">{{ p.modelSpec }}</span></div>
      <div class="dcell"><span class="dl">设备用途</span><span class="dv">{{ p.usage }}</span></div>
    </div>

    <div class="card">
      <div class="card-head">保养计划</div>
      <div class="dcell"><span class="dl">本次保养时间</span><span class="dv">{{ p.thisDate }}</span></div>
      <div class="dcell"><span class="dl">上次保养时间</span><span class="dv">{{ p.lastDate ?? '—' }}</span></div>
      <div class="iv-wrap">
        <div v-for="(it, idx) in p.items" :key="it.id" class="iv-item">
          <div class="iv-top"><span class="iv-no">{{ idx + 1 }}</span><span class="iv-content">{{ it.content }}</span></div>
          <div class="iv-meta">
            <span class="iv-chip">{{ cycleText(it) }}</span>
            <span class="iv-next" :class="{ late: p.status==='undone' && it.nextDate < today }">下次保养 {{ it.nextDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">执行信息</div>
      <div class="dcell"><span class="dl">责任人</span><span class="dv">{{ p.owner }}</span></div>
      <div class="dcell"><span class="dl">完成情况</span><span class="dv">{{ p.status==='done' ? '已完成' : '未完成' }}</span></div>
    </div>

    <div class="btnbar">
      <button v-if="p.status==='undone'" class="btn-ghost" @click="onMarkDone">标记完成</button>
      <button class="btn-primary" @click="$router.push({ path:'/plan/form', query:{ id:p.id } })">编辑</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import TopBar from '@/components/TopBar.vue'
import Tag from '@/components/Tag.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import { useMaintPlanStore } from '@/stores/maintPlan'
import { cycleText, todayStr } from '@/utils/date'

const route = useRoute()
const store = useMaintPlanStore()
const p = computed(() => store.current)
const today = todayStr()

onMounted(async () => {
  const id = route.query.id as string
  if (id) await store.fetchOne(id)
})

async function onMarkDone() {
  try {
    await showConfirmDialog({ title:'标记完成', message:'确认将本计划标记为已完成？' })
    await store.markDone(p.value!.id)
    showToast('已标记完成')
  } catch { /* 用户取消 */ }
}
</script>
<style scoped>
.page-detail{padding-bottom:90px}
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
.iv-wrap{padding:4px 12px 12px}
.iv-item{background:#F7FAF7;border:1px solid #E4EEE5;border-radius:12px;padding:12px;margin-top:10px}
.iv-top{display:flex;gap:10px;align-items:flex-start}
.iv-no{width:20px;height:20px;border-radius:50%;background:var(--color-done-bg);color:var(--color-primary);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.iv-content{flex:1;font-size:14px;font-weight:600;color:var(--color-text);line-height:1.5}
.iv-meta{display:flex;align-items:center;gap:8px;margin-top:9px;padding-left:30px}
.iv-chip{font-size:11px;color:var(--color-primary);background:var(--color-done-bg);border-radius:6px;padding:3px 8px;font-weight:600}
.iv-next{font-size:12px;color:var(--color-text-3)}
.iv-next.late{color:var(--color-overdue-bg);font-weight:600}
.btnbar{position:fixed;bottom:0;left:0;right:0;max-width:375px;margin:0 auto;background:#fff;border-top:1px solid var(--color-line);padding:10px 16px;display:flex;gap:10px;z-index:40}
.btn-primary{flex:1;border:none;border-radius:12px;background:linear-gradient(135deg,#37B45C,#157A38);color:#fff;font-size:16px;font-weight:600;padding:12px 0;letter-spacing:2px;box-shadow:0 6px 14px rgba(31,161,74,.3);cursor:pointer}
.btn-ghost{flex:1;border:1px solid var(--color-primary);border-radius:12px;background:#fff;color:var(--color-primary);font-size:16px;font-weight:600;padding:12px 0;cursor:pointer}
</style>
```

- [ ] **Step 2: 浏览器验收**

```bash
pnpm dev
```
预期：
- 列表点 id=6（植保无人机）→ hero 卡含无人机插画与逾期红标；三卡字段完整；上次保养时间显示「—」（无同编号其他记录）
- id=6 items[0]（桨叶检查更换 2026-09-10）逾期 → 该项「下次保养」红字
- 「标记完成」→ 弹确认 → 确认后返回列表状态变「已完成」
- 「编辑」→ 跳到表单预填；改后返回列表可见更新
- 已完成计划（如 id=2）只显示「编辑」按钮

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat(page): plan detail + mark-done"
```

---

### Task 11: 端到端复测 · 打包验证

**Files:**
- Modify: 仅修缺陷；不新增文件

**Interfaces:**
- Consumes: 全部前序任务产物
- Produces: 可交付 `dist/`；迭代 3 验收清单全过记录

- [ ] **Step 1: 全量单测与类型检查**

```bash
pnpm test
pnpm typecheck
```
预期：全绿；无 TS 错误。

- [ ] **Step 2: 生产构建并验证 MSW 不进包**

```bash
pnpm build
```
预期：
- `dist/` 生成成功
- `grep -r "mockServiceWorker" dist/` 无命中；`grep -rl "SEED_PLANS\|lx_maint_plans_v3" dist/assets/*.js` 无命中（MSW 与种子被 tree-shake）
- `dist/assets/*.js` 首屏 Gzip < 200 KB（`pnpm preview` 响应头或 `gzip-size` 抽查）

- [ ] **Step 3: 预览包跑迭代 3 验收清单**

```bash
VITE_USE_MOCK=1 pnpm preview
```
浏览器逐项过（对照工程化 spec §8.4）：
1. 首页田园横幅 + 统计卡 + 4 分区；「保」进列表，「点/修/配」toast「功能建设中」，其余分区 toast「原型仅开放设备保养模块」；tabbar 首页/设备可跳、其余 toast
2. 列表：6 条种子排序正确（未完成按最早 nextDate 升序居前的无人机逾期红标；已完成按 thisDate 降序）、搜索命中/空态、筛选行三维过滤 + 重置、「共 N 条记录」
3. 新增：名称/编号联动候选、选中带出 4 字段 + 责任人、上次保养提示条（拖拉机 → 2026-08-10）
4. 保养项增删（≥1 不可删）、每项独立字段
5. 校验拦截：必填 / 周期非正整数 / nextDate ≤ thisDate，提示带「第 N 项」
6. 保存回列表可见；详情 hero 卡 + 三卡 + 保养项逾期红字；标记完成二次确认后状态变更
7. 编辑回显；刷新后 `localStorage.lx_maint_plans_v3` 数据保持
8. `?ticket=xxx` 进入 → `lx_token` 写入、请求带 Bearer 头（mock 模式跳过则验 bootstrap 默认用户「王强」）

- [ ] **Step 4: 视觉走查**

对照 `shots/r3-home.png`、`r3-list-fixed2.png`、`r3-form-empty.png`、`r3-detail.png` 逐页比对工程化版本截图；重点：田园横幅山丘/农舍位置、sheet -22px 叠层与 20px 圆角、卡片插画与三列统计、标签配色（未完成 `#FDECEA/#E64A40`、已完成 `#E3F3E8/#1FA14A`、已逾期 `#D93025/#fff`）、筛选 chip 激活态。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore(release): e2e acceptance + build verification"
```

---
