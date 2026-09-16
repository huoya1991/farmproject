import { defineStore } from 'pinia'
import { apiClient } from '@/api/client'
import { exchangeTicket } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '' as string, user: null as null | { name: string; role: string } }),
  actions: {
    async bootstrap(ticket?: string) {
      if (import.meta.env.VITE_USE_MOCK === '1') {
        apiClient.setToken('mock-token')
        this.token = 'mock-token'; this.user = { name: '王强', role: 'device_owner' }
        return
      }
      if (!ticket) return
      const res = await exchangeTicket(ticket)
      this.token = res.token; this.user = res.user
      apiClient.setToken(res.token)
    }
  }
})
