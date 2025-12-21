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
          // Tách Ant Design thành các chunks nhỏ hơn
          // Ant Design rất lớn, tách thành các phần chính
          'antd-core': ['antd/es/locale', 'antd/es/config-provider'],
          'antd-components': [
            'antd/es/button',
            'antd/es/input',
            'antd/es/form',
            'antd/es/table',
            'antd/es/modal',
            'antd/es/select',
            'antd/es/date-picker',
            'antd/es/tabs',
            'antd/es/card',
            'antd/es/spin',
            'antd/es/tag',
            'antd/es/dropdown',
            'antd/es/switch',
            'antd/es/pagination',
            'antd/es/auto-complete',
            'antd/es/upload',
            'antd/es/message',
            'antd/es/notification',
          ],
          'antd-other': ['antd'],
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
    // Tăng chunk size warning limit
    // Ant Design là library rất lớn, khó tách nhỏ hơn nữa
    chunkSizeWarningLimit: 800,
  },
})
