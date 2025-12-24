<script setup lang="ts">
import { ref } from 'vue'
import { useFormBuilderStore } from '@/stores/formBuilder'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const store = useFormBuilderStore()
const { jsonSchemaOutput } = storeToRefs(store)
const showSchema = ref(false)
const copying = ref(false)
const { t } = useI18n()

async function copySchema() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(jsonSchemaOutput.value, null, 2))
    copying.value = true
    setTimeout(() => (copying.value = false), 1200)
  } catch {}
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <button class="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800" @click="showSchema = !showSchema">
        {{ showSchema ? t('builder.hideJson') : t('builder.showJson') }}
      </button>
      <button v-if="showSchema" class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" @click="copySchema">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2v-4m-6 10H8a2 2 0 01-2-2v-2m8 4h2a2 2 0 002-2v-2"/></svg>
        <span>{{ copying ? t('actions.copied') : t('actions.copy') }}</span>
      </button>
    </div>
    <pre v-if="showSchema" class="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100 shadow-inner">{{ JSON.stringify(jsonSchemaOutput, null, 2) }}</pre>
  </div>
</template>

<style scoped></style>
