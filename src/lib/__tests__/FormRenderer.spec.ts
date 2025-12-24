import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormRenderer from '../FormRenderer.vue'

const schema = {
  formTitle: 'Test Form',
  fields: [
    { id: 'name', type: 'text', label: 'Name', required: true, validation: { requiredMessage: 'Name is required' } },
    { id: 'agree', type: 'checkbox', label: 'Agree', required: true },
    {
      id: 'plan',
      type: 'select',
      label: 'Plan',
      required: true,
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'pro', label: 'Pro' },
      ],
    },
  ],
} as const

describe('FormRenderer required validation', () => {
  it('blocks submit and shows errors until fields are valid, then emits payload', async () => {
    const wrapper = mount(FormRenderer, {
      props: { schema: schema as any },
      attachTo: document.body,
    })

    // Submit empty -> should not emit
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('submit')).toBeUndefined()

    // Custom error should be visible for name
    const nameErr = wrapper.find('#name-error')
    expect(nameErr.exists()).toBe(true)
    expect(nameErr.text()).toBe('Name is required')

    // Inputs should have a white background style
    const nameInput = wrapper.find('input#name')
    expect(nameInput.attributes('style') || '').toContain('background: rgb(255, 255, 255)')

    // Fill values
    const name = wrapper.find('input#name')
    await name.setValue('Alice')
    const agree = wrapper.find('input#agree')
    await agree.setValue(true)
    const select = wrapper.find('select#plan')
    await select.setValue('pro')

    // Submit again -> should emit once
    await wrapper.find('form').trigger('submit.prevent')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ name: 'Alice', agree: true, plan: 'pro' })

    wrapper.unmount()
  })

  it('validates email format on submit', async () => {
    const emailSchema = {
      formTitle: 'Email Form',
      fields: [
        { id: 'email', type: 'email', label: 'Email', required: false },
      ],
    }
    const wrapper = mount(FormRenderer, {
      props: { schema: emailSchema as any },
      attachTo: document.body,
    })

    // Enter invalid email and submit -> should not emit
    const input = wrapper.find('input#email')
    await input.setValue('foo@bar')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('submit')).toBeUndefined()

    // Fix to a valid email -> submit should emit
    await input.setValue('foo@bar.com')
    await wrapper.find('form').trigger('submit.prevent')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ email: 'foo@bar.com' })

    wrapper.unmount()
  })

  it('excludes heading and divider from submit payload', async () => {
    const schemaWithDisplay = {
      formTitle: 'Display-only fields excluded',
      fields: [
        { id: 'h1', type: 'heading', label: 'Section', required: false, heading: { text: 'Section', level: 2 } },
        { id: 'div1', type: 'divider', label: '---', required: false },
        { id: 'username', type: 'text', label: 'Username', required: true, validation: { requiredMessage: 'Username is required' } },
      ],
    }

    const wrapper = mount(FormRenderer, {
      props: { schema: schemaWithDisplay as any },
      attachTo: document.body,
    })

    // Try submit empty -> blocked
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('submit')).toBeUndefined()

    // Fill username and submit
    const username = wrapper.find('input#username')
    await username.setValue('john')
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as Record<string, unknown>
    expect(payload).toMatchObject({ username: 'john' })
    // Should not have heading or divider keys
    expect(Object.keys(payload)).not.toContain('h1')
    expect(Object.keys(payload)).not.toContain('div1')

    wrapper.unmount()
  })
})

describe('FormRenderer group field', () => {
  it('renders children when group has no condition', async () => {
    const schemaNoCond = {
      formTitle: 'Group no condition',
      fields: [
        {
          id: 'g1',
          type: 'group',
          label: 'Group A',
          required: false,
          children: [
            { id: 'c1', type: 'text', label: 'Child 1', required: false },
            { id: 'c2', type: 'text', label: 'Child 2', required: false },
          ],
        },
      ],
    } as any

    const wrapper = mount(FormRenderer, { props: { schema: schemaNoCond }, attachTo: document.body })
    // Should render two child text inputs
    const inputs = wrapper.findAll('input[type="text"]')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  it('toggles visibility based on condition and updates live', async () => {
    const schemaCond = {
      formTitle: 'Group condition',
      fields: [
        { id: 'age', type: 'number', label: 'Age', required: false },
        {
          id: 'g1',
          type: 'group',
          label: 'Adult details',
          required: false,
          condition: { whenField: 'age', operator: 'greaterOrEqual', value: 18 },
          children: [
            { id: 'license', type: 'text', label: 'Driver License', required: false },
          ],
        },
      ],
    } as any

    const wrapper = mount(FormRenderer, { props: { schema: schemaCond }, attachTo: document.body })

    // Initially, age is empty -> group hidden
    expect(wrapper.text()).not.toContain('Adult details')

    // Set age to 18 -> group shows
    const age = wrapper.find('input#age')
    await age.setValue('18')
    await age.trigger('input')
    expect(wrapper.text()).toContain('Adult details')
    expect(wrapper.find('input#license').exists()).toBe(true)

    // Lower age to 17 -> group hides
    await age.setValue('17')
    await age.trigger('input')
    expect(wrapper.text()).not.toContain('Adult details')

    wrapper.unmount()
  })
})
