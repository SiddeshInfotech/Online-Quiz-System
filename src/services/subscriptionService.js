import api from "./api";

/**
 * Service for Subscription & Pro Tier APIs
 */
const subscriptionService = {
  /**
   * Get current user's active subscription details, quotas & feature flags
   * GET /api/subscription/me/
   */
  getSubscription: async () => {
    try {
      const response = await api.get("subscription/me/");
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        // Fallback endpoint if nested under auth or user
        const fallback = await api.get("auth/subscription/");
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get dynamic pricing plans
   * GET /api/subscription/plans/
   */
  getPlans: async () => {
    try {
      const response = await api.get("subscription/plans/");
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await api.get("plans/");
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Upgrade user subscription to PRO
   * POST /api/subscription/upgrade/
   * @param {string} billingCycle - "MONTHLY" | "YEARLY"
   */
  upgradeSubscription: async (billingCycle = "MONTHLY") => {
    try {
      const response = await api.post("subscription/upgrade/", {
        billing_cycle: billingCycle,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await api.post("upgrade/", {
          billing_cycle: billingCycle,
        });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Cancel active subscription
   * POST /api/subscription/cancel/
   */
  cancelSubscription: async () => {
    try {
      const response = await api.post("subscription/cancel/");
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await api.post("cancel/");
        return fallback.data;
      }
      throw err;
    }
  },
};

export default subscriptionService;
