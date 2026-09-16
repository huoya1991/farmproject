<template>
  <span class="tag" :class="`tag--${variant}`"><slot /></span>
</template>
<script setup lang="ts">
defineProps<{ variant: 'done'|'undone'|'overdue' }>()
</script>
<style scoped>
.tag{display:inline-block;padding:3px 9px;border-radius:8px;font-size:11px;font-weight:600;line-height:16px;white-space:nowrap}
.tag--done{background:var(--color-done-bg);color:var(--color-done-fg)}
.tag--undone{background:var(--color-undone-bg);color:var(--color-undone-fg)}
.tag--overdue{background:var(--color-overdue-bg);color:var(--color-overdue-fg)}
</style>
