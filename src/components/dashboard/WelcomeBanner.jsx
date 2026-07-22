import Button from "../ui/Button/Button";
import Card from "../ui/Card/Card";

const WelcomeBanner = ({ user, isNewUser }) => {
  return (
    <Card className="relative overflow-hidden bg-violet-50 border-violet-100 p-8 h-full flex flex-col justify-center">
      <div className="relative z-10 max-w-md">
        <p className="text-sm font-medium text-app-muted mb-2">
          {isNewUser ? "Welcome," : "Welcome back,"}
        </p>
        <h2 className="text-3xl font-bold font-space-grotesk text-app mb-4 flex items-center gap-2">
          {user?.full_name || user?.username || "Student"}{" "}
          <span className="text-2xl">{isNewUser ? "🎉" : "👋"}</span>
        </h2>
        <p className="text-app-2 mb-8 text-sm leading-relaxed">
          {isNewUser
            ? "You're all set! Start your first quiz to begin your learning journey."
            : "Keep learning, stay consistent and achieve your goals!"}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Explore Quizzes</Button>
        </div>
      </div>

    </Card>
  );
};

export default WelcomeBanner;

