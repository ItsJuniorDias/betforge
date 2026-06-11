import { X, Trash2, ChevronRight } from "lucide-react";
import { useBetSlip } from "../../context/BetSlipContext";

const QUICK_STAKES = [10, 25, 50, 100, 200];

export default function BetSlip({ onClose }) {
  const {
    items,
    stake,
    setStake,
    betType,
    setBetType,
    removeBet,
    clearSlip,
    totalOdd,
    multiplePayout,
    count,
  } = useBetSlip();

  const fmt = (n) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <aside className="w-[300px] bg-[#111318] border-l border-white/[0.06] flex flex-col flex-shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-widest">BOLETIM</span>
          {count > 0 && (
            <span className="bg-[#C9A84C] text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <button
              onClick={clearSlip}
              className="text-[#5A5750] hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#5A5750] hover:text-[#F0EDE6] transition-colors p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {["single", "multiple", "system"].map((t) => (
          <button
            key={t}
            onClick={() => setBetType(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 ${
              betType === t
                ? "text-[#C9A84C] border-[#C9A84C]"
                : "text-[#5A5750] border-transparent hover:text-[#9B9590]"
            }`}
          >
            {t === "single"
              ? "Simples"
              : t === "multiple"
                ? "Múltipla"
                : "Sistema"}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-12">
          <div className="text-5xl mb-4 opacity-20">🎯</div>
          <p className="text-sm text-[#5A5750] leading-relaxed">
            Selecione uma odd nos jogos para adicionar ao boletim
          </p>
        </div>
      )}

      {/* Items */}
      {count > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.matchId}
              className="bg-[#181C23] border border-white/[0.06] rounded-lg p-3 animate-fadeIn"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#5A5750] mb-0.5 truncate">
                    {item.match}
                  </p>
                  <p className="text-sm font-medium truncate">{item.pick}</p>
                  <p className="text-xs text-[#C9A84C] font-semibold mt-0.5">
                    Odd: {item.odd.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeBet(item.matchId)}
                  className="text-[#5A5750] hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              {betType === "single" && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-between text-xs">
                  <span className="text-[#9B9590]">Retorno</span>
                  <span className="text-[#C9A84C] font-semibold">
                    R$ {fmt(stake * item.odd)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {count > 0 && (
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          {/* Stake input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#9B9590] whitespace-nowrap">
              Valor (R$)
            </label>
            <input
              type="number"
              value={stake}
              min={1}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#181C23] border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-semibold text-right text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          {/* Quick stakes */}
          <div className="flex gap-1.5">
            {QUICK_STAKES.map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={`flex-1 py-1.5 text-[11px] rounded-md border transition-all ${
                  stake === v
                    ? "bg-yellow-500/15 border-[#C9A84C] text-[#C9A84C]"
                    : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Summary */}
          {betType === "multiple" && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-[#9B9590]">Odd total</span>
                <span className="font-semibold">{totalOdd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#9B9590]">Apostas</span>
                <span>{count}</span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-sm font-semibold">Retorno potencial</span>
            <span className="text-base font-bold text-[#C9A84C]">
              R${" "}
              {fmt(
                betType === "multiple"
                  ? multiplePayout
                  : stake * (items[0]?.odd || 1),
              )}
            </span>
          </div>

          <button
            onClick={() => {
              alert(`✅ Aposta de R$ ${fmt(stake)} registrada com sucesso!`);
              clearSlip();
            }}
            className="w-full bg-[#C9A84C] hover:bg-[#F0D080] text-black font-display text-xl tracking-widest py-3 rounded-xl transition-colors"
          >
            APOSTAR AGORA
          </button>
        </div>
      )}
    </aside>
  );
}
