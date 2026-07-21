import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const TermsOfServicePage = () => {
  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content:
        "By accessing or using QuizGen AI ('Service', 'Platform', 'we', 'us', or 'our'), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use our platform. We reserve the right to update these terms at any time, and continued use signifies acceptance of any changes.",
    },
    {
      id: "responsibilities",
      title: "2. User Responsibilities",
      content:
        "As a user of QuizGen AI, you agree to provide accurate registration information, maintain the security of your password, and accept responsibility for all activities that occur under your account. You must not use the platform for unauthorized, illegal, or abusive purposes.",
    },
    {
      id: "quiz-usage",
      title: "3. Quiz Usage & Practice",
      content:
        "QuizGen AI provides interactive quizzes, practice assessments, and learning analytics designed for educational and self-assessment purposes. You may attempt quizzes, review performance history, and track scores in accordance with platform limits.",
    },
    {
      id: "ai-content",
      title: "4. AI-Generated Content",
      content:
        "Quizzes generated via AI algorithms are produced based on user-provided prompts, specified subjects, and machine learning models. While we continuously strive for factual accuracy and quality, QuizGen AI does not guarantee 100% accuracy of all generated questions and explanations. Users are encouraged to verify critical technical information.",
    },
    {
      id: "privacy",
      title: "5. Privacy & Data Handling",
      content:
        "Your privacy is important to us. Our collection and use of personal data, account information, and quiz analytics are governed by our Privacy Policy. By using QuizGen AI, you consent to data collection as described in our Privacy Policy.",
    },
    {
      id: "suspension",
      title: "6. Account Suspension & Termination",
      content:
        "We reserve the right to suspend, disable, or terminate user accounts that violate our terms, engage in fraudulent activity, attempt automated scraping, or breach platform integrity without prior notice.",
    },
    {
      id: "ip",
      title: "7. Intellectual Property",
      content:
        "All software, trademarks, logos, branding, user interface designs, and platform graphics are the exclusive intellectual property of QuizGen AI. User-submitted quiz attempts and performance records remain associated with your profile for system reporting.",
    },
    {
      id: "limitation",
      title: "8. Limitation of Liability",
      content:
        "To the maximum extent permitted by law, QuizGen AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to access the platform, quiz content errors, or service interruptions.",
    },
    {
      id: "contact",
      title: "9. Contact Information",
      content:
        "If you have any questions or concerns regarding these Terms of Service, please contact our support team at support@quizgen.ai or visit our Contact page.",
    },
  ];

  return (
    <div className="min-h-screen surface-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
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
            Last Updated: July 2026
          </div>
        </motion.div>

        {/* Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface rounded-3xl p-8 md:p-10 border border-app shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center gap-3 text-violet-600 dark:text-violet-400 mb-3">
            <FileText size={28} />
            <span className="text-xs font-bold uppercase tracking-wider surface-elev px-3 py-1 rounded-full border border-app">
              Legal Documentation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk text-app mb-3">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base text-app-muted leading-relaxed">
            Please read these Terms of Service carefully before using the QuizGen AI platform. These terms outline your rights and obligations when taking quizzes, generating AI assessments, and interacting with our service.
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
              className="surface rounded-2xl p-6 md:p-8 border border-app shadow-sm hover:border-violet-500/30 transition-all duration-200"
            >
              <h2 className="text-lg font-bold font-space-grotesk text-app mb-3">
                {section.title}
              </h2>
              <p className="text-sm text-app-2 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        {/* Footer Support Banner */}
        <div className="surface-elev rounded-2xl p-6 border border-app flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle size={22} className="text-violet-600 dark:text-violet-400" />
            <div>
              <p className="text-sm font-bold text-app">Have questions about our terms?</p>
              <p className="text-xs text-app-muted">Reach out to our support team for clarification.</p>
            </div>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all whitespace-nowrap"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
