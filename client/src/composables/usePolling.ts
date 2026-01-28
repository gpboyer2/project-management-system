/**
 * 轮询 composable
 * 封装 setInterval/setTimeout 轮询模式
 */
import { onUnmounted, ref } from 'vue';

export interface PollingOptions<T> {
  // 轮询间隔（毫秒）
  interval: number;
  // 立即执行第一次
  immediate?: boolean;
  // 停止条件（返回 true 时停止轮询）
  stopCondition?: (data: T) => boolean;
  // 轮询开始的回调
  onStart?: () => void;
  // 轮询结束的回调
  onStop?: () => void;
  // 每次成功的回调
  onSuccess?: (data: T) => void;
  // 每次失败的回调
  onError?: (error: any) => void;
  // 完成时的回调（满足停止条件）
  onComplete?: (data: T) => void;
}

export interface PollingState {
  is_polling: boolean;
  error: any;
  last_data: any;
}

/**
 * 创建轮询器
 */
export function usePolling<T = any>() {
  const is_polling = ref(false);
  const error = ref<any>(null);
  const last_data = ref<T | null>(null);

  let timer: ReturnType<typeof setInterval> | null = null;
  let aborted = false;

  /**
   * 开始轮询
   * @param fetchFn - 获取数据的函数
   * @param options - 轮询配置选项
   */
  function start(
    fetchFn: () => Promise<T>,
    options: PollingOptions<T>
  ) {
    const {
      interval,
      immediate = true,
      stopCondition,
      onStart,
      onSuccess,
      onError,
      onComplete
    } = options;

    // 清除之前的轮询
    stop();

    aborted = false;
    is_polling.value = true;
    error.value = null;

    if (onStart) {
      onStart();
    }

    async function tick() {
      if (aborted) return;

      try {
        const data = await fetchFn();
        last_data.value = data;
        error.value = null;

        if (onSuccess) {
          onSuccess(data);
        }

        // 检查停止条件
        if (stopCondition?.(data)) {
          stop();
          if (onComplete) {
            onComplete(data);
          }
          return;
        }

        // 继续轮询
        if (!aborted) {
          timer = setTimeout(tick, interval);
        }
      } catch (err) {
        error.value = err;
        if (onError) {
          onError(err);
        }

        // 失败后是否继续轮询
        if (!aborted) {
          timer = setTimeout(tick, interval);
        }
      }
    }

    // 立即执行第一次
    if (immediate) {
      tick();
    } else {
      timer = setTimeout(tick, interval);
    }
  }

  /**
   * 停止轮询
   */
  function stop() {
    aborted = true;
    is_polling.value = false;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /**
   * 重启轮询
   * @param fetchFn - 获取数据的函数
   * @param options - 轮询配置选项
   */
  function restart(fetchFn: () => Promise<T>, options: PollingOptions<T>) {
    stop();
    start(fetchFn, options);
  }

  // 组件卸载时自动停止
  onUnmounted(() => {
    stop();
  });

  return {
    is_polling,
    error,
    last_data,
    start,
    stop,
    restart
  };
}

/**
 * 轮询工具函数（无响应式）
 */
export class Poller<T = any> {
  private timer: ReturnType<typeof setInterval> | null = null;
  private aborted = false;
  private is_running = false;

  constructor(
    private fetchFn: () => Promise<T>,
    private options: PollingOptions<T>
  ) {}

  /**
   * 启动轮询
   */
  start(): void {
    if (this.is_running) return;

    this.aborted = false;
    this.is_running = true;

    const { interval, immediate = true, stopCondition, onSuccess, onError, onComplete, onStart } = this.options;

    if (onStart) {
      onStart();
    }

    const tick = async () => {
      if (this.aborted) return;

      try {
        const data = await this.fetchFn();

        if (onSuccess) {
          onSuccess(data);
        }

        // 检查停止条件
        if (stopCondition?.(data)) {
          this.stop();
          if (onComplete) {
            onComplete(data);
          }
          return;
        }

        // 继续轮询
        if (!this.aborted) {
          this.timer = setTimeout(tick, interval);
        }
      } catch (err) {
        if (onError) {
          onError(err);
        }

        // 失败后继续轮询
        if (!this.aborted) {
          this.timer = setTimeout(tick, interval);
        }
      }
    };

    // 立即执行第一次
    if (immediate) {
      tick();
    } else {
      this.timer = setTimeout(tick, interval);
    }
  }

  /**
   * 停止轮询
   */
  stop(): void {
    this.aborted = true;
    this.is_running = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const { onStop } = this.options;
    if (onStop) {
      onStop();
    }
  }

  /**
   * 重启轮询
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * 更新轮询间隔
   * @param interval - 新的轮询间隔（毫秒）
   */
  updateInterval(interval: number): void {
    this.options.interval = interval;
    if (this.is_running) {
      this.restart();
    }
  }

  /**
   * 是否正在轮询
   * @returns 是否正在轮询
   */
  isActive(): boolean {
    return this.is_running;
  }
}

/**
 * 创建轮询器实例
 * @param fetchFn - 获取数据的函数
 * @param options - 轮询配置选项
 * @returns 轮询器实例
 */
export function createPoller<T>(
  fetchFn: () => Promise<T>,
  options: PollingOptions<T>
): Poller<T> {
  return new Poller(fetchFn, options);
}
