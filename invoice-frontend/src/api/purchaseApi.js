import axiosInstance from './axiosInstance';

export const getPurchasesApi = (page = 0, size = 10, supplierId = '', from = '', to = '') =>
  axiosInstance.get(`/api/purchases?page=${page}&size=${size}${supplierId ? `&supplierId=${supplierId}` : ''}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`);

export const getPurchaseByIdApi = (id) =>
  axiosInstance.get(`/api/purchases/${id}`);

export const createPurchaseApi = (data) =>
  axiosInstance.post('/api/purchases', data);

export const cancelPurchaseApi = (id) =>
  axiosInstance.patch(`/api/purchases/${id}/cancel`);