<template>
  <header class="topbar">
    <button v-if="back" class="topbar__back" @click="$emit('back')" aria-label="返回">‹</button>
    <h1 class="topbar__title">{{ title }}</h1>
  </header>
</template>
<script setup lang="ts">
defineProps<{ title: string; back?: boolean }>()
defineEmits<{ back: [] }>()
</script>
<style scoped>
.topbar{height:44px;display:flex;align-items:center;padding:0 12px;background:var(--color-card);border-bottom:1px solid var(--color-line);position:sticky;top:0;z-index:10}
.topbar__back{border:0;background:transparent;font-size:24px;color:var(--color-primary-dark);padding:0 8px;cursor:pointer}
.topbar__title{flex:1;text-align:center;font-size:16px;font-weight:600;margin:0}
</style>
