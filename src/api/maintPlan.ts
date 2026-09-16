import { apiClient } from './client'
import type { Plan, PlanWithDerived } from '@/types/maintPlan'

type PlanPayload = Omit<Plan, 'id'|'createdAt'|'updatedAt'>

export const listPlans = (params?: { keyword?: string; status?: 'undone'|'done' }) =>
  apiClient.request<PlanWithDerived[]>({ method:'GET', url:'/api/maint-plan', params: params ?? {} })

export const getPlan = (id: string) =>
  apiClient.request<PlanWithDerived>({ method:'GET', url:`/api/maint-plan/${id}` })

export const createPlan = (payload: PlanPayload) =>
  apiClient.request<PlanWithDerived>({ method:'POST', url:'/api/maint-plan', body: payload })

export const updatePlan = (id: string, payload: PlanPayload) =>
  apiClient.request<PlanWithDerived>({ method:'PUT', url:`/api/maint-plan/${id}`, body: payload })

export const markPlanDone = (id: string) =>
  apiClient.request<PlanWithDerived>({ method:'PUT', url:`/api/maint-plan/${id}/status`, body: { status:'done' } })
