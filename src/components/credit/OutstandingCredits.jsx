import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, TrendingUp, RefreshCw, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import transactionService from '../../services/transaction.service';

export const OutstandingCredits = ({ sessionData = null, onCreditSelected = null }) => {
  const { token } = useAuth();
  const [creditsData, setCreditsData] = useState({
    totalOutstanding: 0,
    totalIssued: 0,
    totalSettled: 0,
    activeCredits: 0,
    creditDetails: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOutstandingCredits = async () => {
    if (!token) {
      setError('Authentication required. Please login.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionService.getOutstandingCredits(token);
      
      let credits = [];
      if (response && response.data && response.data.credits) {
        credits = response.data.credits;
      } else if (Array.isArray(response)) {
        credits = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        credits = response.data;
      }

      if (credits && credits.length > 0) {
        const totalOutstanding = credits.reduce((sum, c) => {
          const val = parseFloat(c.credit_outstanding) || 0;
          return sum + val;
        }, 0);
        
        const totalIssued = credits.reduce((sum, c) => {
          const val = parseFloat(c.credit_issued) || 0;
          return sum + val;
        }, 0);
        
        const totalSettled = credits.reduce((sum, c) => {
          const val = parseFloat(c.credit_settled) || 0;
          return sum + val;
        }, 0);
        
        const activeCredits = credits.filter(c => {
          const val = parseFloat(c.credit_outstanding) || 0;
          return val > 0;
        }).length;

        setCreditsData({
          totalOutstanding,
          totalIssued,
          totalSettled,
          activeCredits,
          creditDetails: credits.map(credit => ({
            ...credit,
            credit_outstanding: parseFloat(credit.credit_outstanding) || 0,
            credit_issued: parseFloat(credit.credit_issued) || 0,
            credit_settled: parseFloat(credit.credit_settled) || 0,
            issued_date: credit.issued_at ? new Date(credit.issued_at) : new Date()
          }))
        });
      } else {
        setCreditsData({
          totalOutstanding: 0,
          totalIssued: 0,
          totalSettled: 0,
          activeCredits: 0,
          creditDetails: []
        });
      }
    } catch (err) {
      console.error('Error fetching outstanding credits:', err);
      setError(err.message || 'Failed to load outstanding credits');
      setCreditsData({
        totalOutstanding: 0,
        totalIssued: 0,
        totalSettled: 0,
        activeCredits: 0,
        creditDetails: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOutstandingCredits();
    }
  }, [token, sessionData]);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg shadow p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading outstanding credits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Error Loading Credits</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={fetchOutstandingCredits}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Outstanding Credits</h2>
        <button
          onClick={fetchOutstandingCredits}
          disabled={loading}
          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-red-700 uppercase mb-2">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-900">₹{creditsData.totalOutstanding.toFixed(2)}</p>
          <p className="text-xs text-red-600 mt-2">Amount awaiting settlement</p>
        </div>

        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Total Issued</p>
          <p className="text-2xl font-bold text-blue-900">₹{creditsData.totalIssued.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-2">Total credit given</p>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-green-700 uppercase mb-2">Total Settled</p>
          <p className="text-2xl font-bold text-green-900">₹{creditsData.totalSettled.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-2">Amount recovered</p>
        </div>

        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">Active Credits</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-yellow-900">{creditsData.activeCredits}</p>
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-xs text-yellow-600 mt-2">Players with pending balance</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="border border-gray-200 rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 p-4 md:p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Credit Details</h3>
          <p className="text-sm text-gray-600 mt-1">Breakdown of individual player credits</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Player Name</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Issued</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Settled</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Outstanding</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {creditsData.creditDetails.length > 0 ? (
                creditsData.creditDetails.map((credit) => (
                  <tr key={credit.credit_id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-900 font-medium">{credit.player_name}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      ₹{(parseFloat(credit.credit_issued) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">
                      ₹{(parseFloat(credit.credit_settled) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={(parseFloat(credit.credit_outstanding) || 0) > 0 ? 'text-red-700' : 'text-green-700'}>
                        ₹{(parseFloat(credit.credit_outstanding) || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {credit.issued_date.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(parseFloat(credit.credit_outstanding) || 0) > 0 ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          Outstanding
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(parseFloat(credit.credit_outstanding) || 0) > 0 && onCreditSelected && (
                        <button
                          onClick={() => onCreditSelected(credit)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-semibold flex items-center gap-1 mx-auto transition"
                        >
                          <DollarSign className="w-3 h-3" />
                          Settle
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-600">
                    No credit records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OutstandingCredits;