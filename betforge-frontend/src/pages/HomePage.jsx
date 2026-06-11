import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { sports, promotions } from "../data/mockData";
import { useGames, useLiveGames } from "../hooks/api/useGames";
import GameCard from "../components/betting/GameCard";

const SPORT_TABS = [
  { label: "Todos",    sport: null },
  { label: "Futebol",  sport: "football" },
  { label: "Basquete", sport: "basketball" },
  { label: "E-Sports", sport: "esports" },
  { label: "MMA",      sport: "mma" },
];

function GameSkeleton() {
  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl h-36 animate-pulse" />
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeSportTab, setActiveSportTab] = useState(null);

  // Jogos ao vivo
  const { data: liveGames = [], isLoading: loadingLive } = useLiveGames(
    activeSportTab ?? undefined
  );

  // Próximos jogos (apenas scheduled)
  const { data: upcomingData, isLoading: loadingUpcoming } = useGames({
    status: "scheduled",
    sport: activeSportTab ?? undefined,
    limit: 6,
  });
  const upcomingGames = upcomingData?.data ?? [];

  const statsBar = [
    { label: "Jogos Ao Vivo", value: liveGames.length || "–", change: null },
    { label: "Maior Odd",     value: liveGames.length ? Math.max(
      ...liveGames.flatMap((g) =>
        [g.homeOdd, g.drawOdd, g.awayOdd].filter(Boolean)
      )
    ).toFixed(2) : "–", change: null },
    { label: "Mercados",      value: "2.300+", change: null },
    { label: "Novos Hoje",    value: "128", change: null },
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
          <span className="inline-block bg-green-500/10 text-[#C9A84C] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            🌎 Evento Mundial
          </span>
          <h1 className="font-display text-5xl tracking-wide mb-2 leading-none">
            COPA DO MUNDO
            <br />
            <span className="text-[#C9A84C]">2026</span>
          </h1>
          <p className="text-[#9B9590] text-sm leading-relaxed mb-5">
            Aposte nos maiores confrontos do planeta. Mercados para vencedor,
            artilheiro, classificação, placar exato e centenas de opções ao vivo
            durante toda a competição.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/sports")}
              className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Explorar mercados
            </button>
            <button
              onClick={() => navigate("/live")}
              className="bg-transparent border border-white/10 hover:border-white/25 text-[#9B9590] hover:text-[#F0EDE6] text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Jogos ao vivo
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
        <button className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors">
          Jogar →
        </button>
      </div>

      {/* Sport Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveSportTab(tab.sport)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
              activeSportTab === tab.sport
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink inline-block" />
            Jogos Ao Vivo
            <span className="text-[13px] font-body font-normal text-[#9B9590] ml-1">
              {loadingLive ? "…" : `${liveGames.length} jogos`}
            </span>
          </h2>
          <button
            onClick={() => navigate("/live")}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Ver tudo →
          </button>
        </div>
        {loadingLive ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <GameSkeleton key={i} />)}
          </div>
        ) : liveGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveGames.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl px-5 py-8 text-center text-[#5A5750] text-sm">
            Nenhum jogo ao vivo no momento
          </div>
        )}
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
        {loadingUpcoming ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => <GameSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
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
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.badgeClass}`}>
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
