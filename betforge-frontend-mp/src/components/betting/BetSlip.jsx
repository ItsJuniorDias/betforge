import { X, Trash2 } from "lucide-react";
import { useBetSlip } from "../../context/BetSlipContext";
import { usePlaceBet } from "../../hooks/api/useBets";
import { useBalance } from "../../hooks/api/useUser";
import { getApiError } from "../../services/api";
import { useState } from "react";

const QUICK_STAKES = [10, 25, 50, 100, 200];

export default function BetSlip({ onClose }) {
  const { items, stake, setStake, betType, setBetType, removeBet, clearSlip, totalOdd, multiplePayout, count } = useBetSlip();
  const { data: balance } = useBalance();
  const placeBet = usePlaceBet();
  const [confirmed, setConfirmed] = useState(false);

  const fmt = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const payout = betType === "multiple" ? multiplePayout : stake * (items[0]?.odd || 1);
  const currentBalance = balance?.balance ?? 0;
  const hasEnoughBalance = currentBalance >= stake;

  const apiError = placeBet.error ? getApiError(placeBet.error) : "";

  const handleBet = () => {
    const selections = items.map((item) => ({
      matchId: item.matchId,
      marketId: item.marketId,
      pick: item.pick,
      label: item.pick,
      odd: item.odd,
      matchLabel: item.match,
      marketLabel: item.market ?? "Resultado Final",
    }));

    placeBet.mutate(
      { type: betType === "multiple" ? "multiple" : "single", stake, selections },
      {
        onSuccess: () => {
          setConfirmed(true);
          setTimeout(() => { setConfirmed(false); clearSlip(); }, 3500);
        },
      }
    );
  };

  if (confirmed) {
    return (
      <aside className="w-[300px] bg-[#111318] border-l border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0 h-full px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl">✅</div>
        <div>
          <p className="font-display text-xl tracking-widest text-[#F0EDE6] mb-2">APOSTA REALIZADA!</p>
          <p className="text-sm text-[#5A5750]">Retorno potencial</p>
          <p className="font-display text-2xl text-[#C9A84C] mt-1">R$ {fmt(payout)}</p>
        </div>
        <p className="text-[11px] text-[#5A5750]">Acompanhe em Histórico</p>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-[#111318] border-l border-white/[0.06] flex flex-col flex-shrink-0 h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-widest">BOLETIM</span>
          {count > 0 && <span className="bg-[#C9A84C] text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <button onClick={clearSlip} className="text-[#5A5750] hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>}
          {onClose && <button onClick={onClose} className="text-[#5A5750] hover:text-[#F0EDE6] transition-colors p-1"><X size={16} /></button>}
        </div>
      </div>

      <div className="flex border-b border-white/[0.06]">
        {["single", "multiple"].map((t) => (
          <button key={t} onClick={() => setBetType(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 ${betType === t ? "text-[#C9A84C] border-[#C9A84C]" : "text-[#5A5750] border-transparent hover:text-[#9B9590]"}`}>
            {t === "single" ? "Simples" : "Múltipla"}
          </button>
        ))}
      </div>

      {count === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-12">
          <div className="text-5xl mb-4 opacity-20">🎯</div>
          <p className="text-sm text-[#5A5750] leading-relaxed">Selecione uma odd nos jogos para adicionar ao boletim</p>
        </div>
      )}

      {count > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.map((item) => (
            <div key={item.matchId} className="bg-[#181C23] border border-white/[0.06] rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#5A5750] mb-0.5 truncate">{item.match}</p>
                  <p className="text-sm font-medium truncate">{item.pick}</p>
                  <p className="text-xs text-[#C9A84C] font-semibold mt-0.5">Odd: {item.odd.toFixed(2)}</p>
                </div>
                <button onClick={() => removeBet(item.matchId)} className="text-[#5A5750] hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"><X size={14} /></button>
              </div>
              {betType === "single" && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-between text-xs">
                  <span className="text-[#9B9590]">Retorno</span>
                  <span className="text-[#C9A84C] font-semibold">R$ {fmt(stake * item.odd)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {count > 0 && (
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          {apiError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">{apiError}</div>}

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#9B9590] whitespace-nowrap">Valor (R$)</label>
            <input type="number" value={stake} min={1} onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#181C23] border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-semibold text-right text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C] transition-colors" />
          </div>

          <div className="flex gap-1.5">
            {QUICK_STAKES.map((v) => (
              <button key={v} onClick={() => setStake(v)}
                className={`flex-1 py-1.5 text-[11px] rounded-md border transition-all ${stake === v ? "bg-yellow-500/15 border-[#C9A84C] text-[#C9A84C]" : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"}`}>
                {v}
              </button>
            ))}
          </div>

          {betType === "multiple" && (
            <div className="flex justify-between text-xs">
              <span className="text-[#9B9590]">Odd total</span>
              <span className="font-semibold">{totalOdd.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-sm font-semibold">Retorno potencial</span>
            <span className="text-base font-bold text-[#C9A84C]">R$ {fmt(payout)}</span>
          </div>

          {/* Saldo real */}
          <div className="flex justify-between text-xs text-[#5A5750]">
            <span>Saldo disponível</span>
            <span className={hasEnoughBalance ? "text-[#9B9590]" : "text-red-400"}>R$ {fmt(currentBalance)}</span>
          </div>

          <button onClick={handleBet} disabled={placeBet.isPending || !hasEnoughBalance || stake < 1}
            className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-50 disabled:cursor-not-allowed text-black font-display text-xl tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {placeBet.isPending ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
            {placeBet.isPending ? "APOSTANDO..." : "APOSTAR AGORA"}
          </button>
        </div>
      )}
    </aside>
  );
}
