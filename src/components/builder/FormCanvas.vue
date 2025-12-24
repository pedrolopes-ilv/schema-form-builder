<script setup lang="ts">
import { computed } from 'vue'
import Draggable from 'vuedraggable'
import { useFormBuilderStore } from '@/stores/formBuilder'
import { storeToRefs } from 'pinia'
import type { FieldType } from '@/types/form'
import { useI18n } from 'vue-i18n'

const store = useFormBuilderStore()
const { schema, selectedFieldId } = storeToRefs(store)
const { t } = useI18n()

const canvasFields = computed({
  get: () => schema.value.fields,
  set: (val) => store.reorderFields(val),
})

// Only allow dropping into a group from the palette (which uses pull: 'clone').
// Prevent moving existing canvas fields into a group.
// SortableJS provides `from.options.group.pull` to check source behavior.
function canPutIntoGroup(to: unknown, from: unknown): boolean {
  try {
    // Accept only when dragging from the palette Draggable
    const src = from as { el?: HTMLElement | null }
    const el = src?.el as HTMLElement | null
    return !!el && (el.id === 'palette-draggable' || el.getAttribute('data-source') === 'palette')
  } catch {
    return false
  }
}

function select(id: string) {
  store.setSelectedField(id)
}

function remove(id: string) {
  store.deleteField(id)
}

function onCanvasChange(evt: { added?: { element: { type: FieldType }; newIndex: number } }) {
  if (evt.added) {
    const { element, newIndex } = evt.added
    const created = store.createField(element.type)
    schema.value.fields.splice(newIndex, 1, created)
    store.setSelectedField(created.id)
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-medium">{{ t('builder.canvas') }}</h2>
      <span class="text-xs text-slate-500">{{ t('builder.reorderHint') }}</span>
    </div>
    <Draggable
      v-model="canvasFields"
      item-key="id"
      handle=".drag-handle"
      :group="{ name: 'fields', pull: false, put: true }"
      @change="onCanvasChange"
    >
      <template #item="{ element }">
        <div
          class="mb-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md last:mb-0"
          :class="{ 'ring-2 ring-indigo-500': selectedFieldId === element.id }"
          @click="select(element.id)"
        >
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="drag-handle cursor-grab text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h.01M12 9h.01M16 9h.01M8 15h.01M12 15h.01M16 15h.01" /></svg>
              </span>
              <span class="text-sm font-medium">{{ element.label }}</span>
              <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ element.type }}</span>
              <span v-if="element.required" class="text-xs text-rose-600">*</span>
            </div>
            <button class="text-sm text-rose-600 hover:underline" @click.stop="remove(element.id)">
              {{ $t('actions.delete') }}
            </button>
          </div>

          <!-- Preview -->
          <div>
            <!-- Basic inputs -->
            <component
              v-if="['text','number','textarea','checkbox','date'].includes(element.type)"
              :is="
                element.type === 'text' ? 'input' :
                element.type === 'number' ? 'input' :
                element.type === 'textarea' ? 'textarea' :
                element.type === 'checkbox' ? 'input' :
                element.type === 'date' ? 'input' : 'div'"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              :type="
                element.type === 'number' ? 'number' :
                element.type === 'date' ? 'date' :
                element.type === 'checkbox' ? 'checkbox' : 'text'"
              :placeholder="element.placeholder"
              :aria-label="element.label"
              disabled
            />

            <!-- Masked input preview -->
            <input
              v-else-if="element.type === 'masked'"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              :placeholder="element.mask || '____-____'"
              :aria-label="element.label"
              disabled
              data-testid="preview-masked"
            />

            <!-- Email preview -->
            <input
              v-else-if="element.type === 'email'"
              type="email"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              :placeholder="element.placeholder || 'name@example.com'"
              :aria-label="element.label"
              disabled
              data-testid="preview-email"
            />

            <!-- Currency preview -->
            <div v-else-if="element.type === 'currency'" class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                {{ element.currency?.code || 'CUR' }}
              </span>
              <input
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                :placeholder="element.placeholder || '0,00'"
                :aria-label="element.label"
                disabled
                data-testid="preview-currency"
              />
            </div>

            <!-- Range/Slider preview -->
            <div v-else-if="element.type === 'range'" class="space-y-1" data-testid="preview-range">
              <input
                type="range"
                class="w-full"
                :min="element.range?.min ?? 0"
                :max="element.range?.max ?? 100"
                :step="element.range?.step ?? 1"
                disabled
              />
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ element.range?.min ?? 0 }}</span>
                <span>{{ element.range?.max ?? 100 }}</span>
              </div>
            </div>

            <!-- Switch preview -->
            <div v-else-if="element.type === 'switch'" class="inline-flex items-center gap-2" data-testid="preview-switch">
              <span class="relative inline-block h-5 w-10 rounded-full bg-slate-200">
                <span class="absolute left-0.5 top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow"></span>
              </span>
              <span class="text-xs text-slate-600">Off</span>
            </div>

            <!-- Tags/Chips preview -->
            <div v-else-if="element.type === 'tags'" class="flex flex-wrap gap-1" data-testid="preview-tags">
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Tag 1</span>
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Tag 2</span>
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Tag 3</span>
            </div>

            <!-- Heading preview -->
            <div v-else-if="element.type === 'heading'" class="text-slate-800" data-testid="preview-heading">
              <component :is="`h${element.heading?.level || 2}`" class="font-semibold">
                {{ element.heading?.text || element.label }}
              </component>
            </div>

            <!-- Divider preview -->
            <hr v-else-if="element.type === 'divider'" class="border-slate-200" data-testid="preview-divider" />

            <!-- Group container -->
            <div v-else-if="element.type === 'group'" class="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
              <div class="mb-2 flex items-center gap-2">
                <input
                  class="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  :value="element.label"
                  @input.stop="store.updateField(element.id, { label: ($event.target as HTMLInputElement).value })"
                  :placeholder="t('fieldType.group')"
                />
              </div>
              <!-- Condition editor moved to ConfigPanel; keep group UI minimal here -->

              <Draggable
                :list="element.children"
                item-key="id"
                handle=".drag-handle"
                :group="{ name: 'fields', pull: false, put: canPutIntoGroup }"
                class="min-h-24 rounded-md border border-dashed border-indigo-200 bg-white/70 p-2"
                @change="(e:any)=>{ if(e.added){ const { element: el, newIndex } = e.added; if(el && 'type' in el && !el.id){ const created = store.createField(el.type); element.children.splice(newIndex,1, created as any) } }}"
              >
                <template #item="{ element: child }">
                  <div
                    class="mb-2 rounded-md border border-slate-200 bg-white p-2"
                    :class="{ 'ring-2 ring-indigo-500': selectedFieldId === child.id }"
                    @click.stop="store.setSelectedField(child.id)"
                  >
                    <div class="mb-1 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="drag-handle cursor-grab text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h.01M12 9h.01M16 9h.01M8 15h.01M12 15h.01M16 15h.01" /></svg>
                        </span>
                        <span class="text-xs font-medium">{{ child.label }}</span>
                        <span class="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">{{ child.type }}</span>
                      </div>
                      <button class="text-xs text-rose-600 hover:underline" @click.stop="store.deleteField(child.id)">{{ $t('actions.delete') }}</button>
                    </div>
                    <!-- simple preview for child -->
                    <input v-if="['text','number','date','email','currency','masked'].includes(child.type)" class="w-full rounded border border-slate-300 px-2 py-1 text-xs" :placeholder="child.placeholder" disabled />
                    <textarea v-else-if="child.type==='textarea'" class="w-full rounded border border-slate-300 px-2 py-1 text-xs" :placeholder="child.placeholder" disabled></textarea>
                    <label v-else-if="child.type==='checkbox'" class="inline-flex items-center gap-2 text-xs"><input type="checkbox" disabled /> {{ child.label }}</label>
                    <div v-else-if="child.type==='radio'" class="space-y-1 text-xs"><label v-for="opt in child.options" :key="opt.value" class="flex items-center gap-2"><input type="radio" disabled/> {{ opt.label }}</label></div>
                    <select v-else-if="child.type==='select'" class="w-full rounded border border-slate-300 px-2 py-1 text-xs" disabled>
                      <option v-for="opt in child.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </div>
                </template>
                <template #footer>
                  <div v-if="!element.children.length" class="flex items-center justify-center gap-2 py-8 text-xs text-indigo-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    <span>{{ t('group.dropHere') }}</span>
                  </div>
                </template>
              </Draggable>
            </div>

            <!-- Radio group preview -->
            <div v-else-if="element.type === 'radio'" class="space-y-1">
              <label v-for="opt in element.options" :key="opt.value" class="flex items-center gap-2 text-sm">
                <input type="radio" disabled /> {{ opt.label }}
              </label>
            </div>
            <!-- Select preview -->
            <select v-else-if="element.type === 'select'" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" disabled>
              <option v-for="opt in element.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <!-- Table preview -->
            <div v-else-if="element.type === 'table'" data-testid="table-preview" class="rounded-lg border border-slate-200 bg-white p-3">
              <div class="mb-2 text-xs font-medium text-slate-500">{{ t('fieldType.table') }}</div>
              <div class="overflow-auto">
                <table class="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="px-2 py-1 text-slate-600">Col 1</th>
                      <th class="px-2 py-1 text-slate-600">Col 2</th>
                      <th class="px-2 py-1 text-slate-600">Col 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-slate-100">
                      <td class="px-2 py-1 text-slate-800">A1</td>
                      <td class="px-2 py-1 text-slate-800">B1</td>
                      <td class="px-2 py-1 text-slate-800">C1</td>
                    </tr>
                    <tr class="border-b border-slate-100">
                      <td class="px-2 py-1 text-slate-800">A2</td>
                      <td class="px-2 py-1 text-slate-800">B2</td>
                      <td class="px-2 py-1 text-slate-800">C2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div v-if="!canvasFields.length" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="mb-2 h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          <p>{{ t('builder.emptyHint') }}</p>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<style scoped></style>
