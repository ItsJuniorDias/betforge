import { useNavigate } from 'react-router-dom';
import OddButton from './OddButton';

/**
 * GameCard — card de jogo na HomePage, SportsPage e LivePage.
 *
 * Recebe o shape produzido por toGameCardShape() no useGames hook.
 * Os IDs de mercado são derivados da API: o card sempre exibe o mercado 1x2.
 * O marketId real ("1x2") é passado para OddButton para que a chave de
 * deduplicação no BetSlip seja consistente com a BettingPage.
 */
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

  // Determina se deve mostrar coluna de empate
  const hasDrawOdd = drawOdd != null;

  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:border-yellow-500/25 transition-all duration-200">
      {/* Header — clicável para a BettingPage */}
      <div
        onClick={() => navigate(`/bet/${id}`)}
        className="bg-[#181C23] px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#1E2330] transition-colors"
      >
        <span className="text-[11px] text-[#5A5750] flex items-center gap-1.5">
          {leagueFlag} {league} {round ? `· ${round}` : ''}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink inline-block" />
            {minute ? `${minute}'` : period || 'AO VIVO'}
          </span>
        ) : (
          <span className="text-[11px] text-[#9B9590] bg-[#1E2330] px-2 py-0.5 rounded">
            {time || '–'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        {/* Times & Score — clicável */}
        <div
          onClick={() => navigate(`/bet/${id}`)}
          className="mb-3 space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              {homeEmoji} {homeTeam}
            </span>
            {isLive && (
              <span className="font-display text-xl text-[#C9A84C]">{homeScore}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              {awayEmoji} {awayTeam}
            </span>
            {isLive && (
              <span className="font-display text-xl text-[#C9A84C]">{awayScore}</span>
            )}
          </div>
        </div>

        {/* Odds 1X2 — passam o marketId real para BetSlip */}
        <div className={`grid gap-1.5 ${hasDrawOdd ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {homeOdd != null && (
            <OddButton
              matchId={id}
              marketId="1x2"
              marketLabel="Resultado Final"
              matchLabel={matchLabel}
              pick="home"
              label="1"
              initialOdd={homeOdd}
              isLive={isLive}
            />
          )}
          {hasDrawOdd && (
            <OddButton
              matchId={id}
              marketId="1x2"
              marketLabel="Resultado Final"
              matchLabel={matchLabel}
              pick="draw"
              label="X"
              initialOdd={drawOdd}
              isLive={isLive}
            />
          )}
          {awayOdd != null && (
            <OddButton
              matchId={id}
              marketId="1x2"
              marketLabel="Resultado Final"
              matchLabel={matchLabel}
              pick="away"
              label="2"
              initialOdd={awayOdd}
              isLive={isLive}
            />
          )}
        </div>

        {/* Contador de mercados — leva para BettingPage */}
        {markets > 0 && (
          <div className="mt-2.5 text-right">
            <button
              onClick={() => navigate(`/bet/${id}`)}
              className="text-[11px] text-[#5A5750] hover:text-[#C9A84C] cursor-pointer transition-colors"
            >
              +{markets} mercados →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
