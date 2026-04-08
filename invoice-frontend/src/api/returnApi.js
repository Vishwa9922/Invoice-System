import axiosInstance from './axiosInstance';

export const getReturnsApi = (page = 0, size = 10, status = '', from = '', to = '') =>
  axiosInstance.get(`/api/returns?page=${page}&size=${size}${status ? `&status=${status}` : ''}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`);

export const getReturnByIdApi = (id) =>
  axiosInstance.get(`/api/returns/${id}`);

export const createReturnApi = (data) =>
  axiosInstance.post('/api/returns', data);

export const approveReturnApi = (id) =>
  axiosInstance.put(`/api/returns/${id}/approve`);

export const rejectReturnApi = (id) =>
  axiosInstance.put(`/api/returns/${id}/reject`);