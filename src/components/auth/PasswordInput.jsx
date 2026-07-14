import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import Input from "../ui/Input";

const PasswordInput = ({
  label = "Password",
  name = "password",
  value,
  onChange,
  placeholder = "Enter your password",
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      label={label}
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      leftIcon={Lock}
      error={error}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-400 transition hover:text-violet-600"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      }
    />
  );
};

export default PasswordInput;