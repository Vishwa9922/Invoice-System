import axiosInstance from './axiosInstance';

export const getCategoriesApi = (page = 0, size = 10) =>
  axiosInstance.get(`/api/categories?page=${page}&size=${size}`);

export const getActiveCategoriesApi = () =>
  axiosInstance.get('/api/categories/active');

export const getCategoryByIdApi = (id) =>
  axiosInstance.get(`/api/categories/${id}`);

export const createCategoryApi = (data) =>
  axiosInstance.post('/api/categories', data);

export const updateCategoryApi = (id, data) =>
  axiosInstance.put(`/api/categories/${id}`, data);

export const deleteCategoryApi = (id) =>
  axiosInstance.delete(`/api/categories/${id}`);