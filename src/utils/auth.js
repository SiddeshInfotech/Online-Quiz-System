export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_KEY = "user_data";

export const setToken = (token, refreshToken = null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem("access_token", token);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("access_token");
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("access_token");
};

export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("refresh_token");
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("refresh_token");
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY) || localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("user");
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_data");
  removeToken();
  removeRefreshToken();
  removeUser();
};

