import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import aiQuizService from "../../services/aiQuizService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  BookOpen,
  BarChart3,
  HelpCircle,
  Hash,
  FileText,
  ChevronDown,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAMMING_SUBJECTS = [
  "C", "C++", "C#", "Java", "Python", "JavaScript", "TypeScript",
  "React", "Node.js", "Express.js", "Django", "Flask", "Spring Boot",
  "HTML", "CSS", "SQL", "MongoDB", "PostgreSQL", "Git & GitHub",
  "Data Structures", "Algorithms", "OOP", "DBMS", "Operating Systems",
  "Computer Networks", "AI & Machine Learning", "Cyber Security", "Cloud Computing",
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const QUIZ_MODE_OPTIONS = ["Theory", "Coding"];
const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20, 25];

const DIFFICULTY_META = {
  Easy: { desc: "Foundational", color: "text-emerald-600" },
  Medium: { desc: "Intermediate", color: "text-amber-600" },
  Hard: { desc: "Advanced", color: "text-red-600" },
};

const MODE_META = {
  Theory: {},
  Coding: {},
};

// ─── Field Label ──────────────────────────────────────────────────────────────

const FieldLabel = ({ label }) => (
  <label className="block text-sm font-semibold text-app-2 mb-2.5">
    {label}
  </label>
);

// ─── Inline Error ─────────────────────────────────────────────────────────────

const ErrorMsg = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        key="err"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1.5"
      >
        <span className="w-4 h-4 rounded-full bg-red-100 inline-flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-red-600">
          !
        </span>
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── Searchable Subject Dropdown ──────────────────────────────────────────────

const SubjectDropdown = ({ value, onChange, hasError }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = PROGRAMMING_SUBJECTS.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (subject) => {
    onChange(subject);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        id="subject"
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 80);
        }}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium
          surface transition-all duration-200 text-left
          focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
          hover:border-violet-300 active:scale-[0.995]
          ${hasError
            ? "border-red-300 bg-red-50/20 focus:border-red-400 focus:ring-red-400/20"
            : "border-app"
          }
        `}
      >
        <span className={value ? "text-app" : "text-app-muted"}>
          {value || "Select a subject…"}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-app-muted" />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 mt-1.5 w-full surface border border-app rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-app sticky top-0 surface">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg surface-subtle border border-app">
                <Search size={13} className="text-app-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subjects…"
                  className="flex-1 text-sm bg-transparent focus:outline-none text-app-2 placeholder:text-app-muted"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-app-muted hover:text-app-2 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <ul className="max-h-52 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-app-muted text-center">No subjects found</li>
              ) : (
                filtered.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => handleSelect(s)}
                      className={`
                        w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                        ${s === value
                          ? "bg-violet-600 text-white font-semibold"
                          : "text-app-2 hover:bg-violet-50 hover:text-violet-700"
                        }
                      `}
                    >
                      {s}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Equal-Width Pill Selector ────────────────────────────────────────────────

const PillSelector = ({ options, value, onChange, metaMap, hasError, fullWidth = false }) => (
  <div
    className={`flex gap-2.5 p-3 rounded-xl border transition-all duration-200 ${hasError ? "border-red-300 bg-red-50/20" : "border-app surface-subtle"}
      } ${fullWidth ? "flex-col sm:flex-row" : ""}`}
  >
    {options.map((opt) => {
      const meta = metaMap?.[opt];
      const isSelected = value === opt;
      const isDisabled = meta?.disabled;
      return (
        <button
          key={opt}
          type="button"
          disabled={isDisabled}
          onClick={() => onChange(opt)}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400/30
            ${isDisabled ? "opacity-60 cursor-not-allowed surface-subtle text-app-muted border-app" : "active:scale-95"}
            ${!isDisabled && isSelected
              ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/30 scale-[1.02]"
              : !isDisabled
              ? "surface text-app-2 border-app hover:border-violet-300 hover:text-violet-700 hover:bg-[var(--accent-soft)] hover:shadow-sm"
              : ""
            }
          `}
        >
          {meta?.emoji && <span className="text-base leading-none">{meta.emoji}</span>}
          <span>{opt}</span>
          {meta?.badge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${isSelected ? 'bg-violet-500 text-white' : 'surface-elev text-app-2'}`}>
              {meta.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const GeneratingOverlay = () => (
  <motion.div
    key="overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm rounded-3xl" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)' }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      className="mb-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
        <Sparkles size={26} className="text-white" />
      </div>
    </motion.div>
    <p className="text-base font-bold font-space-grotesk text-app mb-1">Generating with AI…</p>
    <p className="text-xs text-app-muted">Crafting your personalized quiz</p>

    {/* Animated dots */}
    <div className="flex gap-1.5 mt-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const GenerateQuizPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    subject: "", difficulty: "", quizMode: "Theory", numQuestions: "", prompt: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedQuizId, setGeneratedQuizId] = useState(null);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.subject) e.subject = "Please select a programming subject.";
    if (!form.difficulty) e.difficulty = "Please select a difficulty level.";
    if (!form.quizMode) e.quizMode = "Please select a quiz mode.";
    if (!form.numQuestions) {
      e.numQuestions = "Please enter the number of questions.";
    }
    return e;
  };

  /** Extract a human-readable message from an Axios error. */
  const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Something went wrong. Please try again.";
    if (typeof data === "string") return data;
    if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    if (data.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
    if (data.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    // Join all field-level messages
    try {
      const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`);
      return msgs.join(" | ");
    } catch {
      return JSON.stringify(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all as touched so inline errors appear
    setTouched({ subject: true, difficulty: true, quizMode: true, numQuestions: true });
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);
    setGenerated(false);
    setApiError("");
    setGeneratedQuizId(null);

    try {
      const data = await aiQuizService.generateQuiz({
        subject: form.subject,
        difficulty: form.difficulty,
        quiz_mode: form.quizMode,
        number_of_questions: form.numQuestions,
        prompt_topic: form.prompt.trim(),
      });

      if (data && data.success === true) {
        const quizId = data.quiz_id;
        setGeneratedQuizId(quizId);
        setSuccessMessage(data.message || "Quiz Generated Successfully!");
        setGenerated(true);
        navigate(`/quiz/${quizId}`, { state: { from_ai: true } });
      } else {
        setApiError(data?.message || "Quiz generation failed");
      }
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Stagger children animation variants
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        {/* Glow badge + title row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            {/* Glow halo */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-lg opacity-40 scale-110" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Sparkles size={22} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk text-app leading-tight">
              Generate AI Quiz
            </h1>
            <p className="text-sm text-app-muted mt-0.5">
              Create personalized quizzes in seconds using AI.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Success Banner ── */}
      <AnimatePresence>
        {generated && generatedQuizId && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
              <p className="text-xs text-emerald-600 mt-0.5 mb-2">
                Your <strong>{form.numQuestions}-question {form.quizMode}</strong> quiz on{" "}
                <strong>{form.subject}</strong> ({form.difficulty}) is ready.
              </p>
              <Link
                to={`/quiz/${generatedQuizId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                View Quiz Details
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── API Error Banner ── */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            key="api-error"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-bold text-base">!</span>
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Generation Failed</p>
              <p className="text-xs text-red-600 mt-0.5">{apiError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">

        {/* ── Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Card className="p-0 overflow-hidden border border-app shadow-sm relative">

            {/* Generating overlay */}
            <AnimatePresence>
              {isGenerating && <GeneratingOverlay key="gen-overlay" />}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate>
              <motion.div
                className="p-6 sm:p-8 flex flex-col gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >

                {/* ── Subject ── */}
                <motion.div variants={itemVariants}>
                  <FieldLabel icon={BookOpen} label="Programming Subject" required />
                  <SubjectDropdown
                    value={form.subject}
                    onChange={(v) => setField("subject", v)}
                    hasError={!!errors.subject}
                  />
                  <ErrorMsg msg={errors.subject} />
                </motion.div>

                {/* ── Difficulty ── */}
                <motion.div variants={itemVariants}>
                  <FieldLabel icon={BarChart3} label="Difficulty" required />
                  <PillSelector
                    options={DIFFICULTY_OPTIONS}
                    value={form.difficulty}
                    onChange={(v) => setField("difficulty", v)}
                    metaMap={DIFFICULTY_META}
                    hasError={!!errors.difficulty}
                    fullWidth
                  />
                  <ErrorMsg msg={errors.difficulty} />
                </motion.div>

                {/* ── Quiz Mode ── */}
                <motion.div variants={itemVariants}>
                  <FieldLabel icon={HelpCircle} label="Quiz Mode" required />
                  <PillSelector
                    options={QUIZ_MODE_OPTIONS}
                    value={form.quizMode}
                    onChange={(v) => setField("quizMode", v)}
                    metaMap={MODE_META}
                    hasError={!!errors.quizMode}
                    fullWidth
                  />
                  <ErrorMsg msg={errors.quizMode} />
                </motion.div>

                {/* ── Number of Questions ── */}
                <motion.div variants={itemVariants}>
                  <FieldLabel icon={Hash} label="Number of Questions" required />
                  <PillSelector
                    options={NUM_QUESTIONS_OPTIONS}
                    value={form.numQuestions}
                    onChange={(v) => setField("numQuestions", v)}
                    hasError={!!errors.numQuestions}
                    fullWidth
                  />
                  <ErrorMsg msg={errors.numQuestions} />
                </motion.div>

                {/* ── Topic / Prompt ── */}
                <motion.div variants={itemVariants}>
                  <FieldLabel icon={FileText} label="Topic / Prompt" />
                  <div className="relative">
                    <textarea
                      id="prompt"
                      rows={3}
                      value={form.prompt}
                      onChange={(e) => setField("prompt", e.target.value)}
                      placeholder="e.g. 'Focus on recursion and tree traversal' or paste a code snippet…"
                      className="
                        w-full px-4 py-3 rounded-xl border border-app text-sm text-app-2
                        surface placeholder:text-app-muted resize-none
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                        hover:border-violet-300
                      "
                    />
                  </div>
                </motion.div>

                {/* ── Divider ── */}
                <div className="border-t border-app" />

                {/* ── Submit row ── */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4"
                >
                  {/* Generate button with shimmer glow */}
                  <div className="relative group">
                    {/* Glow effect behind button */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 scale-105" />
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isGenerating}
                      className="relative gap-3 min-w-[220px] h-13 justify-center text-base font-bold tracking-wide"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>

              </motion.div>
            </form>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default GenerateQuizPage;
