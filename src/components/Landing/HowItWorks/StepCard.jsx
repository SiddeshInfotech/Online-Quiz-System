import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthModal } from "../../../context/AuthModalContext";

function StepCard({ icon, title, description }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      if (openModal) {
        openModal("signup");
      }
      navigate("/signup");
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className="interactive-glow rounded-3xl border border-app surface-elev p-8 shadow-sm hover:shadow-xl hover:border-[var(--accent)] cursor-pointer"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>

      <h3 className="mb-3 text-xl font-semibold text-app">
        {title}
      </h3>

      <p className="leading-7 text-app-2">
        {description}
      </p>
    </motion.div>
  );
}

export default StepCard;