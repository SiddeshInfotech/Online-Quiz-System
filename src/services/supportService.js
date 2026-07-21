import api from "./api";

const supportService = {
  /**
   * Submit contact support message.
   * POST /api/support/contact/
   * @param {Object} data - { name, email, subject, category, message }
   */
  contactSupport: async (data) => {
    const response = await api.post("/support/contact/", data);
    return response.data;
  },
};

export default supportService;
