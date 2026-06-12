import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { liveGames, upcomingGames, sports, leagues } from "../data/mockData";
import GameCard from "../components/betting/GameCard";

const ALL_GAMES = [...liveGames, ...upcomingGames];

// Dados extras para busca de times e ligas
const TEAMS = [
  ...new Set(ALL_GAMES.flatMap((g) => [g.homeTeam, g.awayTeam])),
].map((name) => ({
  type: "team",
  name,
  games: ALL_GAMES.filter((g) => g.homeTeam === name || g.awayTeam === name),
}));

const POPULAR = [
  "Flamengo",
  "Real Madrid",
  "Champions League",
  "Brasileirão",
  "NBA",
  "Ao Vivo",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState("jogos");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query) setSearchParams({ q: query });
    else setSearchParams({});
  }, [query]);

  const q = query.toLowerCase().trim();

  const matchedGames = q
    ? ALL_GAMES.filter(
        (g) =>
          g.homeTeam.toLowerCase().includes(q) ||
          g.awayTeam.toLowerCase().includes(q) ||
          g.league.toLowerCase().includes(q),
      )
    : [];

  const matchedLeagues = q
    ? leagues.filter((l) => l.label.toLowerCase().includes(q))
    : [];

  const matchedSports = q
    ? sports.filter((s) => s.label.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchedGames.length + matchedLeagues.length + matchedSports.length;
  const hasResults = totalResults > 0;

  const TABS = [
    { key: "jogos", label: "Jogos", count: matchedGames.length },
    { key: "ligas", label: "Ligas", count: matchedLeagues.length },
    { key: "esportes", label: "Esportes", count: matchedSports.length },
  ];

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Campo de busca */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5750] text-xl pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar time, jogo, liga ou esporte..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#111318] border border-white/[0.08] focus:border-[#C9A84C]/50 rounded-2xl pl-11 pr-12 py-4 text-[15px] text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A5750] hover:text-[#9B9590] text-lg transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Estado: vazio — mostra sugestões */}
      {!q && (
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
              Buscas populares
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  className="bg-[#111318] border border-white/[0.06] hover:border-yellow-500/30 hover:text-[#C9A84C] text-[#9B9590] text-sm px-4 py-2 rounded-xl transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
              🔴 Jogos ao vivo agora
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveGames.slice(0, 4).map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
              Esportes
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {sports.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setQuery(s.label)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-[#111318] border border-white/[0.06] hover:border-yellow-500/20 hover:text-[#C9A84C] text-[#9B9590] transition-all"
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[11px] font-medium text-center leading-tight">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sem resultados */}
      {q && !hasResults && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔍</div>
          <p className="text-[#F0EDE6] font-semibold mb-2">
            Nenhum resultado para "{query}"
          </p>
          <p className="text-[#5A5750] text-sm">
            Tente buscar por outro time, liga ou esporte
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR.map((p) => (
              <button
                key={p}
                onClick={() => setQuery(p)}
                className="bg-[#111318] border border-white/[0.06] hover:border-yellow-500/30 text-[#9B9590] hover:text-[#C9A84C] text-sm px-3 py-1.5 rounded-lg transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {q && hasResults && (
        <>
          {/* Cabeçalho dos resultados */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#9B9590]">
              <span className="font-semibold text-[#F0EDE6]">
                {totalResults}
              </span>{" "}
              resultado{totalResults !== 1 ? "s" : ""} para{" "}
              <span className="text-[#C9A84C]">"{query}"</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/[0.06] mb-5">
            {TABS.filter((t) => t.count > 0).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeTab === t.key
                    ? "text-[#C9A84C] border-[#C9A84C]"
                    : "text-[#5A5750] border-transparent hover:text-[#9B9590]"
                }`}
              >
                {t.label}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.key
                      ? "bg-yellow-500/15 text-[#C9A84C]"
                      : "bg-[#1E2330] text-[#5A5750]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Jogos */}
          {activeTab === "jogos" && matchedGames.length > 0 && (
            <div className="space-y-4">
              {matchedGames.filter((g) => g.isLive).length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
                    Ao Vivo
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedGames
                      .filter((g) => g.isLive)
                      .map((g) => (
                        <GameCard key={g.id} game={g} />
                      ))}
                  </div>
                </section>
              )}
              {matchedGames.filter((g) => !g.isLive).length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
                    Próximos
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedGames
                      .filter((g) => !g.isLive)
                      .map((g) => (
                        <GameCard key={g.id} game={g} />
                      ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Ligas */}
          {activeTab === "ligas" && matchedLeagues.length > 0 && (
            <div className="space-y-2">
              {matchedLeagues.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/sports`)}
                  className="w-full flex items-center justify-between bg-[#111318] border border-white/[0.06] hover:border-yellow-500/20 rounded-xl px-4 py-3.5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{l.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#F0EDE6]">
                        {l.label}
                      </p>
                      <p className="text-[11px] text-[#5A5750] mt-0.5">
                        {sports.find((s) => s.id === l.sport)?.icon}{" "}
                        {sports.find((s) => s.id === l.sport)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full">
                      {l.count} jogos
                    </span>
                    <span className="text-[#5A5750] text-sm">›</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Esportes */}
          {activeTab === "esportes" && matchedSports.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {matchedSports.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate("/sports")}
                  className="flex flex-col items-center gap-2 py-5 px-3 rounded-xl bg-[#111318] border border-white/[0.06] hover:border-yellow-500/20 hover:text-[#C9A84C] text-[#9B9590] transition-all"
                >
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="text-[11px] text-[#5A5750]">
                    {s.count} jogos
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
