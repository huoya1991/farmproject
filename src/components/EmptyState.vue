<template>
  <div class="empty">
    <div class="empty__ico">🌱</div>
    <p class="empty__text">{{ text }}</p>
  </div>
</template>
<script setup lang="ts">
defineProps<{ text: string }>()
</script>
<style scoped>
.empty{padding:64px 24px;text-align:center;color:var(--color-text-3)}
.empty__ico{font-size:40px;margin-bottom:8px}
.empty__text{margin:0;font-size:14px}
</style>
