const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const TOKEN_STORAGE_KEY = 'ecobus_token';

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Chuẩn hóa đối tượng user từ Backend (snake_case) sang format Frontend (camelCase)
 */
export function normalizeUser(rawUser) {
  if (!rawUser) return null;
  return {
    id: rawUser.id,
    fullName: rawUser.full_name || rawUser.fullName || '',
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    avatarUrl: rawUser.avatar_url || rawUser.avatarUrl || null,
    role: rawUser.role_name || rawUser.role || 'CUSTOMER',
    membershipTier: rawUser.membership_tier || rawUser.membershipTier || 'BRONZE',
    loyaltyPoints: rawUser.loyalty_points ?? rawUser.loyaltyPoints ?? 0,
    driverProfile: rawUser.driver_profile || rawUser.driverProfile || null,
    createdAt: rawUser.created_at || null
  };
}

async function requestJson(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_GATEWAY_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Lỗi kết nối máy chủ (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function loginApi({ email, password }) {
  const data = await requestJson('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  if (data.token) {
    setToken(data.token);
  }
  return {
    token: data.token,
    user: normalizeUser(data.user),
    message: data.message
  };
}

export async function registerApi({ full_name, email, phone, password }) {
  const data = await requestJson('/api/auth/register', {
    method: 'POST',
    body: { full_name, email, phone, password }
  });
  if (data.token) {
    setToken(data.token);
  }
  return {
    token: data.token,
    user: normalizeUser(data.user),
    message: data.message
  };
}

export async function forgotPasswordApi(email) {
  return requestJson('/api/auth/forgot-password', {
    method: 'POST',
    body: { email }
  });
}

export async function getProfileApi() {
  const data = await requestJson('/api/users/profile', {
    method: 'GET',
    auth: true
  });
  return normalizeUser(data.data);
}

export async function updateProfileApi({ full_name, phone, avatar_url }) {
  return requestJson('/api/users/profile', {
    method: 'PUT',
    body: { full_name, phone, avatar_url },
    auth: true
  });
}

export async function changePasswordApi({ old_password, new_password }) {
  return requestJson('/api/users/change-password', {
    method: 'PUT',
    body: { old_password, new_password },
    auth: true
  });
}

export async function getLoyaltyHistoryApi() {
  return requestJson('/api/users/loyalty-history', {
    method: 'GET',
    auth: true
  });
}
