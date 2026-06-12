import { useParams, useNavigate, Link } from "react-router-dom";
import { useBetById } from "../hooks/api/useBets";

const STATUS = {
  won: { label: "Ganhou", cls: "text-green-400 bg-green-400/10", border: "border-green-500/20", icon: "✅" },
  lost: { label: "Perdeu", cls: "text-red-400 bg-red-400/10", border: "border-red-500/20", icon: "❌" },
  pending: { label: "Em aberto", cls: "text-yellow-400 bg-yellow-400/10", border: "border-yellow-500/20", icon: "⏳" },
  cancelled: { label: "Cancelada", cls: "text-[#5A5750] bg-[#1E2330]", border: "border-white/[0.06]", icon: "🚫" },
} as const;

export default function BetDetailPage() {
  const { betId } = useParams<{ betId: string }>();
  const navigate = useNavigate();
  const { data: bet, isLoading, isError } = useBetById(betId!);

  if (isLoading) {
    return (
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="h-4 bg-[#111318] rounded w-24 animate-pulse" />
        <div className="h-40 bg-[#111318] rounded-2xl animate-pulse" />
        <div className="h-32 bg-[#111318] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !bet) {
    return (
      <div className="p-5 max-w-xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-[#9B9590]">Aposta não encontrada.</p>
        <button onClick={() => navigate("/history")} className="mt-4 text-[#C9A84C] text-sm hover:underline">← Voltar ao histórico</button>
      </div>
    );
  }

  const s = STATUS[bet.status as keyof typeof STATUS] ?? STATUS.pending;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-5 max-w-xl mx-auto">
      <button onClick={() => navigate("/history")} className="text-[13px] text-[#5A5750] hover:text-[#9B9590] transition-colors flex items-center gap-1.5 mb-5">
        ← Histórico
      </button>

      <div className={`bg-[#111318] border ${s.border} rounded-2xl p-5 mb-4`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{s.icon}</span>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
              <span className="text-xs text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full capitalize">{bet.type}</span>
            </div>
            <p className="text-[12px] text-[#5A5750] mt-1">🗓 {new Date(bet.created_at).toLocaleDateString("pt-BR")} {new Date(bet.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider">ID da aposta</p>
            <p className="font-mono text-xs text-[#9B9590] mt-0.5">{bet.id.slice(0, 8).toUpperCase()}...</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#181C23] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">Apostado</p>
            <p className="text-base font-bold text-[#F0EDE6]">R$ {fmt(bet.stake)}</p>
          </div>
          <div className="bg-[#181C23] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">Odd total</p>
            <p className="text-base font-bold text-[#F0EDE6]">{bet.total_odd.toFixed(2)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${bet.status === "won" ? "bg-green-500/10" : bet.status === "lost" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
              {bet.status === "won" ? "Ganho" : bet.status === "lost" ? "Retorno" : "Potencial"}
            </p>
            <p className={`text-base font-bold ${bet.status === "won" ? "text-green-400" : bet.status === "lost" ? "text-red-400" : "text-yellow-400"}`}>
              {bet.status === "won" ? `R$ ${fmt(bet.actual_payout ?? 0)}` : bet.status === "lost" ? "R$ 0,00" : `R$ ${fmt(bet.potential_payout)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Seleções */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide">SELEÇÕES</h2>
          <span className="text-[12px] text-[#5A5750]">{(bet.selections ?? []).length} {(bet.selections ?? []).length === 1 ? "jogo" : "jogos"}</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(bet.selections ?? []).map((sel) => (
            <div key={sel.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">{sel.market_label}</p>
                  <p className="text-sm text-[#9B9590] truncate">{sel.match_label}</p>
                  <p className="text-sm font-semibold text-[#F0EDE6] mt-1">{sel.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-[#5A5750] mb-1">Odd</p>
                  <p className="text-lg font-bold text-[#C9A84C]">{sel.odd.toFixed(2)}</p>
                  <div className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${STATUS[sel.status as keyof typeof STATUS]?.cls ?? "text-[#5A5750] bg-[#1E2330]"}`}>
                    {STATUS[sel.status as keyof typeof STATUS]?.label ?? sel.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button onClick={() => navigator.clipboard?.writeText(bet.id)}
          className="flex-1 bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          📋 Copiar ID
        </button>
      </div>
    </div>
  );
}
