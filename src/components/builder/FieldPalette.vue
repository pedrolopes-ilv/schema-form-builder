<script setup lang="ts">
import { computed } from 'vue'
import Draggable from 'vuedraggable'
import { useFormBuilderStore } from '@/stores/formBuilder'
import type { FieldType } from '@/types/form'
import { useI18n } from 'vue-i18n'

const store = useFormBuilderStore()
const { t } = useI18n()

const availableTypes = computed<{ type: FieldType; label: string }[]>(() => [
  { type: 'text', label: t('fieldType.text') },
  { type: 'textarea', label: t('fieldType.textarea') },
  { type: 'number', label: t('fieldType.number') },
  { type: 'checkbox', label: t('fieldType.checkbox') },
  { type: 'radio', label: t('fieldType.radio') },
  { type: 'select', label: t('fieldType.select') },
  { type: 'date', label: t('fieldType.date') },
  { type: 'table', label: t('fieldType.table') },
  { type: 'masked', label: t('fieldType.masked') },
  { type: 'email', label: t('fieldType.email') },
  { type: 'currency', label: t('fieldType.currency') },
  { type: 'range', label: t('fieldType.range') },
  { type: 'switch', label: t('fieldType.switch') },
  { type: 'tags', label: t('fieldType.tags') },
  { type: 'heading', label: t('fieldType.heading') },
  { type: 'divider', label: t('fieldType.divider') },
  { type: 'group', label: t('fieldType.group') },
])

const add = (type: FieldType): void => {
  store.addField(type)
}

const clonePaletteItem = (item: { type: FieldType; label: string }): { type: FieldType } => {
  return { type: item.type }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-medium">{{ t('builder.palette') }}</h2>
    </div>
    <Draggable
      id="palette-draggable"
      data-source="palette"
      :list="availableTypes"
      item-key="type"
      :group="{ name: 'fields', pull: 'clone', put: false }"
      :clone="clonePaletteItem"
      :sort="false"
      class="grid grid-cols-2 gap-2"
    >
      <template #item="{ element }">
        <div
          class="flex cursor-grab items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-white hover:shadow-sm active:cursor-grabbing"
          @click="add(element.type)"
        >
          {{ element.label }}
        </div>
      </template>
    </Draggable>
  </div>
</template>

<style scoped></style>
