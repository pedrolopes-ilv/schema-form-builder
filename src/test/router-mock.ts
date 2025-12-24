// Minimal vue-router mock for tests
import { defineComponent, h } from 'vue'

export const RouterLink = defineComponent({
  name: 'RouterLink',
  props: { to: { type: [String, Object], required: false } },
  setup(_, { slots }) {
    return () => h('a', {}, slots.default ? slots.default() : [])
  },
})

export const RouterView = defineComponent({
  name: 'RouterView',
  setup() {
    return () => h('div')
  },
})

export function createRouter() {
  return {
    install() {
      /* noop */
    },
  }
}

export function createWebHistory() {
  return {}
}

export default {
  createRouter,
  createWebHistory,
  RouterLink,
  RouterView,
}
