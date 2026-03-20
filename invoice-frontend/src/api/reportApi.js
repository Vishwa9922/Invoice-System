import axiosInstance from './axiosInstance';

export const getDashboardApi = () =>
  axiosInstance.get('/api/reports/dashboard');

export const getSalesReportApi = (from, to) =>
  axiosInstance.get(`/api/reports/sales?from=${from}&to=${to}`);

export const getProductSalesApi = (from, to) =>
  axiosInstance.get(`/api/reports/products?from=${from}&to=${to}`);

export const getCategorySalesApi = (from, to) =>
  axiosInstance.get(`/api/reports/categories?from=${from}&to=${to}`);

export const getTopProductsApi = (limit = 10) =>
  axiosInstance.get(`/api/reports/top-products?limit=${limit}`);

export const exportExcelApi = (from, to) =>
  axiosInstance.get(`/api/reports/export/excel?from=${from}&to=${to}`, {
    responseType: 'blob',
  });

export const exportCsvApi = (from, to) =>
  axiosInstance.get(`/api/reports/export/csv?from=${from}&to=${to}`, {
    responseType: 'blob',
  });