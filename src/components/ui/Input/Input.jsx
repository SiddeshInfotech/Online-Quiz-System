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
          className="mb-2 block text-sm font-medium text-app-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted"
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
            w-full rounded-xl border border-app surface
            py-3
            ${LeftIcon ? "pl-11" : "pl-4"}
            ${rightIcon ? "pr-11" : "pr-4"}
            text-sm text-app
            outline-none
            transition-all duration-300
            placeholder:text-app-muted
            focus:border-[var(--accent)]
            focus:ring-4
            focus:ring-[var(--accent-soft)]
            ${error ? "border-red-500 focus:ring-red-500/20" : ""}
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
        <p className="mt-2 text-xs text-app-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;