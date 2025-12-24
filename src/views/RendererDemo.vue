<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFormBuilderStore } from '@/stores/formBuilder'
import type { FormSchema } from '@/types/form'
import FormRenderer from '@/lib/FormRenderer.vue'
import { storeToRefs } from 'pinia'

const store = useFormBuilderStore()
const { schema: builderSchema } = storeToRefs(store)

const localSchema = ref<FormSchema>({ formTitle: 'Demo Form', fields: [] })
const output = ref<unknown | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

async function onImportFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  try {
    const text = await f.text()
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
      localSchema.value = parsed as FormSchema
    } else {
      alert('Invalid schema file')
    }
  } catch {
    alert('Failed to import JSON')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function useBuilderSchema() {
  localSchema.value = JSON.parse(JSON.stringify(builderSchema.value))
}

function onSubmit(values: Record<string, unknown>) {
  output.value = values
}

const hasSchema = computed(() => localSchema.value.fields.length > 0)
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-base font-medium">Renderer Demo</h2>
      <div class="flex flex-wrap items-center gap-2">
        <button class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" @click="triggerImport">Import JSON</button>
        <button class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" @click="useBuilderSchema">Use current builder schema</button>
        <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onImportFile" />
      </div>
      <p class="mt-2 text-xs text-slate-500">Load a schema to render the form below.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div class="md:col-span-6">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-medium">FormRenderer</h3>
          <div v-if="!hasSchema" class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No schema loaded. Import a JSON file or use the current builder schema.</div>
          <FormRenderer v-else :schema="localSchema" @submit="onSubmit" />
        </div>
      </div>
      <div class="md:col-span-6">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-medium">Submit payload</h3>
          <pre class="min-h-[120px] rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{{ output ? JSON.stringify(output, null, 2) : '// submit to see payload here' }}</pre>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
