import { useOddsFluctuation } from '../../hooks/useOddsFluctuation';
import { useBetSlip } from '../../context/BetSlipContext';

export default function OddButton({ matchId, matchLabel, pick, label, initialOdd, isLive }) {
  const { odd, direction } = useOddsFluctuation(initialOdd, isLive);
  const { addBet, isSelected } = useBetSlip();
  const selected = isSelected(matchId, pick);

  const directionClass = direction === 'up'
    ? 'text-green-400'
    : direction === 'down'
    ? 'text-red-400'
    : 'text-[#F0EDE6]';

  return (
    <button
      onClick={() => addBet({ matchId, match: matchLabel, pick, odd })}
      className={`
        flex flex-col items-center justify-center py-2 px-1 rounded-md
        border transition-all duration-150 text-center min-w-0
        ${selected
          ? 'bg-yellow-500/15 border-[#C9A84C] '
          : 'bg-[#181C23] border-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30'}
      `}
    >
      <span className="text-[10px] text-[#5A5750] mb-0.5 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-semibold transition-colors duration-300 ${selected ? 'text-[#C9A84C]' : directionClass}`}>
        {odd.toFixed(2)}
      </span>
    </button>
  );
}
