import api from './axios.js';

export const authApi = {
  login: (realm, phone, password) =>
    api.post(`/auth/${realm}/login`, { phone, password }, { authRealm: realm }),
  changePassword: (realm, currentPassword, newPassword) =>
    api.post(
      '/auth/change-password',
      { currentPassword, newPassword },
      { authRealm: realm }
    ),
  me: (realm) => api.get('/auth/me', { authRealm: realm }),
};

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin', { authRealm: 'admin' }),
  employee: () => api.get('/dashboard/employee', { authRealm: 'employee' }),
};

export const employeesApi = {
  list: (active) =>
    api.get('/employees', {
      params: active !== undefined ? { active } : {},
      authRealm: 'admin',
    }),
  create: (data) => api.post('/employees', data, { authRealm: 'admin' }),
  update: (id, data) => api.patch(`/employees/${id}`, data, { authRealm: 'admin' }),
};

export const settingsApi = {
  get: () => api.get('/settings', { authRealm: getSettingsRealm() }),
  update: (data) => api.put('/settings', data, { authRealm: 'admin' }),
};

function getSettingsRealm() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/employee')) {
    return 'employee';
  }
  return 'admin';
}

export const productionsApi = {
  create: (data) => api.post('/productions', data, { authRealm: 'employee' }),
  update: (id, data) => api.patch(`/productions/${id}`, data),
  delete: (id) => api.delete(`/productions/${id}`, { authRealm: 'admin' }),
  mine: (params) => api.get('/productions/me', { params, authRealm: 'employee' }),
  list: (params) => api.get('/productions', { params, authRealm: 'admin' }),
  pending: () => api.get('/productions/pending', { authRealm: 'admin' }),
  approve: (id) => api.patch(`/productions/${id}/approve`, {}, { authRealm: 'admin' }),
  reject: (id, rejectionReason) =>
    api.patch(`/productions/${id}/reject`, { rejectionReason }, { authRealm: 'admin' }),
  myEarnings: (params) => api.get('/productions/me/earnings', { params, authRealm: 'employee' }),
};

export const reportsApi = {
  production: (params) => api.get('/reports/production', { params, authRealm: 'admin' }),
};

export const payrollApi = {
  generate: (month, year) => api.post('/payroll/generate', { month, year }, { authRealm: 'admin' }),
  list: (params) => api.get('/payroll', { params, authRealm: 'admin' }),
  markPaid: (id, data) => api.patch(`/payroll/${id}`, data, { authRealm: 'admin' }),
};
