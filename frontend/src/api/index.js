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

export const gramTypesApi = {
  list: () => api.get('/gram-types', { authRealm: getSettingsRealm() }),
  create: (name) => api.post('/gram-types', { name }, { authRealm: 'admin' }),
  update: (id, data) => api.patch(`/gram-types/${id}`, data, { authRealm: 'admin' }),
};

export const qualityTypesApi = {
  list: () => api.get('/quality-types', { authRealm: getSettingsRealm() }),
  create: (name) => api.post('/quality-types', { name }, { authRealm: 'admin' }),
  update: (id, data) => api.patch(`/quality-types/${id}`, data, { authRealm: 'admin' }),
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
  approve: (id, data) => api.patch(`/productions/${id}/approve`, data, { authRealm: 'admin' }),
  reject: (id, rejectionReason) =>
    api.patch(`/productions/${id}/reject`, { rejectionReason }, { authRealm: 'admin' }),
  myEarnings: (params) => api.get('/productions/me/earnings', { params, authRealm: 'employee' }),
};

export const reportsApi = {
  production: (params) => api.get('/reports/production', { params, authRealm: 'admin' }),
};

export const salaryLedgerApi = {
  listSummaries: (params) => api.get('/salary-ledger', { params, authRealm: 'admin' }),
  getEmployee: (employeeId, params) =>
    api.get(`/salary-ledger/employees/${employeeId}`, { params, authRealm: 'admin' }),
  addPayment: (employeeId, data) =>
    api.post(`/salary-ledger/employees/${employeeId}/payments`, data, { authRealm: 'admin' }),
  mine: (params) => api.get('/salary-ledger/me', { params, authRealm: 'employee' }),
};
