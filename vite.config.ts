import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          'react-real-time-chat-app.onrender.com',
          '.onrender.com', // Allow all Render subdomains
          'localhost',
        ],
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@services': path.resolve(__dirname, 'src/services'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@types': path.resolve(__dirname, 'src/types'),
          '@config': path.resolve(__dirname, 'src/config'),
        }
      },
      build: {
        // Use terser for better compression than esbuild
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
          },
        },
        // Manual chunk splitting for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks
              'vendor-react': ['react', 'react-dom'],
              // Admin components chunk (lazy loaded)
              'admin': [
                './src/components/admin/AdminDashboard.tsx',
                './src/components/admin/ChatMonitor.tsx',
                './src/components/admin/AdminStats.tsx',
                './src/components/admin/EnhancedAdminStats.tsx',
                './src/components/admin/UserManagement.tsx',
                './src/components/admin/EnhancedUserManagement.tsx',
                './src/components/admin/ActivityLogComponent.tsx',
                './src/components/admin/SystemHealth.tsx',
              ],
            },
            // Optimize chunk naming for better caching
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
        // Optimize chunk size warnings
        chunkSizeWarningLimit: 1000,
        // Enable CSS code splitting
        cssCodeSplit: true,
      },
    };
});
