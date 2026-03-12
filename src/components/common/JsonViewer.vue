<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: [Object, Array, String, Number, Boolean, null], default: null },
  maxHeight: { type: String, default: '24rem' },
})

const formatted = computed(() => {
  if (props.data === null || props.data === undefined) return 'null'
  if (typeof props.data === 'string') return props.data
  return JSON.stringify(props.data, null, 2)
})
</script>

<template>
  <pre
    class="bg-ov-bg border border-ov-border rounded-lg p-4 text-sm font-mono text-ov-text-muted overflow-auto whitespace-pre-wrap"
    :style="{ maxHeight }"
  >{{ formatted }}</pre>
</template>
