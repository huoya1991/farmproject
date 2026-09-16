import { defineStore } from 'pinia'
import { getDict } from '@/api/dict'
export const useDictStore = defineStore('dict', {
  state: () => ({ cycleUnits: [] as string[] }),
  actions: {
    async loadCycleUnits() {
      if (this.cycleUnits.length) return this.cycleUnits
      this.cycleUnits = await getDict('maint_cycle_unit')
      return this.cycleUnits
    }
  }
})
