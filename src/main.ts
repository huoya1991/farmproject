import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/tokens.css'
import './styles/base.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    const { startMockWorker } = await import('./mock/browser')
    await startMockWorker()
  }
  createApp(App).mount('#app')
}

bootstrap()
