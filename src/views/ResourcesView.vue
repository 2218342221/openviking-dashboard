<script setup>
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import JsonViewer from '../components/common/JsonViewer.vue'

const { post } = useApi()
const toast = useToast()

const resourcePath = ref('')
const resourceTo = ref('')
const resourceInstruction = ref('')
const resourceWait = ref(false)
const addingResource = ref(false)
const resourceResult = ref(null)

const skillData = ref('')
const addingSkill = ref(false)
const skillResult = ref(null)

const waitingProcessed = ref(false)
const waitResult = ref(null)

async function addResource() {
  if (!resourcePath.value) return
  addingResource.value = true
  resourceResult.value = null
  try {
    const body = { path: resourcePath.value }
    if (resourceTo.value) body.to = resourceTo.value
    if (resourceInstruction.value) body.instruction = resourceInstruction.value
    if (resourceWait.value) body.wait = true
    const d = await post('/resources', body)
    resourceResult.value = d.result || d
    toast.success('Resource added')
    resourcePath.value = ''
  } catch (e) { toast.error(e.message) }
  addingResource.value = false
}

async function addSkill() {
  if (!skillData.value) return
  addingSkill.value = true
  skillResult.value = null
  try {
    let body
    try { body = JSON.parse(skillData.value) } catch { body = { data: skillData.value } }
    const d = await post('/resources/skill', body)
    skillResult.value = d.result || d
    toast.success('Skill added')
    skillData.value = ''
  } catch (e) { toast.error(e.message) }
  addingSkill.value = false
}

async function waitProcessed() {
  waitingProcessed.value = true
  waitResult.value = null
  try {
    const d = await post('/system/wait', {})
    waitResult.value = d.result || d
    toast.success('Processing complete')
  } catch (e) { toast.error(e.message) }
  waitingProcessed.value = false
}
</script>

<template>
  <div>
    <PageHeader title="Resources" subtitle="Add resources and skills to the knowledge base" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Add Resource -->
      <div class="bg-ov-surface border border-ov-border rounded-xl p-6">
        <h2 class="text-base font-semibold text-ov-text mb-4">Add Resource</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Path or URL</label>
            <input v-model="resourcePath" placeholder="https://example.com/doc.pdf or /path/to/file"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Target URI (optional)</label>
            <input v-model="resourceTo" placeholder="viking://resources/docs/"
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors" />
          </div>
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Instruction (optional)</label>
            <textarea v-model="resourceInstruction" rows="2" placeholder="Special processing instructions..."
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent resize-none transition-colors" />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="resourceWait" class="rounded border-ov-input-border accent-ov-accent" />
            <span class="text-sm text-ov-text-muted">Wait for processing to complete</span>
          </label>
          <button @click="addResource" :disabled="!resourcePath || addingResource"
            class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            {{ addingResource ? 'Adding...' : 'Add Resource' }}
          </button>
          <JsonViewer v-if="resourceResult" :data="resourceResult" class="mt-2" />
        </div>
      </div>

      <!-- Add Skill -->
      <div class="bg-ov-surface border border-ov-border rounded-xl p-6">
        <h2 class="text-base font-semibold text-ov-text mb-4">Add Skill</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-ov-text-muted mb-1">Skill Data (JSON)</label>
            <textarea v-model="skillData" rows="8" placeholder='{ "name": "my-skill", ... }'
              class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent font-mono resize-none transition-colors" />
          </div>
          <button @click="addSkill" :disabled="!skillData || addingSkill"
            class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            {{ addingSkill ? 'Adding...' : 'Add Skill' }}
          </button>
          <JsonViewer v-if="skillResult" :data="skillResult" class="mt-2" />
        </div>
      </div>
    </div>

    <!-- Wait Processed -->
    <div class="bg-ov-surface border border-ov-border rounded-xl p-6 mt-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-ov-text">Processing Status</h2>
          <p class="text-sm text-ov-text-muted mt-1">Wait for all pending resources to finish processing.</p>
        </div>
        <button @click="waitProcessed" :disabled="waitingProcessed"
          class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2">
          <svg v-if="waitingProcessed" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ waitingProcessed ? 'Waiting...' : 'Wait for Processing' }}
        </button>
      </div>
      <JsonViewer v-if="waitResult" :data="waitResult" class="mt-4" />
    </div>
  </div>
</template>
