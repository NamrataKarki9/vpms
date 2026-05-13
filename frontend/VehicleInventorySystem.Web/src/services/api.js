export const API_BASE_URL = 'http://localhost:5169/api';
const STORAGE_KEY = 'vis_user';

export const getStoredUser = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveStoredUser = (user) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { headers: customHeaders, ...fetchOptions } = options;
  const storedUser = getStoredUser();
  const token = storedUser?.token;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `API Error: ${response.status}`;

    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson?.message) {
        errorMessage = errorJson.message;
      } else if (errorJson?.title) {
        errorMessage = errorJson.title;
      }

      if (errorJson?.errors) {
        const errorDetails = Object.values(errorJson.errors)
          .flat()
          .filter(Boolean)
          .join(' ');
        if (errorDetails) {
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
      }
    } catch {
      errorMessage = errorBody || errorMessage;
    }

    if (response.status === 401) {
      clearStoredUser();
      window.dispatchEvent(new CustomEvent('vis:unauthorized', { detail: { message: errorMessage } }));
    } else if (response.status === 403) {
      window.dispatchEvent(new CustomEvent('vis:forbidden', { detail: { message: 'You are not authorized to access this resource.' } }));
    }

    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return null;
};

export const authApi = {
  login: async (email, password) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  registerCustomer: async (data) => {
    return apiFetch('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  forgotPassword: async (emailAddress) => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ emailAddress })
    });
  },

  verifyOtp: async (emailAddress, otp) => {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ emailAddress, otp })
    });
  },

  resetPassword: async (emailAddress, otp, newPassword, confirmPassword) => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ emailAddress, otp, newPassword, confirmPassword })
    });
  },

  getStaff: async () => {
    return apiFetch('/users/staff');
  },

  getAllUsers: async () => {
    return apiFetch('/users');
  },

  createStaff: async (data) => {
    return apiFetch('/users/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateUser: async (id, data) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  toggleUserStatus: async (id) => {
    return apiFetch(`/users/${id}/status`, {
      method: 'PATCH'
    });
  }
};

export const transactionsApi = {
  getSales: async () => {
    return apiFetch('/Transactions/sales');
  },
  getRecent: async () => {
    return apiFetch('/Transactions/recent');
  }
};
