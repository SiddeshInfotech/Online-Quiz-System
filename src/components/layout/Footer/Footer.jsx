import { Link } from "react-router-dom";
import Container from "../../ui/Container";

function Footer() {
  return (
    <footer className="border-t border-app surface py-12 text-app transition-colors">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-app">
          {/* Branding */}
          <div className="md:col-span-5 space-y-3">
            <h2 className="text-xl font-bold font-space-grotesk text-violet-600 dark:text-violet-400">
              QuizGen AI
            </h2>
            <p className="text-sm text-app-muted max-w-sm leading-relaxed">
              AI-powered quiz generation platform. Create, practice, and master subjects with real-time feedback and intelligent assessments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Platform</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">About Us</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">How It Works</a>
              </li>
              <li>
                <Link to="/contact" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Legal & Privacy</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/contact" className="text-app-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Help & FAQ</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-app-muted">
          <p>© {new Date().getFullYear()} QuizGen AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-app transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-app transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-app transition-colors">Contact</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;