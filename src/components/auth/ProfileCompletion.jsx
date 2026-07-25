import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, GraduationCap, Target, FileText, ArrowRight } from "lucide-react";

import AuthHeader from "./AuthHeader";
import Input from "../ui/Input";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModal } from "../../context/AuthModalContext";

const ProfileCompletion = ({ inModal = true }) => {
  const navigate = useNavigate();
  const { currentUser, updateUser, fetchProfile, isAuthenticated } = useAuth();
  const { formData, closeModal } = useAuthModal() || {};

  const defaultName = formData?.firstName || formData?.lastName
    ? `${formData?.firstName || ""} ${formData?.lastName || ""}`.trim()
    : currentUser?.full_name || "";

  const [form, setForm] = useState({
    full_name: defaultName,
    school: currentUser?.school || "",
    grade: currentUser?.grade || "",
    bio: currentUser?.bio || "",
  });

  const [subjectInterests, setSubjectInterests] = useState([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSubject = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = subjectInput.trim();
      if (val && !subjectInterests.includes(val)) {
        setSubjectInterests([...subjectInterests, val]);
      }
      setSubjectInput("");
    }
  };

  const handleRemoveSubject = (tag) => {
    setSubjectInterests(subjectInterests.filter((s) => s !== tag));
  };

  const finishFlow = () => {
    if (inModal && closeModal) {
      closeModal();
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isAuthenticated) {
        const payload = {
          ...(currentUser?.username ? { username: currentUser.username } : {}),
          ...(currentUser?.email ? { email: currentUser.email } : {}),
          full_name: form.full_name.trim(),
          school: form.school.trim(),
          grade: form.grade.trim(),
          bio: form.bio.trim(),
          subject_interests: subjectInterests,
        };
        const updated = await authService.updateProfile(payload);
        if (updateUser) {
          updateUser(updated?.user || updated);
        }
        if (fetchProfile) {
          await fetchProfile();
        }
      }
      finishFlow();
    } catch (err) {
      console.error("Profile completion update error:", err);
      // Non-blocking fallback if profile endpoint fails
      finishFlow();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`w-full ${!inModal ? "rounded-3xl border border-app surface p-8 shadow-xl lg:p-10 relative" : ""}`}
    >
      <AuthHeader
        title="Complete Your Profile"
        subtitle="Help us personalize your AI learning journey."
      />

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Full Name */}
        <Input
          label="Full Name"
          name="full_name"
          placeholder="e.g. Alex Johnson"
          value={form.full_name}
          onChange={handleChange}
          leftIcon={User}
        />

        {/* Institution / School */}
        <Input
          label="School / University"
          name="school"
          placeholder="e.g. Stanford University"
          value={form.school}
          onChange={handleChange}
          leftIcon={GraduationCap}
        />

        {/* Class / Year */}
        <Input
          label="Class / Grade / Role"
          name="grade"
          placeholder="e.g. Senior Year, Sophomore, Self-Learner"
          value={form.grade}
          onChange={handleChange}
          leftIcon={Target}
        />

        {/* Bio */}
        <Input
          label="Bio (Optional)"
          name="bio"
          placeholder="What are your learning goals?"
          value={form.bio}
          onChange={handleChange}
          leftIcon={FileText}
        />

        {/* Subject Interests */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider">
            Subject Interests
          </label>
          <input
            type="text"
            placeholder="Type a subject and press Enter (e.g. Physics, History)"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={handleAddSubject}
            className="w-full rounded-xl border border-app bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-app)] placeholder:text-app-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {subjectInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {subjectInterests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(tag)}
                    className="hover:text-violet-900 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit & Skip Actions */}
        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Saving Profile..." : "Save Profile & Continue"}
            {!isLoading && <ArrowRight size={18} />}
          </button>

          <button
            type="button"
            onClick={finishFlow}
            className="w-full text-center text-sm font-medium text-app-muted hover:text-app transition-colors py-2 cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProfileCompletion;
