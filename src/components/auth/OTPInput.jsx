import { useRef, useState, useEffect } from "react";

const OTPInput = ({ length = 6, value, onChange, error }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value && value.length === length) {
      setOtp(value.split(""));
    }
  }, [value, length]);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    // take the last character in case of multiple digits
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    const combinedOtp = newOtp.join("");
    onChange(combinedOtp);

    // move to next input if current is filled
    if (val && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // move to previous if current is empty and backspace is pressed
        inputRefs.current[index - 1].focus();
      } else if (otp[index]) {
        // clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (!pastedData || isNaN(pastedData)) return;

    const newOtp = [...otp];
    const pasteLength = Math.min(pastedData.length, length);
    
    for (let i = 0; i < pasteLength; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // focus on the next empty input or the last one
    const focusIndex = pasteLength < length ? pasteLength : length - 1;
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between gap-2">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            ref={(ref) => (inputRefs.current[index] = ref)}
            value={data}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl border surface text-center text-xl font-semibold text-app shadow-sm outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-app hover:border-slate-300"
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default OTPInput;
