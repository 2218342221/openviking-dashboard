<script setup>
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import JsonViewer from '../components/common/JsonViewer.vue'

const { post } = useApi()
const toast = useToast()

const exportUri = ref('')
const exportTo = ref('')
const exporting = ref(false)
const exportResult = ref(null)

const importPath = ref('')
const importParent = ref('')
const importForce = ref(false)
const importVectorize = ref(true)
const importing = ref(false)
const importResult = ref(null)

async function doExport() {
  if (!exportUri.value) return
  exporting.value = true
  exportResult.value = null
  try {
    const body = { uri: exportUri.value }
    if (exportTo.value) body.to = exportTo.value
    const d = await post('/pack/export', body)
    exportResult.value = d.result || d
    toast.success('Export complete')
  } catch (e) { toast.error(e.message) }
  exporting.value = false
}

async function doImport() {
  if (!importPath.value) return
  importing.value = true
  importResult.value = null
  try {
    const body = { file_path: importPath.value }
    if (importParent.value) body.parent = importParent.value
    if (importForce.value) body.force = true
    body.vectorize = importVectorize.value
    const d = await post('/pack/import', body)
    importResult.value = d.result || d
    toast.success('Import complete')
  } catch (e) { toast.error(e.message) }
  importing.value = false
}
</script>

<template>
  <div>
    <PageHeader title="Pack" subtitle="Export and import .ovpack archives" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Export -->
      <div class="bg-ov-surface border border-ov-border rounded-xl p-6">
        <h2 class="text-base font-semibold text-ov-text mb-4">Export</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Source URI</label>
            <input v-model="exportUri" placeholder="viking://resources/my-project"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Destination Path (optional)</label>
            <input v-model="exportTo" placeholder="/path/to/output.ovpack"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <button @click="doExport" :disabled="!exportUri || exporting"
            class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
          <JsonViewer v-if="exportResult" :data="exportResult" class="mt-2" />
        </div>
      </div>

      <!-- Import -->
      <div class="bg-ov-surface border border-ov-border rounded-xl p-6">
        <h2 class="text-base font-semibold text-ov-text mb-4">Import</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">File Path</label>
            <input v-model="importPath" placeholder="/path/to/archive.ovpack"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Parent URI (optional)</label>
            <input v-model="importParent" placeholder="viking://resources/"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="importForce" class="rounded border-ov-input-border accent-ov-accent" />
              <span class="text-sm text-ov-text-muted">Force overwrite</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="importVectorize" class="rounded border-ov-input-border accent-ov-accent" />
              <span class="text-sm text-ov-text-muted">Vectorize</span>
            </label>
          </div>
          <button @click="doImport" :disabled="!importPath || importing"
            class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            {{ importing ? 'Importing...' : 'Import' }}
          </button>
          <JsonViewer v-if="importResult" :data="importResult" class="mt-2" />
        </div>
      </div>
    </div>
  </div>
</template>
