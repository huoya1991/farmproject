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
