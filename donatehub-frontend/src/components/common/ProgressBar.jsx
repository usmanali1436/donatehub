import React from 'react';
import clsx from 'clsx';
import { calculateProgress } from '../../utils/helpers';

const ProgressBar = ({ 
  current, 
  target, 
  className,
  showLabels = true,
  size = 'md' 
}) => {
  const progress = calculateProgress(current, target);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>${current?.toLocaleString() || 0} raised</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={clsx('bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Goal: ${target?.toLocaleString() || 0}</span>
          <span>${((target || 0) - (current || 0)).toLocaleString()} to go</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;