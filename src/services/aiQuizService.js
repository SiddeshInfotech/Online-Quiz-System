import api from "./api";

/**
 * aiQuizService.js
 *
 * Handles all AI quiz generation API calls.
 * Uses the shared Axios instance which automatically attaches
 * the Bearer token via the request interceptor in api.js.
 */

const aiQuizService = {
  /**
   * Generate an AI quiz.
   * POST /api/ai/generate-quiz/
   *
   * @param {Object} params
   * @param {string}      params.subject             - Programming subject (required)
   * @param {string}      params.difficulty          - "Easy" | "Medium" | "Hard" (required)
   * @param {string}      params.quiz_mode           - "Theory" | "Coding" (required)
   * @param {number}      params.number_of_questions - 5 | 10 | 15 | 20 | 25 (required)
   * @param {string}      [params.prompt_topic]      - Optional topic/prompt (max 1000 chars)
   * @param {number|null} [params.category_id]       - Optional category ID
   *
   * @returns {Promise<{ quiz_id: number, message: string, [key: string]: any }>}
   */
  generateQuiz: async ({
    subject,
    difficulty,
    quiz_mode,
    number_of_questions,
    prompt_topic = "",
  }) => {
    const response = await api.post("/ai/generate-quiz/", {
      subject,
      difficulty,
      quiz_mode,
      number_of_questions,
      prompt_topic,
    });
    return response.data;
  },

  /**
   * Admin Panel AI Quiz Generator (Official System Quizzes)
   * POST /api/custom_admin/ai/generate-quiz/
   *
   * @param {Object} quizPayload
   * @returns {Promise<any>}
   */
  generateAdminQuiz: async (quizPayload) => {
    const adminToken =
      localStorage.getItem("admin_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    const response = await api.post(
      "/custom_admin/ai/generate-quiz/",
      quizPayload,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Admin-Request": "true",
        },
      }
    );
    return response.data;
  },
};

export default aiQuizService;
