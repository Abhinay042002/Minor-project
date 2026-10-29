import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Netlify serves this single-page app from the domain root.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
