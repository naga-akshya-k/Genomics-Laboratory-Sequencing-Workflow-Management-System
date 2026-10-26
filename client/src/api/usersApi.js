import api from './client';

export const usersApi = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  toggleDeactivate: (id) => api.patch(`/users/${id}/deactivate`),
};

export default usersApi;
