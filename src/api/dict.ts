import { apiClient } from './client'
export type DictType = 'maint_cycle_unit' | 'usage_duration_unit'
export const getDict = (type: DictType) =>
  apiClient.request<string[]>({ method: 'GET', url: `/api/dict/${type}` })
