import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
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
  app.mount('#app')
}

bootstrap()
