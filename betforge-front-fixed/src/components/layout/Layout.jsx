import Header from "./Header";
import Sidebar from "./Sidebar";
import BetSlip from "../betting/BetSlip";
import BetPanel from "../betting/BetPanel";
import { useLayout } from "../../context/LayoutContext";

export default function Layout({ children }) {
  const { slipOpen, toggleSlip, closeSlip, isBettingPage } = useLayout();

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0B0E]">
      <Header onToggleBetSlip={toggleSlip} />
      <div
        className="flex flex-1 overflow-hidden"
        style={{ height: "calc(100vh - 60px)" }}
      >
        <Sidebar />

        <main className="w-full min-w-0 overflow-y-auto">{children}</main>

        {/* Painel direito */}
        <div
          className={`hidden lg:flex flex-shrink-0 transition-all duration-300 overflow-hidden ${
            slipOpen ? "w-[300px]" : "w-0"
          }`}
        >
          {
            slipOpen &&
              (isBettingPage ? (
                <BetPanel /> /* BettingPage: painel expandido com APOSTAR AGORA */
              ) : (
                <BetSlip onClose={closeSlip} />
              )) /* resto do app: boletim compacto */
          }
        </div>
      </div>
    </div>
  );
}
