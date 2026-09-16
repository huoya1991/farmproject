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
