<script setup>
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import JsonViewer from '../components/common/JsonViewer.vue'

const { get, post, del } = useApi()
const toast = useToast()

const queryUri = ref('')
const relations = ref(null)
const loadingRelations = ref(false)

const linkFrom = ref('')
const linkTo = ref('')
const linkReason = ref('')
const linking = ref(false)

async function loadRelations() {
  if (!queryUri.value) return
  loadingRelations.value = true
  relations.value = null
  try {
    const d = await get('/relations', { uri: queryUri.value })
    relations.value = d.result || d
  } catch (e) { toast.error(e.message) }
  loadingRelations.value = false
}

async function createLink() {
  if (!linkFrom.value || !linkTo.value) return
  linking.value = true
  try {
    const toUris = linkTo.value.split(',').map(s => s.trim()).filter(Boolean)
    await post('/relations/link', {
      from_uri: linkFrom.value,
      to_uris: toUris,
      reason: linkReason.value || undefined,
    })
    toast.success('Link created')
    linkTo.value = ''
    linkReason.value = ''
    if (queryUri.value === linkFrom.value) loadRelations()
  } catch (e) { toast.error(e.message) }
  linking.value = false
}

async function unlinkRelation(fromUri, toUri) {
  try {
    await del('/relations/link', { from_uri: fromUri, to_uri: toUri })
    toast.success('Link removed')
    if (queryUri.value) loadRelations()
  } catch (e) { toast.error(e.message) }
}
</script>

<template>
  <div>
    <PageHeader title="Relations" subtitle="View and manage resource relations" />

    <!-- Query Relations -->
    <div class="bg-ov-surface border border-ov-border rounded-xl p-6 mb-6">
      <h2 class="text-base font-semibold text-ov-text mb-4">Query Relations</h2>
      <div class="flex gap-3 items-end">
        <div class="flex-1">
          <label class="block text-xs text-ov-text-muted mb-1">Resource URI</label>
          <input v-model="queryUri" placeholder="viking://resources/my-doc"
            class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors"
            @keyup.enter="loadRelations" />
        </div>
        <button @click="loadRelations" :disabled="!queryUri || loadingRelations"
          class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {{ loadingRelations ? 'Loading...' : 'Query' }}
        </button>
      </div>

      <!-- Results -->
      <div v-if="relations !== null" class="mt-4">
        <div v-if="Array.isArray(relations) && relations.length > 0" class="space-y-2">
          <div
            v-for="(rel, i) in relations"
            :key="i"
            class="flex items-center justify-between bg-ov-bg border border-ov-border rounded-lg px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-mono text-ov-accent truncate">{{ rel.from_uri || rel.uri || queryUri }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-ov-text-muted shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <span class="font-mono text-ov-info truncate">{{ rel.to_uri || rel.related_uri || '' }}</span>
              </div>
              <p v-if="rel.reason" class="text-xs text-ov-text-muted mt-1">{{ rel.reason }}</p>
            </div>
            <button
              @click="unlinkRelation(rel.from_uri || queryUri, rel.to_uri || rel.related_uri)"
              class="text-ov-danger text-sm hover:underline cursor-pointer ml-3 shrink-0"
            >Unlink</button>
          </div>
        </div>
        <div v-else-if="Array.isArray(relations) && relations.length === 0" class="text-center text-ov-text-muted py-4">
          No relations found.
        </div>
        <JsonViewer v-else :data="relations" />
      </div>
    </div>

    <!-- Create Link -->
    <div class="bg-ov-surface border border-ov-border rounded-xl p-6">
      <h2 class="text-base font-semibold text-ov-text mb-4">Create Link</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">From URI</label>
          <input v-model="linkFrom" placeholder="viking://resources/source"
            class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
        </div>
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">To URIs (comma-separated)</label>
          <input v-model="linkTo" placeholder="viking://resources/target1, viking://resources/target2"
            class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
        </div>
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">Reason (optional)</label>
          <input v-model="linkReason" placeholder="Related documentation"
            class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
        </div>
        <button @click="createLink" :disabled="!linkFrom || !linkTo || linking"
          class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {{ linking ? 'Linking...' : 'Create Link' }}
        </button>
      </div>
    </div>
  </div>
</template>
