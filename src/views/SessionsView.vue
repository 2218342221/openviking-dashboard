<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import JsonViewer from '../components/common/JsonViewer.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'

const { get, post, del } = useApi()
const toast = useToast()

const sessions = ref([])
const loading = ref(true)
const selectedSession = ref(null)
const sessionDetail = ref(null)
const newMsgRole = ref('user')
const newMsgContent = ref('')
const sendingMsg = ref(false)
const confirmDel = ref({ show: false, id: '' })

function sessionId(s) {
  return typeof s === 'string' ? s : (s.id || s.session_id || JSON.stringify(s))
}

async function loadSessions() {
  loading.value = true
  try {
    const d = await get('/sessions')
    sessions.value = d.result || d || []
  } catch (e) { toast.error(e.message) }
  loading.value = false
}

async function createSession() {
  try {
    const d = await post('/sessions', {})
    toast.success('Session created')
    await loadSessions()
    const id = d.result?.id || d.result?.session_id || d.id || d.session_id
    if (id) viewSession(id)
  } catch (e) { toast.error(e.message) }
}

async function viewSession(id) {
  selectedSession.value = id
  try {
    const d = await get(`/sessions/${encodeURIComponent(id)}`)
    sessionDetail.value = d.result || d
  } catch (e) { toast.error(e.message) }
}

async function deleteSession(id) {
  try {
    await del(`/sessions/${encodeURIComponent(id)}`)
    toast.success('Session deleted')
    if (selectedSession.value === id) { selectedSession.value = null; sessionDetail.value = null }
    loadSessions()
  } catch (e) { toast.error(e.message) }
}

async function addMessage() {
  if (!newMsgContent.value || !selectedSession.value) return
  sendingMsg.value = true
  try {
    await post(`/sessions/${encodeURIComponent(selectedSession.value)}/messages`, {
      role: newMsgRole.value,
      content: newMsgContent.value,
    })
    newMsgContent.value = ''
    toast.success('Message added')
    viewSession(selectedSession.value)
  } catch (e) { toast.error(e.message) }
  sendingMsg.value = false
}

async function commitSession() {
  if (!selectedSession.value) return
  try {
    await post(`/sessions/${encodeURIComponent(selectedSession.value)}/commit`)
    toast.success('Session committed')
    viewSession(selectedSession.value)
  } catch (e) { toast.error(e.message) }
}

onMounted(loadSessions)
</script>

<template>
  <div>
    <PageHeader title="Sessions" subtitle="Manage conversation sessions">
      <template #actions>
        <button @click="createSession" class="px-4 py-2 text-sm rounded-lg bg-ov-accent hover:bg-ov-accent-hover text-white font-medium transition-colors cursor-pointer">
          New Session
        </button>
        <button @click="loadSessions" class="px-4 py-2 text-sm rounded-lg border border-ov-border text-ov-text-muted hover:bg-ov-surface-2 transition-colors cursor-pointer">
          Refresh
        </button>
      </template>
    </PageHeader>

    <SkeletonLoader v-if="loading" :lines="4" />

    <div v-else class="space-y-6">
      <!-- Sessions List -->
      <div class="bg-ov-surface border border-ov-border rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-ov-border">
              <th class="px-5 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Session ID</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Info</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ov-border">
            <tr
              v-for="s in sessions"
              :key="sessionId(s)"
              class="hover:bg-ov-surface-2/50 transition-colors"
              :class="selectedSession === sessionId(s) ? 'bg-ov-surface-2' : ''"
            >
              <td class="px-5 py-3 font-mono text-sm text-ov-text">{{ sessionId(s) }}</td>
              <td class="px-5 py-3 text-sm text-ov-text-muted">
                <span v-if="s.created_at">{{ s.created_at }}</span>
                <span v-else-if="typeof s === 'object'">{{ Object.keys(s).filter(k => k !== 'id' && k !== 'session_id').map(k => `${k}: ${s[k]}`).join(', ') }}</span>
              </td>
              <td class="px-5 py-3 flex gap-3">
                <button @click="viewSession(sessionId(s))" class="text-ov-info text-sm hover:underline cursor-pointer">View</button>
                <button
                  @click="confirmDel = { show: true, id: sessionId(s) }"
                  class="text-ov-danger text-sm hover:underline cursor-pointer"
                >Delete</button>
              </td>
            </tr>
            <tr v-if="sessions.length === 0">
              <td colspan="3" class="px-5 py-8 text-center text-ov-text-muted">No active sessions.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Session Detail -->
      <div v-if="sessionDetail" class="bg-ov-surface border border-ov-border rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-ov-text">
            Session: <span class="font-mono text-ov-accent">{{ selectedSession }}</span>
          </h3>
          <div class="flex gap-2">
            <button @click="commitSession" class="px-3 py-1.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer">
              Commit
            </button>
            <button @click="selectedSession = null; sessionDetail = null" class="text-ov-text-muted hover:text-ov-text text-xl leading-none cursor-pointer px-2">&times;</button>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="sessionDetail.messages && sessionDetail.messages.length" class="space-y-3 mb-6 max-h-96 overflow-auto">
          <div
            v-for="(msg, i) in sessionDetail.messages"
            :key="i"
            class="rounded-lg p-3 text-sm"
            :class="msg.role === 'assistant' ? 'bg-ov-surface-2 border border-ov-border' : 'bg-ov-bg border border-ov-border'"
          >
            <div class="text-xs font-medium text-ov-text-muted mb-1 uppercase">{{ msg.role }}</div>
            <div class="text-ov-text whitespace-pre-wrap">{{ msg.content || (msg.parts && msg.parts.map(p => p.text || p.uri || '').join('\n')) || JSON.stringify(msg) }}</div>
          </div>
        </div>

        <!-- Add Message -->
        <div class="border-t border-ov-border pt-4">
          <div class="flex gap-3 items-end">
            <div>
              <label class="block text-xs text-ov-text-muted mb-1">Role</label>
              <select v-model="newMsgRole"
                class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text focus:outline-none focus:border-ov-accent cursor-pointer">
                <option value="user">user</option>
                <option value="assistant">assistant</option>
                <option value="system">system</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs text-ov-text-muted mb-1">Content</label>
              <textarea v-model="newMsgContent" rows="2" placeholder="Enter message content..."
                class="w-full px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent resize-none" />
            </div>
            <button
              @click="addMessage"
              :disabled="!newMsgContent || sendingMsg"
              class="px-4 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >Send</button>
          </div>
        </div>

        <!-- Raw Detail -->
        <details class="mt-4">
          <summary class="text-xs text-ov-text-muted cursor-pointer hover:text-ov-text">Show raw JSON</summary>
          <JsonViewer :data="sessionDetail" class="mt-2" />
        </details>
      </div>
    </div>

    <ConfirmDialog
      :show="confirmDel.show"
      title="Delete Session"
      :message="`Delete session '${confirmDel.id}'?`"
      confirm-text="Delete"
      :danger="true"
      @confirm="deleteSession(confirmDel.id); confirmDel.show = false"
      @cancel="confirmDel.show = false"
    />
  </div>
</template>
