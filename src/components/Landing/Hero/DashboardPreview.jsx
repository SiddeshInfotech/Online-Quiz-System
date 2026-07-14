import { motion } from "framer-motion";
import Card from "../../ui/Card";

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Card
        hover
        className="overflow-hidden rounded-3xl p-6 shadow-xl"
      >
        <div className="space-y-5">

          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Dashboard
            </h3>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-600">
              Online
            </span>
          </div>

          <div className="rounded-2xl bg-violet-600 p-6 text-white">
            <h2 className="text-lg font-semibold">
              AI Quiz Generator
            </h2>

            <button className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-medium text-violet-600 transition hover:scale-105">
              Generate Quiz
            </button>
          </div>

          <div className="space-y-3">
            {["Python Basics", "React Quiz", "Java OOP"].map((quiz) => (
              <div
                key={quiz}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50"
              >
                <span>{quiz}</span>

                <span className="text-xs text-slate-400">
                  Ready
                </span>
              </div>
            ))}
          </div>

        </div>
      </Card>
    </motion.div>
  );
}

export default DashboardPreview;