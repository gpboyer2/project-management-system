import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { validateRequiredEnv } from './src/utils/validate-env';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量（从项目根目录）
  const env = loadEnv(mode, resolve(__dirname, '..'));

  // 校验必需的环境变量
  validateRequiredEnv(env, [
    'VITE_API_PORT',
    'VITE_API_HOST',
    'VITE_FRONTEND_PORT',
    'VITE_WS_PORT',
    'VITE_WS_HOST',
  ], '.env', 'Vite 配置');

  return {
  // 从项目根目录读取 .env 文件
  envDir: resolve(__dirname, '..'),
  // 开发环境跳过登录校验（测试用）
  define: {
    'import.meta.env.VITE_SKIP_AUTH': JSON.stringify(process.env.NODE_ENV === 'development')
  },
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // @logicflow/core 和 @logicflow/extension 需要预构建
    // 因为它们包含复杂的模块依赖关系
    include: ['@logicflow/core', '@logicflow/extension'],

    // 排除 CSS 文件，因为：
    // 1. CSS 不是 JavaScript 模块
    // 2. Vite 有专门的 CSS 处理机制
    // 3. 避免 Vite 尝试解析 CSS 导致 'url' 属性错误
    exclude: ['@logicflow/core/dist/style/index.css']
  },
  server: {
    port: parseInt(env.VITE_FRONTEND_PORT, 10),
    strictPort: true,
    open: true,
    cors: true,
    hmr: {
      port: parseInt(env.VITE_FRONTEND_PORT, 10)
    },
    proxy: {
      '/api': {
        target: `http://${env.VITE_API_HOST}:${env.VITE_API_PORT}`,
        changeOrigin: true
      },
      // WebSocket 代理（前端日志上报）
      '/socket.io': {
        target: `ws://${env.VITE_WS_HOST}:${env.VITE_WS_PORT}`,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: (id) => {
          // node_modules 包处理
          if (id.includes('node_modules')) {
            // 核心框架（最稳定）
            if (id.includes('vue') && !id.includes('element-plus') && !id.includes('draggable')) {
              return 'vendor-core';
            }
            if (id.includes('pinia')) {
              return 'vendor-core';
            }
            if (id.includes('vue-router')) {
              return 'vendor-core';
            }

            // UI 组件库（独立升级）
            if (id.includes('element-plus')) {
              return 'vendor-ui';
            }

            // 工具库（小而稳定）
            if (id.includes('dayjs') || id.includes('axios') || id.includes('highlight.js') || id.includes('mockjs')) {
              return 'vendor-utils';
            }

            // 可视化网络（按需加载）
            if (id.includes('vis-')) {
              return 'vendor-vis';
            }

            // 流程图（按需加载）
            if (id.includes('@logicflow')) {
              return 'vendor-logicflow';
            }

            // 其他组件
            if (id.includes('vue-draggable-plus')) {
              return 'vendor-draggable';
            }

            // 其他第三方库
            return 'vendor';
          }
        }
      }
    }
  },
  esbuild: {
    sourcemap: true
  }
  };
});