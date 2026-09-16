<template>
  <div class="page page-list">
    <div class="hero-banner">
      <HillsScene height="122px" />
      <div class="hb-nav">
        <button class="hb-back" aria-label="返回" @click="$router.push('/home')"><span class="fi" v-html="ICONS.chev"></span></button>
        <span class="hb-title">保养计划</span>
        <button class="hb-add" @click="$router.push('/plan/form')">新增</button>
      </div>
      <div class="hb-brand">
        <span class="hb-logo" v-html="ICONS.leaf"></span>
        <div><div class="hb-name">老乡农场</div><div class="hb-slogan">设备保养 · 让农机更高效</div></div>
      </div>
      <div class="hb-tractor"><DeviceSvg kind="tractor" /></div>
    </div>

    <div class="sheet">
      <div class="search">
        <span class="sic" v-html="ICONS.search"></span>
        <input v-model="store.keyword" placeholder="请输入设备名称或设备编号查询" />
      </div>
      <FilterBar
        v-model:type="store.typeFilter"
        v-model:status="store.statusFilter"
        v-model:owner="store.ownerFilter"
        :type-options="store.typeOptions"
        :owner-options="store.ownerOptions"
        @reset="onReset"
      />
      <div class="list-body">
        <div v-if="store.loading" class="list-loading">加载中…</div>
        <template v-else>
          <PlanCard v-for="p in store.filteredSortedList" :key="p.id" :plan="p"
            @click="$router.push({ path: '/plan/detail', query: { id: p.id } })" />
          <EmptyState v-if="!store.filteredSortedList.length" text="暂无保养计划，点击右上角「新增」录入第一条计划" />
        </template>
      </div>
      <div v-if="store.filteredSortedList.length" class="list-count">共 {{ store.filteredSortedList.length }} 条记录</div>
    </div>

    <Tabbar active="device" />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { ICONS } from '@/components/icons'
import HillsScene from '@/components/HillsScene.vue'
import DeviceSvg from '@/components/DeviceSvg.vue'
import FilterBar from '@/components/FilterBar.vue'
import PlanCard from '@/components/PlanCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Tabbar from '@/components/Tabbar.vue'
import { useMaintPlanStore } from '@/stores/maintPlan'

const store = useMaintPlanStore()
function onReset() {
  store.keyword = ''; store.typeFilter = ''; store.statusFilter = 'all'; store.ownerFilter = ''
}
onMounted(() => store.fetchList())
</script>
<style scoped>
.page-list{padding-bottom:0}
.hero-banner{position:relative;height:186px;overflow:hidden;background:linear-gradient(180deg,#BCE0F2 0%,#D8EEDA 58%,#C6E7CA 100%)}
.hb-nav{position:relative;z-index:5;display:flex;align-items:center;height:48px;padding:0 12px;gap:8px}
.hb-back{width:32px;height:32px;border:none;background:rgba(255,255,255,.65);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);flex-shrink:0;cursor:pointer}
.hb-back .fi{width:19px;height:19px;display:inline-flex}
.hb-back .fi :deep(svg){width:100%;height:100%}
.hb-title{flex:1;text-align:center;font-size:17px;font-weight:700;color:var(--color-text)}
.hb-add{border:none;background:var(--color-primary);color:#fff;font-size:13px;font-weight:600;border-radius:16px;padding:7px 15px;box-shadow:0 4px 10px rgba(21,122,56,.35);flex-shrink:0;cursor:pointer}
.hb-brand{position:relative;z-index:4;display:flex;align-items:center;gap:10px;padding:8px 16px 0}
.hb-logo{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(30,80,50,.14);flex-shrink:0}
.hb-logo :deep(svg){width:24px;height:24px}
.hb-name{font-size:19px;font-weight:800;color:var(--color-primary-xdark);letter-spacing:1px}
.hb-slogan{font-size:11px;color:#3E6B4C;margin-top:3px}
.hb-tractor{position:absolute;right:2px;bottom:12px;width:158px;height:104px;z-index:3}
.sheet{position:relative;z-index:6;margin-top:-22px;background:#fff;border-radius:20px 20px 0 0;padding:14px 0 76px;min-height:calc(100vh - 164px)}
.search{margin:0 14px 10px;position:relative}
.search input{width:100%;height:38px;border:1px solid var(--color-line);border-radius:19px;background:#F4F8F4;padding:0 14px 0 36px;font-size:13px;outline:none}
.search input::placeholder{color:#9AB0A0}
.sic{position:absolute;left:12px;top:10px;width:17px;height:17px;color:#9AB0A0;display:inline-flex}
.sic :deep(svg){width:100%;height:100%}
.list-body{margin-top:10px}
.list-loading{padding:24px;text-align:center;color:var(--color-text-3)}
.list-count{text-align:center;font-size:12px;color:var(--color-text-3);padding:0 0 18px}
</style>
