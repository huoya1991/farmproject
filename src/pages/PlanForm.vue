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
