import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { liveGames, upcomingGames, sports, promotions } from "../data/mockData";
import GameCard from "../components/betting/GameCard";

const SPORT_TABS = ["Todos", "Futebol", "Basquete", "E-Sports", "MMA"];

export default function HomePage() {
  const navigate = useNavigate();
  const [activeSportTab, setActiveSportTab] = useState("Todos");

  const statsBar = [
    { label: "Jogos Ao Vivo", value: "47", change: null },
    { label: "Maior Odd", value: "45.00", change: "+3.2" },
    { label: "Mercados", value: "2.300+", change: null },
    { label: "Novos Hoje", value: "128", change: null },
  ];

  return (
    <div className="p-5 space-y-6 max-w-full mx-auto">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 bg-[#111318] border border-white/[0.06] rounded-xl px-5 py-3 overflow-x-auto">
        {statsBar.map((s, i) => (
          <div key={i} className="flex items-center gap-3 flex-shrink-0">
            {i > 0 && <div className="w-px h-7 bg-white/[0.05]" />}
            <div>
              <p className="text-[10px] text-[#5A5750] uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                {s.value}
                {s.change && (
                  <span className="text-green-400 text-[11px]">
                    ↑ {s.change}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Hero Banner */}
      <div className="relative bg-[#111318] border border-white/[0.06] rounded-2xl p-7 overflow-hidden">
        <div className="absolute right-0 top-0 w-[300px] h-full opacity-5 pointer-events-none select-none flex items-center justify-center text-[200px]">
          🏆
        </div>
        <div className="relative z-10 max-w-lg">
          <span className="inline-block bg-yellow-500/10 text-[#C9A84C] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            🔥 Destaque da Semana
          </span>
          <h1 className="font-display text-5xl tracking-wide mb-2 leading-none">
            CHAMPIONS LEAGUE
            <br />
            <span className="text-[#C9A84C]">QUARTAS DE FINAL</span>
          </h1>
          <p className="text-[#9B9590] text-sm leading-relaxed mb-5">
            As maiores odds do torneio. Mais de 200 mercados disponíveis por
            jogo, incluindo placar exato, primeiro marcador e estatísticas
            avançadas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/sports")}
              className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Ver todos os mercados
            </button>
            <button
              onClick={() => navigate("/live")}
              className="bg-transparent border border-white/10 hover:border-white/25 text-[#9B9590] hover:text-[#F0EDE6] text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Odds ao vivo
            </button>
          </div>
        </div>
      </div>

      {/* Casino quick-access strip */}
      <div
        onClick={() => navigate("/casino")}
        className="flex items-center justify-between bg-gradient-to-r from-[#1A1520] to-[#111318] border border-purple-500/20 rounded-xl px-5 py-4 cursor-pointer hover:border-purple-500/40 transition-all group"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">🎰</span>
          <div>
            <p className="font-display text-lg tracking-wide text-purple-300">
              CASSINO AO VIVO
            </p>
            <p className="text-[12px] text-[#9B9590]">
              Blackjack, Roleta, Slots e muito mais
            </p>
          </div>
        </div>
        <button className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors group-hover:translate-x-0.5 transition-transform">
          Jogar →
        </button>
      </div>

      {/* Sport Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSportTab(tab)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
              activeSportTab === tab
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Live Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
            Jogos Ao Vivo
            <span className="text-[13px] font-body font-normal text-[#9B9590] ml-1">
              {liveGames.length} jogos
            </span>
          </h2>
          <button
            onClick={() => navigate("/live")}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Ver tudo →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {liveGames.slice(0, 4).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
            Próximos Jogos
          </h2>
          <button
            onClick={() => navigate("/sports")}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Ver tudo →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {upcomingGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Promos strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
            Promoções em Destaque
          </h2>
          <button
            onClick={() => navigate("/promotions")}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Ver tudo →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {promotions.slice(0, 3).map((p) => (
            <div
              key={p.id}
              onClick={() => navigate("/promotions")}
              className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 hover:border-yellow-500/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{p.icon}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.badgeClass}`}
                >
                  {p.badge}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-[12px] text-[#9B9590] leading-relaxed mb-3">
                {p.description}
              </p>
              <button className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] font-medium transition-colors">
                {p.cta} →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
