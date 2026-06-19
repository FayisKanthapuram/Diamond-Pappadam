const PREFIX = { admin: 'admin', employee: 'employee', sales: 'sales' };

export function getAuthKeys(realm) {
  const p = PREFIX[realm] || realm;
  return {
    token: `${p}_token`,
    user: `${p}_user`,
    mustChangePassword: `${p}_mustChangePassword`,
  };
}

export function readStoredUser(realm) {
  try {
    const { user: userKey } = getAuthKeys(realm);
    const stored = localStorage.getItem(userKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function persistSession(realm, { token, user, mustChangePassword }, broadcast = false) {
  const keys = getAuthKeys(realm);
  if (token) localStorage.setItem(keys.token, token);
  else localStorage.removeItem(keys.token);

  if (user) localStorage.setItem(keys.user, JSON.stringify(user));
  else localStorage.removeItem(keys.user);

  localStorage.setItem(keys.mustChangePassword, String(!!mustChangePassword));
  if (broadcast) window.dispatchEvent(new CustomEvent('auth-changed', { detail: { realm } }));
}

export function clearSession(realm) {
  const keys = getAuthKeys(realm);
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.user);
  localStorage.removeItem(keys.mustChangePassword);
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { realm } }));
}

export function getRealmFromPath(pathname = window.location.pathname) {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/employee')) return 'employee';
  if (pathname.startsWith('/sales')) return 'sales';
  return null;
}

export function getLoginPath(realm) {
  if (realm === 'admin') return '/admin/login';
  if (realm === 'employee') return '/employee/login';
  if (realm === 'sales') return '/sales/login';
  return '/';
}
