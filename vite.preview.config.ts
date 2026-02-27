import { mergeConfig } from 'vite'
import baseConfig from './vite.config.ts'

export default mergeConfig(baseConfig, {
  base: '/preview/',
  server: {
    hmr: {
      clientPort: 443,
      path: '/preview/',
    },
  },
})
