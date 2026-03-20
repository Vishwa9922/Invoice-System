import axiosInstance from './axiosInstance';

export const getInvoicesApi = (page = 0, size = 10) =>
  axiosInstance.get(`/api/invoices?page=${page}&size=${size}`);

export const getInvoiceByIdApi = (id) =>
  axiosInstance.get(`/api/invoices/${id}`);

export const getInvoiceByNumberApi = (number) =>
  axiosInstance.get(`/api/invoices/number/${number}`);

export const getInvoicesByCustomerApi = (customerId, page = 0, size = 10) =>
  axiosInstance.get(`/api/invoices/customer/${customerId}?page=${page}&size=${size}`);

export const filterInvoicesApi = (from, to, page = 0, size = 10) =>
  axiosInstance.get(`/api/invoices/filter?from=${from}&to=${to}&page=${page}&size=${size}`);

export const cancelInvoiceApi = (id) =>
  axiosInstance.patch(`/api/invoices/${id}/cancel`);

export const downloadInvoicePdfApi = (id) =>
  axiosInstance.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });