import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/welcome'
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/components/WelcomeView.vue')
  },
  {
    path: '/main',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/main/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'documents',
        name: 'Documents',
        component: () => import('@/views/DocumentsView.vue')
      },
      {
        path: 'terminal',
        name: 'Terminal',
        component: () => import('@/views/TerminalView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
