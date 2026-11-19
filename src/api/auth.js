import { apiRequest } from '../api/client.js';

export const getCurrentUser = () => apiRequest('/api/auth/me');
export const signIn = (identifier, password) => apiRequest('/api/auth/login', {
  method: 'POST', body: JSON.stringify({ identifier, password }),
});
export const signUp = (username, studentId, password) => apiRequest('/api/auth/register', {
  method: 'POST', body: JSON.stringify({ username, studentId, password }),
});
export const signOut = () => apiRequest('/api/auth/logout', { method: 'POST' });
