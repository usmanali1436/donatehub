import React from 'react';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };

  return (
    <div className={clsx('flex justify-center items-center', className)}>
      <svg
        className={clsx(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export const PageLoading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

export const ComponentLoading = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <LoadingSpinner />
    <p className="mt-2 text-sm text-gray-600">{message}</p>
  </div>
);

export default LoadingSpinner;