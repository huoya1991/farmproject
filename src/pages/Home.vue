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
    { label:'点检记录', glyph:'点', color:'g-green', route:'/inspect/list' },
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
