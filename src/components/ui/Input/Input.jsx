import React from "react";

const Input = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  leftIcon: LeftIcon,
  rightIcon,
  error,
  helperText,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full rounded-xl border border-slate-200 bg-white
            py-3
            ${LeftIcon ? "pl-11" : "pl-4"}
            ${rightIcon ? "pr-11" : "pr-4"}
            text-sm text-slate-800
            outline-none
            transition-all duration-300
            focus:border-violet-500
            focus:ring-4
            focus:ring-violet-100
            ${error ? "border-red-500 focus:ring-red-100" : ""}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-2 text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;