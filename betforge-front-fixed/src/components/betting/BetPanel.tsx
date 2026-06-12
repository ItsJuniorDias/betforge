import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetSlip } from '../../context/BetSlipContext';
import { useLayout } from '../../context/LayoutContext';
import { usePlaceBet } from '../../hooks/api/useBets';
import { useBalance } from '../../hooks/api/useUser';
import type { Bet } from '../../types/api';

const QUICK_STAKES = [10, 25, 50, 100, 200, 500];

export default function BetPanel() {
  const navigate = useNavigate();
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
  const { closeSlip } = useLayout();
  const placeBet = usePlaceBet();
  const { data: balanceData, refetch: refetchBalance } = useBalance();

  const [confirmedBet, setConfirmedBet] = useState<Bet | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const balance = balanceData?.balance ?? 0;
  const payout =
    betType === 'multiple'
      ? multiplePayout
      : items[0]
        ? stake * items[0].odd
        : 0;
  const profit = payout - stake;

  const handleBet = async () => {
    setErrorMsg(null);

    // Monta o payload real para POST /api/v1/bets
    const selections = items.map((item) => ({
      matchId: item._realMatchId ?? item.matchId,
      marketId: item._marketId ?? '1x2',
      pick: item.pick,
      label: item.pick,
      odd: item.odd,
      matchLabel: item.match,
      marketLabel: item._marketLabel ?? 'Resultado Final',
    }));

    try {
      const newBet = await placeBet.mutateAsync({
        type: betType as 'single' | 'multiple',
        stake,
        selections,
      });
      // Atualiza saldo imediatamente após o débito
      await refetchBalance();
      setConfirmedBet(newBet);
      // Limpa o boletim após 4 segundos
      setTimeout(() => {
        setConfirmedBet(null);
        clearSlip();
      }, 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Erro ao registrar aposta. Tente novamente.';
      setErrorMsg(msg);
    }
  };

  const confirming = placeBet.isPending;

  /* ── Tela de confirmação ──────────────────────────────────────── */
  if (confirmedBet) {
    const confirmedPayout =
      betType === 'multiple'
        ? multiplePayout
        : items[0]
          ? stake * items[0].odd
          : 0;

    return (
      <aside className="w-[300px] bg-[#111318] border-l border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0 h-full px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl">
          ✅
        </div>
        <div>
          <p className="font-display text-2xl tracking-widest text-green-400 mb-1">
            APOSTADO!
          </p>
          <p className="text-[#9B9590] text-sm leading-relaxed">
            Aposta de{' '}
            <span className="font-semibold text-[#F0EDE6]">R$ {fmt(stake)}</span>{' '}
            debitada do seu saldo.
          </p>
        </div>

        {/* Saldo atualizado */}
        <div className="bg-[#181C23] border border-white/[0.06] rounded-xl p-4 w-full space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#5A5750]">Novo saldo</span>
            <span className="font-semibold text-[#F0EDE6]">
              R$ {fmt(balanceData?.balance ?? 0)}
            </span>
          </div>
          <div className="h-px bg-white/[0.05]" />
          <div className="text-center">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
              Retorno potencial
            </p>
            <p className="font-display text-2xl text-[#C9A84C]">
              R$ {fmt(confirmedPayout)}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[#5A5750] leading-relaxed">
          O resultado será creditado automaticamente quando a partida terminar.
        </p>

        <button
          onClick={() => navigate('/history')}
          className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
        >
          Ver em Histórico →
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-[#111318] border-l border-white/[0.06] flex flex-col flex-shrink-0 h-full overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────── */}
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
              className="text-[11px] text-[#5A5750] hover:text-red-400 transition-colors"
            >
              🗑 Limpar
            </button>
          )}
          <button
            onClick={closeSlip}
            className="text-[#5A5750] hover:text-[#9B9590] transition-colors text-lg leading-none pl-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Tipo de aposta ─────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.06]">
        {[
          { key: 'single', label: 'Simples' },
          { key: 'multiple', label: 'Múltipla' },
          { key: 'system', label: 'Sistema' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setBetType(t.key)}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
              betType === t.key
                ? 'text-[#C9A84C] border-[#C9A84C]'
                : 'text-[#5A5750] border-transparent hover:text-[#9B9590]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Estado vazio ────────────────────────────────────────────── */}
      {count === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <div className="text-5xl opacity-20">🎯</div>
          <p className="text-sm text-[#5A5750] leading-relaxed">
            Clique em uma odd para adicionar ao boletim
          </p>
        </div>
      )}

      {/* ── Lista de seleções ───────────────────────────────────────── */}
      {count > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.matchId}
              className="bg-[#181C23] border border-white/[0.06] rounded-xl p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#5A5750] mb-0.5 truncate">
                    {item.match}
                  </p>
                  <p className="text-[13px] font-semibold truncate text-[#F0EDE6]">
                    {item.pick}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#C9A84C] text-sm font-bold">
                      {item.odd.toFixed(2)}
                    </span>
                    {betType === 'single' && (
                      <span className="text-[11px] text-[#5A5750]">
                        → R${' '}
                        {(stake * item.odd).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeBet(item.matchId)}
                  className="text-[#5A5750] hover:text-red-400 transition-colors text-xs p-1 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {betType === 'system' && count < 3 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-[11px] text-yellow-400">
                Sistema requer mínimo 3 seleções ({count}/3)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Rodapé ─────────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          {/* Saldo */}
          <div className="flex justify-between text-[11px]">
            <span className="text-[#5A5750]">Saldo disponível</span>
            <span className="text-[#9B9590] font-medium">R$ {fmt(balance)}</span>
          </div>

          {/* Input de valor */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5750] text-sm font-semibold pointer-events-none">
              R$
            </span>
            <input
              type="number"
              value={stake}
              min={1}
              max={balance}
              onChange={(e) =>
                setStake(Math.max(1, parseFloat(e.target.value) || 1))
              }
              className="w-full bg-[#0A0B0E] border-2 border-[#C9A84C]/40 focus:border-[#C9A84C] rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-right text-[#F0EDE6] focus:outline-none transition-colors"
            />
          </div>

          {/* Atalhos rápidos */}
          <div className="grid grid-cols-6 gap-1">
            {QUICK_STAKES.map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                  stake === v
                    ? 'bg-yellow-500/15 border-[#C9A84C] text-[#C9A84C]'
                    : 'bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20 hover:text-[#F0EDE6]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* % do saldo */}
          <div className="flex gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() =>
                  setStake(parseFloat(((balance * pct) / 100).toFixed(2)))
                }
                className="flex-1 py-1 text-[10px] text-[#5A5750] hover:text-[#C9A84C] bg-[#181C23] border border-white/[0.04] rounded-lg transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Odd total para múltipla */}
          {betType === 'multiple' && count > 1 && (
            <div className="flex justify-between text-[12px] bg-[#181C23] rounded-xl px-3 py-2 border border-white/[0.04]">
              <span className="text-[#5A5750]">Odd total</span>
              <span className="font-bold text-[#F0EDE6]">{totalOdd.toFixed(2)}</span>
            </div>
          )}

          {/* Resumo financeiro */}
          <div className="bg-[#0A0B0E] rounded-xl p-3 border border-white/[0.06] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#5A5750]">Apostado</span>
              <span className="text-[#9B9590]">R$ {fmt(stake)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#5A5750]">Lucro potencial</span>
              <span className="text-green-400 font-semibold">
                + R$ {fmt(Math.max(0, profit))}
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#F0EDE6]">Retorno total</span>
              <span className="text-lg font-bold text-[#C9A84C]">R$ {fmt(payout)}</span>
            </div>
          </div>

          {/* Aviso saldo insuficiente */}
          {stake > balance && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
              <p className="text-red-400 text-[11px]">Saldo insuficiente para esta aposta</p>
            </div>
          )}

          {/* Erro da API */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
              <p className="text-red-400 text-[11px]">{errorMsg}</p>
            </div>
          )}

          {/* ✅ CTA PRINCIPAL */}
          <button
            onClick={handleBet}
            disabled={
              confirming ||
              stake > balance ||
              (betType === 'system' && count < 3)
            }
            className="w-full bg-[#C9A84C] hover:bg-[#F0D080] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              text-black font-display text-2xl tracking-widest py-4 rounded-xl
              transition-all flex items-center justify-center gap-2
              shadow-[0_0_28px_rgba(201,168,76,0.3)]"
          >
            {confirming ? (
              <>
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                PROCESSANDO...
              </>
            ) : (
              'APOSTAR AGORA'
            )}
          </button>

          <p className="text-[10px] text-[#3A3730] text-center leading-relaxed">
            Ao apostar você aceita os{' '}
            <span className="text-[#5A5750]">Termos de Apostas</span>. Jogue com
            responsabilidade.
          </p>
        </div>
      )}
    </aside>
  );
}
