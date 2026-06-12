import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBetSlip } from "../context/BetSlipContext";
import { useLayout } from "../context/LayoutContext";
import { useGameById } from "../hooks/api/useGames";

// ─── Grupos de mercado (sidebar de navegação) ─────────────────────────────────
// Usado apenas para a sidebar de filtro visual — os dados reais vêm da API.
// Mapeia type da API → grupo de UI para filtrar a lista de mercados.
const MARKET_GROUPS = [
  { id: "all",      label: "Todos",            icon: "📋", types: [] },
  { id: "result",   label: "Resultado Final",  icon: "⚽", types: ["1x2"] },
  { id: "goals",    label: "Gols",             icon: "🥅", types: ["over_under"] },
  { id: "handicap", label: "Handicap",         icon: "⚖️", types: ["handicap", "spreads"] },
];

// ─── Odd button com flutuação ao vivo ─────────────────────────────────────────
function LiveOddBtn({
  marketId,
  marketLabel,
  pickId,
  matchId,
  matchLabel,
  pickLabel,
  initialOdd,
  isLive,
}: {
  marketId: string;
  marketLabel: string;
  pickId: string;
  matchId: string;
  matchLabel: string;
  pickLabel: string;
  initialOdd: number;
  isLive: boolean;
}) {
  const [odd, setOdd] = useState(initialOdd);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const { addBet, isSelected } = useBetSlip();

  // Chave única igual à usada pelo OddButton no GameCard
  const betKey = `${matchId}-${marketId}-${pickId}`;
  const selected = isSelected(betKey, pickLabel);

  // Flutuação simulada para jogos ao vivo
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => {
      if (Math.random() < 0.25) {
        const delta = (Math.random() - 0.5) * 0.14;
        setOdd((prev) => {
          const next = Math.max(1.01, parseFloat((prev + delta).toFixed(2)));
          setFlash(next > prev ? "up" : "down");
          setTimeout(() => setFlash(null), 700);
          return next;
        });
      }
    }, 3200);
    return () => clearInterval(t);
  }, [isLive]);

  // Sincroniza com odd atualizada pela API (quando refetch ocorre)
  useEffect(() => {
    setOdd(initialOdd);
  }, [initialOdd]);

  return (
    <button
      onClick={() =>
        addBet({
          matchId: betKey,
          match: matchLabel,
          pick: pickLabel,
          odd,
          _realMatchId: matchId,
          _marketId: marketId,
          _marketLabel: marketLabel,
        })
      }
      className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border
        transition-all duration-150 min-w-0
        ${
          selected
            ? "bg-yellow-500/15 border-[#C9A84C]"
            : "bg-[#181C23] border-white/[0.06] hover:bg-yellow-500/[0.07] hover:border-yellow-500/25"
        }`}
    >
      <span
        className={`text-xs font-medium truncate w-full text-center leading-tight mb-1
        ${selected ? "text-[#C9A84C]" : "text-[#9B9590]"}`}
      >
        {pickLabel}
      </span>
      <span
        className={`text-sm font-bold transition-colors duration-200 ${
          selected
            ? "text-[#C9A84C]"
            : flash === "up"
              ? "text-green-400"
              : flash === "down"
                ? "text-red-400"
                : "text-[#F0EDE6]"
        }`}
      >
        {odd.toFixed(2)}
        {flash === "up" && <span className="text-[9px] ml-0.5 text-green-400">▲</span>}
        {flash === "down" && <span className="text-[9px] ml-0.5 text-red-400">▼</span>}
      </span>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function BettingPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { enterBet, exitBet } = useLayout();

  // Dados reais da API — detalhe do jogo + todos os mercados
  // useGameById já aplica toGameDetailShape via select
  const { data: game, isLoading, isError } = useGameById(gameId || "");

  const [activeGroup, setActiveGroup] = useState("all");
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({});
  const [liveMinute, setLiveMinute] = useState<number | null>(null);
  const [tab, setTab] = useState("markets");

  // Sinaliza ao Layout que estamos na BettingPage → mostra BetPanel
  useEffect(() => {
    enterBet();
    return () => exitBet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Incrementa o minuto ao vivo (simulado, já que a API não tem websocket)
  useEffect(() => {
    if (!game?.isLive) return;
    if (game.minute) setLiveMinute(game.minute);
    const t = setInterval(
      () => setLiveMinute((m) => Math.min(90, (m || 0) + 1)),
      30000,
    );
    return () => clearInterval(t);
  }, [game?.isLive, game?.minute]);

  const toggleMarket = (id: string) =>
    setExpandedMarkets((prev) => ({ ...prev, [id]: !prev[id] }));

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (isError || !game)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#5A5750]">Jogo não encontrado.</p>
      </div>
    );

  const matchLabel = `${game.homeTeam} vs ${game.awayTeam}`;

  // Filtra mercados pelo grupo ativo
  const groupTypes = MARKET_GROUPS.find((g) => g.id === activeGroup)?.types ?? [];
  const visibleMarkets =
    activeGroup === "all"
      ? game.markets_detail
      : game.markets_detail.filter((m) => groupTypes.includes(m.type));

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate(-1)}
        className="text-[13px] text-[#5A5750] hover:text-[#9B9590] transition-colors flex items-center gap-1.5 mb-4"
      >
        ← Voltar
      </button>

      {/* ── Hero do jogo ─────────────────────────────────────────── */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
        {/* Cabeçalho da liga */}
        <div className="bg-[#181C23] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-[#9B9590]">
            <span>{game.leagueFlag}</span>
            <span>{game.league}</span>
            {game.round && (
              <>
                <span className="text-[#5A5750]">·</span>
                <span>{game.round}</span>
              </>
            )}
          </div>
          {game.isLive ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
              AO VIVO{liveMinute ? ` · ${liveMinute}'` : ""}
            </span>
          ) : (
            <span className="text-[12px] text-[#9B9590] bg-[#1E2330] px-2.5 py-1 rounded-full">
              {game.time}
            </span>
          )}
        </div>

        {/* Times + placar */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between">
            {/* Casa */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-[#181C23] border border-white/[0.04] flex items-center justify-center text-4xl">
                {game.homeEmoji}
              </div>
              <p className="font-display text-xl tracking-wide text-center">{game.homeTeam}</p>
              <p className="text-[10px] text-[#5A5750] uppercase tracking-widest">Casa</p>
            </div>

            {/* Placar / VS */}
            <div className="flex flex-col items-center gap-1 px-4">
              {game.isLive ? (
                <>
                  <p className="font-display text-5xl tracking-widest text-[#C9A84C]">
                    {game.homeScore} – {game.awayScore}
                  </p>
                  <p className="text-[10px] text-[#5A5750] uppercase tracking-widest mt-1">
                    {game.period || "1° Tempo"}
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <p className="font-display text-4xl tracking-widest text-[#5A5750]">VS</p>
                  <p className="text-[11px] text-[#5A5750] mt-1">{game.time}</p>
                </div>
              )}
            </div>

            {/* Fora */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-[#181C23] border border-white/[0.04] flex items-center justify-center text-4xl">
                {game.awayEmoji}
              </div>
              <p className="font-display text-xl tracking-wide text-center">{game.awayTeam}</p>
              <p className="text-[10px] text-[#5A5750] uppercase tracking-widest">Fora</p>
            </div>
          </div>

          {/* Odds 1X2 rápidas — vindas da API */}
          <div className={`grid gap-2 mt-5 ${game.drawOdd != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {game.homeOdd != null && (
              <LiveOddBtn
                marketId="1x2"
                marketLabel="Resultado Final"
                pickId="home"
                matchId={game.id}
                matchLabel={matchLabel}
                pickLabel={game.homeTeam}
                initialOdd={game.homeOdd}
                isLive={game.isLive}
              />
            )}
            {game.drawOdd != null ? (
              <LiveOddBtn
                marketId="1x2"
                marketLabel="Resultado Final"
                pickId="draw"
                matchId={game.id}
                matchLabel={matchLabel}
                pickLabel="Empate"
                initialOdd={game.drawOdd}
                isLive={game.isLive}
              />
            ) : (
              <div className="bg-[#181C23] rounded-xl border border-white/[0.04] flex items-center justify-center text-[11px] text-[#5A5750]">
                N/D
              </div>
            )}
            {game.awayOdd != null && (
              <LiveOddBtn
                marketId="1x2"
                marketLabel="Resultado Final"
                pickId="away"
                matchId={game.id}
                matchLabel={matchLabel}
                pickLabel={game.awayTeam}
                initialOdd={game.awayOdd}
                isLive={game.isLive}
              />
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-t border-white/[0.06]">
          {[
            { key: "markets", label: `Mercados · ${game.markets}` },
            { key: "stats", label: "Estatísticas" },
            { key: "lineups", label: "Escalações" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-[12px] font-semibold transition-all border-b-2 ${
                tab === t.key
                  ? "text-[#C9A84C] border-[#C9A84C] bg-yellow-500/[0.03]"
                  : "text-[#5A5750] border-transparent hover:text-[#9B9590]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Aba MERCADOS ─────────────────────────────────────────── */}
      {tab === "markets" && (
        <div className="flex gap-4">
          {/* Grupos / sidebar de filtro */}
          <div className="w-40 flex-shrink-0 space-y-1">
            {MARKET_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-medium
                  transition-all flex items-center gap-2 ${
                    activeGroup === g.id
                      ? "bg-yellow-500/[0.08] text-[#C9A84C] border border-yellow-500/20"
                      : "text-[#9B9590] hover:text-[#F0EDE6] hover:bg-[#111318] border border-transparent"
                  }`}
              >
                <span>{g.icon}</span>
                <span className="truncate">{g.label}</span>
              </button>
            ))}
          </div>

          {/* Mercados reais da API */}
          <div className="flex-1 space-y-3">
            {visibleMarkets.length === 0 && (
              <div className="text-center py-12 text-[#5A5750] text-sm">
                Nenhum mercado disponível nesta categoria
              </div>
            )}

            {visibleMarkets.map((market) => {
              const isExpanded = expandedMarkets[market.id] !== false; // aberto por padrão
              const cols =
                market.picks.length <= 2 ? 2
                : market.picks.length === 3 ? 3
                : market.picks.length === 4 ? 4
                : 3;

              return (
                <div
                  key={market.id}
                  className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleMarket(market.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#181C23] transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-[#F0EDE6]">
                      {market.label}
                    </span>
                    <span
                      className={`text-[#5A5750] text-sm transition-transform duration-200 ${
                        !isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className="grid gap-2 p-3 pt-1"
                      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                    >
                      {market.picks.map((pick) => (
                        <LiveOddBtn
                          key={pick.id}
                          marketId={market.id}
                          marketLabel={market.label}
                          pickId={pick.id}
                          matchId={game.id}
                          matchLabel={matchLabel}
                          pickLabel={pick.label}
                          initialOdd={pick.odd}
                          isLive={game.isLive}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aba ESTATÍSTICAS ─────────────────────────────────────── */}
      {tab === "stats" && (
        <div className="space-y-3">
          {[
            { label: "Posse de bola", home: 58, away: 42, bar: true },
            { label: "Chutes a gol", home: 7, away: 4, max: 15 },
            { label: "Chutes totais", home: 14, away: 9, max: 25 },
            { label: "Escanteios", home: 6, away: 3, max: 12 },
            { label: "Faltas", home: 8, away: 11, max: 20 },
            { label: "Cartões amarelos", home: 1, away: 2, max: 5 },
            { label: "Impedimentos", home: 3, away: 1, max: 8 },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#111318] border border-white/[0.06] rounded-xl px-5 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">
                  {s.home}{s.bar ? "%" : ""}
                </span>
                <span className="text-[11px] text-[#5A5750] uppercase tracking-wider">
                  {s.label}
                </span>
                <span className="text-sm font-bold">
                  {s.away}{s.bar ? "%" : ""}
                </span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1E2330]">
                <div
                  className="bg-[#C9A84C] rounded-l-full"
                  style={{ width: `${s.bar ? s.home : (s.home / (s.max || 20)) * 100}%` }}
                />
                <div
                  className="bg-[#3A3D55] rounded-r-full ml-auto"
                  style={{ width: `${s.bar ? s.away : (s.away / (s.max || 20)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Aba ESCALAÇÕES ───────────────────────────────────────── */}
      {tab === "lineups" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { team: game.homeTeam, emoji: game.homeEmoji, formation: "4-3-3",
              players: ["Goleiro","Def. Dir.","Zagueiro","Zagueiro","Def. Esq.",
                        "Volante","Meia","Meia","Atacante","Atacante","Atacante"] },
            { team: game.awayTeam, emoji: game.awayEmoji, formation: "4-4-2",
              players: ["Goleiro","Def. Dir.","Zagueiro","Zagueiro","Def. Esq.",
                        "Meia Dir.","Volante","Volante","Meia Esq.","Atacante","Atacante"] },
          ].map((t, ti) => (
            <div key={ti} className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{t.team}</p>
                  <p className="text-[10px] text-[#5A5750]">{t.formation}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {t.players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-white/[0.03] last:border-0">
                    <span className="w-5 h-5 rounded-full bg-[#1E2330] text-[10px] flex items-center justify-center text-[#5A5750] flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-[#9B9590]">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
