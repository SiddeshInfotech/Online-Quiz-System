import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlertTriangle, Bell, ShieldAlert, RefreshCcw } from "lucide-react";

/**
 * RenewalBanner
 * Shows contextual banners based on days_remaining from the subscription API.
 *
 * daysRemaining > 7     → no banner
 * daysRemaining === 7   → informational (blue)
 * daysRemaining === 3   → warning (amber)
 * daysRemaining === 1   → urgent warning (orange)
 * daysRemaining <= 0    → expired (red) with Renew CTA
 *
 * Banners are dismissible per session, keyed by banner type.
 */

const BANNER_CONFIG = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    icon: <Bell size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />,
    textColor: "text-blue-800 dark:text-blue-200",
    dismissColor: "text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700",
    icon: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />,
    textColor: "text-amber-800 dark:text-amber-200",
    dismissColor: "text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200",
  },
  urgent: {
    bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-700",
    icon: <ShieldAlert size={18} className="text-orange-600 dark:text-orange-400 shrink-0" />,
    textColor: "text-orange-800 dark:text-orange-200",
    dismissColor: "text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-200",
  },
  expired: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700",
    icon: <RefreshCcw size={18} className="text-red-600 dark:text-red-400 shrink-0" />,
    textColor: "text-red-800 dark:text-red-200",
    dismissColor: "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200",
  },
};

const getBannerType = (daysRemaining) => {
  if (daysRemaining <= 0) return "expired";
  if (daysRemaining === 1) return "urgent";
  if (daysRemaining <= 3) return "warning";
  if (daysRemaining <= 7) return "info";
  return null;
};

const getBannerMessage = (daysRemaining) => {
  if (daysRemaining <= 0) return "Your Premium plan has expired. Renew now to regain access to Pro features.";
  if (daysRemaining === 1) return "Your Premium plan expires tomorrow. Renew now to continue enjoying Premium features.";
  if (daysRemaining <= 3) return `Your Premium plan expires in ${daysRemaining} days. Renew soon to avoid interruption.`;
  return `Your Pro plan renews in ${daysRemaining} days.`;
};

const SESSION_KEY = "dismissed_renewal_banners";

const getDismissed = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
  } catch {
    return [];
  }
};

const dismissBanner = (type) => {
  const current = getDismissed();
  if (!current.includes(type)) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...current, type]));
  }
};

const RenewalBanner = ({ daysRemaining }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const bannerType = getBannerType(daysRemaining);

  useEffect(() => {
    if (bannerType && getDismissed().includes(bannerType)) {
      setDismissed(true);
    }
  }, [bannerType]);

  if (!bannerType || dismissed || daysRemaining == null) return null;

  const config = BANNER_CONFIG[bannerType];
  const message = getBannerMessage(daysRemaining);
  const isExpired = bannerType === "expired";

  const handleDismiss = () => {
    dismissBanner(bannerType);
    setDismissed(true);
  };

  return (
    <div className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm font-medium mb-4 ${config.bg}`}>
      <div className="flex items-center gap-2.5">
        {config.icon}
        <span className={config.textColor}>{message}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isExpired && (
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Renew Now
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className={`p-1 rounded-full transition-colors ${config.dismissColor}`}
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default RenewalBanner;
