import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supportService from "../../services/supportService";

const VALID_CATEGORIES = [
  "General Inquiry",
  "Technical Support",
  "Feature Request",
  "Bug Report",
];

const faqs = [
  {
    question: "How does AI quiz generation work?",
    answer:
      "QuizGen AI uses advanced LLM algorithms to parse your prompt, topic, or subject matter and generate structured multiple-choice questions complete with instant options, correct answers, and educational explanations.",
  },
  {
    question: "Can I track my quiz performance and attempts?",
    answer:
      "Yes! Every attempt is automatically recorded. You can view overall accuracy, total points earned, completed quizzes, detailed attempt reviews, and unlocked achievement badges on your personal dashboard.",
  },
  {
    question: "Is QuizGen AI free to use?",
    answer:
      "QuizGen AI offers a comprehensive free tier with access to standard library quizzes, attempt tracking, leaderboard rankings, and AI quiz generation.",
  },
  {
    question: "How are leaderboard rankings calculated?",
    answer:
      "Leaderboard rankings update in real-time. Each correct answer earned in completed quizzes awards 1 point toward your overall user rank.",
  },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General Inquiry",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for edited field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    if (networkError) setNetworkError(null);
  };

  const validateClient = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    if (!formData.subject.trim()) {
      errs.subject = "Subject is required.";
    }

    if (!formData.category) {
      errs.category = "Category is required.";
    }

    if (!formData.message.trim()) {
      errs.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessToast(null);
    setNetworkError(null);

    if (!validateClient()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
      };

      await supportService.contactSupport(payload);

      // Show modern success toast
      setSuccessToast(
        "Thank you for reaching out! Your message has been sent successfully. We will get back to you shortly."
      );

      // Clear all form fields & reset dropdown to General Inquiry
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "General Inquiry",
        message: "",
      });
      setFieldErrors({});
    } catch (err) {
      console.error("Contact support submit failed:", err);
      if (err.response && err.response.status === 400 && err.response.data) {
        // Backend validation errors (e.g. { email: ["..."], message: ["..."] })
        const backendErrs = {};
        Object.entries(err.response.data).forEach(([key, msgs]) => {
          backendErrs[key] = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
        });
        setFieldErrors(backendErrs);
      } else {
        // Network / 500 error: Do not clear form data
        setNetworkError("Unable to send your message right now. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen surface-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation & Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between pb-4 border-b border-app"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider border border-violet-500/20">
            <MessageSquare size={14} />
            Get in Touch
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk text-app">
            We'd Love to Hear From You
          </h1>
          <p className="text-sm md:text-base text-app-muted leading-relaxed">
            Have questions about QuizGen AI, feature requests, or need technical assistance? Drop us a message below.
          </p>
        </motion.div>

        {/* Grid Layout: Contact Info Cards + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Contact Information & Cards */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="surface rounded-3xl p-6 md:p-8 border border-app shadow-sm space-y-6">
              <h2 className="text-xl font-bold font-space-grotesk text-app pb-3 border-b border-app">
                Contact Information
              </h2>

              <div className="space-y-5">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Email Us</p>
                    <a
                      href="mailto:support@quizgen.ai"
                      className="text-sm font-semibold text-app hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      uidssvps
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Call Us</p>
                    <p className="text-sm font-semibold text-app">94222 85212</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Interactive Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="surface rounded-3xl p-6 md:p-8 border border-app shadow-sm">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <h2 className="text-xl font-bold font-space-grotesk text-app pb-3 border-b border-app">
                  Send Us a Message
                </h2>

                {/* Success Toast */}
                <AnimatePresence>
                  {successToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-3 shadow-sm"
                    >
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                      <div className="flex-1">{successToast}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Network / Server Error Toast */}
                <AnimatePresence>
                  {networkError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-3 shadow-sm"
                    >
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <div className="flex-1">{networkError}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-app-2 mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      disabled={isSubmitting}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      aria-label="Your Name"
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      className={`w-full h-11 px-4 text-sm surface-subtle border rounded-xl text-app outline-none focus:ring-2 transition-all disabled:opacity-50 ${fieldErrors.name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-app focus:border-violet-500 focus:ring-violet-500/20"
                        }`}
                    />
                    {fieldErrors.name && (
                      <p id="name-error" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-app-2 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      disabled={isSubmitting}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      aria-label="Email Address"
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`w-full h-11 px-4 text-sm surface-subtle border rounded-xl text-app outline-none focus:ring-2 transition-all disabled:opacity-50 ${fieldErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-app focus:border-violet-500 focus:ring-violet-500/20"
                        }`}
                    />
                    {fieldErrors.email && (
                      <p id="email-error" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subject Input */}
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold text-app-2 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      name="subject"
                      disabled={isSubmitting}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      aria-label="Subject"
                      aria-invalid={!!fieldErrors.subject}
                      aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                      className={`w-full h-11 px-4 text-sm surface-subtle border rounded-xl text-app outline-none focus:ring-2 transition-all disabled:opacity-50 ${fieldErrors.subject
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-app focus:border-violet-500 focus:ring-violet-500/20"
                        }`}
                    />
                    {fieldErrors.subject && (
                      <p id="subject-error" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.subject}
                      </p>
                    )}
                  </div>

                  {/* Category Select */}
                  <div>
                    <label htmlFor="contact-category" className="block text-xs font-semibold text-app-2 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contact-category"
                      name="category"
                      disabled={isSubmitting}
                      value={formData.category}
                      onChange={handleChange}
                      aria-label="Category"
                      aria-invalid={!!fieldErrors.category}
                      aria-describedby={fieldErrors.category ? "category-error" : undefined}
                      className={`w-full h-11 px-4 text-sm surface-subtle border rounded-xl text-app outline-none focus:ring-2 transition-all cursor-pointer disabled:opacity-50 ${fieldErrors.category
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-app focus:border-violet-500 focus:ring-violet-500/20"
                        }`}
                    >
                      {VALID_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <p id="category-error" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.category}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-app-2 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    disabled={isSubmitting}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please write your detailed message or feedback (minimum 10 characters)..."
                    aria-label="Message"
                    aria-invalid={!!fieldErrors.message}
                    aria-describedby={fieldErrors.message ? "message-error" : undefined}
                    className={`w-full p-4 text-sm surface-subtle border rounded-xl text-app outline-none focus:ring-2 transition-all min-h-[130px] resize-y disabled:opacity-50 ${fieldErrors.message
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-app focus:border-violet-500 focus:ring-violet-500/20"
                      }`}
                  />
                  {fieldErrors.message && (
                    <p id="message-error" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="surface rounded-3xl p-6 md:p-10 border border-app space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-app">
            <HelpCircle size={24} className="text-violet-600 dark:text-violet-400" />
            <div>
              <h2 className="text-xl font-bold font-space-grotesk text-app">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-app-muted">Quick answers to common questions</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="surface-subtle rounded-2xl border border-app overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-app hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-xs md:text-sm text-app-muted leading-relaxed border-t border-app/50 pt-3"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
