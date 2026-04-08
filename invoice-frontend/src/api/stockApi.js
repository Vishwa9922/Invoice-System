import axiosInstance from './axiosInstance';

export const getStockMovementsApi = (productId, page = 0, size = 10, type = '', from = '', to = '') =>
  axiosInstance.get(`/api/stock/movements?productId=${productId}&page=${page}&size=${size}${type ? `&type=${type}` : ''}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`);

export const getStockGraphApi = (productId, from = '', to = '') =>
  axiosInstance.get(`/api/stock/movements/${productId}/graph${from ? `?from=${from}` : ''}${to ? `${from ? '&' : '?'}to=${to}` : ''}`);

export const adjustStockApi = (data) =>
  axiosInstance.post('/api/stock/adjust', data);

export const getStockSummaryApi = () =>
  axiosInstance.get('/api/stock/summary');

export const getExpiringProductsApi = (days = 30) =>
  axiosInstance.get(`/api/expiry/expiring?days=${days}`);

export const getExpiredProductsApi = () =>
  axiosInstance.get('/api/expiry/expired');

export const getExpiryAlertsApi = () =>
  axiosInstance.get('/api/expiry/alerts');