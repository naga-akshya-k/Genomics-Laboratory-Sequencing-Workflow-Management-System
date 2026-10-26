import client from './client';

export const notificationsApi = {
  getMyNotifications: () => client.get('/notifications'),
  markAsRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllAsRead: () => client.patch('/notifications/read-all'),
};

export default notificationsApi;
