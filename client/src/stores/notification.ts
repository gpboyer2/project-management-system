import { defineStore } from 'pinia';

/**
 *
 * 通知消息状态管理
 *
 */
export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Array<{
      id: string
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message?: string
      duration?: number
      timestamp: number
    }>,
  }),

  actions: {
    /**
     * 添加通知消息
     */
    addNotification(notification: {
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message?: string
      duration?: number
    }) {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification = {
        ...notification,
        id,
        timestamp: Date.now(),
      };

      this.notifications.push(newNotification);

      // 自动移除
      if (notification.duration !== 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, notification.duration || 3000);
      }

      return id;
    },

    /**
     * 移除通知消息
     */
    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    },

    /**
     * 清空所有通知
     */
    clearAll() {
      this.notifications = [];
    },

    /**
     * 添加成功通知
     */
    success(title: string, message?: string, duration?: number) {
      return this.addNotification({ type: 'success', title, message, duration });
    },

    /**
     * 添加错误通知
     */
    error(title: string, message?: string, duration?: number) {
      return this.addNotification({ type: 'error', title, message, duration });
    },

    /**
     * 添加警告通知
     */
    warning(title: string, message?: string, duration?: number) {
      return this.addNotification({ type: 'warning', title, message, duration });
    },

    /**
     * 添加信息通知
     */
    info(title: string, message?: string, duration?: number) {
      return this.addNotification({ type: 'info', title, message, duration });
    },
  },

  persist: {
    key: 'notification-store',
  }
});