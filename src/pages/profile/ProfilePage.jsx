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
  Award
} from "lucide-react";

import achievementService from "../../services/achievementService";
import { resolveMediaUrl } from "../../services/api";

import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import { AuthContext } from "../../context/AuthContext";
import authService from "../../services/authService";

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
      <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-64 surface-elev rounded-lg" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Profile Card */}
      <div className="lg:col-span-1">
        <Card className="p-8 flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-slate-200" />
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/2 surface-elev rounded-lg" />
          </div>
          <div className="h-11 w-full bg-slate-200 rounded-xl mt-4" />
        </Card>
      </div>

      {/* Right Column - Info Cards */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="p-8">
          <div className="h-6 w-40 bg-slate-200 rounded-lg mb-6" />
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
          <div className="h-6 w-32 bg-slate-200 rounded-lg mb-6" />
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
        console.log("State updated (handleAddSubject):", newInterests);
      }
      setSubjectInput("");
    }
  };

  const handleBlurSubject = () => {
    const val = subjectInput.trim();
    if (val && !subjectInterests.includes(val)) {
      const newInterests = [...subjectInterests, val];
      setSubjectInterests(newInterests);
      console.log("State updated (handleBlurSubject):", newInterests);
    }
    setSubjectInput("");
  };

  const removeSubject = (subjectToRemove) => {
    const newInterests = subjectInterests.filter((s) => s !== subjectToRemove);
    setSubjectInterests(newInterests);
    console.log("State updated (removeSubject):", newInterests);
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

    let currentSubjects = [...subjectInterests];
    const pendingSubject = subjectInput.trim();
    if (pendingSubject && !currentSubjects.includes(pendingSubject)) {
      currentSubjects.push(pendingSubject);
      setSubjectInterests(currentSubjects);
      setSubjectInput("");
      console.log("State updated (handleSubmit pending input):", currentSubjects);
    }

    setSaving(true);
    try {
      let payload;
      let isFormData = false;

      if (profilePicture) {
        payload = new FormData();
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

      console.log("[TRACE] 1. PUT /api/auth/profile/ successful");
      console.log("[TRACE] 2. Exact response.user returned:", updated?.user);
      console.log("PUT Response:", updated);

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

            <div className="border-t border-slate-100 pt-5 mt-2">
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
                      placeholder="Type subject and press Enter"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={handleAddSubject}
                      onBlur={handleBlurSubject}
                      leftIcon={Book}
                    />
                    {subjectInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subjectInterests.map((subject, idx) => (
                          <div key={subject} className="flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-medium border border-violet-100">
                            {subject}
                            <button
                              type="button"
                              onClick={() => removeSubject(subject)}
                              className="text-violet-400 hover:text-violet-600 focus:outline-none"
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
              value={profile?.username ?? ""}
              leftIcon={AtSign}
              readOnly
              disabled
              helperText="Username cannot be changed."
              className="surface-subtle text-app-muted cursor-not-allowed"
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setFieldError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password
      });
      onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to change password. Please try again.";
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
        className="relative w-full max-w-md surface rounded-3xl shadow-2xl border border-app p-8 z-10"
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
            className="p-2 rounded-xl text-app-muted hover:text-app-2 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Old Password"
            name="old_password"
            type="password"
            placeholder="Enter old password"
            value={form.old_password}
            onChange={handleChange}
            leftIcon={KeyRound}
            required
          />
          <Input
            label="New Password"
            name="new_password"
            type="password"
            placeholder="Enter new password"
            value={form.new_password}
            onChange={handleChange}
            leftIcon={KeyRound}
            required
          />
          <Input
            label="Confirm New Password"
            name="confirm_password"
            type="password"
            placeholder="Confirm new password"
            value={form.confirm_password}
            onChange={handleChange}
            leftIcon={KeyRound}
            required
          />

          {fieldError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} /> {fieldError}
            </p>
          )}

          <div className="flex gap-3 mt-1">
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
  console.log("[TRACE] 8. ProfilePage rendering with currentUser:", currentUser);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!currentUser);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentBadges, setRecentBadges] = useState([]);
  const [totalClaimedBadges, setTotalClaimedBadges] = useState(0);

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
        const badgesList = badgesData.badges || badgesData || [];
        const claimed = badgesList.filter(b => b.status === "CLAIMED").map(b => ({
          ...b,
          image_url: resolveMediaUrl(b.image_url)
        }));
        // Sort by newest if claimed_at exists
        claimed.sort((a, b) => new Date(b.claimed_at || 0) - new Date(a.claimed_at || 0));
        // Use profile.badge_count from backend if available, otherwise count from list.
        // profile.badge_count is the authoritative value per new backend contract.
        setTotalClaimedBadges(claimed.length);
        setRecentBadges(claimed.slice(0, 5));
      } catch (err) {
        console.error("Failed to load profile or badges", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProfile]);

  // Sync totalClaimedBadges from profile.badge_count whenever the profile updates.
  // This eliminates the need for a separate API call when the badge count changes.
  useEffect(() => {
    if (currentUser?.badge_count !== undefined) {
      setTotalClaimedBadges(currentUser.badge_count);
    }
  }, [currentUser?.badge_count]);

  const handleSaved = async ({ returnedProfile, oldProfilePicture } = {}) => {
    console.log("[TRACE] 3. ProfilePage.handleSaved called, triggering fetchProfile()");
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
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold font-space-grotesk text-app flex items-center gap-1.5">
                      🏆 Achievements
                    </h3>
                    <p className="text-xs text-app-muted mt-0.5">Your earned badges</p>
                  </div>
                  {recentBadges.length > 0 && (
                    <Link
                      to="/profile/badges"
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1"
                    >
                      View All →
                    </Link>
                  )}
                </div>

                {/* Content */}
                {recentBadges.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentBadges.map((badge) => (
                      <div
                        key={badge.id || badge.badge_id || badge.name}
                        className="w-10 h-10 rounded-xl surface-subtle border-2 border-white shadow flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer flex-shrink-0"
                        title={badge.name}
                      >
                        {badge.image_url ? (
                          <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover" />
                        ) : (
                          <Award className="text-violet-400" size={20} />
                        )}
                      </div>
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
                    <Link
                      to="/achievements"
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Go to Achievements →
                    </Link>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>


          {/* Right Column - Info & Security Cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
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

