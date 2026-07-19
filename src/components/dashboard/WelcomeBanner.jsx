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

      {/* Placeholder for 3D Illustration */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 min-w-[200px] flex items-center justify-center opacity-90 pointer-events-none">
        {/* Abstract shapes as placeholder for Target 3D illustration */}
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-[16px] border-violet-400 shadow-xl flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-[12px] border-white bg-violet-600 shadow-inner flex items-center justify-center">
              <div className="w-4 h-4 rounded-full surface"></div>
            </div>
          </div>
          {/* Decorative star */}
          <div className="absolute top-4 left-4 w-6 h-6 bg-amber-400 rotate-45 flex items-center justify-center rounded-sm">
            <div className="w-full h-full bg-amber-200 rounded-full scale-50"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeBanner;

