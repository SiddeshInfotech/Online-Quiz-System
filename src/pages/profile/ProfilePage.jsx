import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  AtSign,
  Pencil,
  KeyRound,
  LogOut,
  X,
  Check,
  AlertCircle,
  Shield,
  CreditCard,
  FileText,
  GraduationCap,
  Book,
  Camera,
  Target,
  Trophy,
  Award,
  Crown,
  Zap,
  RotateCcw,
  Code2,
  ArrowRight,
  Sparkles
} from "lucide-react";

import achievementService from "../../services/achievementService";
import { resolveMediaUrl } from "../../services/api";

import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordStrengthIndicator, { isPasswordStrong } from "../../components/auth/PasswordStrengthIndicator";
import { AuthContext } from "../../context/AuthContext";
import authService from "../../services/authService";
import { getCurrentPlan } from "../pricing/PricingPage";
import subscriptionService from "../../services/subscriptionService";
import CancelSubscriptionModal from "../../components/common/CancelSubscriptionModal";
import RenewalBanner from "../../components/common/RenewalBanner";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generate up-to-two uppercase initials from a display name. */
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl border text-sm font-medium
        ${isSuccess
          ? "surface border-emerald-200 text-emerald-700"
          : "surface border-red-200 text-red-600"
        }`}
    >
      {isSuccess
        ? <Check size={18} className="text-emerald-500 flex-shrink-0" />
        : <AlertCircle size={18} className="text-red-500 flex-shrink-0" />}
      <span>{toast.message}</span>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="w-full max-w-6xl mx-auto pb-12 animate-pulse">
    {/* Header */}
    <div className="mb-8">
      <div className="h-8 w-48 surface-subtle rounded-lg mb-2" />
      <div className="h-4 w-64 surface-elev rounded-lg" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Profile Card */}
      <div className="lg:col-span-1">
        <Card className="p-8 flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full surface-subtle" />
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="h-6 w-3/4 surface-subtle rounded-lg" />
            <div className="h-4 w-1/2 surface-elev rounded-lg" />
          </div>
          <div className="h-11 w-full surface-subtle rounded-xl mt-4" />
        </Card>
      </div>

      {/* Right Column - Info Cards */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="p-8">
          <div className="h-6 w-40 surface-subtle rounded-lg mb-6" />
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-4 w-24 surface-elev rounded" />
                <div className="h-6 w-full surface-subtle rounded" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <div className="h-6 w-32 surface-subtle rounded-lg mb-6" />
          <div className="flex gap-4">
            <div className="h-11 flex-1 surface-elev rounded-xl" />
            <div className="h-11 flex-1 surface-elev rounded-xl" />
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Edit Profile Modal
// ─────────────────────────────────────────────────────────────────────────────

const EditProfileModal = ({ profile, onClose, onSaved }) => {
  const getSubjectInterestsList = (subjects) => {
    if (!subjects) return [];
    if (Array.isArray(subjects)) return subjects;
    if (typeof subjects === 'string') {
      try {
        const parsed = JSON.parse(subjects);
        return Array.isArray(parsed) ? parsed : [subjects];
      } catch (e) {
        return [subjects];
      }
    }
    return [];
  };

  const initialSubjects = getSubjectInterestsList(profile?.subject_interests);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    school: profile?.school ?? "",
    grade: profile?.grade ?? "",
  });
  const [subjectInterests, setSubjectInterests] = useState(initialSubjects);
  const [subjectInput, setSubjectInput] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profile?.profile_picture || "");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddSubject = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = subjectInput.trim();
      if (val && !subjectInterests.includes(val)) {
        const newInterests = [...subjectInterests, val];
        setSubjectInterests(newInterests);
      }
      setSubjectInput("");
    }
  };

  const handleBlurSubject = () => {
    const val = subjectInput.trim();
    if (val && !subjectInterests.includes(val)) {
      const newInterests = [...subjectInterests, val];
      setSubjectInterests(newInterests);
    }
    setSubjectInput("");
  };

  const removeSubject = (subjectToRemove) => {
    const newInterests = subjectInterests.filter((s) => s !== subjectToRemove);
    setSubjectInterests(newInterests);
  };

  const handleChange = (e) => {
    setFieldError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setFieldError("Full name is required.");
      return;
    }
    if (!form.username.trim()) {
      setFieldError("Username is required.");
      return;
    }

    let currentSubjects = [...subjectInterests];
    const pendingSubject = subjectInput.trim();
    if (pendingSubject && !currentSubjects.includes(pendingSubject)) {
      currentSubjects.push(pendingSubject);
      setSubjectInterests(currentSubjects);
      setSubjectInput("");
    }

    const cleanUsername = form.username.trim();

    setSaving(true);
    try {
      let payload;
      let isFormData = false;

      if (profilePicture) {
        payload = new FormData();
        payload.append("username", cleanUsername);
        if (profile?.email) payload.append("email", profile.email);
        payload.append("full_name", form.full_name.trim());
        payload.append("bio", form.bio.trim());
        payload.append("school", form.school.trim());
        payload.append("grade", form.grade.trim());
        payload.append("subject_interests", JSON.stringify(currentSubjects));
        currentSubjects.forEach(s => payload.append("subject_interests_list", s));
        payload.append("profile_picture", profilePicture);
        isFormData = true;
      } else {
        payload = {
          username: cleanUsername,
          ...(profile?.email ? { email: profile.email } : {}),
          full_name: form.full_name.trim(),
          bio: form.bio.trim(),
          school: form.school.trim(),
          grade: form.grade.trim(),
          subject_interests: currentSubjects
        };
      }

      let updated;
      try {
        updated = await authService.updateProfile(payload);
      } catch (err) {
        if (profilePicture && err.response) {
            console.warn("Multipart upload failed, attempting Base64 fallback...");
            const base64Image = await fileToBase64(profilePicture);
            const base64Payload = {
              username: cleanUsername,
              ...(profile?.email ? { email: profile.email } : {}),
              full_name: form.full_name.trim(),
              bio: form.bio.trim(),
              school: form.school.trim(),
              grade: form.grade.trim(),
              subject_interests: currentSubjects,
              profile_picture: base64Image
            };
            updated = await authService.updateProfile(base64Payload);
        } else {
            throw err;
        }
      }

      onSaved({ returnedProfile: updated?.user, oldProfilePicture: profile?.profile_picture });
    } catch (err) {
      console.error("PUT /api/auth/profile/ error:", err);
      if (err.response) {
        console.error("Response payload:", err.response.data);
      }

      let msg = "Failed to save changes. Please try again.";
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          msg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else {
          try {
            const errors = [];
            for (const [key, val] of Object.entries(data)) {
              const valStr = Array.isArray(val) ? val.join(" ") : (typeof val === 'object' ? JSON.stringify(val) : val);
              errors.push(`${key}: ${valStr}`);
            }
            msg = errors.length > 0 ? errors.join(" | ") : JSON.stringify(data);
          } catch (e) {
            msg = JSON.stringify(data);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }

      setFieldError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md surface rounded-3xl shadow-2xl border border-app flex flex-col z-10 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-app flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold font-space-grotesk text-app">
              Edit Profile
            </h2>
            <p className="text-xs text-app-muted mt-0.5">
              Update your display information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-2 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-8 pt-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative w-24 h-24 rounded-full surface-elev flex items-center justify-center border-2 border-app overflow-hidden group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-app-muted" />
                )}
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Camera size={20} className="mb-1" />
                  <span className="text-[10px] font-medium">Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-app-muted">Profile Picture</p>
            </div>

            <Input
              label="Full Name"
              name="full_name"
              placeholder="Your full name"
              value={form.full_name}
              onChange={handleChange}
              leftIcon={User}
            />

            <Input
              label="Bio"
              name="bio"
              placeholder="Tell us about yourself"
              value={form.bio}
              onChange={handleChange}
              leftIcon={FileText}
            />

            <div className="border-t border-app pt-5 mt-2">
              <p className="text-sm font-semibold text-app mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-violet-600" />
                Educational Details
              </p>
              <div className="flex flex-col gap-5">
                <Input
                  label="Institution/School/College"
                  name="school"
                  placeholder="Where do you study?"
                  value={form.school}
                  onChange={handleChange}
                  leftIcon={GraduationCap}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Class/Year"
                    name="grade"
                    placeholder="e.g. 10th, 1st Year"
                    value={form.grade}
                    onChange={handleChange}
                    leftIcon={Target}
                  />
                  <div className="flex flex-col gap-1.5">
                    <Input
                      label="Subject Interests"
                      name="subject_interests"
                      placeholder="e.g. C, C++, Python, React (press Enter)"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={handleAddSubject}
                      onBlur={handleBlurSubject}
                      leftIcon={Book}
                    />

                    {/* Quick selection chips for programming subjects */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["C", "C++", "Python", "JavaScript", "React", "Java", "Django", "Node.js"].map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => {
                            if (!subjectInterests.includes(tech)) {
                              setSubjectInterests([...subjectInterests, tech]);
                            }
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            subjectInterests.includes(tech)
                              ? "bg-violet-600 text-white border-violet-600 font-semibold"
                              : "surface-subtle text-app-muted hover:text-app border-app hover:border-violet-400"
                          }`}
                        >
                          + {tech}
                        </button>
                      ))}
                    </div>

                    {subjectInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-app/50">
                        {subjectInterests.map((subject) => (
                          <div key={subject} className="flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold border border-violet-100">
                            {subject}
                            <button
                              type="button"
                              onClick={() => removeSubject(subject)}
                              className="text-violet-400 hover:text-violet-600 focus:outline-none cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Username"
              name="username"
              placeholder="Choose your username"
              value={form.username}
              onChange={handleChange}
              leftIcon={AtSign}
              helperText="Letters, numbers, and @/./+/-/_ characters allowed."
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={profile?.email ?? ""}
              leftIcon={Mail}
              readOnly
              disabled
              helperText="Email cannot be changed."
              className="surface-subtle text-app-muted cursor-not-allowed"
            />

          </div>

          {/* Actions Footer */}
        <div className="p-8 pt-6 border-t border-app flex-shrink-0 flex flex-col gap-4 surface-subtle">
            {fieldError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertCircle size={14} /> {fieldError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Change Password Modal
// ─────────────────────────────────────────────────────────────────────────────

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const handleChange = (e) => {
    setFieldError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid =
    form.old_password.trim().length > 0 &&
    isPasswordStrong(form.new_password) &&
    form.new_password === form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.old_password.trim()) {
      setFieldError("Old password is required.");
      return;
    }

    if (!isPasswordStrong(form.new_password)) {
      setFieldError("New password does not meet all security requirements.");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setFieldError("New passwords do not match.");
      return;
    }

    setSaving(true);
    setFieldError("");

    try {
      await authService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password
      });
      onSuccess();
    } catch (err) {
      console.error("Change password error:", err);
      let msg = "Failed to change password. Please try again.";
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          msg = typeof data.message === "string" ? data.message : JSON.stringify(data.message);
        } else {
          try {
            const errors = Object.values(data)
              .flat()
              .map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
              .join(" ");
            msg = errors || "Failed to change password.";
          } catch {
            msg = JSON.stringify(data);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }
      setFieldError(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md surface rounded-3xl shadow-2xl border border-app p-8 z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold font-space-grotesk text-app">
              Change Password
            </h2>
            <p className="text-xs text-app-muted mt-0.5">
              Update your account password
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-2 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Old Password */}
          <PasswordInput
            label="Old Password"
            name="old_password"
            placeholder="Enter old password"
            value={form.old_password}
            onChange={handleChange}
          />

          {/* New Password */}
          <div>
            <PasswordInput
              label="New Password"
              name="new_password"
              placeholder="Enter new password"
              value={form.new_password}
              onChange={handleChange}
            />
            <PasswordStrengthIndicator password={form.new_password} />
          </div>

          {/* Confirm New Password */}
          <div>
            <PasswordInput
              label="Confirm New Password"
              name="confirm_password"
              placeholder="Confirm new password"
              value={form.confirm_password}
              onChange={handleChange}
            />
            {form.confirm_password && form.new_password !== form.confirm_password && (
              <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} /> Passwords do not match
              </p>
            )}
          </div>

          {fieldError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
              <AlertCircle size={14} className="shrink-0" /> {fieldError}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={saving || !isFormValid}
            >
              {saving ? "Updating…" : "Change Password"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Profile Page
// ─────────────────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { currentUser, logout, updateUser, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!currentUser);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentBadges, setRecentBadges] = useState([]);
  const [totalClaimedBadges, setTotalClaimedBadges] = useState(0);
  const [currentPlan, setCurrentPlanState] = useState(() => getCurrentPlan(currentUser));
  const [subData, setSubData] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSub = async () => {
      try {
        setSubLoading(true);
        const data = await subscriptionService.getSubscription();
        if (!cancelled && data) {
          setSubData(data);
          const activePlan = data.plan?.toLowerCase() || (data.is_pro ? "pro" : "free");
          setCurrentPlanState(activePlan);
        }
      } catch (err) {
        console.error("Profile subscription fetch error:", err);
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    };
    loadSub();

    const handlePlanChange = (e) => {
      if (e.detail?.plan) {
        setCurrentPlanState(e.detail.plan);
      }
      loadSub();
    };
    window.addEventListener("app:refresh-plan", handlePlanChange);
    return () => {
      cancelled = true;
      window.removeEventListener("app:refresh-plan", handlePlanChange);
    };
  }, []);

  const isPro = subData ? Boolean(subData.is_pro || subData.plan === "PRO") : currentPlan === "pro";

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const dismissToast = useCallback(() => setToast(null), []);

  // Fetch fresh profile from backend on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchProfile();
        // Fetch recent badges for the profile preview (image thumbnails only)
        const badgesData = await achievementService.getUserAuthBadges();
        const badgesList = Array.isArray(badgesData)
          ? badgesData
          : badgesData.badges || [];

        const claimed = badgesList
          .filter(b => b.is_claimed === true)
          .map(b => ({
            ...b,
            icon_url: resolveMediaUrl(b.icon_url || b.image_url),
            image_url: resolveMediaUrl(b.icon_url || b.image_url)
          }));

        // Sort by newest if earned_at / claimed_at exists
        claimed.sort((a, b) => new Date(b.earned_at || b.claimed_at || 0) - new Date(a.earned_at || a.claimed_at || 0));
        setTotalClaimedBadges(claimed.length);
        setRecentBadges(claimed.slice(0, 5));
      } catch (err) {
        console.error("Failed to load profile or badges", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const handleGamificationRefresh = () => {
      load();
    };

    window.addEventListener("app:refresh-gamification", handleGamificationRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("app:refresh-gamification", handleGamificationRefresh);
    };
  }, [fetchProfile]);

  // Sync totalClaimedBadges from profile.badge_count whenever the profile updates.
  // This eliminates the need for a separate API call when the badge count changes.
  useEffect(() => {
    if (currentUser?.badge_count !== undefined) {
      setTotalClaimedBadges(currentUser.badge_count);
    }
  }, [currentUser?.badge_count]);

  const handleSaved = async ({ returnedProfile, oldProfilePicture } = {}) => {
    const freshProfile = await fetchProfile();
    
    if (returnedProfile && returnedProfile.profile_picture) {
      // If the backend returns the exact same URL after an upload, log it as a backend issue
      // We do NOT mask it with frontend workarounds anymore.
      if (oldProfilePicture && returnedProfile.profile_picture === oldProfilePicture) {
         console.warn("[BACKEND ISSUE] PUT /api/auth/profile/ returned the same old profile_picture URL despite upload!", {
           oldProfilePicture,
           putResponse: returnedProfile.profile_picture
         });
      }

      // If the GET request diverges from the PUT response, log it
      if (freshProfile?.profile_picture !== returnedProfile.profile_picture) {
         console.warn("[BACKEND ISSUE] GET /api/auth/profile/ returned a different profile_picture than the PUT response!", {
           putResponse: returnedProfile.profile_picture,
           getResponse: freshProfile?.profile_picture
         });
      }
      
      // Enforce the PUT response URL as the single source of truth
      updateUser({
        ...freshProfile,
        profile_picture: returnedProfile.profile_picture
      });
    }

    setShowModal(false);
    showToast("Profile updated successfully!");
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    showToast("Password changed successfully!");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const profile = currentUser;
  const displayName = profile?.full_name || profile?.username || "Student";
  const initials = getInitials(displayName);

  // Calculate Profile Completion
  const completionPercentage = profile?.profile_completion ?? 0;

  const getSubjectInterestsList = (subjects) => {
    if (!subjects) return [];
    if (Array.isArray(subjects)) return subjects;
    if (typeof subjects === 'string') {
      try {
        const parsed = JSON.parse(subjects);
        return Array.isArray(parsed) ? parsed : [subjects];
      } catch (e) {
        return [subjects];
      }
    }
    return [];
  };
  const subjectList = getSubjectInterestsList(profile?.subject_interests);

  // To keep dynamic text like "Your profile is fully complete!" based on fields:
  const completionFields = [
    profile?.profile_picture,
    profile?.full_name,
    profile?.bio,
    profile?.school,
    profile?.grade,
    profile?.subject_interests
  ];
  const completedCount = completionFields.filter(Boolean).length;

  return (
    <>
      {/* Page */}
      <div className="w-full max-w-6xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-space-grotesk text-app mb-2">
            My Profile
          </h1>
          <p className="text-base text-app-muted">
            View and manage your account information and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <Card className="p-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold font-space-grotesk text-lg flex items-center gap-2">
                      <Target size={20} />
                      Profile Completion
                    </h3>
                    <span className="font-bold text-xl">{completionPercentage}%</span>
                  </div>

                  <div className="w-full bg-white/20 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
                    <motion.div
                      className="surface h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-white/80 font-medium">
                    {completedCount === completionFields.length
                      ? "Your profile is fully complete!"
                      : `Complete ${completionFields.length - completedCount} more fields to reach 100%`}
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <Card className="p-8 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                {/* Background Decoration */}
                <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 group-hover:from-violet-600/30 group-hover:to-fuchsia-600/30 transition-colors duration-500" />

                {/* Avatar */}
                <div className="relative z-10 mb-6 mt-4 group/avatar cursor-not-allowed">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                    {profile?.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt={displayName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6D5EF9&color=fff`;
                        }}
                        className="w-36 h-36 rounded-full object-cover ring-4 ring-white shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)] group-hover/avatar:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)] ring-4 ring-white group-hover/avatar:opacity-80 transition-opacity">
                        <span className="text-4xl font-bold text-white font-space-grotesk tracking-wide">
                          {initials}
                        </span>
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/40 text-white" title="Avatar upload not yet supported by backend">
                      <Camera size={28} className="mb-1" />
                      <span className="text-xs font-medium">Update</span>
                    </div>
                  </motion.div>
                </div>

                {/* Name + username */}
                <div className="z-10 mb-8 w-full">
                  <h2 className="text-3xl font-bold font-space-grotesk text-app mb-1">
                    {displayName}
                  </h2>
                  {profile?.username && (
                    <p className="text-sm font-medium text-app-muted flex items-center justify-center gap-1">
                      <AtSign size={14} /> {profile.username}
                    </p>
                  )}
                </div>

                {/* Action */}
                <Button
                  variant="primary"
                  className="w-full gap-2 z-10"
                  onClick={() => setShowModal(true)}
                >
                  <Pencil size={18} />
                  Edit Profile
                </Button>
              </Card>
            </motion.div>

            {/* Achievements Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Card className="p-5 hover:shadow-xl transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-app">
                  <div>
                    <h3 className="text-sm font-bold font-space-grotesk text-app flex items-center gap-1.5">
                      🏆 Achievements
                    </h3>
                    <p className="text-xs text-app-muted mt-0.5">Your earned badges</p>
                  </div>
                  <Link
                    to="/profile/badges"
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1"
                  >
                    Badges Collected →
                  </Link>
                </div>

                {/* Content */}
                {recentBadges.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentBadges.map((badge) => (
                      <Link
                        key={badge.id || badge.badge_id || badge.name}
                        to={`/badges/${badge.id || badge.badge_id}`}
                        className="w-10 h-10 rounded-xl surface-subtle border-2 border-white shadow flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer flex-shrink-0"
                        title={badge.name || badge.badge_name}
                      >
                        {badge.image_url || badge.icon_url ? (
                          <img src={badge.image_url || badge.icon_url} alt={badge.name || badge.badge_name} className="w-full h-full object-cover" />
                        ) : (
                          <Award className="text-violet-400" size={20} />
                        )}
                      </Link>
                    ))}
                    {totalClaimedBadges > 5 && (
                      <Link
                        to="/profile/badges"
                        className="w-10 h-10 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700 border border-violet-100 rounded-xl flex items-center justify-center font-bold text-xs shadow transition-colors flex-shrink-0"
                      >
                        +{totalClaimedBadges - 5}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-3">
                    <span className="text-3xl mb-2">🏅</span>
                    <p className="text-sm font-semibold text-app-2 mb-1">No badges claimed yet</p>
                    <p className="text-[11px] text-app-muted mb-3">Complete quizzes and claim your first badge.</p>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/profile/badges"
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Badges Collected →
                      </Link>
                      <Link
                        to="/achievements"
                        className="text-xs font-semibold text-app-muted hover:text-app surface-subtle hover:bg-[var(--bg-elevated)] border border-app rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Go to Achievements
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>


          {/* Right Column - Info & Security Cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Subscription & Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
            >
              <Card className={`p-8 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden border-2 ${
                isPro ? "border-violet-500/40" : "border-app"
              }`}>
                {isPro && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow flex items-center gap-1">
                    <Crown size={12} /> PRO MEMBER
                  </div>
                )}

                {/* Renewal Banner */}
                {!subLoading && subData?.is_pro && (
                  <div className="mb-4">
                    <RenewalBanner daysRemaining={subData?.days_remaining} />
                  </div>
                )}

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-app">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      subLoading ? "animate-pulse bg-slate-200 dark:bg-slate-700" :
                      isPro
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {!subLoading && <Crown size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {subLoading ? (
                          <div className="h-5 w-44 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                        ) : (
                          <>
                            <h3 className="text-lg font-bold font-space-grotesk text-app">Subscription & Quota</h3>
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              isPro
                                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-300 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            }`}>
                              {isPro ? "👑 PRO MEMBER" : "Free Tier"}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-app-muted">Manage your daily limits and active plan</p>
                    </div>
                  </div>

                  <Link to="/pricing">
                    <Button variant={isPro ? "secondary" : "primary"} size="sm" className="gap-1.5 text-xs font-bold">
                      {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>

                {/* 4 Metadata Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl surface-subtle border border-app">
                  {subLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="h-2.5 w-14 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 w-20 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-0.5">Plan</span>
                        <span className="text-sm font-extrabold text-app flex items-center gap-1">
                          {isPro ? <span className="text-amber-500">👑 Premium (PRO)</span> : "Free Tier"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-0.5">Billing</span>
                        <span className="text-sm font-extrabold text-app">{subData?.billing_cycle ?? (isPro ? "MONTHLY" : "Free")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-0.5">Started</span>
                        <span className="text-sm font-semibold text-app">
                          {subData?.subscription_start ? new Date(subData.subscription_start).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-0.5">Renews</span>
                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                          {subData?.renewal_date ? new Date(subData.renewal_date).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Usage Progress Cards */}
                {(() => {
                  const sk = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";
                  const qUsed = subData?.daily_attempt_used ?? subData?.daily_quiz_used;
                  const qLimit = subData?.daily_attempt_limit ?? subData?.daily_quiz_limit;
                  const qRem = subData?.daily_attempt_remaining ?? subData?.daily_quiz_remaining ?? (qUsed != null && qLimit != null ? Math.max(0, qLimit - qUsed) : null);
                  const qPct = qUsed != null && qLimit ? Math.min(100, Math.round((qUsed / qLimit) * 100)) : 0;
                  const cUsed = subData?.coding_question_used;
                  const cLimit = subData?.coding_question_limit;
                  const cRem = cUsed != null && cLimit != null ? Math.max(0, cLimit - cUsed) : null;
                  const cPct = cUsed != null && cLimit ? Math.min(100, Math.round((cUsed / cLimit) * 100)) : 0;

                  return (
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      {/* Daily Quizzes */}
                      <div className="p-4 rounded-xl surface-subtle border border-app flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-app flex items-center gap-1.5">
                            <Book size={15} className="text-violet-600" /> Daily Quizzes
                          </span>
                          {subLoading ? (
                            <div className={`h-3.5 w-20 ${sk}`} />
                          ) : (
                            <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">
                              {qUsed ?? "—"} / {qLimit ?? "—"} Used Today
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          {subLoading ? (
                            <div className={`h-full w-1/2 ${sk} rounded-full`} />
                          ) : (
                            <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-500" style={{ width: `${qPct}%` }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-app-muted font-medium pt-0.5">
                          {subLoading ? (
                            <div className={`h-3 w-16 ${sk}`} />
                          ) : (
                            <>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{qRem != null ? `${qRem} Remaining` : "—"}</span>
                              <span>Resets in {subData?.reset_hours ?? 24}h</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Subscription History Timeline */}
                {!subLoading && subData && (subData.subscription_start || subData.renewal_date) && (
                  <div className="mb-6 pt-4 border-t border-app">
                    <h4 className="text-xs font-bold text-app uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-violet-500" /> Subscription History
                    </h4>
                    <div className="flex flex-col gap-0">
                      {subData.subscription_start && (
                        <div className="flex items-start gap-3 pb-4 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-violet-600 ring-2 ring-violet-600/30 mt-0.5 shrink-0" />
                            <div className="w-0.5 flex-1 bg-violet-300/50 dark:bg-violet-700/40 mt-1" style={{ minHeight: "20px" }} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-app">{new Date(subData.subscription_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                            <p className="text-[11px] text-app-muted">Started {isPro ? "Premium" : "Free Tier"}</p>
                          </div>
                        </div>
                      )}
                      {subData.renewal_date && (
                        <div className="flex items-start gap-3 pb-4 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-500/30 mt-0.5 shrink-0" />
                            <div className="w-0.5 flex-1 bg-violet-300/50 dark:bg-violet-700/40 mt-1" style={{ minHeight: "20px" }} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-app">{new Date(subData.renewal_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                            <p className="text-[11px] text-app-muted">Scheduled Renewal</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Current</p>
                          <p className="text-[11px] text-app-muted">{subData?.status === "ACTIVE" ? "Active" : subData?.status || "Active"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Benefits Summary */}
                <div className="pt-4 border-t border-app flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-app block mb-1">Premium Benefits</span>
                    <div className="flex items-center gap-4 text-xs text-app-muted">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><Check size={14} /> Unlimited AI</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><Check size={14} /> Advanced Analytics</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><Check size={14} /> Priority Support</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Link to="/pricing" className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1">
                      View All Benefits →
                    </Link>
                    {isPro && (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* CancelSubscriptionModal */}
            <CancelSubscriptionModal
              isOpen={showCancelModal}
              onClose={() => setShowCancelModal(false)}
              loading={cancelLoading}
              renewalDate={subData?.renewal_date ? new Date(subData.renewal_date).toLocaleDateString() : null}
              onConfirm={async () => {
                setCancelLoading(true);
                try {
                  await subscriptionService.cancelSubscription();
                  setSubData((prev) => ({ ...prev, plan: "FREE", is_pro: false, status: "CANCELLED" }));
                  setCurrentPlanState("free");
                  window.dispatchEvent(new CustomEvent("app:refresh-plan", { detail: { plan: "free" } }));
                  showToast("Subscription cancelled. Pro benefits remain until billing period ends.", "success");
                } catch (err) {
                  showToast("Failed to cancel. Please try again.", "error");
                } finally {
                  setCancelLoading(false);
                  setShowCancelModal(false);
                }
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-app">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                    <User className="text-violet-600 dark:text-violet-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-app">
                      Personal Information
                    </h3>
                    <p className="text-sm text-app-muted">
                      Your essential details
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Info Row: Full Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <User size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Full Name
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.full_name || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Row: Username */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <AtSign size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Username
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.username || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Row: Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <Mail size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Email Address
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.email || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Row: Bio */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <FileText size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Bio
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.bio || "No bio added yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-app">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <GraduationCap className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-space-grotesk text-app">
                        Educational Details
                      </h3>
                      <p className="text-sm text-app-muted">
                        Your academic background
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Info Row: School */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <GraduationCap size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Institution / School
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.school || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Row: Class & Subject (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <Target size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Class / Year
                        </p>
                        <p className="text-base font-semibold text-app">
                          {profile?.grade || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl surface-subtle border border-app hover:bg-[var(--bg-surface)] hover:shadow-sm transition-all duration-300">
                      <div className="w-9 h-9 rounded-full surface shadow-sm flex items-center justify-center border border-app flex-shrink-0">
                        <Book size={16} className="text-app-muted" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-0.5">
                          Subject Interests
                        </p>
                        <p className="text-base font-semibold text-app mt-1">
                          {subjectList.length > 0 ? subjectList.join(", ") : "No subjects selected"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>



            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-app">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Shield className="text-amber-600 dark:text-amber-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-app">
                      Security & Access
                    </h3>
                    <p className="text-sm text-app-muted">
                      Manage your password and session
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="primary"
                    className="flex-1 gap-2 h-11"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <KeyRound size={18} />
                    Change Password
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 h-11 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showModal && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowPasswordModal(false)}
            onSuccess={handlePasswordSuccess}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onDismiss={dismissToast} />}
      </AnimatePresence>
    </>
  );
};

export default ProfilePage;

