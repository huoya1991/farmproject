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
