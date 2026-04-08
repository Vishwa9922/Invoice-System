import axiosInstance from './axiosInstance';

export const getSuppliersApi = (page = 0, size = 10, search = '') =>
  axiosInstance.get(`/api/suppliers?page=${page}&size=${size}${search ? `&search=${search}` : ''}`);

export const getSupplierByIdApi = (id) =>
  axiosInstance.get(`/api/suppliers/${id}`);

export const createSupplierApi = (data) =>
  axiosInstance.post('/api/suppliers', data);

export const updateSupplierApi = (id, data) =>
  axiosInstance.put(`/api/suppliers/${id}`, data);

export const deleteSupplierApi = (id) =>
  axiosInstance.delete(`/api/suppliers/${id}`);