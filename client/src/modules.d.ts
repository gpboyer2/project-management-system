/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
// Vue文件模块声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, any>;
  export default component;
}

// 具体组件模块声明
declare module '@/components/base/base-button/index.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<any, any, any>;
  export default component;
}

declare module '@/components/base/base-table/index.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<any, any, any>;
  export default component;
}

declare module '@/components/base/base-modal/index.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<any, any, any>;
  export default component;
}

// 通用base组件声明
declare module '@/components/base/*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<any, any, any>;
  export default component;
}