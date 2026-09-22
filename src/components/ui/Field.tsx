import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children?: ReactNode;
}

function FieldShell({ label, error, hint, optional, htmlFor, children }: BaseProps & { htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-mute">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-mute">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({ id, label, error, hint, optional, className = '', ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} optional={optional} htmlFor={id}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field ${error ? 'field-error' : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextArea({ id, label, error, hint, optional, className = '', ...rest }: TextAreaProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} optional={optional} htmlFor={id}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`field min-h-[96px] resize-y ${error ? 'field-error' : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
}
