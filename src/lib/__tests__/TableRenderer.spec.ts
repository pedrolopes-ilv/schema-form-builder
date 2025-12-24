import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FormRenderer from '../FormRenderer.vue'

describe('FormRenderer table field', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Variable-based tables are no longer supported; API-only

  it('fetches API-based table', async () => {
    const schema = {
      formTitle: 'With Table',
      fields: [
        {
          id: 'tbl2',
          type: 'table',
          label: 'Data',
          required: false,
          table: { api: { url: 'https://api.example.com/data', method: 'GET', headers: {} } },
        },
      ],
    }

    // mock fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      headers: { get: () => 'application/json' },
      json: async () => [{ id: 1, name: 'X' }],
    })

    const wrapper = mount(FormRenderer, {
      props: { schema: schema as any },
      attachTo: document.body,
    })

    // allow microtasks and next ticks to resolve
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    await (wrapper.vm as any).$nextTick?.()

    expect(wrapper.text()).toContain('id')
    expect(wrapper.text()).toContain('name')
    expect(wrapper.text()).toContain('X')
  })
})
