import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  className,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error 
      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 bg-white hover:border-gray-400',
    props.disabled && 'bg-gray-50 cursor-not-allowed',
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;