<script setup lang="ts">
import Draggable from 'vuedraggable'
import { computed } from 'vue'
import { useFormBuilderStore } from '@/stores/formBuilder'
import { storeToRefs } from 'pinia'
import type { FormField } from '@/types/form'
import { useI18n } from 'vue-i18n'

const store = useFormBuilderStore()
const { selectedField } = storeToRefs(store)
const { t } = useI18n()

const optionList = computed({
  get: () => selectedField.value?.options || [],
  set: (val: NonNullable<FormField['options']>) => {
    if (!selectedField.value) return
    store.updateField(selectedField.value.id, { options: val })
  },
})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function onOptionLabelInput(index: number, label: string) {
  if (!selectedField.value) return
  const current = [...(selectedField.value.options || [])]
  const prevVal = current[index]?.value ?? ''
  current[index] = { ...current[index], label }
  if (!prevVal || /^option\d+$/.test(String(prevVal))) {
    const base = slugify(label) || `option${index + 1}`
    current[index] = { ...current[index], value: base }
  }
  store.updateField(selectedField.value.id, { options: current })
}

function onOptionValueInput(index: number, value: string) {
  if (!selectedField.value) return
  const current = [...(selectedField.value.options || [])]
  current[index] = { ...current[index], value }
  store.updateField(selectedField.value.id, { options: current })
}

function addOption() {
  if (!selectedField.value) return
  const options = selectedField.value.options || []
  store.updateField(selectedField.value.id, {
    options: [...options, { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` }],
  })
}

function removeOption(index: number) {
  if (!selectedField.value || !selectedField.value.options) return
  const next = [...selectedField.value.options]
  next.splice(index, 1)
  store.updateField(selectedField.value.id, { options: next })
}
</script>

<template>
  <fieldset>
    <legend class="mb-2 flex items-center justify-between">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ t('config.options') }}
      </h3>
      <div class="flex items-center gap-2">
        <button class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" @click="addOption">
          {{ t('actions.addOption') }}
        </button>
      </div>
    </legend>

    <div class="mb-1 grid grid-cols-[24px,1fr,1fr,auto] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
      <div></div>
      <div>{{ t('config.optionKey') }}</div>
      <div>{{ t('config.optionLabel') }}</div>
      <div class="text-right pr-1">{{ t('config.actions') }}</div>
    </div>

    <Draggable v-model="optionList" item-key="value" handle=".opt-drag" class="space-y-2">
      <template #item="{ element, index }">
        <div class="grid grid-cols-[24px,1fr,1fr,auto] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <span class="opt-drag cursor-grab text-slate-400" :aria-label="`Drag option ${index + 1}`">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h.01M12 9h.01M16 9h.01M8 15h.01M12 15h.01M16 15h.01"/></svg>
          </span>

          <!-- Option Key (value) -->
          <div>
            <label :for="`opt-key-${selectedField?.id}-${index}`" class="sr-only">{{ t('config.optionKey') }}</label>
            <input
              :id="`opt-key-${selectedField?.id}-${index}`"
              type="text"
              class="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :class="[ (element.value?.toString().trim() ? 'border-slate-300' : 'border-rose-400'), 'bg-white' ]"
              :value="element.value"
              :placeholder="t('config.optionKey')"
              @input="onOptionValueInput(index, ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Option Value (label) -->
          <div>
            <label :for="`opt-label-${selectedField?.id}-${index}`" class="sr-only">{{ t('config.optionLabel') }}</label>
            <input
              :id="`opt-label-${selectedField?.id}-${index}`"
              type="text"
              class="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :class="[ (element.label?.trim() ? 'border-slate-300' : 'border-rose-400'), 'bg-white' ]"
              :value="element.label"
              :placeholder="t('config.optionLabel')"
              @input="onOptionLabelInput(index, ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div class="text-right">
            <button class="text-xs text-rose-600 hover:underline" @click="removeOption(index)">
              {{ t('config.remove') }}
            </button>
          </div>
        </div>
      </template>
    </Draggable>
    <p class="mt-1 text-xs text-slate-500">{{ t('config.reorderHint') }}</p>
  </fieldset>
</template>

<style scoped></style>
