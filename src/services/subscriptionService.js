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
   * Create Razorpay Order
   * POST /api/subscription/create-order/
   * @param {string} billingCycle - "MONTHLY" | "YEARLY"
   */
  createOrder: async (billingCycle = "MONTHLY") => {
    try {
      const response = await api.post("subscription/create-order/", {
        billing_cycle: billingCycle,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await api.post("create-order/", {
          billing_cycle: billingCycle,
        });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Verify Razorpay Payment Signature
   * POST /api/subscription/verify-payment/
   * @param {Object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post("subscription/verify-payment/", paymentData);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await api.post("verify-payment/", paymentData);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Full Razorpay Checkout Flow:
   * 1. Calls createOrder
   * 2. Opens Razorpay popup
   * 3. Calls verifyPayment on success
   * Fallback: Calls direct upgrade endpoint if Razorpay SDK unavailable or order fails
   */
  processRazorpayPayment: async (billingCycle = "MONTHLY", userDetails = {}) => {
    try {
      // 1. Create order on backend
      const orderData = await subscriptionService.createOrder(billingCycle);

      // Check if window.Razorpay SDK is loaded
      if (typeof window.Razorpay !== "function") {
        console.warn("Razorpay SDK not loaded, falling back to direct upgrade");
        return await subscriptionService.upgradeSubscription(billingCycle);
      }

      // 2. Open Razorpay modal wrapped in Promise
      return new Promise((resolve, reject) => {
        const options = {
          key: orderData.key_id || orderData.key || "rzp_test_TI2fVt8KBz2An2",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: orderData.name || "QuizGen AI",
          description: orderData.description || "QuizGen Pro Subscription",
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              // 3. Verify signature on backend
              const verifyRes = await subscriptionService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              resolve(verifyRes);
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: userDetails.name || orderData.user?.name || "",
            email: userDetails.email || orderData.user?.email || "",
          },
          theme: {
            color: "#6D5EF9",
          },
          modal: {
            ondismiss: function () {
              reject(new Error("Payment window cancelled by user"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          reject(new Error(resp.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (err) {
      // If backend create-order endpoint doesn't exist yet, fallback to direct upgrade
      if (err.response?.status === 404) {
        return await subscriptionService.upgradeSubscription(billingCycle);
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
