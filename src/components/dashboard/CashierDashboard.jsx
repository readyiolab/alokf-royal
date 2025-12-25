const CashierDashboard = () => {
    const { user, logout } = useAuth();
  
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.username}</p>
            </div>
            <Button onClick={logout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Float</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹25,000</p>
                <p className="text-sm text-muted-foreground">Available balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">18</p>
                <p className="text-sm text-muted-foreground">Completed today</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  };
  