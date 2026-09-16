<template>
  <div class="section-title">{{ title }}</div>
  <div class="icon-grid"><slot /></div>
</template>
<script setup lang="ts">
defineProps<{ title: string }>()
</script>
<style scoped>
.section-title{display:flex;align-items:center;margin:24px 16px 14px;font-size:15px;font-weight:700;color:var(--color-text)}
.section-title::before{content:"";width:4px;height:14px;border-radius:2px;background:linear-gradient(180deg,#37B45C,#157A38);margin-right:8px}
.icon-grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:20px;padding:0 10px}
</style>
