import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import path from 'node:path'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VantResolver()] })],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/vant-theme.less";`,
        javascriptEnabled: true
      }
    }
  },
  server: { port: 5173, host: '127.0.0.1' }
})
