import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';


// ============================================
// Reports.jsx
// ============================================
 const Reports = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [metrics, setMetrics] = useState(null);
  
    useEffect(() => {
      if (!token) {
        navigate('/login');
        return;
      }
      fetchData();
    }, [token, navigate]);
  
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await AdminService.getAllSessionSummaries(token);
        setSessions(response || []);
        const calculatedMetrics = AdminService.calculateDashboardMetrics(response || []);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    if (loading) {
      return (
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading reports...</p>
            </div>
          </div>
        </AdminLayout>
      );
    }
  
    if (!metrics) {
      return (
        <AdminLayout>
          <Alert className="bg-white border-gray-200">
            <AlertDescription className="text-gray-600">
              No data available for reports.
            </AlertDescription>
          </Alert>
        </AdminLayout>
      );
    }
  
    return (
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">Business analytics and performance metrics</p>
          </div>
  
        {/* Overall Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {AdminService.formatCurrency(metrics.totalRevenue)}
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                metrics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {AdminService.formatCurrency(metrics.totalProfit)}
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Profit/Session
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {AdminService.formatCurrency(metrics.averageProfit)}
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Profitability Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.profitabilityRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.profitableSessions} of {metrics.totalSessions} sessions
              </p>
            </CardContent>
          </Card>
        </div>
  
        {/* Player Metrics */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Player Metrics</CardTitle>
            <CardDescription>Player engagement and activity</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Players</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalPlayers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Avg Players/Session</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.averagePlayers.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalSessions}</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </AdminLayout>
    );
  };
  
  export default Reports;