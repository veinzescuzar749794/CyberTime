import { apiRequest } from './client.js';

export const listStations = async () => (await apiRequest('/api/stations')).stations;
export const registerStation = (pcName,ipAddress) => apiRequest('/api/stations',{method:'POST',body:JSON.stringify({pcName,ipAddress})});
export const addStationCashTopUp = (pcId,amount) => apiRequest(`/api/stations/${pcId}/topups`,{method:'POST',body:JSON.stringify({amount})});
