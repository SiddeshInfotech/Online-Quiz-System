import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";

const PrivacyPolicyPage = () => {
  const sections = [
    {
      id: "info-collect",
      title: "1. Information We Collect",
      content:
        "QuizGen AI collects information necessary to provide, improve, and secure our interactive quiz and learning services. This includes personal identification details provided during registration and technical data automatically recorded during platform interaction.",
    },
    {
      id: "account-data",
      title: "2. Account Data",
      content:
        "When you create an account, we collect your full name, username, email address, and encrypted password. You may optionally update profile details such as educational institution, grade level, and avatar information.",
    },
    {
      id: "quiz-data",
      title: "3. Quiz & Performance Data",
      content:
        "We log quiz attempt histories, selected option IDs, completion times, accuracy percentages, earned points, and unlocked badges to render your personal analytics dashboard, leaderboard statistics, and progress tracking.",
    },
    {
      id: "cookies",
      title: "4. Cookies & Local Storage",
      content:
        "QuizGen AI uses cookies and browser local storage to maintain authenticated sessions, store your preferred theme (dark/light mode), and save transient quiz answers to prevent data loss during network disruptions.",
    },
    {
      id: "security",
      title: "5. Data Security",
      content:
        "We enforce industry-standard security protocols including HTTPS encryption in transit, hashed passwords, secure API authentication tokens, and strict access controls to safeguard your data against unauthorized access.",
    },
    {
      id: "third-party",
      title: "6. Third-Party Services",
      content:
        "We may integrate verified third-party authentication services (such as Google OAuth) and analytics tools. These providers process data in accordance with their independent privacy policies.",
    },
    {
      id: "data-retention",
      title: "7. Data Retention",
      content:
        "Your account data and quiz history are retained for as long as your account remains active. You may request account deletion at any time via your Settings page or by contacting support.",
    },
    {
      id: "user-rights",
      title: "8. User Rights",
      content:
        "You have the right to access, update, export, or delete your personal information stored on QuizGen AI. You can update your profile information directly from your Profile settings.",
    },
    {
      id: "contact",
      title: "9. Contact Information",
      content:
        "For privacy inquiries, data deletion requests, or questions about data handling, please reach out to our privacy officer at privacy@quizgen.ai or via our Contact page.",
    },
  ];

  return (
    <div className="min-h-screen surface-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-app"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="text-xs text-app-muted font-medium">
            Effective Date: July 2026
          </div>
        </motion.div>

        {/* Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface rounded-3xl p-8 md:p-10 border border-app shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
            <Shield size={28} />
            <span className="text-xs font-bold uppercase tracking-wider surface-elev px-3 py-1 rounded-full border border-app">
              Privacy & Protection
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk text-app mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base text-app-muted leading-relaxed">
            QuizGen AI values your trust. This Privacy Policy details how we collect, protect, and process your personal information and quiz data across our application.
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="surface rounded-2xl p-6 md:p-8 border border-app shadow-sm hover:border-emerald-500/30 transition-all duration-200"
            >
              <h2 className="text-lg font-bold font-space-grotesk text-app mb-3 flex items-center gap-2">
                {section.title}
              </h2>
              <p className="text-sm text-app-2 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        {/* Support Banner */}
        <div className="surface-elev rounded-2xl p-6 border border-app flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock size={22} className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-app">Questions about your data?</p>
              <p className="text-xs text-app-muted">Contact our data protection team anytime.</p>
            </div>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all whitespace-nowrap"
          >
            Contact Privacy Team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
