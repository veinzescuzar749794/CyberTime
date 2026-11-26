import { apiRequest } from './client.js';

export const getProfile = async () => (await apiRequest('/api/profile')).profile;
export const saveProfile = async (profile) => (await apiRequest('/api/profile', { method:'PUT', body:JSON.stringify(profile) })).profile;
export const updatePassword = (currentPassword,newPassword,confirmPassword) => apiRequest('/api/profile/password', { method:'PUT', body:JSON.stringify({currentPassword,newPassword,confirmPassword}) });
