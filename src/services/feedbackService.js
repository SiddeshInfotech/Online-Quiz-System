import api from "./api";

const feedbackService = {
  getSummary: async () => {
    const response = await api.get("/feedback/summary/");
    return response.data;
  },

  getFeedback: async (params = {}) => {
    const response = await api.get("/feedback/", { params });
    return response.data;
  },

  submitFeedback: async (data) => {
    const response = await api.post("/feedback/submit/", data);
    return response.data;
  },

  updateFeedback: async (id, data) => {
    const response = await api.put(`/feedback/${id}/`, data);
    return response.data;
  },

  getMyFeedback: async () => {
    const response = await api.get("/feedback/me/");
    return response.data;
  },

  deleteMyFeedback: async () => {
    const response = await api.delete("/feedback/me/delete/");
    return response.data;
  },
};

export default feedbackService;