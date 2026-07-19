import api from './api';

export const notificationService = {
  markAsRead: async (notificationId) => {
    const { data } = await api.post('notifications/mark-as-read/', {
      notification_id: notificationId,
    });
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.post('notifications/mark-as-read/', {
      mark_all: true,
    });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get('notifications/unread-count/');
    return data;
  },
};

export default notificationService;
