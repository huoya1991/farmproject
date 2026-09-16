<template>
  <div class="ic" :class="{ 'ic--err': !!error }">
    <header class="ic__head">
      <span class="ic__idx">保养项 #{{ index + 1 }}</span>
      <button v-if="removable" class="ic__del" @click="$emit('remove')">删除</button>
    </header>
    <van-cell-group inset>
      <van-field
        :model-value="modelValue.content"
        @update:model-value="update('content', $event)"
        label="保养内容"
        type="textarea"
        rows="2"
        autosize
        placeholder="如：更换机油机滤"
        required
      />
      <van-field label="保养周期" required>
        <template #input>
          <div class="ic__cycle">
            <input class="ic__num" type="number" min="1" step="1"
                   :value="modelValue.cycleValue"
                   @input="update('cycleValue', Number(($event.target as HTMLInputElement).value))" />
            <select class="ic__unit" :value="modelValue.cycleUnit" @change="update('cycleUnit', ($event.target as HTMLSelectElement).value)">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </template>
      </van-field>
      <van-field
        :model-value="modelValue.nextDate"
        @update:model-value="update('nextDate', $event)"
        label="下次保养时间"
        type="date"
        required
      />
    </van-cell-group>
    <p v-if="error" class="ic__errtxt">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import type { MaintItem, CycleUnit } from '@/types/maintPlan'
const props = defineProps<{ modelValue: MaintItem; units: string[]; index: number; removable: boolean; error?: string | undefined }>()
const emit = defineEmits<{ 'update:modelValue':[MaintItem]; remove:[] }>()
function update<K extends keyof MaintItem>(key: K, value: MaintItem[K] | string) {
  const next: MaintItem = { ...props.modelValue, [key]: value as MaintItem[K] }
  if (key === 'cycleUnit') next.cycleUnit = value as CycleUnit
  emit('update:modelValue', next)
}
</script>
<style scoped>
.ic{background:var(--color-card);border-radius:var(--radius-card);box-shadow:var(--shadow-card);margin:12px;padding:12px 0 4px}
.ic--err{outline:1px solid var(--color-overdue-fg)}
.ic__head{display:flex;justify-content:space-between;align-items:center;padding:0 16px 8px}
.ic__idx{font-size:13px;color:var(--color-primary-dark);font-weight:600}
.ic__del{border:0;background:transparent;color:var(--color-overdue-fg);font-size:12px;cursor:pointer}
.ic__cycle{display:flex;gap:8px;width:100%}
.ic__num{flex:1;border:1px solid var(--color-line);border-radius:8px;padding:4px 8px;font-size:14px;font-family:inherit;color:var(--color-text)}
.ic__unit{border:1px solid var(--color-line);border-radius:8px;padding:4px 8px;font-size:14px;font-family:inherit;color:var(--color-text);background:#fff}
.ic__errtxt{margin:6px 16px 8px;color:var(--color-overdue-fg);font-size:12px}
</style>
