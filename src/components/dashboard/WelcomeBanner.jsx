import { Link } from "react-router-dom";
import Button from "../ui/Button/Button";
import Card from "../ui/Card/Card";

const WelcomeBanner = ({ user, isNewUser }) => {
  const displayName = user?.full_name || user?.username || "Student";

  return (
    <Card className="relative overflow-hidden surface border border-app p-5 sm:p-6 h-full flex flex-col justify-between">
      <div className="relative z-10">
        <p className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1">
          {isNewUser ? "Welcome," : "Welcome back,"}
        </p>
        <h2 className="text-xl sm:text-2xl font-bold font-space-grotesk text-app mb-2 flex items-center gap-1.5 flex-wrap" title={displayName}>
          <span>{displayName}</span>
          <span className="text-xl shrink-0">{isNewUser ? "🎉" : "👋"}</span>
        </h2>
        <p className="text-app-2 text-xs leading-relaxed line-clamp-2 my-2 font-medium">
          {isNewUser
            ? "You're all set! Start your first quiz to begin your learning journey."
            : "Keep learning, stay consistent and achieve your goals!"}
        </p>
      </div>

      <div className="relative z-10 mt-auto pt-3">
        <Link to="/library">
          <Button variant="primary" size="sm" className="text-xs font-semibold px-4 py-2 hover:scale-105 transition-transform w-full sm:w-auto">
            Explore Quizzes
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default WelcomeBanner;
