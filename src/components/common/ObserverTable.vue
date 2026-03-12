<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
})

const parsed = computed(() => {
  const s = props.status
  if (!s || !s.includes('|')) return null

  const lines = s.split('\n').filter(l => l.trim().startsWith('|'))
  if (lines.length < 2) return null

  const extract = line =>
    line.split('|').slice(1, -1).map(c => c.trim())

  const headers = extract(lines[0])
  const rows = lines.slice(1).map(extract)

  return { headers, rows }
})

function cellClass(value, header) {
  const v = value.toLowerCase()
  if (v === 'ok' || v === 'healthy') return 'text-ov-accent font-medium'
  if (v === 'error' || v === 'failed') return 'text-ov-danger font-medium'
  if (header?.toLowerCase() === 'errors' && parseInt(value) > 0) return 'text-ov-danger font-medium'
  if (header?.toLowerCase() === 'pending' && parseInt(value) > 0) return 'text-ov-warning font-medium'
  if (header?.toLowerCase() === 'in progress' && parseInt(value) > 0) return 'text-ov-info font-medium'
  return ''
}

function isTotal(row) {
  return row[0]?.toUpperCase() === 'TOTAL'
}

function formatCell(value, header) {
  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/)
  if (isoMatch) return `${isoMatch[1]} ${isoMatch[2]}`
  return value
}
</script>

<template>
  <div v-if="parsed" class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-ov-border">
          <th
            v-for="(h, i) in parsed.headers"
            :key="i"
            class="px-3 py-2 text-left text-xs font-semibold text-ov-text-muted uppercase tracking-wider"
            :class="i > 0 ? 'text-right' : ''"
          >{{ h }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-ov-border/50">
        <tr
          v-for="(row, ri) in parsed.rows"
          :key="ri"
          :class="isTotal(row) ? 'bg-ov-surface-2/30 font-medium' : 'hover:bg-ov-surface-2/20'"
          class="transition-colors"
        >
          <td
            v-for="(cell, ci) in row"
            :key="ci"
            class="px-3 py-2 text-ov-text"
            :class="[ci > 0 ? 'text-right tabular-nums' : '', cellClass(cell, parsed.headers[ci])]"
          >{{ formatCell(cell, parsed.headers[ci]) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="text-sm text-ov-text-muted">{{ status || 'No data available.' }}</p>
</template>
