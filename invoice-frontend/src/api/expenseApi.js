import axiosInstance from './axiosInstance';

export const getExpensesApi = (page = 0, size = 10, category = '', from = '', to = '') =>
  axiosInstance.get(`/api/expenses?page=${page}&size=${size}${category ? `&category=${category}` : ''}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`);

export const getExpenseByIdApi = (id) =>
  axiosInstance.get(`/api/expenses/${id}`);

export const createExpenseApi = (data) =>
  axiosInstance.post('/api/expenses', data);

export const updateExpenseApi = (id, data) =>
  axiosInstance.put(`/api/expenses/${id}`, data);

export const deleteExpenseApi = (id) =>
  axiosInstance.delete(`/api/expenses/${id}`);