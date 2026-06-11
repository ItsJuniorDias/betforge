import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBetSlip } from "../../context/BetSlipContext";
import { useBalance } from "../../hooks/api/useUser";
import { useAuth } from "../../context/AuthContext";
import { useLogout } from "../../hooks/api/useAuth";

export default function Header({ onToggleBetSlip }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useBetSlip();
  const { user } = useAuth();
  const { data: balanceData } = useBalance();
  const logout = useLogout();

  const balance = balanceData?.balance ?? user?.balance ?? 0;
  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/sports", label: "Esportes" },
    { to: "/live", label: "Ao Vivo", live: true },
    { to: "/casino", label: "Cassino" },
    { to: "/promotions", label: "Promoções" },
  ];

  return (
    <header className="h-[60px] bg-[#111318] border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[#C9A84C] rounded-lg flex items-center justify-center text-black font-bold text-base">B</div>
          <span className="font-display text-2xl tracking-[3px] text-[#C9A84C]">BETFORGE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all no-underline ${location.pathname === link.to ? "text-[#C9A84C] bg-yellow-500/[0.08]" : "text-[#9B9590] hover:text-[#F0EDE6] hover:bg-[#181C23]"}`}>
              {link.live && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/search")} className="w-9 h-9 bg-[#181C23] border border-white/[0.06] hover:border-white/20 rounded-lg flex items-center justify-center text-[#5A5750] hover:text-[#9B9590] transition-all text-base" title="Buscar">🔍</button>

        <button onClick={() => navigate("/notifications")}
          className={`relative w-9 h-9 bg-[#181C23] border border-white/[0.06] hover:border-white/20 rounded-lg flex items-center justify-center text-base transition-all ${location.pathname === "/notifications" ? "border-yellow-500/30 text-[#C9A84C]" : "text-[#5A5750] hover:text-[#9B9590]"}`}>
          🔔
        </button>

        {/* Saldo real do backend */}
        <div className="hidden sm:flex flex-col items-end bg-[#181C23] border border-white/[0.06] rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-[#5A5750] uppercase tracking-wider">Saldo</span>
          <span className="text-sm font-semibold text-[#C9A84C]">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Avatar com initials reais */}
        <Link to="/account" className="w-9 h-9 rounded-full bg-[#1E2330] border border-yellow-500/20 flex items-center justify-center text-xs font-semibold text-[#C9A84C] no-underline">
          {initials}
        </Link>

        <button onClick={() => navigate("/deposit")} className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors">
          + Depositar
        </button>

        <button onClick={onToggleBetSlip} className="relative bg-[#181C23] border border-white/[0.06] hover:border-yellow-500/30 text-base px-3 py-2 rounded-lg transition-colors">
          🎯
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-black text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">{count}</span>
          )}
        </button>

        <button onClick={() => logout.mutate()} disabled={logout.isPending}
          className="hidden lg:flex text-[13px] text-[#9B9590] hover:text-red-400 px-3 py-2 rounded-lg transition-colors border-l border-white/[0.06] ml-1 pl-3">
          Sair
        </button>
      </div>
    </header>
  );
}
