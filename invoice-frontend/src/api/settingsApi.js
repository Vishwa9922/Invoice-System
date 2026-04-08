import axiosInstance from './axiosInstance';

export const getSettingsApi = () =>
  axiosInstance.get('/api/settings');

export const updateSettingsApi = (data) =>
  axiosInstance.put('/api/settings', data);