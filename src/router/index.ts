import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/pages/Home.vue') },
  { path: '/plan/list', component: () => import('@/pages/PlanList.vue') },
  { path: '/plan/form', component: () => import('@/pages/PlanForm.vue') },
  { path: '/plan/detail', component: () => import('@/pages/PlanDetail.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

export const router = createRouter({ history: createWebHashHistory('/'), routes })
