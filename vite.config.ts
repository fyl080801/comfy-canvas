import { fileURLToPath, URL } from 'node:url'

import { defineConfig, ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const createProxy = ({ target, rewrite }: { target: string, rewrite: string }): string | ProxyOptions => {

  return {
    target,
    changeOrigin: true,
    rewrite: (p) => {
      const newPath = p.replace(new RegExp(`^\/${rewrite}`), '')
      console.log(`[Proxy] ${p} → ${target}${newPath}`)
      return newPath
    },
    configure: (proxy,) => {
      proxy.on('proxyReq', (proxyReq, req, res) => {
        console.log(`[Proxy Request] ${req.method} ${req.url} → ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`)
      })
      proxy.on('proxyRes', (proxyRes, req, res) => {
        console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url} ← ${proxyRes.headers.server || 'unknown'}`)
      })
      proxy.on('error', (err, req, res) => {
        console.error(`[Proxy Error] ${req.method} ${req.url}:`, err.message)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/aliyun': createProxy({
        target: 'https://dashscope.aliyuncs.com',
        rewrite: 'aliyun'
      }),
      '/s3': createProxy({
        target: 'https://s3.fyl080801.uk',
        rewrite: 's3'
      }),
    }
  },
})
