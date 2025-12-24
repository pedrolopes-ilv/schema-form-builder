import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useFormBuilderStore } from '@/stores/formBuilder'

describe('useFormBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a text field and selects it', () => {
    const store = useFormBuilderStore()
    store.addField('text')
    expect(store.schema.fields.length).toBe(1)
    const fld = store.schema.fields[0]
    expect(fld.type).toBe('text')
    expect(store.selectedFieldId).toBe(fld.id)
  })

  it('updates a field label', () => {
    const store = useFormBuilderStore()
    store.addField('number')
    const id = store.schema.fields[0].id
    store.updateField(id, { label: 'Age' })
    expect(store.schema.fields[0].label).toBe('Age')
  })

  it('deletes a field', () => {
    const store = useFormBuilderStore()
    store.addField('text')
    const id = store.schema.fields[0].id
    store.deleteField(id)
    expect(store.schema.fields.length).toBe(0)
  })

  it('reorders fields', () => {
    const store = useFormBuilderStore()
    store.addField('text')
    store.addField('number')
    const [a, b] = store.schema.fields
    store.reorderFields([b, a])
    expect(store.schema.fields[0].id).toBe(b.id)
  })

  it('jsonSchemaOutput returns the schema object', () => {
    const store = useFormBuilderStore()
    store.setFormTitle('My Form')
    store.addField('select')
    const json = store.jsonSchemaOutput
    expect(json.formTitle).toBe('My Form')
    expect(json.fields.length).toBe(1)
    expect(json.fields[0].type).toBe('select')
  })
})
