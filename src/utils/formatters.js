export const formatCurrency = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(numAmount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN');
};