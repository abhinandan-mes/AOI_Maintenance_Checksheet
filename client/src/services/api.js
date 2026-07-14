import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000
});

export const authStorage = {
  getToken: () => localStorage.getItem('aoi_auth_token'),
  setToken: (token) => localStorage.setItem('aoi_auth_token', token),
  clearToken: () => localStorage.removeItem('aoi_auth_token')
};

API.interceptors.request.use(config => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // A 401 on the login endpoint means wrong credentials — not an expired session.
    // Only fire the global session-expiry event for all other authenticated routes.
    if (error.response?.status === 401 && !isLoginRequest) {
      authStorage.clearToken();
      window.dispatchEvent(new Event('aoi-auth-expired'));
    }

    const serverMessage = error.response?.data?.error;
    if (serverMessage) error.message = serverMessage;
    else if (!error.response) error.message = 'Cannot reach the server. Check that the backend is running.';
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth APIs
  login: (credentials) => API.post('/auth/login', credentials),
  logout: () => API.post('/auth/logout'),
  createUser: (payload) => API.post('/auth/create-user', payload),
  getCurrentUser: () => API.get('/auth/me'),
  getAllUsers: () => API.get('/auth/users'),
  getActiveAssignees: () => API.get('/auth/active-assignees'),
  updateUser: (id, payload) => API.put(`/auth/users/${id}`, payload),
  deleteUser: (id) => API.delete(`/auth/users/${id}`),
  getMySessions: () => API.get('/auth/sessions/me'),
  getAllSessionsSummary: () => API.get('/auth/sessions/all'),
  revokeSession: (sessionId) => API.post(`/auth/sessions/${sessionId}/revoke`),
  changePassword: (payload) => API.post('/auth/change-password', payload),
  getFailedLogins: () => API.get('/auth/failed-logins'),
  getSystemEvents: () => API.get('/auth/system-events'),

  // Maintenance Record APIs
  submitMaintenanceRecord: (data) => API.post('/maintenance', data),
  getAllMaintenanceRecords: (params) => API.get('/maintenance', { params }),
  getMaintenanceRecordById: (id) => API.get(`/maintenance/${id}`),
  updateMaintenanceRecord: (id, data) => API.put(`/maintenance/${id}`, data),
  reviewMaintenanceRecord: (id, reviewedBy) => API.post(`/maintenance/${id}/review`, { reviewed_by: reviewedBy }),
  reviewWorkflowRecord: (id, action, remarks, designatedManagerId) => API.post(`/maintenance/${id}/review`, { action, remarks, designated_manager_id: designatedManagerId }),
  reassignRecord: (id, username) => API.post(`/maintenance/${id}/reassign`, { username }),
  deleteMaintenanceRecord: (id) => API.delete(`/maintenance/${id}`),
  batchReviewRecords: (payload) => API.post('/maintenance/batch-review', payload),
  batchReassignRecords: (payload) => API.post('/maintenance/batch-reassign', payload),
  batchDeleteRecords: (payload) => API.post('/maintenance/batch-delete', payload)
};

export default apiService;
