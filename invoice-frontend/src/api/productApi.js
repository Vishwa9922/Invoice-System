import axiosInstance from './axiosInstance';

export const getProductsApi = (page = 0, size = 10) =>
  axiosInstance.get(`/api/products?page=${page}&size=${size}`);

export const searchProductsApi = (keyword, page = 0, size = 10) =>
  axiosInstance.get(`/api/products/search?keyword=${keyword}&page=${page}&size=${size}`);

export const getProductByIdApi = (id) =>
  axiosInstance.get(`/api/products/${id}`);

export const getProductByBarcodeApi = (barcode) =>
  axiosInstance.get(`/api/products/barcode/${barcode}`);

export const getProductsByCategoryApi = (categoryId) =>
  axiosInstance.get(`/api/products/category/${categoryId}`);

export const createProductApi = (data) =>
  axiosInstance.post('/api/products', data);

export const updateProductApi = (id, data) =>
  axiosInstance.put(`/api/products/${id}`, data);

export const deleteProductApi = (id) =>
  axiosInstance.delete(`/api/products/${id}`);