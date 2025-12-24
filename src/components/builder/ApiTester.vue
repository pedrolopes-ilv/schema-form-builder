<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface ApiConfig {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
}

const props = defineProps<{ modelValue: ApiConfig }>()
const { t } = useI18n()

const loading = ref(false)
const status = ref<string>('')
const elapsed = ref<number | null>(null)
const output = ref<string>('')

async function send() {
  const cfg = props.modelValue || { url: '', method: 'GET', headers: {}, body: '' }
  if (!cfg.url) {
    status.value = 'Missing URL'
    output.value = ''
    return
  }
  try {
    loading.value = true
    status.value = ''
    output.value = ''
    const start = performance.now()
    const res = await fetch(cfg.url, {
      method: cfg.method || 'GET',
      headers: cfg.headers || {},
      body: cfg.method && cfg.method !== 'GET' && cfg.body ? cfg.body : undefined,
    })
    const ct = res.headers.get('content-type') || ''
    let bodyText = ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      bodyText = JSON.stringify(json, null, 2)
    } else {
      bodyText = await res.text()
    }
    elapsed.value = Math.round(performance.now() - start)
    status.value = `${res.status} ${res.statusText}`
    output.value = bodyText
  } catch (e: unknown) {
    elapsed.value = null
    status.value = 'Request failed'
    output.value = (() => {
      if (typeof e === 'string') return e
      if (e instanceof Error) return e.message
      try { return JSON.stringify(e) } catch { return String(e) }
    })()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-2 rounded-lg border border-slate-200 p-3">
    <div class="flex items-center justify-between">
      <div class="text-sm font-medium">{{ t('table.test') }}</div>
      <button type="button" class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" :disabled="loading" @click="send">
        {{ loading ? '...' : t('table.test') }}
      </button>
    </div>
    <div class="text-xs text-slate-600">
      <span v-if="status">{{ status }}</span>
      <span v-if="elapsed != null"> — {{ elapsed }}ms</span>
    </div>
    <pre class="max-h-60 overflow-auto rounded bg-slate-50 p-2 text-xs"><code>{{ output || t('actions.hide') && '' }}</code></pre>
  </div>
</template>

<style scoped></style>
