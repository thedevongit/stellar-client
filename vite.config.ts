import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePluginRadar } from 'vite-plugin-radar'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'


const env = loadEnv('', process.cwd(), '');

// https://vitejs.dev/config/
export default defineConfig({

  // optimizeDeps: {
  //   esbuildOptions: {
  //     // Enable esbuild polyfill plugins
  //     plugins: [
  //       NodeGlobalsPolyfillPlugin({
  //         buffer: true,
  //         process: true,
  //       }),
  //       NodeModulesPolyfillPlugin(),
  //     ]
  //   }
  // },
  plugins: [react(),
  // NodeGlobalsPolyfillPlugin({
  //   buffer: true
  // }),
  VitePluginRadar({
    // Google Analytics tag injection
    analytics: {
      id: '',
    },
  })],
  server: {
    host: true
  },
  define: {
    'process.env': env,
  },

  build: {
    outDir: 'build',
    manifest: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
