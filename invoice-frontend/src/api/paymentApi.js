import axiosInstance from './axiosInstance';

export const recordPaymentApi = (data) =>
  axiosInstance.post('/api/payments', data);

export const getPaymentsByInvoiceApi = (invoiceId) =>
  axiosInstance.get(`/api/payments?invoiceId=${invoiceId}`);

export const getPendingDuesApi = () =>
  axiosInstance.get('/api/payments/pending');

export const getWhatsAppReminderApi = (invoiceId) =>
  axiosInstance.get(`/api/payments/reminder/${invoiceId}`);