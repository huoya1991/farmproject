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
function onTap(t: typeof tabs[number]){
  // Task 2 冒烟阶段路由尚未挂载，router 可能为 undefined，待 Task 7 接入后生效
  if ('route' in t && t.route) router?.push(t.route)
  else showToast('功能建设中')
}
</script>
<style scoped>
.tabbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:375px;height:56px;display:flex;background:var(--color-card);border-top:1px solid var(--color-line);padding-bottom:env(safe-area-inset-bottom)}
.tabbar__item{flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--color-text-3);gap:2px;cursor:pointer}
.tabbar__item.active{color:var(--color-primary);font-weight:600}
.tabbar__ico{width:22px;height:22px}
.tabbar__ico :deep(svg){width:100%;height:100%}
.tabbar__label{font-size:11px}
</style>
