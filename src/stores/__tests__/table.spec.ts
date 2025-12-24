import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFormBuilderStore } from '@/stores/formBuilder'

describe('Table field defaults', () => {
  it('createField("table") initializes table config with API settings', () => {
    setActivePinia(createPinia())
    const store = useFormBuilderStore()
    const field = store.createField('table')
    expect(field.type).toBe('table')
    expect(field.table).toBeTruthy()
    expect(field.table?.api?.method).toBe('GET')
    expect(field.table?.api?.url).toBe('')
  })
})
