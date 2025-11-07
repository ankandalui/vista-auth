import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client/index': 'src/client/index.ts',
    'server/index': 'src/server/index.ts',
    'middleware/index': 'src/middleware/index.ts',
    'guards/index': 'src/guards/index.tsx',
    'ui/index': 'src/ui/index.ts',
    'database/index': 'src/database/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});
