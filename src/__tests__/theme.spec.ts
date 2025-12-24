import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

// Light-only app: ensure it renders and shows header actions
describe('App (light-only)', () => {
  it('renders header and actions', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia()] },
    })
    expect(wrapper.text()).toContain('Form Builder')
    expect(wrapper.text()).toContain('Export JSON')
    expect(wrapper.text()).toContain('Import JSON')
  })
})
