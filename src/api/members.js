import { apiRequest } from '../api/client.js';

export const listMembers = async () => (await apiRequest('/api/users')).users;
export const createMember = (payload) => apiRequest('/api/users', {
  method: 'POST', body: JSON.stringify(payload),
});
export const addCashTopUp = (memberId, amount) => apiRequest(`/api/users/${memberId}/topups`, {
  method: 'POST', body: JSON.stringify({ amount }),
});
