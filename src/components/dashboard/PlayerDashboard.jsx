// src/pages/player/Dashboard.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  CreditCard, 
  History, 
  Bell, 
  LogOut,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PlayerDashboard = () => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'P';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Mock data - replace with actual API data
  const playerStats = {
    currentBalance: 50000,
    creditsAvailable: 100000,
    creditsUsed: 50000,
    pendingRequests: 2,
    totalTransactions: 45,
    lastTransaction: '2024-12-15',
    kycStatus: 'approved', // 'pending', 'approved', 'rejected'
    accountStatus: 'active'
  };

  const recentTransactions = [
    { id: 1, type: 'deposit', amount: 25000, date: '2024-12-15', status: 'completed' },
    { id: 2, type: 'withdrawal', amount: 10000, date: '2024-12-14', status: 'completed' },
    { id: 3, type: 'credit_request', amount: 50000, date: '2024-12-13', status: 'pending' },
    { id: 4, type: 'deposit', amount: 15000, date: '2024-12-12', status: 'completed' },
  ];

  const quickActions = [
    { name: 'Request Credit', icon: CreditCard, href: '/player/credit-request', color: 'bg-blue-600' },
    { name: 'View History', icon: History, href: '/player/history', color: 'bg-green-600' },
    { name: 'My Profile', icon: User, href: '/player/profile', color: 'bg-purple-600' },
    { name: 'Notifications', icon: Bell, href: '/player/notifications', color: 'bg-yellow-600' },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      completed: { variant: 'default', className: 'bg-green-600', label: 'Completed' },
      pending: { variant: 'default', className: 'bg-yellow-600', label: 'Pending' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      approved: { variant: 'default', className: 'bg-green-600', label: 'Approved' },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getKYCStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                  {getInitials(user?.full_name || user?.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {user?.full_name || user?.username}
                </h1>
                <p className="text-sm text-zinc-400">Player Account</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="text-zinc-300 border-zinc-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Account Status Banner */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">Account Status</h3>
                    {getKYCStatusIcon(playerStats.kycStatus)}
                  </div>
                  <p className="text-blue-100">
                    KYC Status: {getStatusBadge(playerStats.kycStatus)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Current Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(playerStats.currentBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-zinc-400">Credits Available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(playerStats.creditsAvailable)}
                  </p>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-zinc-400">Credits Used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(playerStats.creditsUsed)}
                  </p>
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-zinc-400">Pending Requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">
                    {playerStats.pendingRequests}
                  </p>
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-zinc-400">Total Transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">
                    {playerStats.totalTransactions}
                  </p>
                  <History className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription>Access frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.name}
                      to={action.href}
                      className="flex flex-col items-center gap-3 p-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors group"
                    >
                      <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                        {action.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <CardDescription>Your latest account activity</CardDescription>
                </div>
                <Link to="/player/history">
                  <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'deposit' ? 'bg-green-600' :
                        transaction.type === 'withdrawal' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <TrendingUp className="w-5 h-5 text-white" />
                        ) : transaction.type === 'withdrawal' ? (
                          <TrendingDown className="w-5 h-5 text-white" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-zinc-400">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-500' :
                        transaction.type === 'withdrawal' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Credit Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Credit Usage</CardTitle>
                <CardDescription>Your current credit status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Credit Limit</span>
                    <span className="font-medium text-white">
                      {formatCurrency(playerStats.creditsAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${(playerStats.creditsUsed / playerStats.creditsAvailable) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Used</span>
                    <span className="font-medium text-white">
                      {formatCurrency(playerStats.creditsUsed)} 
                      <span className="text-zinc-500 ml-1">
                        ({Math.round((playerStats.creditsUsed / playerStats.creditsAvailable) * 100)}%)
                      </span>
                    </span>
                  </div>
                </div>
                <Link to="/player/credit-request" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Request Credit
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Player ID</span>
                    <span className="font-medium text-white">{user?.id || 'P-12345'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Member Since</span>
                    <span className="font-medium text-white">Jan 2024</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Account Status</span>
                    <Badge variant="default" className="bg-green-600">
                      {playerStats.accountStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-400">Last Activity</span>
                    <span className="font-medium text-white">{playerStats.lastTransaction}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-zinc-400">
            <p>© 2024 RoyalFlush Casino. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <span>Player: {user?.username}</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlayerDashboard;