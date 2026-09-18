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
