// ============================================
// Sessions.jsx - Admin Session History
// ============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminService from '../../services/admin.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

const AdminSessions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getAllSessionSummaries(30);
      setSessions(response || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError(error.message || 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (color) => {
    const colorMap = {
      'green': 'bg-green-100 text-green-800 border-green-300',
      'blue': 'bg-blue-100 text-blue-800 border-blue-300',
      'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'orange': 'bg-orange-100 text-orange-800 border-orange-300',
      'red': 'bg-red-100 text-red-800 border-red-300'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session history...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Session History</h2>
          <p className="text-gray-600 mt-1">View past session summaries and financial performance</p>
        </div>

        {error && (
          <Alert className="bg-red-50 border-2 border-red-600">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {sessions.length === 0 ? (
          <Alert className="bg-blue-50 border-2 border-blue-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              No session history available yet. Open a session to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session) => {
              const formattedSession = AdminService.formatSession(session);
              const { performanceRating } = formattedSession.performance;
              
              return (
                <Card key={session.session_id} className="border-2 border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-black">
                          Session {session.session_id} - {formattedSession.formattedDate}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.session_date).toLocaleDateString('en-IN', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={`border-2 ${getBadgeColor(performanceRating.color)}`}>
                        {performanceRating.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="bg-blue-50 p-4 rounded-lg ">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Opening Float</p>
                        <p className="text-lg font-bold text-black mt-1">
                          {formattedSession.formattedOpeningFloat}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg ">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Deposits</p>
                        <p className="text-lg font-bold text-black mt-1">
                          {formattedSession.formattedDeposits}
                        </p>
                      </div>
                      
                      <div className="bg-amber-50 p-4 rounded-lg ">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Closing Float</p>
                        <p className="text-lg font-bold text-black mt-1">
                          {formattedSession.formattedClosingFloat}
                        </p>
                      </div>
                      
                      <div className={`${formattedSession.performance.isProfitable ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg `}>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Profit/Loss</p>
                        <div className="flex items-center gap-2 mt-1">
                          {formattedSession.performance.isProfitable ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                          <p className={`text-lg font-bold ${formattedSession.performance.isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                            {formattedSession.formattedProfitLoss}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 p-4 rounded-lg ">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Players</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-5 h-5 text-indigo-600" />
                          <p className="text-lg font-bold text-black">
                            {session.total_players || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details Row */}
                    <div className="grid gap-4 md:grid-cols-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Total Withdrawals</p>
                        <p className="text-sm font-semibold text-black mt-1">
                          {formattedSession.formattedWithdrawals}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
                        <p className="text-sm font-semibold text-black mt-1">
                          {formattedSession.formattedExpenses}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Profit Margin</p>
                        <p className="text-sm font-semibold text-black mt-1">
                          {formattedSession.performance.profitMargin.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Transactions</p>
                        <p className="text-sm font-semibold text-black mt-1">
                          {session.total_transactions || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSessions;