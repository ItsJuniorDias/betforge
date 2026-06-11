import { useOddsFluctuation } from '../../hooks/useOddsFluctuation';
import { useBetSlip } from '../../context/BetSlipContext';

/**
 * OddButton — botão de odd para GameCard (lista de jogos)
 *
 * Props:
 *   matchId      — ID real do jogo (UUID da API)
 *   marketId     — ID do mercado (ex: UUID do mercado 1x2 na API)
 *   marketLabel  — label do mercado (ex: "Resultado Final")
 *   matchLabel   — "TimeA vs TimeB"
 *   pick         — identificador da escolha (ex: "home", "draw", "away")
 *   label        — rótulo exibido (ex: "1", "X", "2")
 *   initialOdd   — valor inicial da odd
 *   isLive       — ativa a flutuação animada de odds
 */
export default function OddButton({
  matchId,
  marketId = '1x2',
  marketLabel = 'Resultado Final',
  matchLabel,
  pick,
  label,
  initialOdd,
  isLive,
}) {
  const { odd, direction } = useOddsFluctuation(initialOdd, isLive);
  const { addBet, isSelected } = useBetSlip();

  // Chave única para deduplicação: combina jogo + mercado + pick
  const betKey = `${matchId}-${marketId}-${pick}`;
  const selected = isSelected(betKey, pick);

  const directionClass =
    direction === 'up'
      ? 'text-green-400'
      : direction === 'down'
        ? 'text-red-400'
        : 'text-[#F0EDE6]';

  return (
    <button
      onClick={() =>
        addBet({
          matchId: betKey,           // chave de deduplicação no BetSlip
          match: matchLabel,
          pick,
          odd,
          // Campos extras para o payload real POST /bets
          _realMatchId: matchId,
          _marketId: marketId,
          _marketLabel: marketLabel,
        })
      }
      className={`
        flex flex-col items-center justify-center py-2 px-1 rounded-md
        border transition-all duration-150 text-center min-w-0
        ${
          selected
            ? 'bg-yellow-500/15 border-[#C9A84C]'
            : 'bg-[#181C23] border-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30'
        }
      `}
    >
      <span className="text-[10px] text-[#5A5750] mb-0.5 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-sm font-semibold transition-colors duration-300 ${
          selected ? 'text-[#C9A84C]' : directionClass
        }`}
      >
        {odd != null ? odd.toFixed(2) : '–'}
      </span>
    </button>
  );
}
