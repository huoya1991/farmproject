import { defineStore } from 'pinia'
import { getDict } from '@/api/dict'
export const useDictStore = defineStore('dict', {
  state: () => ({ cycleUnits: [] as string[], usageUnits: [] as string[] }),
  actions: {
    async loadCycleUnits() {
      if (this.cycleUnits.length) return this.cycleUnits
      this.cycleUnits = await getDict('maint_cycle_unit')
      return this.cycleUnits
    },
    async loadUsageUnits() {
      if (this.usageUnits.length) return this.usageUnits
      this.usageUnits = await getDict('usage_duration_unit')
      return this.usageUnits
    }
  }
})
