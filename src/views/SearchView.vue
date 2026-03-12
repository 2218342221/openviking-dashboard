<script setup>
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import JsonViewer from '../components/common/JsonViewer.vue'

const { post } = useApi()
const toast = useToast()

const modes = [
  { id: 'find', label: 'Semantic Find', desc: 'Semantic search without session context' },
  { id: 'search', label: 'Search', desc: 'Semantic search with optional session' },
  { id: 'grep', label: 'Grep', desc: 'Pattern-based content search' },
  { id: 'glob', label: 'Glob', desc: 'Filename pattern matching' },
]

const activeMode = ref('find')
const query = ref('')
const targetUri = ref('')
const sessionId = ref('')
const limit = ref(10)
const caseInsensitive = ref(false)
const results = ref(null)
const searching = ref(false)
const selectedResult = ref(null)

async function doSearch() {
  if (!query.value) return
  searching.value = true
  results.value = null
  selectedResult.value = null

  try {
    let body = {}
    if (activeMode.value === 'find') {
      body = { query: query.value, limit: limit.value }
      if (targetUri.value) body.target_uri = targetUri.value
    } else if (activeMode.value === 'search') {
      body = { query: query.value, limit: limit.value }
      if (targetUri.value) body.target_uri = targetUri.value
      if (sessionId.value) body.session_id = sessionId.value
    } else if (activeMode.value === 'grep') {
      body = { pattern: query.value }
      if (targetUri.value) body.uri = targetUri.value
      if (caseInsensitive.value) body.case_insensitive = true
    } else if (activeMode.value === 'glob') {
      body = { pattern: query.value }
      if (targetUri.value) body.uri = targetUri.value
    }

    const d = await post(`/search/${activeMode.value}`, body)
    results.value = d.result || d
  } catch (e) { toast.error(e.message) }
  searching.value = false
}
</script>

<template>
  <div>
    <PageHeader title="Search" subtitle="Find content across the knowledge base" />

    <!-- Mode Tabs -->
    <div class="flex gap-1 mb-6 bg-ov-surface border border-ov-border rounded-xl p-1">
      <button
        v-for="mode in modes"
        :key="mode.id"
        @click="activeMode = mode.id; results = null"
        :class="activeMode === mode.id ? 'bg-ov-accent text-white' : 'text-ov-text-muted hover:text-ov-text hover:bg-ov-surface-2'"
        class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >{{ mode.label }}</button>
    </div>

    <!-- Search Form -->
    <div class="bg-ov-surface border border-ov-border rounded-xl p-6 mb-6">
      <p class="text-xs text-ov-text-muted mb-3">{{ modes.find(m => m.id === activeMode)?.desc }}</p>

      <div class="space-y-3">
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">
            {{ activeMode === 'grep' ? 'Pattern' : activeMode === 'glob' ? 'Glob Pattern' : 'Query' }}
          </label>
          <input
            v-model="query"
            :placeholder="activeMode === 'grep' ? 'e.g. TODO|FIXME' : activeMode === 'glob' ? 'e.g. **/*.md' : 'e.g. How does authentication work?'"
            class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors"
            @keyup.enter="doSearch"
          />
        </div>

        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-48">
            <label class="block text-xs text-ov-text-muted mb-1">Target URI (optional)</label>
            <input v-model="targetUri" placeholder="viking://resources/"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>

          <div v-if="activeMode === 'search'">
            <label class="block text-xs text-ov-text-muted mb-1">Session ID (optional)</label>
            <input v-model="sessionId" placeholder="session-id"
              class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors w-48" />
          </div>

          <div v-if="activeMode === 'find' || activeMode === 'search'">
            <label class="block text-xs text-ov-text-muted mb-1">Limit</label>
            <input v-model.number="limit" type="number" min="1" max="100"
              class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text focus:outline-none focus:border-ov-accent transition-colors w-20" />
          </div>

          <div v-if="activeMode === 'grep'" class="flex items-end">
            <label class="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <input type="checkbox" v-model="caseInsensitive" class="rounded border-ov-input-border accent-ov-accent" />
              <span class="text-xs text-ov-text-muted">Case insensitive</span>
            </label>
          </div>
        </div>

        <button
          @click="doSearch"
          :disabled="!query || searching"
          class="px-6 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          <svg v-if="searching" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="results !== null">
      <div v-if="Array.isArray(results) && results.length > 0" class="space-y-3">
        <div
          v-for="(r, i) in results"
          :key="i"
          @click="selectedResult = selectedResult === i ? null : i"
          class="bg-ov-surface border border-ov-border rounded-xl p-4 hover:border-ov-accent/30 transition-colors cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-sm text-ov-accent truncate">{{ r.uri || r.path || r.file || `Result ${i + 1}` }}</span>
            <span v-if="r.score !== undefined" class="text-xs text-ov-text-muted bg-ov-bg px-2 py-0.5 rounded-full">
              score: {{ typeof r.score === 'number' ? r.score.toFixed(3) : r.score }}
            </span>
          </div>
          <p v-if="r.abstract || r.content || r.text" class="text-sm text-ov-text-muted line-clamp-3">
            {{ r.abstract || r.content || r.text }}
          </p>
          <JsonViewer v-if="selectedResult === i" :data="r" class="mt-3" />
        </div>
      </div>
      <div v-else-if="Array.isArray(results) && results.length === 0" class="bg-ov-surface border border-ov-border rounded-xl p-8 text-center text-ov-text-muted">
        No results found.
      </div>
      <div v-else>
        <JsonViewer :data="results" />
      </div>
    </div>
  </div>
</template>
