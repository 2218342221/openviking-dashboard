<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'
import ObserverTable from '../components/common/ObserverTable.vue'

const { get, post } = useApi()
const toast = useToast()

const loading = ref(true)
const observer = ref(null)
const systemStatus = ref(null)
const autoRefresh = ref(false)
let refreshInterval = null

const componentOrder = ['queue', 'vikingdb', 'vlm', 'transaction']

const componentIcons = {
  queue: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
  vikingdb: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  vlm: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z',
  transaction: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
}

function sortedComponents() {
  if (!observer.value?.components) return []
  return componentOrder
    .filter(k => observer.value.components[k])
    .map(k => ({ key: k, ...observer.value.components[k] }))
}

async function loadAll() {
  loading.value = true
  try {
    const d = await get('/observer/system')
    observer.value = d.result || d
  } catch { /* ignore */ }
  try {
    const d = await get('/system/status')
    systemStatus.value = d.result || d
  } catch { /* ignore */ }
  loading.value = false
}

async function waitProcessed() {
  toast.info('Waiting for processing to complete...')
  try {
    await post('/system/wait', {})
    toast.success('Processing complete')
    loadAll()
  } catch (e) { toast.error(e.message) }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshInterval = setInterval(loadAll, 5000)
  } else {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(loadAll)
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div>
    <PageHeader title="System" subtitle="Observer and system monitoring">
      <template #actions>
        <button @click="waitProcessed"
          class="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors cursor-pointer">
          Wait Processed
        </button>
        <button @click="toggleAutoRefresh"
          :class="autoRefresh ? 'bg-ov-accent text-white' : 'border border-ov-border text-ov-text-muted hover:bg-ov-surface-2'"
          class="px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer">
          {{ autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh' }}
        </button>
        <button @click="loadAll"
          class="px-4 py-2 text-sm rounded-lg border border-ov-border text-ov-text-muted hover:bg-ov-surface-2 transition-colors cursor-pointer">
          Refresh
        </button>
      </template>
    </PageHeader>

    <SkeletonLoader v-if="loading" :lines="6" />

    <div v-else class="space-y-6">
      <!-- System Status -->
      <div v-if="systemStatus" class="bg-ov-surface border border-ov-border rounded-xl p-5">
        <h2 class="text-sm font-semibold text-ov-text-muted uppercase tracking-wider mb-4">System Status</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="(val, key) in systemStatus" :key="key" class="bg-ov-bg rounded-lg p-3">
            <div class="text-xs text-ov-text-muted mb-1 capitalize">{{ key.replace(/_/g, ' ') }}</div>
            <div class="text-sm font-medium text-ov-text">
              <span v-if="typeof val === 'boolean'" class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full" :class="val ? 'bg-ov-accent' : 'bg-ov-danger'" />
                {{ val ? 'Yes' : 'No' }}
              </span>
              <span v-else>{{ val }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observer Health Overview -->
      <div v-if="observer" class="bg-ov-surface border border-ov-border rounded-xl p-5">
        <div class="flex items-center gap-3 mb-4">
          <span
            class="w-3 h-3 rounded-full"
            :class="observer.is_healthy ? 'bg-ov-accent animate-pulse' : 'bg-ov-danger animate-pulse'"
          />
          <h2 class="text-sm font-semibold text-ov-text-muted uppercase tracking-wider">
            Overall Health: {{ observer.is_healthy ? 'Healthy' : 'Unhealthy' }}
          </h2>
        </div>
        <div v-if="observer.errors?.length" class="space-y-2 mb-4">
          <div v-for="(err, i) in observer.errors" :key="i"
            class="flex items-start gap-2 p-3 bg-ov-danger/10 border border-ov-danger/20 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-ov-danger shrink-0 mt-0.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span class="text-sm text-ov-danger">{{ err }}</span>
          </div>
        </div>
      </div>

      <!-- Observer Component Cards -->
      <div v-if="observer?.components" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="comp in sortedComponents()"
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
    </div>
  </div>
</template>
