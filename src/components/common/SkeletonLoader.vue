<script setup>
defineProps({
  lines: { type: Number, default: 3 },
})
</script>

<template>
  <div class="space-y-3 animate-pulse">
    <div
      v-for="i in lines"
      :key="i"
      class="h-4 bg-ov-surface-2 rounded"
      :class="i === lines ? 'w-2/3' : 'w-full'"
    />
  </div>
</template>
