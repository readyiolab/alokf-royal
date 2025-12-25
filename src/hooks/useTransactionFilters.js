export const useTransactionFilters = () => {
  const getTransactionType = (t) => t?.transaction_type || '';

  const getCashbookTransactions = (transactions = []) =>
    transactions.filter((t) => {
      const type = getTransactionType(t);

      // Standard cash transactions
      if (
        [
          'buy_in',
          'cash_payout',
          'settle_credit',
          'add_float',
          'expense',
        ].includes(type)
      ) {
        return true;
      }

      // Dealer Tips - cash only
      if (t.activity_type === 'dealer_tip') {
        const cashPaid = parseFloat(
          t.cash_paid_to_dealer || t.total_cash_paid || 0
        );
        return cashPaid > 0;
      }

      // Club Expenses - always cash
      if (t.activity_type === 'club_expense') {
        return true;
      }

      // Player Expenses - cash only
      if (t.activity_type === 'player_expense') {
        return false;
      }

      // Rakeback - cash only
      if (
        t.activity_type === 'rakeback' &&
        parseFloat(t.cash_amount || 0) > 0
      ) {
        return true;
      }

      // Wallet movements
      const primaryMove = parseFloat(t.primary_amount || 0);
      const secondaryMove = parseFloat(t.secondary_amount || 0);
      if (primaryMove !== 0 || secondaryMove !== 0) {
        return true;
      }

      return false;
    });

  const getChipLedgerTransactions = (transactions = []) =>
    transactions.filter((t) => {
      const type = t.transaction_type;
      const activity = t.activity_type;

      // Main chip transactions
      if (
        [
          'buy_in',
          'cash_payout',
          'credit_issued',
          'issue_credit',
          'deposit_chips',
          'return_chips',
        ].includes(type)
      ) {
        return true;
      }

      // Dealer tips in chips
      if (activity === 'dealer_tip' && parseFloat(t.chip_amount || 0) > 0) {
        return true;
      }

      // Player expenses in chips
      if (activity === 'player_expense' && parseFloat(t.chip_amount || 0) > 0) {
        return true;
      }

      // Rakeback in chips
      if (
        activity === 'rakeback' &&
        parseFloat(t.amount || t.chip_amount || 0) > 0
      ) {
        return true;
      }

      // Chip breakdown
      if (
        parseInt(t.chips_100 || 0) > 0 ||
        parseInt(t.chips_500 || 0) > 0 ||
        parseInt(t.chips_5000 || 0) > 0 ||
        parseInt(t.chips_10000 || 0) > 0
      ) {
        return true;
      }

      return false;
    });

  const getCreditRegisterTransactions = (transactions = []) =>
    transactions.filter((t) =>
      ['credit_issued', 'settle_credit'].includes(getTransactionType(t))
    );

  const getUniquePlayersCount = (transactions = []) =>
    new Set(transactions.filter((t) => t.player_id).map((t) => t.player_id))
      .size;

  return {
    getCashbookTransactions,
    getChipLedgerTransactions,
    getCreditRegisterTransactions,
    getUniquePlayersCount,
  };
};