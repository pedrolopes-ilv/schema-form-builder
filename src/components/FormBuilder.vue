<script setup lang="ts">
import { useFormBuilderStore } from '@/stores/formBuilder'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import FieldPalette from './builder/FieldPalette.vue'
import FormCanvas from './builder/FormCanvas.vue'
import ConfigPanel from './builder/ConfigPanel.vue'
import JsonSchemaPanel from './builder/JsonSchemaPanel.vue'

const store = useFormBuilderStore()
const { schema } = storeToRefs(store)
const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
    <!-- Left column: Palette, Title, JSON -->
    <aside class="md:col-span-3 space-y-3">
      <FieldPalette />

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-1 block text-sm font-medium" for="formTitle">{{ t('builder.formTitle') }}</label>
        <input id="formTitle" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="schema.formTitle" @input="store.setFormTitle(($event.target as HTMLInputElement).value)" :placeholder="t('builder.untitled')" />
      </div>

      <JsonSchemaPanel />
    </aside>

    <!-- Canvas -->
    <section class="md:col-span-6">
      <FormCanvas />
    </section>

    <!-- Config Panel -->
    <aside class="md:col-span-3">
      <ConfigPanel />
    </aside>
  </div>
</template>

<style scoped></style>
