export const formatCurrency = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(numAmount || 0);
};

// IST timezone constant
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format date and time in IST (UTC+5:30)
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format date only in IST (UTC+5:30)
 */
export const formatDateOnly = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format time only in IST (UTC+5:30)
 */
export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format date and time separately in IST (UTC+5:30)
 * Returns { date: string, time: string }
 */
export const formatDateTime = (date) => {
  if (!date) return { date: '', time: '' };
  const dateObj = new Date(date);
  return {
    date: dateObj.toLocaleDateString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short'
    }),
    time: dateObj.toLocaleTimeString('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};