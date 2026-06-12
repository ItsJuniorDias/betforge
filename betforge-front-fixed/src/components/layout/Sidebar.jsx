import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { sports, leagues } from "../../data/mockData";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeSport, setActiveSport] = useState("football");
  const filteredLeagues = leagues.filter((l) => l.sport === activeSport);

  const SectionTitle = ({ children }) => (
    <p className="px-4 py-2 text-[10px] font-semibold text-[#5A5750] uppercase tracking-widest">
      {children}
    </p>
  );

  const Item = ({ icon, label, badge, badgeLive, onClick, to, active }) => {
    const cls = `flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors no-underline text-inherit
      ${active ? "bg-yellow-500/[0.08]" : "hover:bg-[#181C23]"}`;

    const inner = (
      <>
        <div
          className={`flex items-center gap-2 text-[13px] ${active ? "text-[#F0EDE6]" : "text-[#9B9590]"}`}
        >
          {icon && <span>{icon}</span>}
          {label}
        </div>
        {badge && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full bg-[#1E2330] ${badgeLive ? "text-red-400" : "text-[#5A5750]"}`}
          >
            {badge}
          </span>
        )}
      </>
    );
    if (to)
      return (
        <Link to={to} className={cls}>
          {inner}
        </Link>
      );
    return (
      <div className={cls} onClick={onClick}>
        {inner}
      </div>
    );
  };

  return (
    <aside className="w-[220px] bg-[#111318] border-r border-white/[0.06] overflow-y-auto flex-shrink-0">
      {/* Busca rápida */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => navigate("/search")}
          className="w-full flex items-center gap-2 bg-[#181C23] border border-white/[0.06] hover:border-white/20 rounded-xl px-3 py-2 text-[12px] text-[#5A5750] hover:text-[#9B9590] transition-all"
        >
          <span>🔍</span>
          <span>Buscar times, ligas...</span>
        </button>
      </div>

      {/* Destaques */}
      <div className="border-b border-white/[0.06] py-2">
        <SectionTitle>Destaques</SectionTitle>
        <Item
          icon={
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink" />
          }
          label="Ao Vivo"
          badge="47"
          badgeLive
          to="/live"
          active={location.pathname === "/live"}
        />
        <Item
          icon="⭐"
          label="Populares"
          badge="22"
          to="/sports"
          active={false}
        />
        <Item icon="🔥" label="Hoje" badge="84" to="/sports" active={false} />
        <Item icon="⏰" label="Amanhã" badge="61" to="/sports" active={false} />
      </div>

      {/* Cassino */}
      <div className="border-b border-white/[0.06] py-2">
        <SectionTitle>Cassino</SectionTitle>
        <Item
          icon="🎰"
          label="Cassino"
          to="/casino"
          active={location.pathname === "/casino"}
        />
        <Item icon="🎡" label="Slots" badge="320" />
        <Item icon="📡" label="Ao Vivo" badge="48" />
        <Item icon="🚀" label="Crash Games" badge="12" />
        <Item icon="💎" label="Jackpots" badge="6" />
      </div>

      {/* Esportes */}
      <div className="border-b border-white/[0.06] py-2">
        <SectionTitle>Esportes</SectionTitle>
        {sports.slice(0, 6).map((s) => (
          <Item
            key={s.id}
            icon={s.icon}
            label={s.label}
            badge={s.count}
            active={activeSport === s.id && location.pathname === "/sports"}
            onClick={() => {
              setActiveSport(s.id);
              navigate("/sports");
            }}
          />
        ))}
      </div>

      {/* Ligas */}
      {filteredLeagues.length > 0 && (
        <div className="border-b border-white/[0.06] py-2">
          <SectionTitle>Ligas</SectionTitle>
          {filteredLeagues.map((l) => (
            <Item
              key={l.id}
              icon={l.flag}
              label={l.label}
              badge={l.count}
              to="/sports"
            />
          ))}
        </div>
      )}

      {/* Minha Conta */}
      <div className="border-b border-white/[0.06] py-2">
        <SectionTitle>Minha Conta</SectionTitle>
        <Item
          icon="👤"
          label="Perfil"
          to="/account"
          active={location.pathname === "/account"}
        />
        <Item
          icon="📋"
          label="Apostas"
          to="/history"
          active={location.pathname === "/history"}
        />
        <Item
          icon="💳"
          label="Extrato"
          to="/transactions"
          active={location.pathname === "/transactions"}
        />
        <Item
          icon="🔔"
          label="Notificações"
          to="/notifications"
          active={location.pathname === "/notifications"}
        />
        <Item
          icon="🎁"
          label="Promoções"
          to="/promotions"
          active={location.pathname === "/promotions"}
        />
        <Item
          icon="⬇️"
          label="Depositar"
          to="/deposit"
          active={location.pathname === "/deposit"}
        />
        <Item
          icon="⬆️"
          label="Sacar"
          to="/withdraw"
          active={location.pathname === "/withdraw"}
        />
      </div>

      {/* Botões de auth */}
      <div className="p-3 space-y-2">
        <Link
          to="/register"
          className="block w-full text-center bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-[13px] py-2 rounded-xl transition-colors no-underline"
        >
          Criar Conta
        </Link>
        <Link
          to="/login"
          className="block w-full text-center bg-[#181C23] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-[13px] py-2 rounded-xl transition-colors no-underline"
        >
          Entrar
        </Link>
      </div>
    </aside>
  );
}
