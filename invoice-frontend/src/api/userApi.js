import axiosInstance from './axiosInstance';

export const getUsersApi = () =>
  axiosInstance.get('/api/users');

export const updateUserRoleApi = (id, role) =>
  axiosInstance.put(`/api/users/${id}/role?role=${role}`);

export const deactivateUserApi = (id) =>
  axiosInstance.delete(`/api/users/${id}`);