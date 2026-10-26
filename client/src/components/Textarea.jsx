import React from 'react';

const Textarea = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const textareaId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed px-3 py-2 ${
          error
            ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
            : 'border-slate-300 bg-white text-slate-800'
        }`}
        {...props}
      />

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Textarea;
