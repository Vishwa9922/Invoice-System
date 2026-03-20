import axiosInstance from './axiosInstance';

export const posCheckoutApi = (data) =>
  axiosInstance.post('/api/pos/checkout', data);