import { useState, useEffect } from "react";
import { liveGames } from "../data/mockData";
import GameCard from "../components/betting/GameCard";

export default function LivePage() {
  const [games, setGames] = useState(liveGames);
  const [filter, setFilter] = useState("all");

  // Simulate minute updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGames((prev) =>
        prev.map((g) =>
          g.minute ? { ...g, minute: Math.min(90, g.minute + 1) } : g,
        ),
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sports = ["all", "football", "basketball", "esports", "mma"];
  const sportLabels = {
    all: "Todos",
    football: "Futebol",
    basketball: "Basquete",
    esports: "E-Sports",
    mma: "MMA",
  };

  const filtered =
    filter === "all" ? games : games.filter((g) => g.sport === filter);

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-blink" />
        <h1 className="font-display text-4xl tracking-wide">AO VIVO</h1>
        <span className="bg-red-400/10 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
          {games.length} jogos
        </span>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sports.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
              filter === s
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {sportLabels[s]}
          </button>
        ))}
      </div>

      {/* Live indicator bar */}
      <div className="flex items-center gap-2 bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3 mb-5">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-blink" />
        <p className="text-sm text-[#9B9590]">
          Odds atualizadas em tempo real · Clique em uma odd para adicionar ao
          boletim
        </p>
      </div>

      {/* Games grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔴</div>
          <p className="text-[#5A5750]">
            Nenhum jogo ao vivo neste esporte no momento
          </p>
        </div>
      )}
    </div>
  );
}
