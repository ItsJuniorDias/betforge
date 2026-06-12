import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BetSlipProvider } from "./context/BetSlipContext";
import { LayoutProvider } from "./context/LayoutContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";

import LoginPage from "./pages/Loginpage";
import RegisterPage from "./pages/Registerpage";
import ForgotPasswordPage from "./pages/Forgotpasswordpage";
import HomePage from "./pages/HomePage";
import LivePage from "./pages/LivePage";
import SportsPage from "./pages/SportsPage";
import CasinoPage from "./pages/Casinopage";
import PromotionsPage from "./pages/PromotionsPage";
import SearchPage from "./pages/Searchpage";
import NotificationsPage from "./pages/Notificationspage";
import AccountPage from "./pages/AccountPage";
import HistoryPage from "./pages/Historypage";        // Histórico de apostas (TSX real)
import TransactionsPage from "./pages/TransactionsPage"; // Extrato financeiro (novo)
import BetDetailPage from "./pages/Betdetailpage";
import DepositPage from "./pages/Depositpage";
import WithdrawPage from "./pages/Withdrawpage";
import BettingPage from "./pages/Bettingpage";
import NotFoundPage from "./pages/Notfoundpage";

export default function App() {
  return (
    <BrowserRouter>
      <QueryWrapper />
    </BrowserRouter>
  );
}

function QueryWrapper() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <LayoutProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Rotas protegidas com Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/sports" element={<SportsPage />} />
                      <Route path="/live" element={<LivePage />} />
                      <Route path="/casino" element={<CasinoPage />} />
                      <Route path="/promotions" element={<PromotionsPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/account" element={<AccountPage />} />

                      {/* Histórico de apostas */}
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/history/:betId" element={<BetDetailPage />} />

                      {/* Extrato financeiro (transações de depósito/saque) */}
                      <Route path="/transactions" element={<TransactionsPage />} />

                      <Route path="/deposit" element={<DepositPage />} />
                      <Route path="/withdraw" element={<WithdrawPage />} />
                      <Route path="/bet/:gameId" element={<BettingPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </LayoutProvider>
      </BetSlipProvider>
    </AuthProvider>
  );
}
