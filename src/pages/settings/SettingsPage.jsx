import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Bell,
  BookOpen,
  Info,
  LogOut,
  Trash2,
  X,
  AlertTriangle,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import { AuthContext } from "../../context/AuthContext";
import { useDashboardContext } from "../../context/DashboardContext";
import authService from "../../services/authService";

// ─────────────────────────────────────────────────────────────────────────────
// Delete Account Modal
// ─────────────────────────────────────────────────────────────────────────────

const DeleteAccountModal = ({ onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleConfirm = async () => {
    if (inputValue !== "DELETE") return;
    
    setIsDeleting(true);
    setErrorMsg("");
    try {
      // In a real app, import authService and call it
      // But we will pass the actual function in onConfirm for separation of concerns
      await onConfirm();
      setSuccessMsg("Account deleted successfully!");
      // The parent will handle redirect and logout after success
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
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
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting && !successMsg) onClose(); }}
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
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 z-10 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 mb-2">
          Delete Account?
        </h2>
        <p className="text-slate-500 mb-6">
          Your account will be permanently deleted after 30 days. You can cancel this within 30 days by contacting support.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <>
            <div className="mb-6 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-slate-900"
                placeholder="DELETE"
                disabled={isDeleting}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="danger"
                className="w-full bg-red-600 hover:bg-red-700 text-white border-none h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={isDeleting || inputValue !== "DELETE"}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </Button>
              <Button
                variant="secondary"
                className="w-full h-12"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-violet-600' : 'bg-slate-200'
    }`}
    onClick={onChange}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Settings Page
// ─────────────────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { data, refetch } = useDashboardContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Dummy states for UI
  const [theme, setTheme] = useState('light');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  
  const initialGoal = data?.dailyGoal?.total?.toString() || '3';
  const [dailyGoal, setDailyGoal] = useState(initialGoal);

  useEffect(() => {
    if (data?.dailyGoal?.total) {
      setDailyGoal(data.dailyGoal.total.toString());
    }
  }, [data?.dailyGoal?.total]);

  const handleDailyGoalChange = async (e) => {
    const newGoal = e.target.value;
    setDailyGoal(newGoal); // Optimistic UI update
    try {
      await authService.updateSettings({ daily_quiz_goal: parseInt(newGoal, 10) });
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      console.error("Failed to update daily goal:", err);
      // Revert on error
      if (data?.dailyGoal?.total) {
        setDailyGoal(data.dailyGoal.total.toString());
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteConfirm = async () => {
    await authService.deleteAccount();
    setTimeout(() => {
      logout();
      navigate("/login");
    }, 1500); // Wait so user sees the success message in the modal
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 mb-2">
            Settings
          </h1>
          <p className="text-base text-slate-500">
            Customize your QuizGen AI experience
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Appearance Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Palette className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-slate-900">Appearance</h3>
                    <p className="text-sm text-slate-500">Choose how QuizGen AI looks to you.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-violet-600 bg-violet-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Sun size={24} className={theme === 'light' ? 'text-violet-600' : 'text-slate-400'} />
                    <span className={`font-semibold ${theme === 'light' ? 'text-violet-700' : 'text-slate-600'}`}>Light Mode</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-violet-600 bg-violet-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Moon size={24} className={theme === 'dark' ? 'text-violet-600' : 'text-slate-400'} />
                    <span className={`font-semibold ${theme === 'dark' ? 'text-violet-700' : 'text-slate-600'}`}>Dark Mode</span>
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Bell className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-slate-900">Notifications</h3>
                    <p className="text-sm text-slate-500">Manage how we contact you.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive updates and reminders via email.</p>
                    </div>
                    <Toggle checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Push Notifications</p>
                      <p className="text-sm text-slate-500">Get notified on your device when a new quiz is ready.</p>
                    </div>
                    <Toggle checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Learning Preferences Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                    <BookOpen className="text-fuchsia-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-slate-900">Learning Preferences</h3>
                    <p className="text-sm text-slate-500">Tailor your learning experience.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">Daily Quiz Goal</p>
                      <p className="text-sm text-slate-500">Number of quizzes to complete each day.</p>
                    </div>
                    <select 
                      value={dailyGoal}
                      onChange={handleDailyGoalChange}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 font-medium text-slate-700 w-full sm:w-auto"
                    >
                      <option value="1">1 Quiz / Day</option>
                      <option value="3">3 Quizzes / Day</option>
                      <option value="5">5 Quizzes / Day</option>
                      <option value="10">10 Quizzes / Day</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* About Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
            <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Info className="text-slate-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-slate-900">About QuizGen AI</h3>
                    <p className="text-sm text-slate-500">Version 1.0.0 (Beta)</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-violet-600 hover:bg-violet-50">
                  Release Notes <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
            <Card className="p-0 overflow-hidden border-red-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 sm:p-8 bg-red-50/30">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-100">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-space-grotesk text-red-700">Account Actions</h3>
                    <p className="text-sm text-red-500/80">Manage your session and account data.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 h-12 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 h-12 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={18} />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPage;
