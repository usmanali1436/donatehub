export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateProgress = (raised, goal) => {
  if (!goal || goal === 0) return 0;
  return Math.min((raised / goal) * 100, 100);
};

export const formatProgress = (raised, goal) => {
  const percentage = calculateProgress(raised, goal);
  return `${Math.round(percentage)}%`;
};

export const getCategoryIcon = (category) => {
  const icons = {
    health: '🏥',
    education: '🎓',
    disaster: '🌪️',
    others: '💝',
  };
  return icons[category] || icons.others;
};

export const getCategoryColor = (category) => {
  const colors = {
    health: 'bg-red-100 text-red-800',
    education: 'bg-blue-100 text-blue-800',
    disaster: 'bg-yellow-100 text-yellow-800',
    others: 'bg-purple-100 text-purple-800',
  };
  return colors[category] || colors.others;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const debounce = (func, delay) => {
  let timeoutId;
  const debouncedFunction = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
  
  debouncedFunction.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debouncedFunction;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const generateInitials = (name) => {
  if (!name) return 'U';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

export const isNGO = (user) => user?.role === 'ngo';
export const isDonor = (user) => user?.role === 'donor';

export const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
};