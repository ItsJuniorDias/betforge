import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BetSlipProvider } from "./context/BetSlipContext";
import { LayoutProvider } from "./context/LayoutContext";
import Layout from "./components/layout/Layout";

import HomePage from "./pages/HomePage";
import LivePage from "./pages/LivePage";
import SportsPage from "./pages/SportsPage";
import HistoryPage from "./pages/HistoryPage";
import PromotionsPage from "./pages/PromotionsPage";
import AccountPage from "./pages/AccountPage";
import DepositPage from "./pages/Depositpage";
import WithdrawPage from "./pages/Withdrawpage";

// Telas criadas nesta sessão
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CasinoPage from "./pages/CasinoPage";
import BettingPage from "./pages/BettingPage";
import BetDetailPage from "./pages/BetDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BetSlipProvider>
      <BrowserRouter>
        <LayoutProvider>
          <Routes>
            {/* ── Rotas públicas (sem Header / Sidebar) ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* ── Rotas com Layout ── */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/sports" element={<SportsPage />} />
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/casino" element={<CasinoPage />} />
                    <Route path="/promotions" element={<PromotionsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route
                      path="/notifications"
                      element={<NotificationsPage />}
                    />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/history/:betId" element={<BetDetailPage />} />
                    <Route path="/deposit" element={<DepositPage />} />
                    <Route path="/withdraw" element={<WithdrawPage />} />
                    <Route path="/bet/:gameId" element={<BettingPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </LayoutProvider>
      </BrowserRouter>
    </BetSlipProvider>
  );
}
