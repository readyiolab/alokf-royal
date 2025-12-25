import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/Sessioncontext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Dot
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Use SessionContext instead of local state
  const { 
    sessionStatus, 
    isLoadingSession,
    sessionError 
  } = useSession();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoadingSession) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (sessionError && !sessionStatus) {
    return (
      <AdminLayout>
        <Alert className="bg-white border-2 border-red-600">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {sessionError}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const hasActiveSession = sessionStatus?.has_active_session;
  const session = sessionStatus?.session;
  const summary = sessionStatus?.summary;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        

        {/* Session Status Alert - Only show when active */}
        {hasActiveSession && (
          <Alert className="bg-white border-2 border-black">
            <div className="w-4 h-4 text-green-500 animate-pulse flex" ><Dot/></div>
            <AlertDescription className="text-black animate-pulse">
              Session active for {new Date(session.session_date).toLocaleDateString('en-IN')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid - Always show */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Opening Float
              </CardTitle>
              <div className="p-2 bg-gray-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {formatCurrency(session?.opening_float || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Starting balance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Available Float
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {formatCurrency(summary?.available_float || 0)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                Can be used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Deposits
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {formatCurrency(summary?.total_deposits || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Cash: {formatCurrency(summary?.cash_deposits || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Players
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {summary?.total_players || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Active today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats - Always show */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-orange-700" />
                </div>
                Chips in Circulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">
                {summary?.chips_in_circulation || 0}
              </div>
              <Badge 
                className={`mt-2 ${
                  summary?.chips_in_circulation > 0 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {summary?.chips_in_circulation > 0 ? 'Active' : 'All Returned'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-red-700" />
                </div>
                Outstanding Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">
                {formatCurrency(summary?.outstanding_credit || 0)}
              </div>
              <Badge 
                className={`mt-2 ${
                  summary?.outstanding_credit > 0 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {summary?.outstanding_credit > 0 ? 'Pending' : 'Clear'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-700" />
                </div>
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">
                {summary?.pending_credit_requests || 0}
              </div>
              <Badge 
                className={`mt-2 ${
                  summary?.pending_credit_requests > 0 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {summary?.pending_credit_requests > 0 ? 'Action Required' : 'None'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;