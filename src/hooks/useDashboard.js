/**
 * useDashboard.js
 *
 * Custom hook that fetches and exposes all dashboard data.
 * Components consume this via DashboardContext — they never
 * import mock data or call the service directly.
 *
 * Exposes: { data, loading, error }
 */

import { useState, useEffect } from "react";
import { fetchDashboardData } from "../services/dashboardService";

const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchDashboardData();

        // We no longer overlay the authenticated user's identity fields here
        // from localStorage. This merge now happens dynamically in
        // DashboardContext.jsx using AuthContext so it instantly responds
        // to profile updates without a page refresh.

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          // Surface Axios response error detail when available
          const message =
            err?.response?.data?.detail ??
            err?.response?.data?.message ??
            err?.message ??
            "Failed to load dashboard data.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Cleanup to avoid setting state on unmounted component
    return () => { cancelled = true; };
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        "Failed to load dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch, setData };
};

export default useDashboard;
