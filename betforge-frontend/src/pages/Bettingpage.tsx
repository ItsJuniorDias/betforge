import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBetSlip } from "../context/BetSlipContext";
import { useLayout } from "../context/LayoutContext";
// Dados dos jogos virão da API — usando seed local como fallback
const liveGames = [];
const upcomingGames = [];

// ─── Grupos de mercado ────────────────────────────────────────────────────────
const MARKET_GROUPS = [
  {
    id: "result",
    label: "Resultado Final",
    icon: "⚽",
    markets: [{ id: "1x2", label: "1X2", picks: null }],
  },
  {
    id: "goals",
    label: "Gols",
    icon: "🥅",
    markets: [
      {
        id: "over25",
        label: "Mais/Menos 2.5",
        picks: [
          { label: "Mais de 2.5", odd: 1.85 },
          { label: "Menos de 2.5", odd: 1.95 },
        ],
      },
      {
        id: "over35",
        label: "Mais/Menos 3.5",
        picks: [
          { label: "Mais de 3.5", odd: 2.7 },
          { label: "Menos de 3.5", odd: 1.45 },
        ],
      },
      {
        id: "btts",
        label: "Ambas Marcam",
        picks: [
          { label: "Sim", odd: 1.72 },
          { label: "Não", odd: 2.1 },
        ],
      },
    ],
  },
  {
    id: "handicap",
    label: "Handicap Asiático",
    icon: "⚖️",
    markets: [
      {
        id: "ah-home",
        label: "Casa (-1)",
        picks: [
          { label: "Casa -1", odd: 2.15 },
          { label: "Fora +1", odd: 1.72 },
        ],
      },
      {
        id: "ah-away",
        label: "Visitante (-1)",
        picks: [
          { label: "Casa +1", odd: 1.55 },
          { label: "Fora -1", odd: 2.5 },
        ],
      },
    ],
  },
  {
    id: "halftime",
    label: "Intervalo / Final",
    icon: "⏱️",
    markets: [
      {
        id: "ht-ft",
        label: "Resultado no Intervalo",
        picks: [
          { label: "Casa / Casa", odd: 2.4 },
          { label: "Empate / Casa", odd: 3.8 },
          { label: "Fora / Casa", odd: 8.5 },
          { label: "Casa / Empate", odd: 6.0 },
          { label: "Empate / Empate", odd: 4.2 },
          { label: "Fora / Fora", odd: 9.0 },
        ],
      },
    ],
  },
  {
    id: "corners",
    label: "Escanteios",
    icon: "🚩",
    markets: [
      {
        id: "corners-total",
        label: "Total de Escanteios",
        picks: [
          { label: "Mais de 9.5", odd: 1.9 },
          { label: "Menos de 9.5", odd: 1.9 },
        ],
      },
      {
        id: "corners-home",
        label: "Escanteios Casa",
        picks: [
          { label: "Mais de 4.5", odd: 2.05 },
          { label: "Menos de 4.5", odd: 1.75 },
        ],
      },
    ],
  },
  {
    id: "cards",
    label: "Cartões",
    icon: "🟨",
    markets: [
      {
        id: "cards-total",
        label: "Total de Cartões",
        picks: [
          { label: "Mais de 3.5", odd: 2.2 },
          { label: "Menos de 3.5", odd: 1.65 },
        ],
      },
    ],
  },
  {
    id: "scorer",
    label: "Marcadores",
    icon: "👟",
    markets: [
      {
        id: "anytime",
        label: "Qualquer Marcador",
        picks: [
          { label: "Jogador A", odd: 2.5 },
          { label: "Jogador B", odd: 3.2 },
          { label: "Jogador C", odd: 4.0 },
          { label: "Jogador D", odd: 5.5 },
        ],
      },
      {
        id: "first-scorer",
        label: "Primeiro Marcador",
        picks: [
          { label: "Jogador A", odd: 5.0 },
          { label: "Jogador B", odd: 6.5 },
          { label: "Jogador C", odd: 8.0 },
          { label: "Jogador D", odd: 11.0 },
        ],
      },
    ],
  },
];

// ─── Odd button com flutuação ao vivo ─────────────────────────────────────────
function LiveOddBtn({
  marketId,
  pickId,
  matchId,
  matchLabel,
  pickLabel,
  initialOdd,
  isLive,
}) {
  const [odd, setOdd] = useState(initialOdd);
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null
  const { addBet, isSelected } = useBetSlip();
  const selected = isSelected(`${matchId}-${marketId}-${pickId}`, pickLabel);

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

  return (
    <button
      onClick={() =>
        addBet({
          matchId: `${matchId}-${marketId}-${pickId}`,
          match: matchLabel,
          pick: pickLabel,
          odd,
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
        {flash === "up" && (
          <span className="text-[9px] ml-0.5 text-green-400">▲</span>
        )}
        {flash === "down" && (
          <span className="text-[9px] ml-0.5 text-red-400">▼</span>
        )}
      </span>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function BettingPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { enterBet, exitBet } = useLayout();

  const allGames = [...liveGames, ...upcomingGames];
  const game = allGames.find((g) => g.id === gameId) || allGames[0];

  const [activeGroup, setActiveGroup] = useState("result");
  const [expandedMarkets, setExpandedMarkets] = useState({});
  const [liveMinute, setLiveMinute] = useState(game?.minute || null);
  const [tab, setTab] = useState("markets");

  // Sinaliza ao Layout que estamos na BettingPage → mostra BetPanel
  useEffect(() => {
    enterBet();
    return () => exitBet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Incrementa o minuto ao vivo
  useEffect(() => {
    if (!game?.isLive) return;
    const t = setInterval(
      () => setLiveMinute((m) => Math.min(90, (m || 0) + 1)),
      30000,
    );
    return () => clearInterval(t);
  }, [game?.isLive]);

  const toggleMarket = (id) =>
    setExpandedMarkets((prev) => ({ ...prev, [id]: prev[id] === false }));

  if (!game)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#5A5750]">Jogo não encontrado.</p>
      </div>
    );

  const matchLabel = `${game.homeTeam} vs ${game.awayTeam}`;
  const currentGroup = MARKET_GROUPS.find((g) => g.id === activeGroup);

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
            <span className="text-[#5A5750]">·</span>
            <span>{game.round}</span>
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
              <p className="font-display text-xl tracking-wide text-center">
                {game.homeTeam}
              </p>
              <p className="text-[10px] text-[#5A5750] uppercase tracking-widest">
                Casa
              </p>
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
                  <p className="font-display text-4xl tracking-widest text-[#5A5750]">
                    VS
                  </p>
                  <p className="text-[11px] text-[#5A5750] mt-1">{game.time}</p>
                </div>
              )}
            </div>

            {/* Fora */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-[#181C23] border border-white/[0.04] flex items-center justify-center text-4xl">
                {game.awayEmoji}
              </div>
              <p className="font-display text-xl tracking-wide text-center">
                {game.awayTeam}
              </p>
              <p className="text-[10px] text-[#5A5750] uppercase tracking-widest">
                Fora
              </p>
            </div>
          </div>

          {/* Odds 1X2 rápidas */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <LiveOddBtn
              marketId="result"
              pickId="home"
              matchId={game.id}
              matchLabel={matchLabel}
              pickLabel={game.homeTeam}
              initialOdd={game.homeOdd}
              isLive={game.isLive}
            />
            {game.drawOdd ? (
              <LiveOddBtn
                marketId="result"
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
            <LiveOddBtn
              marketId="result"
              pickId="away"
              matchId={game.id}
              matchLabel={matchLabel}
              pickLabel={game.awayTeam}
              initialOdd={game.awayOdd}
              isLive={game.isLive}
            />
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
          {/* Grupos */}
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

          {/* Mercados do grupo ativo */}
          <div className="flex-1 space-y-3">
            {currentGroup?.markets.map((market) => {
              const picks =
                market.id === "1x2"
                  ? [
                      { label: game.homeTeam, odd: game.homeOdd },
                      ...(game.drawOdd
                        ? [{ label: "Empate", odd: game.drawOdd }]
                        : []),
                      { label: game.awayTeam, odd: game.awayOdd },
                    ]
                  : market.picks;

              const isExpanded = expandedMarkets[market.id] !== true; // aberto por padrão
              const cols =
                picks.length <= 2
                  ? 2
                  : picks.length === 3
                    ? 3
                    : picks.length === 4
                      ? 4
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
                      className={`text-[#5A5750] text-sm transition-transform duration-200 ${!isExpanded ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className="grid gap-2 p-3 pt-1"
                      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                    >
                      {picks.map((pick, pi) => (
                        <LiveOddBtn
                          key={pi}
                          marketId={market.id}
                          pickId={String(pi)}
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
                  {s.home}
                  {s.bar ? "%" : ""}
                </span>
                <span className="text-[11px] text-[#5A5750] uppercase tracking-wider">
                  {s.label}
                </span>
                <span className="text-sm font-bold">
                  {s.away}
                  {s.bar ? "%" : ""}
                </span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1E2330]">
                <div
                  className="bg-[#C9A84C] rounded-l-full"
                  style={{
                    width: `${s.bar ? s.home : (s.home / (s.max || 20)) * 100}%`,
                  }}
                />
                <div
                  className="bg-[#3A3D55] rounded-r-full ml-auto"
                  style={{
                    width: `${s.bar ? s.away : (s.away / (s.max || 20)) * 100}%`,
                  }}
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
            {
              team: game.homeTeam,
              emoji: game.homeEmoji,
              formation: "4-3-3",
              players: [
                "Goleiro",
                "Def. Dir.",
                "Zagueiro",
                "Zagueiro",
                "Def. Esq.",
                "Volante",
                "Meia",
                "Meia",
                "Atacante",
                "Atacante",
                "Atacante",
              ],
            },
            {
              team: game.awayTeam,
              emoji: game.awayEmoji,
              formation: "4-4-2",
              players: [
                "Goleiro",
                "Def. Dir.",
                "Zagueiro",
                "Zagueiro",
                "Def. Esq.",
                "Meia Dir.",
                "Volante",
                "Volante",
                "Meia Esq.",
                "Atacante",
                "Atacante",
              ],
            },
          ].map((t, ti) => (
            <div
              key={ti}
              className="bg-[#111318] border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{t.team}</p>
                  <p className="text-[10px] text-[#5A5750]">{t.formation}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {t.players.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1 border-b border-white/[0.03] last:border-0"
                  >
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
