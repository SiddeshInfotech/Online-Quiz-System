import React from "react";
import { Check, X } from "lucide-react";

export const validatePassword = (password = "") => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-\+=/\\[\]~]/.test(password),
  };
};

export const isPasswordStrong = (password = "") => {
  const v = validatePassword(password);
  return v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecialChar;
};

const PasswordStrengthIndicator = ({ password = "" }) => {
  if (!password) return null;

  const checks = validatePassword(password);
  const score = Object.values(checks).filter(Boolean).length;

  let strengthLabel = "Weak";
  let strengthColor = "text-red-500";
  let barColor = "bg-red-500";
  let widthClass = "w-1/3";

  if (score >= 5) {
    strengthLabel = "Strong";
    strengthColor = "text-emerald-500";
    barColor = "bg-emerald-500";
    widthClass = "w-full";
  } else if (score >= 3) {
    strengthLabel = "Medium";
    strengthColor = "text-amber-500";
    barColor = "bg-amber-500";
    widthClass = "w-2/3";
  }

  const rules = [
    { label: "8 characters minimum", valid: checks.minLength },
    { label: "Uppercase letter (A-Z)", valid: checks.hasUppercase },
    { label: "Lowercase letter (a-z)", valid: checks.hasLowercase },
    { label: "Number (0-9)", valid: checks.hasNumber },
    { label: "Special character (!@#$%^&*)", valid: checks.hasSpecialChar },
  ];

  return (
    <div className="mt-2.5 p-3 rounded-xl surface-subtle border border-app text-xs space-y-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-app-muted text-[11px] uppercase tracking-wider">
          Password Strength
        </p>
        <span className={`font-bold text-xs ${strengthColor}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} ${widthClass} transition-all duration-300 rounded-full`} />
      </div>

      {/* Requirement List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              rule.valid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-app-muted opacity-70"
            }`}
          >
            {rule.valid ? (
              <Check size={13} className="text-emerald-500 shrink-0" strokeWidth={3} />
            ) : (
              <X size={13} className="text-red-400 shrink-0" strokeWidth={2.5} />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
