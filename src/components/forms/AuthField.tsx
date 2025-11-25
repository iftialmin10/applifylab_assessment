import type { ChangeEvent } from "react";

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export function AuthField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  wrapperClassName = "_social_login_form_input _mar_b14",
  labelClassName = "_social_login_label _mar_b8",
  inputClassName = "form-control _social_login_input",
}: AuthFieldProps) {
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={wrapperClassName}>
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={inputClassName}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error && (
        <p id={describedBy} className="_form_error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
