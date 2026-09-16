import { apiClient } from './client'
export const exchangeTicket = (ticket: string) =>
  apiClient.request<{ token: string; user: { name: string; role: string } }>({ method:'POST', url:'/api/auth/exchange', body:{ ticket } })
