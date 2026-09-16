<template>
  <div class="page">
    <TopBar title="骨架冒烟" back @back="()=>{}" />
    <div style="padding:16px;display:flex;gap:8px">
      <Tag variant="done">已完成</Tag>
      <Tag variant="undone">未完成</Tag>
      <Tag variant="overdue">已逾期</Tag>
    </div>
    <EmptyState text="暂无数据" />
    <Tabbar active="home" />
  </div>
</template>
<script setup lang="ts">
import TopBar from '@/components/TopBar.vue'
import Tabbar from '@/components/Tabbar.vue'
import EmptyState from '@/components/EmptyState.vue'
import Tag from '@/components/Tag.vue'
</script>
