import React, { useEffect } from 'react';
import { useSession } from '../../contexts/Sessioncontext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  CreditCard,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { sessionStatus, isLoadingSession, checkSessionStatus } = useSession();

  // Refresh session status when component mounts
  useEffect(() => {
    checkSessionStatus();
  }, []);

  if (isLoadingSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSession = sessionStatus?.has_active_session;
  const sessionData = sessionStatus?.session;
  const summary = sessionStatus?.summary;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.full_name || user?.username}</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            View Reports
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            New Transaction
          </Button>
        </div>
      </div>

      {/* Session Status Alert */}
      {!hasActiveSession ? (
        <Alert className="bg-white border-2 border-gray-900">
          <AlertCircle className="h-5 w-5 text-gray-900" />
          <AlertDescription className="text-gray-900">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                No active session today. Open a session to start operations.
              </span>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white ml-4">
                Open Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-white border-2 border-black">
          <CheckCircle className="h-5 w-5 text-black" />
          <AlertDescription className="text-black">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="font-medium">
                Session is active since {new Date(sessionData?.opened_at).toLocaleString()}
              </span>
              <span className="text-sm font-semibold">
                Float: ₹{sessionData?.owner_float?.toLocaleString()}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      {hasActiveSession && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Deposits */}
          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Deposits
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                ₹{summary?.total_deposits?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Cash: ₹{summary?.cash_deposits?.toLocaleString() || 0} | 
                Online: ₹{summary?.online_deposits?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          {/* Total Withdrawals */}
          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Withdrawals
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                ₹{summary?.total_withdrawals?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Including settlements
              </p>
            </CardContent>
          </Card>

          {/* Available Float */}
          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Available Float
              </CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                ₹{summary?.available_float?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Chips in circulation: ₹{summary?.chips_in_circulation?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          {/* Active Players */}
          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Active Players
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {summary?.total_players || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Total transactions: {summary?.total_transactions || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats Row */}
      {hasActiveSession && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Outstanding Credit */}
          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-4 h-4 text-purple-700" />
                </div>
                Outstanding Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                ₹{summary?.outstanding_credit?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Pending requests: {summary?.pending_credit_requests || 0}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-orange-700" />
                </div>
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                ₹{summary?.total_expenses?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Operational costs
              </p>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                </div>
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Opening Float:</span>
                  <span className="text-sm font-medium text-black">
                    ₹{sessionData?.opening_float?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Current Float:</span>
                  <span className="text-sm font-medium text-black">
                    ₹{summary?.remaining_float?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Section */}
      <Card className="bg-white border-2 border-black">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-black">Reports</CardTitle>
              <CardDescription className="text-gray-600">
                {hasActiveSession 
                  ? 'Recent transaction activity'
                  : 'No data available - please open a session'
                }
              </CardDescription>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveSession ? (
            <div className="text-center py-8 text-gray-600">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Transaction reports will appear here</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a session to view reports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white border-2 border-black">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-black">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">
                Latest transactions and events
              </CardDescription>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveSession ? (
            <div className="text-center py-8 text-gray-600">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a session to track activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;