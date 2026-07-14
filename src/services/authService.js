import api from "./api";

const authService = {
  // POST /auth/register/
  register: async (payload) => {
    const response = await api.post("/auth/register/", payload);
    return response;
  },

  // POST /auth/verify-email/
  verifyEmail: async (email, otp) => {
    const response = await api.post("/auth/verify-email/", { email, otp });
    return response.data;
  },

  // POST /auth/login/
  login: async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    return response.data;
  },

  // GET /auth/profile/
  getProfile: async () => {
    const response = await api.get("/auth/profile/");
    return response.data;
  },

  // POST /auth/forgot-password/
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password/", { email });
    return response.data;
  },

  // POST /auth/verify-otp/
  verifyOTP: async (email, otp) => {
    const response = await api.post("/auth/verify-otp/", { email, otp });
    return response.data;
  },

  // POST /auth/reset-password/
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post("/auth/reset-password/", {
      email,
      otp,
      new_password: newPassword,
    });
    return response.data;
  },

  // POST /auth/resend-otp/
  resendOTP: async (email, purpose) => {
    const response = await api.post("/auth/resend-otp/", { email, purpose });
    return response.data;
  },

  // POST /auth/google-login/
  googleLogin: async (id_token) => {
    const response = await api.post("/auth/google-login/", { id_token });
    return response.data;
  },
  // PUT /auth/profile/
  updateProfile: async (payload) => {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
    const response = await api.put("/auth/profile/", payload, config);
    return response.data;
  },

  // PATCH /auth/profile/
  updateSettings: async (payload) => {
    const response = await api.patch("/auth/profile/", payload);
    return response.data;
  },

  // POST /auth/change-password/
  changePassword: async (payload) => {
    const response = await api.post("/auth/change-password/", payload);
    return response.data;
  },

  // DELETE /auth/delete-account/
  deleteAccount: async () => {
    const response = await api.delete("/auth/delete-account/");
    return response.data;
  },
};

export default authService;
