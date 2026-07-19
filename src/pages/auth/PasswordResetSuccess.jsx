import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

import Logo from "../../components/ui/Logo";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";


const PasswordResetSuccess = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <Card className="relative rounded-3xl border border-app surface p-8 shadow-xl lg:p-10">
        <div className="absolute right-6 top-6">

        </div>

        <Logo className="mb-8" />

        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle
              size={42}
              className="text-green-600"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="font-space-grotesk text-3xl font-bold text-app">
            Password Updated!
          </h2>

          <p className="mt-3 text-sm leading-6 text-app-muted">
            Your password has been reset successfully.
            <br />
            You can now sign in with your new password.
          </p>
        </div>

        <Link to="/login" className="block mt-8 w-full">
          <Button className="w-full">
            Back to Login
          </Button>
        </Link>
      </Card>
    </motion.div>
  );
};

export default PasswordResetSuccess;
