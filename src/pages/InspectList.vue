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
