import { useState } from "react";
import SignupForm from "./SignupForm";
import OtpVerification from "./OtpVerification";

const SignupFlow = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const handleSignupSuccess = (userEmail) => {
    setEmail(userEmail);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <>
      {step === 1 && <SignupForm onSuccess={handleSignupSuccess} />}
      {step === 2 && <OtpVerification email={email} onBack={handleBack} />}
    </>
  );
};

export default SignupFlow;
