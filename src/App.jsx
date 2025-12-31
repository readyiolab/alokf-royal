import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/Sessioncontext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Existing routes
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StaffLogin from "./components/auth/StaffLogin"

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSessions from "./pages/admin/Sessions";
import AdminPlayers from "./pages/admin/Players";
import AdminKYCManagement from "./pages/admin/KYCManagement";
import AdminCreditApprovals from "./pages/admin/CreditApprovals";
import AdminReports from "./pages/admin/Reports";
import StaffManagement from "./pages/admin/StaffManagement";
import DealerManagement from "./pages/admin/DealerManagement";
import UserManagement from "./pages/admin/UserManagement";

// Cashier pages
import CashierDashboard from "./pages/cashier/Dashboard";
import CashierTransactions from "./pages/cashier/Transactions";
import CashierCredits from "./pages/cashier/Credits";
import CashierPlayers from "./pages/cashier/Players";
import CashierSettlement from "./pages/cashier/Settlement";
import CashierReports from "./pages/cashier/Reports";
import KYCManagement from "./pages/cashier/KYCManagement";
import FloorManager from "./pages/cashier/FloorManagerNew";
import CRM from "./pages/cashier/CRM";
import DailyCashbook from "./pages/cashier/DailyCashbook";
import ChipLedger from "./pages/cashier/ChipLedger";
import CreditRegister from "./pages/cashier/CreditRegister";
import FloatChipsLog from "./pages/cashier/FloatChipsLog";
import CashierManagement from "./pages/cashier/CashierManagement";
import AuditLogReversals from "./pages/cashier/AuditLogReversals";

// Player pages
// import PlayerDashboard from "./pages/player/Dashboard";
// import PlayerProfile from "./pages/player/Profile";
// import PlayerKYC from "./pages/player/KYC";
// import PlayerHistory from "./pages/player/History";
// import PlayerNotifications from "./pages/player/Notifications";



// ==================== PLAYER COMPONENTS ====================
import PlayerSearch from "./components/players/PlayerSearch";
import PlayerCard from "./components/players/PlayerCard";
import PlayerList from "./components/players/PlayerList";
import AddPlayerDialog from "./components/players/AddPlayerDialog";
import PlayerDetails from "./components/players/PlayerDetails";
import PlayerStats from "./components/players/PlayerStats";
import PlayerNotes from "./components/players/PlayerNotes";
import PlayerDashboard from "./components/dashboard/PlayerDashboard"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SessionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<StaffLogin/>} />

              {/* Admin Routes - Protected */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="sessions" element={<AdminSessions />} />
                    <Route path="players" element={<AdminPlayers />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="staff" element={<StaffManagement />} />
                    <Route path="dealers" element={<DealerManagement />} />
                    <Route path="kyc" element={<AdminKYCManagement />} />
                    <Route path="credits" element={<AdminCreditApprovals />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Cashier Routes - Protected */}
              <Route path="/cashier/*" element={
                <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                  
                    <Routes>
                      <Route path="dashboard" element={<CashierTransactions />} />
                      <Route path="cashbook" element={<DailyCashbook />} />
                      <Route path="chip-ledger" element={<ChipLedger />} />
                      <Route path="credit-register" element={<CreditRegister />} />
                      <Route path="float-chips-log" element={<FloatChipsLog />} />
                      <Route path="credits" element={<CashierCredits />} />
                      <Route path="players" element={<CashierPlayers />} />
                      <Route path="cashier-management" element={<CashierManagement />} />
                      <Route path="audit-log-reversals" element={<AuditLogReversals />} />
                      <Route path="floor-manager" element={<FloorManager />} />
                      <Route path="crm" element={<CRM />} />
                      <Route path="kyc" element={<KYCManagement />} />
                      <Route path="settlement" element={<CashierSettlement />} />
                      <Route path="reports" element={<CashierReports />} />
                      <Route path="" element={<Navigate to="/cashier/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/cashier/dashboard" replace />} />
                    </Routes>
                
                </ProtectedRoute>
              } />

              {/* Floor Manager Routes - Protected (No layout wrapper - full screen) */}
              <Route path="/floor-manager/*" element={
                <ProtectedRoute allowedRoles={['floor_manager', 'admin']}>
                  <Routes>
                    <Route path="/" element={<FloorManager />} />
                    <Route path="*" element={<Navigate to="/floor-manager" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Player Routes - Protected */}
              <Route path="/player/*" element={
                <ProtectedRoute allowedRoles={['player']}>
                  <Routes>
                    <Route path="dashboard" element={<PlayerDashboard />} />
                    {/* <Route path="profile" element={<PlayerProfile />} /> */}
                    {/* <Route path="kyc" element={<PlayerKYC />} /> */}
                    {/* <Route path="history" element={<PlayerHistory />} /> */}
                    {/* <Route path="notifications" element={<PlayerNotifications />} /> */}
                    <Route path="*" element={<Navigate to="/player/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* 404 - Must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;