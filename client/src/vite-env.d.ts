/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>;
  export default component;
}

// Vite 环境变量类型定义（从 .env 文件加载）
interface ImportMetaEnv {
  // Vite 默认环境变量
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;

  // 自定义环境变量（必须以 VITE_ 开头）
  readonly VITE_API_PORT: string;
  readonly VITE_API_HOST: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FRONTEND_PORT: string;
  readonly VITE_WS_PORT: string;
  readonly VITE_WS_HOST: string;
  readonly VITE_WS_URL: string;
  readonly VITE_SKIP_AUTH?: string;
}

// 运行时配置类型定义（由后端注入到 index.html）
interface RuntimeConfig {
  [key: string]: string;
  VITE_API_BASE_URL: string;
  VITE_WS_URL: string;
  VITE_API_HOST: string;
  VITE_API_PORT: string;
  VITE_WS_HOST: string;
  VITE_WS_PORT: string;
  VITE_FRONTEND_PORT: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

export {};