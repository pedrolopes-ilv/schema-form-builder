<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFormBuilderStore } from '@/stores/formBuilder'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView } from 'vue-router'

const store = useFormBuilderStore()
const { jsonSchemaOutput } = storeToRefs(store)
const { t } = useI18n()

// Export JSON (kept)
const downloadJson = (): void => {
  const blob = new Blob([JSON.stringify(jsonSchemaOutput.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${jsonSchemaOutput.value.formTitle || 'form'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import JSON (kept)
const fileInput = ref<HTMLInputElement | null>(null)
const triggerImport = (): void => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}
const onImportFile = async (e: Event): Promise<void> => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) {
    return
  }
  try {
    const text = await f.text()
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
      store.schema.formTitle = parsed.formTitle || 'Untitled Form'
      store.schema.fields = parsed.fields || []
    } else {
      alert('Invalid schema file')
    }
  } catch {
    alert('Failed to import JSON')
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Top Navbar -->
    <header class="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div class="w-full px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold tracking-tight">{{ t('app.title') }}</h1>
          <nav class="ml-6 hidden md:flex items-center gap-3 text-sm">
            <RouterLink
              to="/"
              class="rounded-md px-2 py-1 hover:bg-slate-100"
              active-class="bg-slate-200"
              >Builder</RouterLink
            >
            <RouterLink
              to="/renderer"
              class="rounded-md px-2 py-1 hover:bg-slate-100"
              active-class="bg-slate-200"
              >Renderer</RouterLink
            >
          </nav>
        </div>
        <div class="flex items-center gap-2">
          <button class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" @click="downloadJson">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
            {{ t('actions.export') }}
          </button>
          <button class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" @click="triggerImport">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l3-3m-3 3l-3-3M5 20h14"/></svg>
            {{ t('actions.import') }}
          </button>
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onImportFile" />
        </div>
      </div>
    </header>

    <main class="w-full p-0">
      <RouterView />
    </main>
  </div>

</template>

<style scoped></style>
