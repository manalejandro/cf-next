import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const baseInput =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--cf-orange)] focus:outline-none disabled:opacity-50";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <input ref={ref} className={`${baseInput} ${error ? "border-[var(--color-error)]" : ""} ${className}`} {...props} />
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <select
        className={`${baseInput} appearance-none cursor-pointer ${error ? "border-[var(--color-error)]" : ""} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#1c2128" }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`${baseInput} resize-none ${error ? "border-[var(--color-error)]" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
