import { useNavigate } from "react-router-dom";
import OddButton from "./OddButton";

export default function GameCard({ game }) {
  const navigate = useNavigate();
  const {
    id,
    league,
    leagueFlag,
    round,
    homeTeam,
    awayTeam,
    homeEmoji,
    awayEmoji,
    homeScore,
    awayScore,
    minute,
    period,
    isLive,
    time,
    homeOdd,
    drawOdd,
    awayOdd,
    sport,
    markets,
  } = game;

  const matchLabel = `${homeTeam} vs ${awayTeam}`;

  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:border-yellow-500/25 transition-all duration-200">
      {/* Header — clicável para a BettingPage */}
      <div
        onClick={() => navigate(`/bet/${id}`)}
        className="bg-[#181C23] px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#1E2330] transition-colors"
      >
        <span className="text-[11px] text-[#5A5750] flex items-center gap-1.5">
          {leagueFlag} {league} · {round}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink inline-block" />
            {minute ? `${minute}'` : period}
          </span>
        ) : (
          <span className="text-[11px] text-[#9B9590] bg-[#1E2330] px-2 py-0.5 rounded">
            {time}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        {/* Teams & Score — clicável */}
        <div
          onClick={() => navigate(`/bet/${id}`)}
          className="mb-3 space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              {homeEmoji} {homeTeam}
            </span>
            {isLive && (
              <span className="font-display text-xl text-[#C9A84C]">
                {homeScore}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              {awayEmoji} {awayTeam}
            </span>
            {isLive && (
              <span className="font-display text-xl text-[#C9A84C]">
                {awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Odds — adicionam ao BetSlip diretamente */}
        <div
          className={`grid gap-1.5 ${drawOdd ? "grid-cols-3" : "grid-cols-2"}`}
        >
          <OddButton
            matchId={id}
            matchLabel={matchLabel}
            pick={homeTeam}
            label="1"
            initialOdd={homeOdd}
            isLive={isLive}
          />
          {drawOdd && (
            <OddButton
              matchId={id}
              matchLabel={matchLabel}
              pick="Empate"
              label="X"
              initialOdd={drawOdd}
              isLive={isLive}
            />
          )}
          <OddButton
            matchId={id}
            matchLabel={matchLabel}
            pick={awayTeam}
            label="2"
            initialOdd={awayOdd}
            isLive={isLive}
          />
        </div>

        {/* Markets count — leva para BettingPage */}
        <div className="mt-2.5 text-right">
          <button
            onClick={() => navigate(`/bet/${id}`)}
            className="text-[11px] text-[#5A5750] hover:text-[#C9A84C] cursor-pointer transition-colors"
          >
            +{markets} mercados →
          </button>
        </div>
      </div>
    </div>
  );
}
