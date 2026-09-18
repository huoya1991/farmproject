<template>
  <div class="page form">
    <TopBar title="新增点检记录" back @back="$router.push('/inspect/list')" />

    <!-- 分组 1 · 设备信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.tractorTab"></span>设备信息</div>
      <van-cell-group inset>
        <van-field v-model="draft.date" label="点检日期" type="date" required />
        <van-field :model-value="deviceText" label="设备编号" placeholder="请选择" readonly required is-link @click="showDevice = true" />
        <van-field :model-value="draft.deviceName" label="设备名称" placeholder="选择编号后自动带出" readonly required />
      </van-cell-group>
    </div>

    <!-- 分组 2 · 点检信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.clipboard"></span>点检信息</div>
      <van-cell-group inset>
        <van-field label="仪表检查" required>
          <template #input>
            <div class="toggle">
              <button v-for="o in RESULT_OPTS" :key="o" type="button"
                class="toggle__btn" :class="{ on: draft.meterResult === o, bad: o === '异常' && draft.meterResult === o }"
                @click="draft.meterResult = o">{{ o }}</button>
            </div>
          </template>
        </van-field>
        <van-field label="车况检查" required>
          <template #input>
            <div class="toggle">
              <button v-for="o in RESULT_OPTS" :key="o" type="button"
                class="toggle__btn" :class="{ on: draft.vehicleResult === o, bad: o === '异常' && draft.vehicleResult === o }"
                @click="draft.vehicleResult = o">{{ o }}</button>
            </div>
          </template>
        </van-field>
        <van-field :model-value="draft.vehicleStatus" label="车辆状态" placeholder="请选择" readonly required is-link @click="showStatus = true" />
        <van-field v-model="draft.note" label="异常说明" type="textarea" rows="3" maxlength="200" show-word-limit
          :required="hasAbnormal" :placeholder="hasAbnormal ? '存在异常项，请填写异常说明' : '选填'" />
      </van-cell-group>
      <div class="photos">
        <div class="photos__label">现场照片<span class="photos__tip">（最多 3 张）</span></div>
        <van-uploader v-model="fileList" accept="image/*" :max-count="3" :after-read="afterRead" />
      </div>
    </div>

    <!-- 分组 3 · 人员及使用信息 -->
    <div class="grp">
      <div class="grp-hd"><span class="gi" v-html="ICONS.user"></span>人员及使用信息</div>
      <van-cell-group inset>
        <van-field v-model="draft.inspector" label="点检人员" placeholder="请输入" required />
        <van-field :model-value="draft.operator" label="使用人" placeholder="请选择" readonly required is-link @click="showOperator = true" />
        <van-field label="使用时长" required>
          <template #input>
            <div class="duration">
              <input v-model="draft.durationValue" type="number" min="0" step="0.1" placeholder="请输入" class="duration__input" />
              <button type="button" class="duration__unit" @click="showUnit = true">
                {{ draft.durationUnit || '单位' }}<span class="du-arrow" v-html="ICONS.down"></span>
              </button>
            </div>
          </template>
        </van-field>
      </van-cell-group>
    </div>

    <div class="form__bar">
      <button class="btn-ghost" @click="$router.push('/inspect/list')">取消</button>
      <van-button type="primary" class="btn-save" :loading="submitting" @click="submit">保存记录</van-button>
    </div>

    <van-popup v-model:show="showDevice" position="bottom" round>
      <van-picker :columns="deviceColumns" title="选择设备" @confirm="onPickDevice" @cancel="showDevice = false" />
    </van-popup>
    <van-popup v-model:show="showStatus" position="bottom" round>
      <van-picker :columns="statusColumns" title="车辆状态" @confirm="onPickStatus" @cancel="showStatus = false" />
    </van-popup>
    <van-popup v-model:show="showOperator" position="bottom" round>
      <van-picker :columns="ownerColumns" title="使用人" @confirm="onPickOperator" @cancel="showOperator = false" />
    </van-popup>
    <van-popup v-model:show="showUnit" position="bottom" round>
      <van-picker :columns="unitColumns" title="时长单位" @confirm="onPickUnit" @cancel="showUnit = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, type UploaderFileListItem } from 'vant'
import TopBar from '@/components/TopBar.vue'
import { ICONS } from '@/components/icons'
import { useInspectionStore } from '@/stores/inspection'
import { useDictStore } from '@/stores/dict'
import { useAuthStore } from '@/stores/auth'
import { searchDevices } from '@/api/device'
import { validateInspect, deriveInspectStatus } from '@/utils/validateInspect'
import { todayStr } from '@/utils/date'
import type { CheckResult, InspectPayload } from '@/types/inspection'
import type { Device } from '@/types/maintPlan'

const RESULT_OPTS: CheckResult[] = ['正常', '异常']

const router = useRouter()
const store = useInspectionStore()
const dict = useDictStore()
const auth = useAuthStore()

const devices = ref<Device[]>([])
const fileList = ref<UploaderFileListItem[]>([])
const submitting = ref(false)
const showDevice = ref(false)
const showStatus = ref(false)
const showOperator = ref(false)
const showUnit = ref(false)
let ownerTouched = false

const draft = reactive({
  date: todayStr(),
  deviceCode: '',
  deviceName: '',
  meterResult: '正常' as CheckResult,
  vehicleResult: '正常' as CheckResult,
  vehicleStatus: '' as CheckResult | '',
  durationValue: '',
  durationUnit: '',
  inspector: auth.user?.name ?? '',
  operator: '',
  note: ''
})

const hasAbnormal = computed(() =>
  deriveInspectStatus({
    meterResult: draft.meterResult,
    vehicleResult: draft.vehicleResult,
    vehicleStatus: draft.vehicleStatus || '正常'
  }) === '异常')

const deviceText = computed(() => draft.deviceCode)
const deviceColumns = computed(() => devices.value.map(d => ({ text: `${d.code} · ${d.name}`, value: d.code })))
const statusColumns = RESULT_OPTS.map(o => ({ text: o, value: o }))
const ownerColumns = computed(() => [...new Set(devices.value.map(d => d.owner))].map(o => ({ text: o, value: o })))
const unitColumns = computed(() => dict.usageUnits.map(u => ({ text: u, value: u })))

onMounted(async () => {
  devices.value = await searchDevices('')
  await dict.loadUsageUnits()
  if (!draft.durationUnit && dict.usageUnits.length) draft.durationUnit = dict.usageUnits[0]!
})

type PickerEvent = { selectedOptions: { text: string; value: string }[] }

function onPickDevice(ev: PickerEvent) {
  const dev = devices.value.find(d => d.code === ev.selectedOptions[0]?.value)
  if (dev) {
    draft.deviceCode = dev.code
    draft.deviceName = dev.name
    if (!ownerTouched) draft.operator = dev.owner
  }
  showDevice.value = false
}
function onPickStatus(ev: PickerEvent) {
  draft.vehicleStatus = (ev.selectedOptions[0]?.value ?? '') as CheckResult | ''
  showStatus.value = false
}
function onPickOperator(ev: PickerEvent) {
  draft.operator = ev.selectedOptions[0]?.value ?? ''
  ownerTouched = true
  showOperator.value = false
}
function onPickUnit(ev: PickerEvent) {
  draft.durationUnit = ev.selectedOptions[0]?.value ?? ''
  showUnit.value = false
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX = 1280
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) { reject(new Error('no canvas ctx')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

async function afterRead(item: UploaderFileListItem | UploaderFileListItem[]) {
  const arr = Array.isArray(item) ? item : [item]
  for (const it of arr) {
    if (!it.file) continue
    try {
      it.url = await compressImage(it.file)
      it.status = 'done'
    } catch {
      fileList.value = fileList.value.filter(f => f !== it)
      showToast('照片处理失败，请重试')
    }
  }
}

async function submit() {
  const photos = fileList.value.map(f => f.url).filter((u): u is string => !!u)
  const payload: InspectPayload = {
    date: draft.date,
    deviceCode: draft.deviceCode,
    deviceName: draft.deviceName,
    meterResult: draft.meterResult,
    vehicleResult: draft.vehicleResult,
    vehicleStatus: draft.vehicleStatus as CheckResult,
    durationValue: Number(draft.durationValue),
    durationUnit: draft.durationUnit,
    inspector: draft.inspector,
    operator: draft.operator,
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    ...(photos.length ? { photos } : {})
  }
  const res = validateInspect(payload)
  if (!res.ok) { showToast(res.errors[0]!.message); return }
  submitting.value = true
  try {
    const created = await store.create(payload)
    if (photos.length && !(created.photos?.length)) showToast('照片过大，已忽略照片')
    await store.fetchList()
    showToast('保存成功')
    await nextTick()
    router.push('/inspect/list')
  } finally { submitting.value = false }
}
</script>

<style scoped>
.form{padding-bottom:86px}
.grp{margin-top:12px}
.grp-hd{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:700;color:var(--color-text);padding:0 22px 8px;position:relative}
.grp-hd::before{content:"";width:4px;height:16px;border-radius:2px;background:var(--color-primary);position:absolute;left:14px;top:2px}
.gi{width:18px;height:18px;color:var(--color-primary);display:inline-flex}
.gi :deep(svg){width:100%;height:100%}
.toggle{display:flex;gap:8px}
.toggle__btn{border:1px solid var(--color-line);background:#F4F8F4;color:var(--color-text-2);border-radius:16px;padding:5px 18px;font-size:13px;cursor:pointer}
.toggle__btn.on{background:var(--color-done-bg);border-color:var(--color-primary);color:var(--color-primary);font-weight:600}
.toggle__btn.bad{background:var(--color-undone-bg);border-color:var(--color-undone-fg);color:var(--color-undone-fg);font-weight:600}
.photos{padding:10px 26px 4px}
.photos__label{font-size:14px;color:var(--color-text-2);margin-bottom:8px}
.photos__tip{font-size:12px;color:var(--color-text-3)}
.duration{display:flex;align-items:center;gap:8px;width:100%}
.duration__input{flex:1;min-width:0;border:none;background:transparent;font-size:14px;color:var(--color-text);outline:none;text-align:right}
.duration__unit{display:flex;align-items:center;gap:3px;border:1px solid var(--color-line);border-radius:14px;background:#F4F8F4;padding:4px 10px;font-size:13px;color:var(--color-text-2);flex-shrink:0;cursor:pointer}
.du-arrow{width:12px;height:12px;display:inline-flex}
.du-arrow :deep(svg){width:100%;height:100%}
.form__bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:375px;padding:12px 16px;background:var(--color-card);border-top:1px solid var(--color-line);display:flex;gap:10px;z-index:20}
.btn-ghost{flex:1;border:1px solid var(--color-primary);border-radius:12px;background:#fff;color:var(--color-primary);font-size:16px;font-weight:600;padding:10px 0;cursor:pointer}
.btn-save{flex:2;border-radius:12px}
</style>
