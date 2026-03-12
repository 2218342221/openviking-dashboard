import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadOvConfig() {
  const configPath = process.env.OPENVIKING_CONFIG_FILE || path.join(process.env.HOME, '.openviking', 'ov.conf')
  if (!fs.existsSync(configPath)) {
    console.error(`OpenViking config not found at: ${configPath}`)
    process.exit(1)
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const server = config.server || {}
  const rootKey = server.root_api_key
  const port = server.port || 1933
  if (!rootKey) {
    console.error(`root_api_key is not configured in ${configPath}`)
    process.exit(1)
  }
  return { rootKey, port }
}

const { rootKey: ROOT_KEY, port: OV_PORT } = loadOvConfig()
const OV_BASE = `http://127.0.0.1:${OV_PORT}`
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '3000', 10)

async function proxyToOV(apiKey, method, ovPath, { body, query } = {}) {
  let url = `${OV_BASE}${ovPath}`
  if (query) {
    const qs = new URLSearchParams(query).toString()
    if (qs) url += `?${qs}`
  }
  const headers = { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
  const opts = { method, headers }
  if (body && method !== 'GET' && method !== 'HEAD') {
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

function proxyWithUserKey(req, method, ovPath, opts = {}) {
  const apiKey = req.headers['x-api-key'] || ROOT_KEY
  return proxyToOV(apiKey, method, ovPath, opts)
}

function proxyWithRootKey(method, ovPath, opts = {}) {
  return proxyToOV(ROOT_KEY, method, ovPath, opts)
}

async function sendProxy(res, proxyResult) {
  const { status, data } = await proxyResult
  res.status(status).json(data)
}

const app = express()
app.use(express.json())

// ---- Auth ----
app.post('/api/auth/login', async (req, res) => {
  const { api_key } = req.body
  if (!api_key) return res.status(400).json({ error: 'api_key is required' })

  if (api_key === ROOT_KEY) {
    return res.json({ role: 'root', account_id: null, user_id: null })
  }

  try {
    const { status, data } = await proxyToOV(api_key, 'GET', '/health')
    if (status >= 400) {
      return res.status(401).json({ error: 'Invalid API key' })
    }
    const resolve = await proxyToOV(api_key, 'GET', '/api/v1/system/status')
    const identity = resolve.data?.result?.identity || resolve.data?.identity || {}
    return res.json({
      role: identity.role || 'user',
      account_id: identity.account_id || null,
      user_id: identity.user_id || null,
    })
  } catch {
    return res.status(401).json({ error: 'Invalid API key or server unreachable' })
  }
})

// ---- System / Observer (user key) ----
app.get('/api/health', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/health')))
app.get('/api/system/status', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/system/status')))
app.post('/api/system/wait', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/system/wait', { body: req.body })))
app.get('/api/observer/system', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/observer/system')))
app.get('/api/observer/queue', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/observer/queue')))
app.get('/api/observer/vikingdb', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/observer/vikingdb')))
app.get('/api/observer/vlm', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/observer/vlm')))
app.get('/api/observer/transaction', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/observer/transaction')))

// ---- Admin: Accounts (root key) ----
app.get('/api/admin/accounts', async (req, res) => sendProxy(res, proxyWithRootKey('GET', '/api/v1/admin/accounts')))
app.post('/api/admin/accounts', async (req, res) => sendProxy(res, proxyWithRootKey('POST', '/api/v1/admin/accounts', { body: req.body })))
app.delete('/api/admin/accounts/:id', async (req, res) => sendProxy(res, proxyWithRootKey('DELETE', `/api/v1/admin/accounts/${req.params.id}`)))

// ---- Admin: Users (root key) ----
app.get('/api/admin/accounts/:id/users', async (req, res) => sendProxy(res, proxyWithRootKey('GET', `/api/v1/admin/accounts/${req.params.id}/users`)))
app.post('/api/admin/accounts/:id/users', async (req, res) => sendProxy(res, proxyWithRootKey('POST', `/api/v1/admin/accounts/${req.params.id}/users`, { body: req.body })))
app.delete('/api/admin/accounts/:aid/users/:uid', async (req, res) => sendProxy(res, proxyWithRootKey('DELETE', `/api/v1/admin/accounts/${req.params.aid}/users/${req.params.uid}`)))
app.put('/api/admin/accounts/:aid/users/:uid/role', async (req, res) => sendProxy(res, proxyWithRootKey('PUT', `/api/v1/admin/accounts/${req.params.aid}/users/${req.params.uid}/role`, { body: req.body })))
app.post('/api/admin/accounts/:aid/users/:uid/key', async (req, res) => sendProxy(res, proxyWithRootKey('POST', `/api/v1/admin/accounts/${req.params.aid}/users/${req.params.uid}/key`)))

// ---- Sessions (user key) ----
app.get('/api/sessions', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/sessions')))
app.post('/api/sessions', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/sessions', { body: req.body })))
app.get('/api/sessions/:id', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', `/api/v1/sessions/${req.params.id}`)))
app.delete('/api/sessions/:id', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'DELETE', `/api/v1/sessions/${req.params.id}`)))
app.post('/api/sessions/:id/messages', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', `/api/v1/sessions/${req.params.id}/messages`, { body: req.body })))
app.post('/api/sessions/:id/commit', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', `/api/v1/sessions/${req.params.id}/commit`)))

// ---- Filesystem (user key) ----
app.get('/api/fs/ls', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/fs/ls', { query: req.query })))
app.get('/api/fs/tree', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/fs/tree', { query: req.query })))
app.get('/api/fs/stat', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/fs/stat', { query: req.query })))
app.post('/api/fs/mkdir', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/fs/mkdir', { body: req.body })))
app.delete('/api/fs', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'DELETE', '/api/v1/fs', { query: req.query })))
app.post('/api/fs/mv', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/fs/mv', { body: req.body })))

// ---- Content (user key) ----
app.get('/api/content/read', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/content/read', { query: req.query })))
app.get('/api/content/abstract', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/content/abstract', { query: req.query })))
app.get('/api/content/overview', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/content/overview', { query: req.query })))

// ---- Search (user key) ----
app.post('/api/search/find', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/search/find', { body: req.body })))
app.post('/api/search/search', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/search/search', { body: req.body })))
app.post('/api/search/grep', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/search/grep', { body: req.body })))
app.post('/api/search/glob', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/search/glob', { body: req.body })))

// ---- Resources (user key) ----
app.post('/api/resources', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/resources', { body: req.body })))
app.post('/api/resources/skill', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/skills', { body: req.body })))

// ---- Relations (user key) ----
app.get('/api/relations', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/relations', { query: req.query })))
app.post('/api/relations/link', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/relations/link', { body: req.body })))
app.delete('/api/relations/link', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'DELETE', '/api/v1/relations/link', { query: req.query })))

// ---- Pack (user key) ----
app.post('/api/pack/export', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/pack/export', { body: req.body })))
app.post('/api/pack/import', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'POST', '/api/v1/pack/import', { body: req.body })))

// ---- Tasks (user key) ----
app.get('/api/tasks', async (req, res) => sendProxy(res, proxyWithUserKey(req, 'GET', '/api/v1/tasks')))

// ---- Static file serving (production) ----
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist')
  app.use(express.static(distPath))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

import http from 'node:http'
import { networkInterfaces } from 'node:os'

const server = http.createServer(app)

server.listen(ADMIN_PORT, '::', () => {
  const addrs = []
  const ifaces = networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (!iface.internal) addrs.push(iface.address)
    }
  }
  console.log(`OpenViking UI server listening on port ${ADMIN_PORT}`)
  console.log(`  Local:    http://127.0.0.1:${ADMIN_PORT}`)
  if (addrs.length) console.log(`  Network:  http://${addrs[0]}:${ADMIN_PORT}`)
  console.log(`Proxying to OpenViking at ${OV_BASE}`)
})
