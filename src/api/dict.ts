import { apiClient } from './client'
export const getDict = (type: 'maint_cycle_unit') =>
  apiClient.request<string[]>({ method:'GET', url:`/api/dict/${type}` })
