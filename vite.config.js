import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This repository is published at https://<owner>.github.io/Minor-project/.
export default defineConfig({
  plugins: [react()],
  base: '/Minor-project/',
});
