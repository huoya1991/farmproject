import { apiClient } from './client'
import type { InspectRecordDerived, InspectPayload } from '@/types/inspection'

export const listInspectRecords = () =>
  apiClient.request<InspectRecordDerived[]>({ method: 'GET', url: '/api/inspect-records' })

export const getInspectRecord = (id: string) =>
  apiClient.request<InspectRecordDerived>({ method: 'GET', url: `/api/inspect-records/${id}` })

export const createInspectRecord = (payload: InspectPayload) =>
  apiClient.request<InspectRecordDerived>({ method: 'POST', url: '/api/inspect-records', body: payload })
