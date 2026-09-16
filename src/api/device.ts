import { apiClient } from './client'
import type { Device } from '@/types/maintPlan'
export const searchDevices = (keyword: string) =>
  apiClient.request<Device[]>({ method:'GET', url:'/api/device', params:{ keyword } })
