import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/therapie' },
    {
      path: '/connexion',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/inscription',
      name: 'signup',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/oauth/consent',
      name: 'oauth-consent',
      component: () => import('@/views/OAuthConsentView.vue'),
      meta: { bare: true },
    },
    {
      path: '/therapie',
      name: 'therapy',
      component: () => import('@/views/TherapyView.vue'),
    },
    {
      path: '/therapie/avancees',
      name: 'progress',
      component: () => import('@/views/ProgressView.vue'),
    },
    {
      path: '/therapie/tuto',
      name: 'tutorial',
      component: () => import('@/views/TutorialView.vue'),
    },
    {
      path: '/therapie/seances/nouvelle',
      name: 'session-new',
      component: () => import('@/views/SessionFormView.vue'),
    },
    {
      path: '/therapie/seances/:id',
      name: 'session',
      component: () => import('@/views/SessionDetailView.vue'),
    },
    {
      path: '/therapie/seances/:id/modifier',
      name: 'session-edit',
      component: () => import('@/views/SessionFormView.vue'),
    },
    {
      path: '/relation',
      name: 'relation',
      component: () => import('@/views/RelationView.vue'),
    },
    {
      path: '/reglages',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && auth.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
