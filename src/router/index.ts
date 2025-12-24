import { createRouter, createWebHistory } from 'vue-router'

const BuilderPage = () => import('../views/BuilderPage.vue')
const RendererDemo = () => import('../views/RendererDemo.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'builder', component: BuilderPage },
    { path: '/renderer', name: 'renderer', component: RendererDemo },
  ],
})

export default router
