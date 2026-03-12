<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import PageHeader from '../components/common/PageHeader.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'
import ObserverTable from '../components/common/ObserverTable.vue'

const { get } = useApi()

const healthy = ref(null)
const observer = ref(null)
const loading = ref(true)

const componentOrder = ['queue', 'vikingdb', 'vlm', 'transaction']

const sortedComponents = computed(() => {
  if (!observer.value?.components) return []
  return componentOrder
    .filter(k => observer.value.components[k])
    .map(k => ({ key: k, ...observer.value.components[k] }))
})

const summaryStats = computed(() => {
  if (!observer.value?.components) return []
  const stats = []
  const q = observer.value.components.queue
  if (q?.status) {
    const m = q.status.match(/TOTAL\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/)
    if (m) {
      stats.push({ label: 'Processed', value: m[3], icon: 'check' })
      stats.push({ label: 'Pending', value: m[1], icon: 'clock', warn: parseInt(m[1]) > 0 })
      stats.push({ label: 'Errors', value: m[4], icon: 'alert', danger: parseInt(m[4]) > 0 })
    }
  }
  const vdb = observer.value.components.vikingdb
  if (vdb?.status) {
    const m = vdb.status.match(/TOTAL\s*\|\s*(\d+)\s*\|\s*(\d+)/)
    if (m) stats.push({ label: 'Vectors', value: m[2], icon: 'db' })
  }
  const vlm = observer.value.components.vlm
  if (vlm?.status) {
    const m = vlm.status.match(/TOTAL\s*\|[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/)
    if (m) stats.push({ label: 'LLM Tokens', value: formatNum(m[3]), icon: 'spark' })
  }
  return stats
})

function formatNum(n) {
  const v = parseInt(n)
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K'
  return String(v)
}

const componentIcons = {
  queue: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
  vikingdb: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  vlm: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z',
  transaction: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
}

async function refresh() {
  loading.value = true
  try {
    await get('/health')
    healthy.value = true
  } catch {
    healthy.value = false
  }
  try {
    const d = await get('/observer/system')
    observer.value = d.result || d
  } catch { /* ignore */ }
  loading.value = false
}

onMounted(refresh)
</script>

<template>
  <div>
    <PageHeader title="Dashboard" subtitle="System health and status overview">
      <template #actions>
        <button
          @click="refresh"
          class="px-4 py-2 text-sm rounded-lg border border-ov-border text-ov-text-muted hover:bg-ov-surface-2 transition-colors cursor-pointer"
        >Refresh</button>
      </template>
    </PageHeader>

    <SkeletonLoader v-if="loading" :lines="5" />

    <div v-else class="space-y-6">
      <!-- Health + Summary Row -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <!-- Health Card -->
        <div
          class="col-span-2 md:col-span-3 lg:col-span-1 bg-ov-surface border rounded-xl p-4 flex items-center gap-3"
          :class="healthy ? 'border-ov-accent/40' : 'border-ov-danger/40'"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="healthy ? 'bg-ov-accent/10' : 'bg-ov-danger/10'"
          >
            <span
              :class="healthy ? 'bg-ov-accent' : 'bg-ov-danger'"
              class="w-3 h-3 rounded-full animate-pulse"
            />
          </div>
          <div>
            <div class="text-sm font-semibold text-ov-text">{{ healthy ? 'Online' : 'Offline' }}</div>
            <div class="text-xs text-ov-text-muted">Server</div>
          </div>
        </div>

        <!-- Summary Stat Cards -->
        <div
          v-for="stat in summaryStats"
          :key="stat.label"
          class="bg-ov-surface border border-ov-border rounded-xl p-4"
        >
          <div class="text-xs text-ov-text-muted mb-1">{{ stat.label }}</div>
          <div
            class="text-xl font-bold tabular-nums"
            :class="stat.danger ? 'text-ov-danger' : stat.warn ? 'text-ov-warning' : 'text-ov-text'"
          >{{ stat.value }}</div>
        </div>
      </div>

      <!-- Observer Components -->
      <div v-if="observer?.components" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="comp in sortedComponents"
          :key="comp.key"
          class="bg-ov-surface border rounded-xl overflow-hidden transition-colors"
          :class="comp.is_healthy ? 'border-ov-border' : 'border-ov-danger/50'"
        >
          <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-ov-border/50">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :class="comp.is_healthy ? 'bg-ov-accent/10' : 'bg-ov-danger/10'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                class="w-4 h-4"
                :class="comp.is_healthy ? 'text-ov-accent' : 'text-ov-danger'"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="componentIcons[comp.key] || componentIcons.queue" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm text-ov-text capitalize">{{ comp.key }}</h3>
            </div>
            <span
              class="px-2 py-0.5 text-xs rounded-full font-medium"
              :class="comp.is_healthy
                ? 'bg-ov-accent/10 text-ov-accent'
                : 'bg-ov-danger/10 text-ov-danger'"
            >{{ comp.is_healthy ? 'Healthy' : 'Error' }}</span>
          </div>
          <div class="px-3 py-3">
            <ObserverTable :status="comp.status" />
          </div>
        </div>
      </div>

      <div v-else class="bg-ov-surface border border-ov-border rounded-xl p-8 text-center text-ov-text-muted">
        No observer data available.
      </div>
    </div>
  </div>
</template>
