<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-ov-text">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-ov-text-muted mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
