import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  dts: true,
  clean: true,
  target: 'es2020',
  format: ['esm'],
  sourcemap: true,
  minify: false
})
