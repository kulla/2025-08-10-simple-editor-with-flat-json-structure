import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  html: {
    title: 'Simple Editor with Flat JSON Structure',
  },
  output: {
    assetPrefix: '/2025-08-10-simple-editor-with-flat-json-structure/',
  },
  plugins: [pluginReact()],
})
