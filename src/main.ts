import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { apiClient } from './api/client'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    const { startMockWorker } = await import('./mock/browser')
    await startMockWorker()
  }
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)

  const { useAuthStore } = await import('./stores/auth')
  const auth = useAuthStore()
  const params = new URLSearchParams(location.search)
  await auth.bootstrap(params.get('ticket') ?? undefined)

  apiClient.on('auth-expired', () => { location.reload() })

  app.mount('#app')
}

bootstrap()
