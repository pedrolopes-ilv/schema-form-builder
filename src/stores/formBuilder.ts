import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnyField, FieldOption, FieldType, FormField, FormSchema, GroupField } from '@/types/form'

function generateId(prefix = 'fld'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const useFormBuilderStore = defineStore('formBuilder', () => {
  const schema = ref<FormSchema>({
    formTitle: 'Untitled Form',
    fields: [],
  })

  const selectedFieldId = ref<string | null>(null)

  const selectedField = computed<AnyField | undefined>(() => {
    const targetId = selectedFieldId.value
    if (!targetId) return undefined

    const findById = (fields: AnyField[]): AnyField | undefined => {
      for (const f of fields) {
        if (f.id === targetId) return f
        if (f.type === 'group') {
          const found = findById((f as GroupField).children)
          if (found) return found
        }
      }
      return undefined
    }
    return findById(schema.value.fields)
  })

  const createField = (type: FieldType): AnyField => {
    // group is a special container field
    if (type === 'group') {
      const grp: GroupField = {
        id: generateId('grp'),
        type: 'group',
        // Use a neutral default label for group. Do NOT borrow heading defaults to avoid confusion
        // that a heading component exists inside the group.
        label: 'Group',
        required: false,
        placeholder: undefined,
        validation: {},
        children: [],
        condition: undefined,
      }
      return grp
    }
    const base: FormField = {
      id: generateId(),
      type,
      label: getDefaultLabel(type),
      required: false,
      placeholder: getPlaceholderFor(type),
      validation: {},
    }
    if (type === 'radio' || type === 'select') {
      base.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ] as FieldOption[]
    }
    if (type === 'table') {
      base.table = {
        api: { url: '', method: 'GET', headers: {}, body: '' },
      }
    }
    if (type === 'masked') {
      base.mask = ''
    }
    if (type === 'currency') {
      base.currency = { code: 'BRL', locale: 'pt-BR' }
    }
    if (type === 'range') {
      base.range = { min: 0, max: 100, step: 1, showValue: true }
    }
    if (type === 'tags') {
      base.tags = { separator: ',', maxTags: 0 }
    }
    if (type === 'heading') {
      base.heading = { text: 'Heading', level: 2 }
    }
    return base
  }

  const addField = (type: FieldType): void => {
    const base = createField(type)
    schema.value.fields.push(base)
    selectedFieldId.value = base.id
  }

  const updateField = (id: string, patch: Partial<AnyField>): void => {
    // Try update at root first
    const idx = schema.value.fields.findIndex((field) => field.id === id)
    if (idx !== -1) {
      schema.value.fields[idx] = { ...schema.value.fields[idx], ...patch } as AnyField
      return
    }
    // Search in groups recursively
    const updateInChildren = (fields: AnyField[]): boolean => {
      for (const f of fields) {
        if (f.type === 'group') {
          const g = f as GroupField
          const i = g.children.findIndex((c) => c.id === id)
          if (i !== -1) {
            g.children[i] = { ...g.children[i], ...patch }
            return true
          }
          if (updateInChildren(g.children)) return true
        }
      }
      return false
    }
    updateInChildren(schema.value.fields)
  }

  const deleteField = (id: string): void => {
    const removeFrom = (list: AnyField[]): boolean => {
      const idx = list.findIndex((field) => field.id === id)
      if (idx !== -1) {
        list.splice(idx, 1)
        return true
      }
      for (const f of list) {
        if (f.type === 'group') {
          if (removeFrom((f as GroupField).children)) return true
        }
      }
      return false
    }
    if (removeFrom(schema.value.fields)) {
      if (selectedFieldId.value === id) selectedFieldId.value = null
    }
  }

  const reorderFields = (newOrder: AnyField[]): void => {
    schema.value.fields = [...newOrder]
  }

  const setSelectedField = (id: string | null): void => {
    selectedFieldId.value = id
  }

  const jsonSchemaOutput = computed(() => ({ ...schema.value }))

  const setFormTitle = (title: string): void => {
    schema.value.formTitle = title
  }

  return {
    schema,
    selectedFieldId,
    selectedField,
    createField,
    addField,
    updateField,
    deleteField,
    reorderFields,
    setSelectedField,
    setFormTitle,
    jsonSchemaOutput,
    // Group helpers
    addChildField,
    moveField,
    removeChildField,
  }
})

function getDefaultLabel(type: FieldType): string {
  switch (type) {
    case 'text':
      return 'Text'
    case 'textarea':
      return 'Textarea'
    case 'number':
      return 'Number'
    case 'checkbox':
      return 'Checkbox'
    case 'radio':
      return 'Radio Group'
    case 'select':
      return 'Select'
    case 'date':
      return 'Date'
    case 'table':
      return 'Table'
    case 'masked':
      return 'Masked'
    case 'email':
      return 'Email'
    case 'currency':
      return 'Currency'
    case 'range':
      return 'Slider'
    case 'switch':
      return 'Switch'
    case 'tags':
      return 'Tags'
    case 'heading':
      return 'Heading'
    case 'divider':
      return 'Divider'
    case 'group':
      return 'Group'
  }
}

function getPlaceholderFor(type: FieldType): string | undefined {
  switch (type) {
    case 'text':
      return 'Enter text'
    case 'textarea':
      return 'Enter long text'
    case 'number':
      return '0'
    case 'date':
      return 'YYYY-MM-DD'
    case 'email':
      return 'name@example.com'
    case 'currency':
      return '0,00'
    default:
      return undefined
  }
}

// Group-related helpers
function findGroupById(fields: AnyField[], id: string): GroupField | undefined {
  for (const f of fields) {
    if (f.type === 'group') {
      if (f.id === id) return f as GroupField
      const nested = findGroupById((f as GroupField).children, id)
      if (nested) return nested
    }
  }
  return undefined
}

function addChildField(parentId: string, type: FieldType): AnyField | undefined {
  const store = useFormBuilderStore()
  const g = findGroupById(store.schema.fields, parentId)
  if (!g) return undefined
  const child = store.createField(type)
  g.children.push(child)
  store.setSelectedField(child.id)
  return child
}

type Path = { parentId?: string; index: number } // root when parentId undefined

function moveField(from: Path, to: Path): void {
  const store = useFormBuilderStore()
  const getList = (p: Path): AnyField[] => {
    if (p.parentId) {
      const g = findGroupById(store.schema.fields, p.parentId)
      return g ? g.children : []
    }
    return store.schema.fields
  }
  const fromList = getList(from)
  const toList = getList(to)
  const [item] = fromList.splice(from.index, 1)
  if (item) toList.splice(to.index, 0, item)
}

function removeChildField(parentId: string, index: number): void {
  const store = useFormBuilderStore()
  const g = findGroupById(store.schema.fields, parentId)
  if (!g) return
  const removed = g.children.splice(index, 1)
  if (removed.length && store.selectedFieldId === removed[0].id) {
    store.setSelectedField(null)
  }
}
