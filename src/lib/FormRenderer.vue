<script setup lang="ts">
import type { FormSchema, FormField } from '@/types/form'
import type { AnyField, GroupField, VisibilityCondition } from '@/types/form'
import { reactive, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{ schema: FormSchema; messages?: { required?: string } }>(), {
  messages: () => ({ required: 'This field is required' }),
})
const emit = defineEmits<{ (e: 'submit', payload: Record<string, unknown>): void }>()

type Values = Record<string, unknown>
type Errors = Record<string, string | undefined>
const state = reactive<{ values: Values; errors: Errors }>({ values: {}, errors: {} })

// Table data caches
const tableLoading = reactive<Record<string, boolean>>({})
const tableError = reactive<Record<string, string | undefined>>({})
const tableResult = reactive<Record<string, unknown>>({})

const coerceInitial = (field: FormField) => {
  switch (field.type) {
    case 'checkbox':
      return false
    case 'switch':
      return false
    case 'number':
      return ''
    case 'date':
      return ''
    case 'email':
      return ''
    case 'masked':
      return ''
    case 'currency':
      return ''
    case 'radio':
    case 'select':
      return ''
    case 'range':
      return typeof field.range?.min === 'number' ? field.range.min : 0
    case 'tags':
      return [] as unknown[]
    default:
      return ''
  }
}

function eachField(fields: AnyField[], fn: (f: FormField) => void): void {
  for (const f of fields) {
    if ((f as AnyField).type === 'group') {
      const g = f as GroupField
      eachField(g.children as AnyField[], fn)
    } else {
      fn(f as FormField)
    }
  }
}

const ensureInitialValues = (): void => {
  eachField(props.schema.fields as AnyField[], (f) => {
    if (!(f.id in state.values)) {
      state.values[f.id] = coerceInitial(f)
    }
  })
}
ensureInitialValues()

watch(
  () => props.schema,
  () => {
    ensureInitialValues()
  },
  { deep: true }
)

const ensureTableFetched = async (field: FormField): Promise<void> => {
  if (field.type !== 'table') {
    return
  }
  const api = field.table?.api
  if (!api || !api.url) {
    return
  }
  if (tableLoading[field.id] || tableResult[field.id] !== undefined) {
    return
  }
  try {
    tableLoading[field.id] = true
    tableError[field.id] = undefined
    const res = await fetch(api.url, {
      method: api.method || 'GET',
      headers: api.headers || {},
      body: api.method && api.method !== 'GET' && api.body ? api.body : undefined,
    })
    const ct = res.headers.get('content-type') || ''
    const data = ct.includes('application/json') ? await res.json() : await res.text()
    tableResult[field.id] = data
  } catch (e) {
    tableError[field.id] = e instanceof Error ? e.message : String(e)
  } finally {
    tableLoading[field.id] = false
  }
}

const isEmptyString = (val: unknown): boolean => {
  return typeof val === 'string' ? val.trim() === '' : val === '' || val == null
}

const isValidNumber = (val: unknown): boolean => {
  return typeof val === 'number' && !Number.isNaN(val)
}

const isValidEmail = (val: unknown): boolean => {
  if (typeof val !== 'string') {
    return false
  }
  const s = val.trim()
  if (s === '') {
    return false
  }
  // Pragmatic email check (RFC-lite)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(s)
}

// Applies a simple numeric mask where '9' represents a digit and any other
// character is treated as a literal. e.g., mask "(99) 99999-9999"
const applyMask = (raw: string, mask: string): string => {
  const digits = raw.replace(/\D+/g, '').split('')
  let out = ''
  for (let i = 0; i < mask.length; i++) {
    const m = mask[i]
    if (m === '9') {
      if (digits.length === 0) {
        break
      }
      out += digits.shift()
    } else {
      out += m
    }
  }
  return out
}

const validateField = (field: FormField): boolean => {
  const val = state.values[field.id]
  // Always allow type-specific validation even when not required (e.g., email format)
  // First, handle required emptiness for inputs that require a value
  if (field.required) {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'date':
      case 'email':
      case 'masked':
      case 'currency':
      case 'select':
      case 'radio': {
        const ok = !isEmptyString(val)
        state.errors[field.id] = ok ? undefined : (field.validation?.requiredMessage || props.messages?.required)
        if (!ok) {
          return false
        }
        break
      }
      case 'number': {
        const ok = isValidNumber(val)
        state.errors[field.id] = ok ? undefined : (field.validation?.requiredMessage || props.messages?.required)
        if (!ok) {
          return false
        }
        break
      }
      case 'checkbox':
      case 'switch': {
        const ok = val === true
        state.errors[field.id] = ok ? undefined : (field.validation?.requiredMessage || props.messages?.required)
        if (!ok) {
          return false
        }
        break
      }
      case 'range': {
        const n = typeof val === 'number' ? val : Number(val)
        const inRange = !Number.isNaN(n) && (!field.range?.min || n >= field.range.min) && (!field.range?.max || n <= field.range.max)
        const ok = inRange
        state.errors[field.id] = ok ? undefined : (field.validation?.requiredMessage || props.messages?.required)
        if (!ok) {
          return false
        }
        break
      }
      case 'tags': {
        const arr = Array.isArray(val) ? val : []
        const ok = arr.length > 0
        state.errors[field.id] = ok ? undefined : (field.validation?.requiredMessage || props.messages?.required)
        if (!ok) {
          return false
        }
        break
      }
      case 'table':
      case 'heading':
      case 'divider': {
        state.errors[field.id] = undefined
        break
      }
    }
  } else {
    // Not required: clear error by default
    state.errors[field.id] = undefined
  }

  // Additional type-specific validations that apply even when not required
  if (field.type === 'email') {
    const s = typeof val === 'string' ? val.trim() : ''
    if (s !== '' && !isValidEmail(s)) {
      state.errors[field.id] = field.validation?.requiredMessage || 'Invalid email address'
      return false
    }
  }

  switch (field.type) {
    case 'table':
    case 'heading':
    case 'divider':
      return true
    default:
      return true
  }
}

const getFieldByKey = (key: string): FormField | undefined => {
  let found: FormField | undefined
  eachField(props.schema.fields as AnyField[], (f) => {
    const k = (f.name && f.name.trim()) || f.id
    if (!found && k === key) {
      found = f
    }
  })
  return found
}

const evalCondition = (cond: VisibilityCondition | undefined): boolean => {
  // If there is no condition configured, default to visible
  if (!cond) return true

  // Resolve the referenced field by name (preferred) or fallback id
  const ref = getFieldByKey(cond.whenField)
  if (!ref) return true

  const val = state.values[ref.id]
  const cmpRaw = cond.value as unknown

  // Normalize comparison operands depending on referenced field type
  const toBool = (v: unknown): boolean => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v !== 0
    const s = String(v).trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes' || s === 'on'
  }

  const toNumber = (v: unknown): number => {
    const n = Number(v)
    return Number.isNaN(n) ? NaN : n
  }

  const equals = (a: unknown, b: unknown): boolean => {
    // Type-aware equality: align to referenced field type first
    switch (ref.type) {
      case 'number': {
        const an = toNumber(a)
        const bn = toNumber(b)
        return !Number.isNaN(an) && !Number.isNaN(bn) ? an === bn : String(a ?? '') === String(b ?? '')
      }
      case 'checkbox':
      case 'switch': {
        return toBool(a) === toBool(b)
      }
      default:
        return String(a ?? '') === String(b ?? '')
    }
  }

  const contains = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a)) return a.includes(b)
    return String(a ?? '').includes(String(b ?? ''))
  }

  const op = (cond.operator || 'equals') as VisibilityCondition['operator']
  switch (op) {
    case 'equals':
      return equals(val, cmpRaw)
    case 'notEquals':
      return !equals(val, cmpRaw)
    case 'greaterThan':
      return toNumber(val) > toNumber(cmpRaw)
    case 'greaterOrEqual':
      return toNumber(val) >= toNumber(cmpRaw)
    case 'lessThan':
      return toNumber(val) < toNumber(cmpRaw)
    case 'lessOrEqual':
      return toNumber(val) <= toNumber(cmpRaw)
    case 'contains':
      return contains(val, cmpRaw)
    case 'notContains':
      return !contains(val, cmpRaw)
    default:
      return true
  }
}

const validateAll = (): { ok: boolean; firstInvalid?: FormField } => {
  let firstInvalid: FormField | undefined
  let ok = true
  // validate only visible, non-display fields
  const visit = (fields: AnyField[], visible: boolean) => {
    for (const f of fields) {
      if (f.type === 'group') {
        const groupVisible = visible && evalCondition((f as GroupField).condition)
        visit((f as GroupField).children as AnyField[], groupVisible)
      } else if (visible) {
        const ff = f as FormField
        const valid = validateField(ff)
        if (!valid) {
          ok = false
          if (!firstInvalid) firstInvalid = ff
        }
      }
    }
  }
  visit(props.schema.fields as AnyField[], true)
  return { ok, firstInvalid }
}

const focusField = async (field: FormField): Promise<void> => {
  await nextTick()
  if (field.type === 'radio') {
    const el = document.querySelector(`input[type="radio"][name="${field.id}"]`) as HTMLInputElement | null
    if (el) {
      el.focus()
    }
  } else {
    const el = document.getElementById(field.id) as HTMLElement | null
    if (el) {
      el.focus()
    }
  }
}

const onSubmit = async (ev: Event): Promise<void> => {
  ev.preventDefault()
  const { ok, firstInvalid } = validateAll()
  if (!ok) {
    if (firstInvalid) {
      await focusField(firstInvalid)
    }
    return
  }
  // Build payload using custom key (name) when provided, otherwise fallback to id
  // Note: Group is a container only; children contribute their own values with their own keys (flat output).
  const payload: Record<string, unknown> = {}
  const collect = (fields: AnyField[], visible: boolean) => {
    for (const f of fields) {
      if (f.type === 'group') {
        const vis = visible && evalCondition((f as GroupField).condition)
        if (vis) collect((f as GroupField).children as AnyField[], vis)
      } else if (visible) {
        const ff = f as FormField
        if (ff.type === 'heading' || ff.type === 'divider') continue
        const key = ff.name && ff.name.trim() ? ff.name : ff.id
        payload[key] = state.values[ff.id]
      }
    }
  }
  collect(props.schema.fields as AnyField[], true)
  emit('submit', payload)
}

const onFieldInput = (field: FormField, ev?: Event): void => {
  const target = ev?.target as HTMLInputElement | undefined
  if (target) {
    state.values[field.id] = target.value
  }
  if (field.type === 'masked' && typeof field.mask === 'string' && field.mask) {
    const current = target ? target.value : String(state.values[field.id] || '')
    state.values[field.id] = applyMask(current, field.mask)
    if (target) {
      target.value = String(state.values[field.id] || '')
    }
  }
  // live-validate to clear error as user fixes input
  if (state.errors[field.id]) {
    validateField(field)
  }
}

const normalizeTableData = (raw: unknown): unknown[] | undefined => {
  // Direct array
  if (Array.isArray(raw)) {
    return raw
  }
  // If it's a string, try to parse JSON
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return normalizeTableData(parsed)
    } catch {
      return undefined
    }
  }
  // If it's an object, try common shapes
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    // Common keys
    const commonKeys = ['data', 'items', 'results', 'rows']
    for (const key of commonKeys) {
      const val = obj[key]
      if (Array.isArray(val)) {
        return val
      }
    }
    // Fallback: first array-of-objects value
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) {
        return val
      }
    }
  }
  return undefined
}

const getTableState = (field: FormField): { data: unknown; loading: boolean; error?: string } => {
  if (field.type !== 'table') {
    return { data: undefined, loading: false }
  }
  // API source only
  ensureTableFetched(field)
  const raw = tableResult[field.id]
  const data = normalizeTableData(raw) ?? raw
  return { data, loading: !!tableLoading[field.id], error: tableError[field.id] }
}

const getColumns = (data: unknown): string[] => {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    return Object.keys(data[0] as Record<string, unknown>)
  }
  return []
}
</script>

<template>
  <form @submit="onSubmit" novalidate>
    <h2 style="margin-bottom: 12px; font-weight: 600;">{{ props.schema.formTitle }}</h2>
    <div v-for="field in props.schema.fields" :key="field.id" style="margin-bottom: 12px;">
      <label v-if="!['checkbox','switch','heading','divider','group'].includes(field.type)" :for="field.id" style="display:block; margin-bottom: 6px; font-size: 14px;">{{ field.label }} <span v-if="field.required" aria-hidden="true" style="color:#dc2626">*</span></label>

      <template v-if="field.type === 'text'">
        <input
          :id="field.id"
          type="text"
          :placeholder="field.placeholder"
          v-model="state.values[field.id]"
          @input="onFieldInput(field)"
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        />
      </template>
      <!-- Group container -->
      <template v-else-if="field.type === 'group'">
        <!-- Smooth show/hide transition for group visibility -->
        <Transition name="fade-slide">
          <div v-if="evalCondition((field as any).condition)" style="border:1px solid #cbd5e1; background:#ffffff; padding:12px; border-radius:8px;">
            <div style="font-weight:600; margin-bottom:8px;">{{ field.label }}</div>
            <div v-for="child in (field as any).children" :key="child.id" style="margin-bottom: 10px;">
            <label v-if="!['checkbox','switch','heading','divider'].includes(child.type)" :for="child.id" style="display:block; margin-bottom: 6px; font-size: 13px;">{{ child.label }} <span v-if="child.required" aria-hidden="true" style="color:#dc2626">*</span></label>

            <template v-if="child.type === 'text'">
              <input
                :id="child.id"
                type="text"
                :placeholder="child.placeholder"
                v-model="state.values[child.id]"
                @input="onFieldInput(child)"
                :aria-invalid="!!state.errors[child.id]"
                :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                :style="[
                  { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
                  state.errors[child.id] ? { borderColor: '#ef4444' } : null,
                ]"
              />
            </template>
            <template v-else-if="child.type === 'textarea'">
              <textarea
                :id="child.id"
                :placeholder="child.placeholder"
                v-model="state.values[child.id]"
                @input="onFieldInput(child)"
                :aria-invalid="!!state.errors[child.id]"
                :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                :style="[
                  { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
                  state.errors[child.id] ? { borderColor: '#ef4444' } : null,
                ]"
              ></textarea>
            </template>
            <template v-else-if="child.type === 'number'">
              <input
                :id="child.id"
                type="number"
                :placeholder="child.placeholder"
                v-model.number="state.values[child.id]"
                @input="onFieldInput(child)"
                :aria-invalid="!!state.errors[child.id]"
                :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                :style="[
                  { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
                  state.errors[child.id] ? { borderColor: '#ef4444' } : null,
                ]"
              />
            </template>
            <template v-else-if="child.type === 'date'">
              <input
                :id="child.id"
                type="date"
                :placeholder="child.placeholder"
                v-model="state.values[child.id]"
                @input="onFieldInput(child)"
                :aria-invalid="!!state.errors[child.id]"
                :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                :style="[
                  { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
                  state.errors[child.id] ? { borderColor: '#ef4444' } : null,
                ]"
              />
            </template>
            <template v-else-if="child.type === 'checkbox'">
              <label :for="child.id" style="display:flex; align-items:center; gap:8px; font-size:13px;">
                <input
                  :id="child.id"
                  type="checkbox"
                  v-model="state.values[child.id]"
                  @change="onFieldInput(child)"
                  :aria-invalid="!!state.errors[child.id]"
                  :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                  :style="{
                    width: '16px',
                    height: '16px',
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px'
                  }"
                />
                {{ child.label }}
              </label>
            </template>
            <template v-else-if="child.type === 'radio'">
              <div class="space-y-1">
                <label v-for="opt in child.options" :key="opt.value" class="flex items-center gap-2" :style="{ fontSize: '13px' }">
                  <input type="radio" :name="child.id" :value="opt.value" v-model="state.values[child.id]" @change="onFieldInput(child)" /> {{ opt.label }}
                </label>
              </div>
            </template>
            <template v-else-if="child.type === 'select'">
              <select
                :id="child.id"
                v-model="state.values[child.id]"
                @change="onFieldInput(child)"
                :aria-invalid="!!state.errors[child.id]"
                :aria-describedby="state.errors[child.id] ? `${child.id}-error` : undefined"
                :style="[
                  { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
                  state.errors[child.id] ? { borderColor: '#ef4444' } : null,
                ]"
              >
                <option :value="''">—</option>
                <option v-for="opt in child.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </template>

            <div v-if="state.errors[child.id]" :id="`${child.id}-error`" style="color:#dc2626; font-size:12px; margin-top:4px;">
              {{ state.errors[child.id] }}
            </div>
            </div>
          </div>
        </Transition>
      </template>
      <template v-else-if="field.type === 'textarea'">
        <textarea
          :id="field.id"
          :placeholder="field.placeholder"
          v-model="state.values[field.id]"
          @input="onFieldInput(field)"
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        ></textarea>
      </template>
      <template v-else-if="field.type === 'number'">
        <input
          :id="field.id"
          type="number"
          :placeholder="field.placeholder"
          v-model.number="state.values[field.id]"
          @input="onFieldInput(field)"
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        />
      </template>
      <template v-else-if="field.type === 'date'">
        <input
          :id="field.id"
          type="date"
          :placeholder="field.placeholder"
          v-model="state.values[field.id]"
          @input="onFieldInput(field)"
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        />
      </template>
      <template v-else-if="field.type === 'checkbox'">
        <label :for="field.id" style="display:flex; align-items:center; gap:8px; font-size:14px;">
          <input
            :id="field.id"
            type="checkbox"
            v-model="state.values[field.id]"
            @change="onFieldInput(field)"
            :aria-invalid="!!state.errors[field.id]"
            :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
            :style="{
              width: '16px',
              height: '16px',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px'
            }"
          />
          {{ field.label }}
        </label>
      </template>
      <template v-else-if="field.type === 'switch'">
        <label :for="field.id" style="display:flex; align-items:center; gap:8px; font-size:14px;">
          <input
            :id="field.id"
            type="checkbox"
            v-model="state.values[field.id]"
            @change="onFieldInput(field)"
            :aria-invalid="!!state.errors[field.id]"
            :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
            :style="{
              width: '16px',
              height: '16px',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px'
            }"
          />
          {{ field.label }}
        </label>
      </template>
      <template v-else-if="field.type === 'radio'">
        <div :aria-invalid="!!state.errors[field.id]" :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined">
          <label v-for="opt in field.options" :key="opt.value" style="display:flex; align-items:center; gap:8px; font-size:14px; margin-bottom:4px;">
            <input
              type="radio"
              :name="field.id"
              :value="opt.value"
              v-model="state.values[field.id]"
              @change="onFieldInput(field)"
              :style="{
                width: '16px',
                height: '16px',
                background: '#fff',
                border: '1px solid #cbd5e1'
              }"
            />
            {{ opt.label }}
          </label>
        </div>
      </template>
      <template v-else-if="field.type === 'select'">
        <select
          :id="field.id"
          v-model="state.values[field.id]"
          @change="onFieldInput(field)"
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        >
          <option value=""></option>
          <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </template>
      <template v-else-if="field.type === 'email' || field.type === 'masked' || field.type === 'currency'">
        <input
          :id="field.id"
          :type="field.type === 'email' ? 'email' : 'text'"
          :placeholder="field.placeholder"
          :value="String(state.values[field.id] ?? '')"
          @input="onFieldInput(field, $event)"
          @blur="
            (e:any)=>{
              if(field.type==='currency'){
                const code = field.currency?.code || 'USD'
                const locale = field.currency?.locale || 'en-US'
                const raw = String((e.target as HTMLInputElement).value || '')
                const num = Number(raw.replace(/[^\d.-]+/g,'').replace(/(\..*?)\./g,'$1'))
                if(!Number.isNaN(num)){
                  const fmt = new Intl.NumberFormat(locale,{ style:'currency', currency: code })
                  ;(e.target as HTMLInputElement).value = fmt.format(num)
                  state.values[field.id] = (e.target as HTMLInputElement).value
                }
                onFieldInput(field)
              } else if(field.type==='masked' && typeof field.mask==='string' && field.mask){
                const target = e.target as HTMLInputElement
                target.value = applyMask(target.value, field.mask)
                state.values[field.id] = target.value
                onFieldInput(field)
              } else {
                onFieldInput(field)
              }
            }
          "
          :aria-invalid="!!state.errors[field.id]"
          :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
          :style="[
            { width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' },
            state.errors[field.id] ? { borderColor: '#ef4444' } : null,
          ]"
        />
      </template>
      <template v-else-if="field.type === 'range'">
        <div>
          <input
            :id="field.id"
            type="range"
            :min="field.range?.min ?? 0"
            :max="field.range?.max ?? 100"
            :step="field.range?.step ?? 1"
            v-model.number="(state.values[field.id] as number)"
            @input="onFieldInput(field)"
            :aria-invalid="!!state.errors[field.id]"
            :aria-describedby="state.errors[field.id] ? `${field.id}-error` : undefined"
            :style="{ width: '100%' }"
          />
          <div v-if="field.range?.showValue !== false" style="font-size:12px; color:#475569; margin-top:4px;">{{ state.values[field.id] }}</div>
        </div>
      </template>
      <template v-else-if="field.type === 'tags'">
        <div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
            <span v-for="(tag, idx) in (state.values[field.id] as unknown[] as string[])" :key="idx" style="display:inline-flex; align-items:center; gap:6px; background:#e2e8f0; color:#0f172a; border-radius:9999px; padding:2px 8px; font-size:12px;">
              {{ tag }}
              <button type="button" @click="(state.values[field.id] as unknown[] as string[]).splice(idx,1); onFieldInput(field)" style="background:transparent; border:none; cursor:pointer;">×</button>
            </span>
          </div>
          <input
            :id="field.id"
            type="text"
            :placeholder="field.placeholder || ''"
            @keydown.enter.prevent="(e:any)=>{ const inp=e.target as HTMLInputElement; const v=inp.value.trim(); if(v){ (state.values[field.id] as unknown[] as string[]).push(v); inp.value=''; onFieldInput(field) } }"
            :style="{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }"
          />
          <div style="font-size:12px; color:#64748b; margin-top:4px;">Press Enter to add{{ field.tags?.separator ? ` or '${field.tags.separator}'` : '' }}</div>
        </div>
      </template>
      <template v-else-if="field.type === 'heading'">
        <component :is="`h${field.heading?.level || 2}`" style="margin:8px 0;">{{ field.heading?.text || field.label }}</component>
      </template>
      <template v-else-if="field.type === 'divider'">
        <hr />
      </template>
      <template v-else-if="field.type === 'table'">
        <div style="border:1px solid #e2e8f0; border-radius:8px; padding:8px; background:#fff;">
          <div style="font-size:13px; color:#475569; margin-bottom:6px;">Table</div>
          <div v-if="getTableState(field).loading" style="font-size:13px; color:#64748b;">Loading…</div>
          <div v-else-if="getTableState(field).error" style="font-size:13px; color:#ef4444;">{{ getTableState(field).error }}</div>
          <div v-else>
            <template v-if="Array.isArray(getTableState(field).data) && getTableState(field).data.length">
              <div style="overflow:auto; max-width:100%;">
                <table style="width:100%; border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th v-for="col in getColumns(getTableState(field).data)" :key="col" style="text-align:left; font-size:12px; color:#334155; padding:6px; border-bottom:1px solid #e2e8f0;">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rIdx) in (getTableState(field).data as any[])" :key="rIdx">
                      <td v-for="col in getColumns(getTableState(field).data)" :key="col" style="font-size:13px; color:#0f172a; padding:6px; border-bottom:1px solid #f1f5f9;">
                        {{ (row && typeof row === 'object') ? (row as any)[col] : '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div v-else style="font-size:13px; color:#64748b;">No data</div>
          </div>
        </div>
      </template>

      <p v-if="state.errors[field.id]" :id="`${field.id}-error`" style="color:#ef4444; font-size:12px; margin-top:6px;">{{ state.errors[field.id] }}</p>
    </div>

    <div style="margin-top: 16px;">
      <button type="submit" style="padding:8px 12px; border:1px solid #0f172a; background:#0f172a; color:white; border-radius:8px;">Enviar</button>
    </div>
  </form>

</template>

<style>
/* Simple fade + slight slide transition for group visibility */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 160ms ease, transform 180ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<style scoped>
/* No Tailwind required; minimal inline styles used above */
</style>
