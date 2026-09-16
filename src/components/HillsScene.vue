<template><div class="hills-scene" :style="{ height }" v-html="HILLS" /></template>
<script setup lang="ts">
// 值逐字拷贝 prototype/index.html 的 HILLS
const HILLS = '<svg class="hills" viewBox="0 0 375 150" preserveAspectRatio="xMidYMax slice">' +
  '<circle cx="52" cy="24" r="13" fill="#FFF3C4" opacity=".95"/>' +
  '<ellipse cx="128" cy="30" rx="20" ry="7" fill="#fff" opacity=".85"/>' +
  '<ellipse cx="312" cy="18" rx="15" ry="6" fill="#fff" opacity=".75"/>' +
  '<ellipse cx="220" cy="42" rx="12" ry="5" fill="#fff" opacity=".6"/>' +
  '<path d="M0 88 Q60 58 125 80 T250 76 T375 86 V150 H0 Z" fill="#A9DCB4"/>' +
  '<path d="M0 108 Q80 82 165 102 T375 104 V150 H0 Z" fill="#8AD09C"/>' +
  '<path d="M0 128 Q100 110 205 124 T375 122 V150 H0 Z" fill="#6FC385"/>' +
  '<g><rect x="282" y="82" width="28" height="19" rx="1" fill="#FFF7EC"/><path d="M278 84l18-13 18 13z" fill="#E0644A"/><rect x="292" y="90" width="7" height="11" fill="#C98A5A"/></g>' +
  '<g><rect x="262" y="88" width="3" height="12" fill="#8A6A4A"/><circle cx="263" cy="82" r="9" fill="#4FAE66"/><circle cx="255" cy="88" r="6" fill="#5BBF74"/></g>' +
  '<g><rect x="326" y="92" width="3" height="10" fill="#8A6A4A"/><circle cx="327" cy="86" r="7" fill="#4FAE66"/></g>' +
  '<g><rect x="38" y="96" width="3" height="11" fill="#8A6A4A"/><circle cx="39" cy="90" r="8" fill="#5BBF74"/></g>' +
  '</svg>'
withDefaults(defineProps<{ height?: string }>(), { height: '128px' })
</script>
