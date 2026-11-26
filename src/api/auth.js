import { apiRequest } from './client.js';

export const getCurrentUser = () => apiRequest('/api/auth/me');
export const signIn = (identifier, password) => apiRequest('/api/auth/login', { method:'POST', body:JSON.stringify({identifier,password}) });
export const signUp = (username, studentId, email, password) => apiRequest('/api/auth/register', { method:'POST', body:JSON.stringify({username,studentId,email,password}) });
export const requestPasswordReset = (email) => apiRequest('/api/auth/forgot-password', { method:'POST', body:JSON.stringify({email}) });
export const submitPasswordReset = (token, password, confirmPassword) => apiRequest('/api/auth/reset-password', { method:'POST', body:JSON.stringify({token,password,confirmPassword}) });
export const signOut = () => apiRequest('/api/auth/logout', { method:'POST' });
