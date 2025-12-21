import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    sourcemap: false, // Tắt source map ở production
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách Firebase thành chunk riêng (thư viện lớn)
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          // Tách React và React DOM
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Tách Ant Design (UI library lớn)
          'antd-vendor': ['antd'],
          // Tách Redux
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          // Tách các icon libraries
          'icons-vendor': ['@ant-design/icons', 'react-icons'],
        },
        // Tối ưu chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Tăng chunk size warning limit (vì đã tách chunks)
    chunkSizeWarningLimit: 600,
  },
})
