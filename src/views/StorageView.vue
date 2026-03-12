<script setup>
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'

const { get, post, del } = useApi()
const toast = useToast()

const scopes = ['agent', 'user', 'resources', 'temp', 'session']
const currentPath = ref('')
const fsItems = ref([])
const fsLoading = ref(false)
const fileContent = ref(null)
const fileContentUri = ref(null)
const contentLevel = ref('read')
const showMkdir = ref(false)
const mkdirName = ref('')

const breadcrumbs = computed(() => {
  if (!currentPath.value) return []
  const parts = currentPath.value.split('/').filter(Boolean)
  return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
})

function isDir(item) {
  if (typeof item === 'object' && item !== null && 'isDir' in item) return item.isDir
  const name = typeof item === 'string' ? item : (item.uri || item.path || '')
  return name.endsWith('/')
}

function itemName(item) {
  const name = typeof item === 'string' ? item : (item.uri || item.path || String(item))
  const stripped = name.replace(/\/$/, '')
  const parts = stripped.split('/')
  return parts[parts.length - 1]
}

function itemUri(item) {
  return typeof item === 'string' ? item : (item.uri || item.path || String(item))
}

function itemAbstract(item) {
  return (typeof item === 'object' && item !== null) ? item.abstract : null
}

async function browseTo(p) {
  currentPath.value = p
  fileContent.value = null
  fileContentUri.value = null
  if (!p) { fsItems.value = []; return }
  fsLoading.value = true
  try {
    const d = await get('/fs/ls', { uri: `viking://${p}` })
    fsItems.value = d.result || d || []
  } catch { fsItems.value = [] }
  fsLoading.value = false
}

async function onItemClick(item) {
  const uri = itemUri(item)
  if (isDir(item)) {
    const stripped = uri.replace(/^viking:\/\//, '')
    browseTo(stripped)
  } else {
    await loadContent(uri, 'read')
  }
}

async function loadContent(uri, level) {
  contentLevel.value = level
  fileContentUri.value = uri
  try {
    const d = await get(`/content/${level}`, { uri })
    const c = d.result || d
    fileContent.value = typeof c === 'string' ? c : JSON.stringify(c, null, 2)
  } catch (e) {
    fileContent.value = `Error: ${e.message}`
  }
}

async function doMkdir() {
  if (!mkdirName.value) return
  const uri = `viking://${currentPath.value}/${mkdirName.value}`
  try {
    await post('/fs/mkdir', { uri })
    toast.success(`Directory "${mkdirName.value}" created`)
    mkdirName.value = ''
    showMkdir.value = false
    browseTo(currentPath.value)
  } catch (e) { toast.error(e.message) }
}

async function deleteItem(item) {
  const uri = itemUri(item)
  if (!confirm(`Delete "${itemName(item)}"?`)) return
  try {
    await del('/fs', { uri, recursive: 'true' })
    toast.success('Deleted')
    browseTo(currentPath.value)
  } catch (e) { toast.error(e.message) }
}
</script>

<template>
  <div>
    <PageHeader title="Storage" subtitle="Browse the viking:// filesystem">
      <template #actions>
        <button
          v-if="currentPath"
          @click="showMkdir = !showMkdir"
          class="px-4 py-2 text-sm rounded-lg bg-ov-accent hover:bg-ov-accent-hover text-white font-medium transition-colors cursor-pointer"
        >New Folder</button>
      </template>
    </PageHeader>

    <!-- Breadcrumb -->
    <div class="flex items-center gap-1 mb-4 text-sm flex-wrap">
      <button @click="browseTo('')" class="text-ov-accent hover:underline font-medium cursor-pointer">viking://</button>
      <template v-for="(crumb, i) in breadcrumbs" :key="i">
        <span class="text-ov-text-muted">/</span>
        <button @click="browseTo(crumb.path)" class="text-ov-accent hover:underline cursor-pointer">{{ crumb.name }}</button>
      </template>
    </div>

    <!-- Mkdir -->
    <div v-if="showMkdir" class="bg-ov-surface border border-ov-border rounded-xl p-4 mb-4 flex gap-3 items-end">
      <div class="flex-1">
        <label class="block text-xs text-ov-text-muted mb-1">Directory name</label>
        <input v-model="mkdirName" placeholder="new-folder"
          class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent"
          @keyup.enter="doMkdir" />
      </div>
      <button @click="doMkdir" :disabled="!mkdirName"
        class="px-4 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 cursor-pointer">Create</button>
      <button @click="showMkdir = false" class="px-3 py-2 text-ov-text-muted hover:text-ov-text cursor-pointer">&times;</button>
    </div>

    <!-- Scope Selector -->
    <div v-if="!currentPath" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <button
        v-for="scope in scopes"
        :key="scope"
        @click="browseTo(scope)"
        class="bg-ov-surface border border-ov-border rounded-xl p-4 text-left hover:border-ov-accent/50 transition-colors cursor-pointer group"
      >
        <div class="flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-ov-text-muted group-hover:text-ov-accent transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          <span class="font-medium text-ov-text">{{ scope }}</span>
        </div>
        <div class="text-xs text-ov-text-muted">viking://{{ scope }}/</div>
      </button>
    </div>

    <!-- Directory Listing -->
    <div v-if="currentPath" class="bg-ov-surface border border-ov-border rounded-xl overflow-hidden mb-6">
      <SkeletonLoader v-if="fsLoading" :lines="4" class="p-4" />
      <div v-else-if="fsItems.length === 0" class="p-8 text-center text-ov-text-muted">Empty directory.</div>
      <div v-else class="divide-y divide-ov-border">
        <div
          v-for="item in fsItems"
          :key="itemUri(item)"
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-ov-surface-2/50 transition-colors group"
        >
          <button @click="onItemClick(item)" class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left">
            <svg v-if="isDir(item)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-ov-warning shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-ov-text-muted shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <div class="min-w-0 flex-1">
              <span class="text-sm font-medium text-ov-text truncate block">{{ itemName(item) }}</span>
              <span v-if="itemAbstract(item)" class="text-xs text-ov-text-muted truncate block">{{ itemAbstract(item) }}</span>
            </div>
          </button>
          <button
            @click="deleteItem(item)"
            class="opacity-0 group-hover:opacity-100 text-ov-text-muted hover:text-ov-danger transition-all cursor-pointer p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- File Content Viewer -->
    <div v-if="fileContent !== null" class="bg-ov-surface border border-ov-border rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-sm text-ov-text-muted truncate flex-1 mr-4">{{ fileContentUri }}</h3>
        <div class="flex gap-1">
          <button
            v-for="level in ['abstract', 'overview', 'read']"
            :key="level"
            @click="loadContent(fileContentUri, level)"
            :class="contentLevel === level ? 'bg-ov-accent text-white' : 'text-ov-text-muted hover:bg-ov-surface-2'"
            class="px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer capitalize"
          >{{ level === 'read' ? 'Content' : level === 'abstract' ? 'L0 Abstract' : 'L1 Overview' }}</button>
        </div>
        <button @click="fileContent = null; fileContentUri = null" class="text-ov-text-muted hover:text-ov-text ml-3 cursor-pointer">&times;</button>
      </div>
      <pre class="bg-ov-bg border border-ov-border rounded-lg p-4 text-sm font-mono text-ov-text-muted overflow-auto max-h-96 whitespace-pre-wrap">{{ fileContent }}</pre>
    </div>
  </div>
</template>
