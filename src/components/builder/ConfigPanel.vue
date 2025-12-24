<script setup lang="ts">
import { useFormBuilderStore } from '@/stores/formBuilder'
import { storeToRefs } from 'pinia'
import OptionList from './OptionList.vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import ApiTester from './ApiTester.vue'

const store = useFormBuilderStore()
const { selectedField, schema } = storeToRefs(store)
const { t } = useI18n()

// Helpers to manage headers (object <-> rows)
const headerRows = computed<{ key: string; value: string }[]>(() => {
  const obj = selectedField.value?.table?.api?.headers || {}
  return Object.entries(obj).map(([key, value]) => ({ key, value }))
})

const addHeaderRow = (): void => {
  const current = selectedField.value
  if (!current) {
    return
  }
  const headers = { ...(current.table?.api?.headers || {}) }
  let i = 1
  let key = `Header-${i}`
  while (headers[key]) {
    i++
    key = `Header-${i}`
  }
  headers[key] = ''
  store.updateField(current.id, { table: { ...(current.table || {}), api: { ...(current.table?.api || {}), headers } } })
}

const updateHeaderKey = (index: number, newKey: string): void => {
  const current = selectedField.value
  if (!current) {
    return
  }
  const entries = headerRows.value.slice()
  const row = entries[index]
  if (!row) {
    return
  }
  const headers: Record<string, string> = {}
  entries.forEach((e, i) => {
    const k = i === index ? newKey : e.key
    if (k) {
      headers[k] = i === index ? e.value : e.value
    }
  })
  store.updateField(current.id, { table: { ...(current.table || {}), api: { ...(current.table?.api || {}), headers } } })
}

const updateHeaderValue = (index: number, newVal: string): void => {
  const current = selectedField.value
  if (!current) {
    return
  }
  const entries = headerRows.value.slice()
  if (!entries[index]) {
    return
  }
  entries[index].value = newVal
  const headers: Record<string, string> = {}
  entries.forEach((e) => {
    if (e.key) {
      headers[e.key] = e.value
    }
  })
  store.updateField(current.id, { table: { ...(current.table || {}), api: { ...(current.table?.api || {}), headers } } })
}

const removeHeaderRow = (index: number): void => {
  const current = selectedField.value
  if (!current) {
    return
  }
  const entries = headerRows.value.slice()
  entries.splice(index, 1)
  const headers: Record<string, string> = {}
  entries.forEach((e) => {
    if (e.key) {
      headers[e.key] = e.value
    }
  })
  store.updateField(current.id, { table: { ...(current.table || {}), api: { ...(current.table?.api || {}), headers } } })
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-0 shadow-sm">
    <div class="sticky top-[68px] z-10 flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur">
      <h2 class="font-medium">{{ t('config.title') }}</h2>
      <div v-if="selectedField" class="flex items-center gap-2">
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ selectedField.type }}</span>
      </div>
    </div>

    <div class="p-4">
      <div v-if="selectedField" class="space-y-5">
        <!-- Basics -->
        <section>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('config.basics') }}</h3>
          <div class="space-y-3">
            <!-- Required inside Basics (hide for non-input content types) -->
            <div v-if="!['heading','divider','table'].includes(selectedField.type)" class="flex items-center gap-2">
              <input :id="`fld-required-${selectedField.id}`" type="checkbox" class="h-4 w-4 rounded border-slate-300" :checked="selectedField.required" @change="store.updateField(selectedField.id, { required: ($event.target as HTMLInputElement).checked })" />
              <label :for="`fld-required-${selectedField.id}`" class="text-sm">{{ t('config.required') }}</label>
            </div>

            <div>
              <label :for="`fld-label-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('config.fieldLabel') }}</label>
              <input :id="`fld-label-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" :value="selectedField.label" :placeholder="t('config.fieldLabel')" @input="store.updateField(selectedField.id, { label: ($event.target as HTMLInputElement).value })" />
              <p class="mt-1 text-xs text-slate-500">{{ t('config.fieldLabelHelp') }}</p>
            </div>

            <!-- Submission key (name) -->
            <div>
              <label :for="`fld-name-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('config.keyLabel') }}</label>
              <input :id="`fld-name-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" :value="selectedField.name || ''" :placeholder="selectedField.id" @input="store.updateField(selectedField.id, { name: (($event.target as HTMLInputElement).value || '').trim() || undefined })" />
              <p class="mt-1 text-xs text-slate-500">{{ t('config.keyHelp') }}</p>
            </div>

            <div v-if="['text', 'textarea', 'number', 'date', 'email', 'currency', 'masked'].includes(selectedField.type)">
              <label :for="`fld-ph-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('config.placeholder') }}</label>
              <input :id="`fld-ph-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" :value="selectedField.placeholder || ''" :placeholder="t('config.placeholderHelp')" @input="store.updateField(selectedField.id, { placeholder: ($event.target as HTMLInputElement).value })" />
            </div>

            <!-- Required custom message -->
            <div v-if="selectedField.required && !['heading','divider','table'].includes(selectedField.type)">
              <label :for="`fld-reqmsg-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('config.requiredMessage') }}</label>
              <input :id="`fld-reqmsg-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" :value="selectedField.validation?.requiredMessage || ''" :placeholder="t('config.requiredMessagePlaceholder')" @input="store.updateField(selectedField.id, { validation: { ...(selectedField.validation || {}), requiredMessage: ($event.target as HTMLInputElement).value } })" />
              <p class="mt-1 text-xs text-slate-500">{{ t('config.requiredMessageHelp') }}</p>
            </div>
          </div>
        </section>

        <!-- Group: visibility condition -->
        <section v-if="selectedField.type === 'group'">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('group.condition.title') }}</h3>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="col-span-1">
              <label class="mb-1 block text-slate-600">{{ t('group.condition.whenField') }}</label>
              <select
                class="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                :value="(selectedField as any).condition?.whenField || ''"
                @change="
                  store.updateField(selectedField.id, {
                    condition: {
                      ...((selectedField as any).condition || {}),
                      whenField: ((($event.target as HTMLSelectElement).value) || undefined),
                      operator: (((selectedField as any).condition && (selectedField as any).condition.operator) || 'equals'),
                    },
                  })
                "
              >
                <option value="">—</option>
                <option v-for="f in schema.fields" :key="f.id" :value="(f as any).name || f.id">{{ f.label }}</option>
              </select>
            </div>
            <div class="col-span-1">
              <label class="mb-1 block text-slate-600">{{ t('group.condition.operator') }}</label>
              <select
                class="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                :value="(selectedField as any).condition?.operator || 'equals'"
                @change="
                  store.updateField(selectedField.id, {
                    condition: {
                      ...((selectedField as any).condition || {}),
                      operator: ((($event.target as HTMLSelectElement).value) as any),
                    },
                  })
                "
              >
                <option value="equals">{{ t('group.condition.operators.equals') }}</option>
                <option value="notEquals">{{ t('group.condition.operators.notEquals') }}</option>
                <option value="greaterThan">{{ t('group.condition.operators.greaterThan') }}</option>
                <option value="greaterOrEqual">{{ t('group.condition.operators.greaterOrEqual') }}</option>
                <option value="lessThan">{{ t('group.condition.operators.lessThan') }}</option>
                <option value="lessOrEqual">{{ t('group.condition.operators.lessOrEqual') }}</option>
                <option value="contains">{{ t('group.condition.operators.contains') }}</option>
                <option value="notContains">{{ t('group.condition.operators.notContains') }}</option>
              </select>
            </div>
            <div class="col-span-1">
              <label class="mb-1 block text-slate-600">{{ t('group.condition.value') }}</label>
              <input
                class="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                :value="((selectedField as any).condition as any)?.value ?? ''"
                @input="
                  store.updateField(selectedField.id, {
                    condition: {
                      ...((selectedField as any).condition || {}),
                      value: (($event.target as HTMLInputElement).value),
                      operator: (((selectedField as any).condition && (selectedField as any).condition.operator) || 'equals'),
                    },
                  })
                "
              />
            </div>
          </div>
        </section>

        <!-- Options for radio/select -->
        <section v-if="['radio', 'select'].includes(selectedField.type)">
          <OptionList />
        </section>

        <!-- Masked input configuration -->
        <section v-if="selectedField.type === 'masked'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="`msk-preset-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.maskPreset') }}</label>
              <select
                :id="`msk-preset-${selectedField.id}`"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                @change="
                  (e)=>{
                    const v=(e.target as HTMLSelectElement).value
                    const presets: Record<string,string> = {
                      phone: '(99) 99999-9999',
                      cpf: '999.999.999-99',
                      cnpj: '99.999.999/9999-99',
                      zip: '99999-999'
                    }
                    if(v && v !== 'custom'){
                      store.updateField(selectedField!.id, { mask: presets[v] })
                    }
                  }
                "
              >
                <option value="">—</option>
                <option value="phone">{{ t('advanced.maskPhone') }}</option>
                <option value="cpf">{{ t('advanced.maskCPF') }}</option>
                <option value="cnpj">{{ t('advanced.maskCNPJ') }}</option>
                <option value="zip">{{ t('advanced.maskZIP') }}</option>
                <option value="custom">{{ t('advanced.maskPresetCustom') }}</option>
              </select>
            </div>
            <div>
              <label :for="`msk-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.mask') }}</label>
              <input :id="`msk-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.mask || ''" @input="store.updateField(selectedField.id, { mask: ($event.target as HTMLInputElement).value })" />
            </div>
          </div>
        </section>

        <!-- Currency configuration -->
        <section v-if="selectedField.type === 'currency'" class="space-y-3">
          <div>
            <label :for="`cur-preset-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.currencyPreset') }}</label>
            <select
              :id="`cur-preset-${selectedField.id}`"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              @change="
                (e)=>{
                  const v=(e.target as HTMLSelectElement).value
                  const map: Record<string,{code:string, locale:string}> = {
                    brl: { code:'BRL', locale:'pt-BR' },
                    usd: { code:'USD', locale:'en-US' },
                    eur: { code:'EUR', locale:'de-DE' }
                  }
                  if(map[v]){
                    const cur = map[v]
                    store.updateField(selectedField!.id, { currency: { ...(selectedField!.currency || {}), code: cur.code, locale: cur.locale } })
                  }
                }
              "
            >
              <option value="">—</option>
              <option value="brl">{{ t('advanced.currencyBRL') }}</option>
              <option value="usd">{{ t('advanced.currencyUSD') }}</option>
              <option value="eur">{{ t('advanced.currencyEUR') }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="`cur-code-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.currencyCode') }}</label>
              <input :id="`cur-code-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.currency?.code || ''" @input="store.updateField(selectedField.id, { currency: { ...(selectedField.currency || {}), code: ($event.target as HTMLInputElement).value.toUpperCase() } })" />
            </div>
            <div>
              <label :for="`cur-loc-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.currencyLocale') }}</label>
              <input :id="`cur-loc-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.currency?.locale || ''" @input="store.updateField(selectedField.id, { currency: { ...(selectedField.currency || {}), locale: ($event.target as HTMLInputElement).value } })" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="`cur-min-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.min') }}</label>
              <input :id="`cur-min-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.currency?.min ?? ''" @input="store.updateField(selectedField.id, { currency: { ...(selectedField.currency || {}), min: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div>
              <label :for="`cur-max-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.max') }}</label>
              <input :id="`cur-max-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.currency?.max ?? ''" @input="store.updateField(selectedField.id, { currency: { ...(selectedField.currency || {}), max: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
          </div>
        </section>

        <!-- Range (slider) configuration -->
        <section v-if="selectedField.type === 'range'" class="space-y-3">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label :for="`rng-min-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.min') }}</label>
              <input :id="`rng-min-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.range?.min ?? 0" @input="store.updateField(selectedField.id, { range: { ...(selectedField.range || { max: 100 }), min: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div>
              <label :for="`rng-max-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.max') }}</label>
              <input :id="`rng-max-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.range?.max ?? 100" @input="store.updateField(selectedField.id, { range: { ...(selectedField.range || { min: 0 }), max: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div>
              <label :for="`rng-step-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.step') }}</label>
              <input :id="`rng-step-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.range?.step ?? 1" @input="store.updateField(selectedField.id, { range: { ...(selectedField.range || { min: 0, max: 100 }), step: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input :id="`rng-show-${selectedField.id}`" type="checkbox" class="h-4 w-4 rounded border-slate-300" :checked="selectedField.range?.showValue ?? true" @change="store.updateField(selectedField.id, { range: { ...(selectedField.range || { min: 0, max: 100 }), showValue: ($event.target as HTMLInputElement).checked } })" />
            <label :for="`rng-show-${selectedField.id}`" class="text-sm">{{ t('advanced.showValue') }}</label>
          </div>
        </section>

        <!-- Tags/Chips configuration -->
        <section v-if="selectedField.type === 'tags'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="`tg-sep-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.separator') }}</label>
              <input :id="`tg-sep-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.tags?.separator || ','" @input="store.updateField(selectedField.id, { tags: { ...(selectedField.tags || {}), separator: ($event.target as HTMLInputElement).value } })" />
            </div>
            <div>
              <label :for="`tg-max-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.maxTags') }}</label>
              <input :id="`tg-max-${selectedField.id}`" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.tags?.maxTags ?? 0" @input="store.updateField(selectedField.id, { tags: { ...(selectedField.tags || {}), maxTags: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
          </div>
        </section>

        <!-- Heading configuration -->
        <section v-if="selectedField.type === 'heading'" class="space-y-3">
          <div>
            <label :for="`hd-text-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.headingText') }}</label>
            <input :id="`hd-text-${selectedField.id}`" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.heading?.text || ''" @input="store.updateField(selectedField.id, { heading: { ...(selectedField.heading || {}), text: ($event.target as HTMLInputElement).value } })" />
          </div>
          <div>
            <label :for="`hd-level-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('advanced.headingLevel') }}</label>
            <select :id="`hd-level-${selectedField.id}`" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :value="selectedField.heading?.level || 2" @change="store.updateField(selectedField.id, { heading: { ...(selectedField.heading || {}), level: Number(($event.target as HTMLSelectElement).value) as 1|2|3 } })">
              <option :value="1">H1</option>
              <option :value="2">H2</option>
              <option :value="3">H3</option>
            </select>
          </div>
        </section>

        <!-- Table configuration (API only) -->
        <section v-if="selectedField.type === 'table'" class="space-y-3">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('fieldType.table') }}</h3>
          <!-- API config -->
          <div class="space-y-3 rounded-lg border border-slate-200 p-3">
            <div>
              <label :for="`tbl-url-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('table.url') }}</label>
              <input
                :id="`tbl-url-${selectedField.id}`"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                :value="selectedField.table?.api?.url || ''"
                @input="store.updateField(selectedField.id, { table: { ...(selectedField.table || {}), api: { ...(selectedField.table?.api || {}), url: ($event.target as HTMLInputElement).value } } })"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label :for="`tbl-method-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('table.method') }}</label>
                <select
                  :id="`tbl-method-${selectedField.id}`"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  :value="selectedField.table?.api?.method || 'GET'"
                  @change="store.updateField(selectedField.id, { table: { ...(selectedField.table || {}), api: { ...(selectedField.table?.api || {}), method: ($event.target as HTMLSelectElement).value as any } } })"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
            </div>

            <div>
              <div class="mb-1 text-sm font-medium">{{ t('table.headers') }}</div>
              <div class="space-y-2">
                <div v-for="(row, idx) in headerRows" :key="idx" class="grid grid-cols-12 items-center gap-2">
                  <input
                    :id="`tbl-h-key-${selectedField.id}-${idx}`"
                    class="col-span-5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    :placeholder="t('table.headerKey')"
                    :value="row.key"
                    @input="updateHeaderKey(idx, ($event.target as HTMLInputElement).value)"
                  />
                  <input
                    :id="`tbl-h-val-${selectedField.id}-${idx}`"
                    class="col-span-6 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    :placeholder="t('table.headerValue')"
                    :value="row.value"
                    @input="updateHeaderValue(idx, ($event.target as HTMLInputElement).value)"
                  />
                  <button type="button" class="col-span-1 text-xs text-rose-600 hover:underline" @click="removeHeaderRow(idx)">{{ t('config.remove') }}</button>
                </div>
                <button type="button" class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" @click="addHeaderRow">{{ t('actions.addOption') }}</button>
              </div>
            </div>

            <div>
              <label :for="`tbl-body-${selectedField.id}`" class="mb-1 block text-sm font-medium">{{ t('table.body') }}</label>
              <textarea
                :id="`tbl-body-${selectedField.id}`"
                class="h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                :value="selectedField.table?.api?.body || ''"
                @input="store.updateField(selectedField.id, { table: { ...(selectedField.table || {}), api: { ...(selectedField.table?.api || {}), body: ($event.target as HTMLTextAreaElement).value } } })"
              />
            </div>

            <ApiTester :model-value="selectedField.table?.api || { url: '', method: 'GET', headers: {}, body: '' }" />
            </div>
          </section>
      </div>

      <div v-else class="flex min-h-[140px] items-center justify-center text-sm text-slate-500">
        {{ t('config.title') }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
