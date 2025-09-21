import React from 'react';
import clsx from 'clsx';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = 'md',
  closeOnOverlayClick = true 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div 
        className={clsx(
          'bg-white rounded-lg shadow-xl w-full animate-fade-in',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className, ...props }) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
);

const ModalContent = ({ children, className, ...props }) => (
  <div className={clsx('mb-6', className)} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ children, className, ...props }) => (
  <div className={clsx('flex justify-end space-x-3', className)} {...props}>
    {children}
  </div>
);

Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;

export default Modal;