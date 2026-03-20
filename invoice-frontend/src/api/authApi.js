import axiosInstance from './axiosInstance';

export const loginApi = (data) =>
  axiosInstance.post('/api/auth/login', data);

export const registerApi = (data) =>
  axiosInstance.post('/api/auth/register', data);

export const registerAdminApi = (data) =>
  axiosInstance.post('/api/auth/register/admin', data);