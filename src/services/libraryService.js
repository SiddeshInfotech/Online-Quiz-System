import api from "./api";

const libraryService = {
  // Fetch categories for tabs
  getCategories: async () => {
    const response = await api.get("/quizzes/categories/");
    return response.data;
  },

  // Fetch all library quizzes with filters
  getLibraryQuizzes: async (params) => {
    // params can include: search, category, difficulty, ordering
    const response = await api.get("/quizzes/library/", { params });
    return response.data;
  },

  // Global search API
  searchQuizzes: async (query) => {
    const response = await api.get("/quizzes/search/", { params: { q: query } });
    return response.data;
  },


  // Fetch library meta (e.g. dynamic message)
  getLibraryMeta: async () => {
    const response = await api.get("/quizzes/library/meta/");
    return response.data;
  },

  // Fetch single quiz details
  getQuizById: async (id) => {
    const response = await api.get(`/quizzes/${id}/`);
    return response.data;
  },

  // Alias for getQuizById
  getQuizDetails: async (id) => {
    const response = await api.get(`/quizzes/${id}/`);
    return response.data;
  },
};

export default libraryService;
