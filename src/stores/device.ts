import { defineStore } from 'pinia'
import { searchDevices } from '@/api/device'
import type { Device } from '@/types/maintPlan'
export const useDeviceStore = defineStore('device', {
  state: () => ({ results: [] as Device[] }),
  actions: {
    async search(keyword: string) {
      this.results = keyword ? await searchDevices(keyword) : []
      return this.results
    }
  }
})
