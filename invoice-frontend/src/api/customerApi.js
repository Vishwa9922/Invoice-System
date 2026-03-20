import axiosInstance from './axiosInstance';

export const getCustomersApi = (page = 0, size = 10) =>
  axiosInstance.get(`/api/customers?page=${page}&size=${size}`);

export const searchCustomersApi = (keyword, page = 0, size = 10) =>
  axiosInstance.get(`/api/customers/search?keyword=${keyword}&page=${page}&size=${size}`);

export const getCustomerByMobileApi = (mobile) =>
  axiosInstance.get(`/api/customers/mobile/${mobile}`);

export const getCustomerByIdApi = (id) =>
  axiosInstance.get(`/api/customers/${id}`);

export const createCustomerApi = (data) =>
  axiosInstance.post('/api/customers', data);

export const updateCustomerApi = (id, data) =>
  axiosInstance.put(`/api/customers/${id}`, data);