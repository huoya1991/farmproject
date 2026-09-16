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
