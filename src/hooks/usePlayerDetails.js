export const usePlayerDetails = () => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (player) => {
    if (!player) return null;
    const status = player.status || 'active';
    const statusConfig = {
      active: {
        variant: 'default',
        text: 'Active',
        color: 'bg-green-100 text-green-800',
      },
      inactive: {
        variant: 'secondary',
        text: 'Inactive',
        color: 'bg-gray-100 text-gray-800',
      },
      suspended: {
        variant: 'destructive',
        text: 'Suspended',
        color: 'bg-red-100 text-red-800',
      },
    };
    return statusConfig[status] || statusConfig.active;
  };

  const getKYCBadge = (kycStatus) => {
    if (!kycStatus) return null;
    const kycConfig = {
      verified: { text: 'KYC Verified', color: 'bg-green-100 text-green-800' },
      pending: { text: 'KYC Pending', color: 'bg-yellow-100 text-yellow-800' },
      rejected: { text: 'KYC Rejected', color: 'bg-red-100 text-red-800' },
      not_submitted: {
        text: 'KYC Not Submitted',
        color: 'bg-gray-100 text-gray-800',
      },
    };
    return kycConfig[kycStatus] || kycConfig.not_submitted;
  };

  const getPlayerTypeBadge = (playerType) => {
    if (!playerType) return null;
    const typeConfig = {
      regular: { text: 'Regular', color: 'bg-blue-100 text-blue-800' },
      vip: { text: 'VIP', color: 'bg-purple-100 text-purple-800' },
      high_roller: {
        text: 'High Roller',
        color: 'bg-orange-100 text-orange-800',
      },
    };
    return typeConfig[playerType] || typeConfig.regular;
  };

  return {
    getInitials,
    getStatusBadge,
    getKYCBadge,
    getPlayerTypeBadge,
  };
};