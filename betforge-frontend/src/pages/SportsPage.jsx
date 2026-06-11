import { useState } from "react";
import { sports, leagues } from "../data/mockData";
import { useGames } from "../hooks/api/useGames";
import GameCard from "../components/betting/GameCard";

export default function SportsPage() {
  const [activeSport, setActiveSport] = useState("football");
  const [activeLeague, setActiveLeague] = useState("all");

  const sportLeagues = leagues.filter((l) => l.sport === activeSport);

  // Busca jogos filtrados por esporte (e opcionalmente liga) da API real
  const { data, isLoading, isError } = useGames({
    sport: activeSport,
    league: activeLeague === "all" ? undefined : activeLeague,
    limit: 50,
  });

  const allGames = data?.data ?? [];
  const liveGames = allGames.filter((g) => g.isLive);
  const upcomingGames = allGames.filter((g) => !g.isLive);

  return (
    <div className="p-5 max-w-full mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-6">ESPORTES</h1>

      {/* Sports selector */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => {
              setActiveSport(sport.id);
              setActiveLeague("all");
            }}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
              activeSport === sport.id
                ? "bg-yellow-500/[0.08] border-[#C9A84C] text-[#C9A84C]"
                : "bg-[#111318] border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] hover:border-white/20"
            }`}
          >
            <span className="text-xl">{sport.icon}</span>
            <span className="text-[11px] font-medium text-center leading-tight">
              {sport.label}
            </span>
            <span
              className={`text-[10px] ${activeSport === sport.id ? "text-[#C9A84C]" : "text-[#5A5750]"}`}
            >
              {sport.count}
            </span>
          </button>
        ))}
      </div>

      {/* League filter */}
      {sportLeagues.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveLeague("all")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeLeague === "all"
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            Todas as Ligas
          </button>
          {sportLeagues.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLeague(l.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeLeague === l.id
                  ? "bg-[#C9A84C] text-black"
                  : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
              }`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#111318] border border-white/[0.06] rounded-xl h-36 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">⚠️</div>
          <p className="text-[#5A5750]">Erro ao carregar jogos</p>
        </div>
      )}

      {/* Games */}
      {!isLoading && !isError && (
        allGames.length > 0 ? (
          <>
            {liveGames.length > 0 && (
              <section className="mb-6">
                <h2 className="font-display text-xl tracking-wide flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink" />
                  Ao Vivo
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
            {upcomingGames.length > 0 && (
              <section>
                <h2 className="font-display text-xl tracking-wide flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                  Próximos Jogos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-20">
              {sports.find((s) => s.id === activeSport)?.icon}
            </div>
            <p className="text-[#5A5750]">Nenhum jogo disponível no momento</p>
          </div>
        )
      )}
    </div>
  );
}
