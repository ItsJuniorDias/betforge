import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBets, useBetStats } from "../hooks/api/useBets";

const STATUS_LABELS: Record<string, string> = { won: "Ganhou", lost: "Perdeu", pending: "Em aberto", cancelled: "Cancelada" };
const STATUS_STYLES: Record<string, string> = {
  won: "text-green-400 bg-green-400/10",
  lost: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  cancelled: "text-[#5A5750] bg-[#1E2330]",
};

function StatCard({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) {
  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
      <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-semibold ${positive ? "text-green-400" : ""}`}>{value}</p>
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useBets({ page, limit: 10, status: filter === "all" ? undefined : filter });
  const { data: stats, isLoading: statsLoading } = useBetStats();

  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (isLoading || statsLoading) {
    return (
      <div className="p-5">
        <div className="h-8 bg-[#111318] rounded-lg w-64 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#111318] rounded-xl animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#111318] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 text-center py-20">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-[#9B9590]">Erro ao carregar histórico.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-[#C9A84C] text-sm hover:underline">Tentar novamente</button>
      </div>
    );
  }

  const bets = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-5 max-w-full mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-6">HISTÓRICO DE APOSTAS</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Apostado" value={fmt(stats?.totalStaked ?? 0)} />
        <StatCard label="Total de Apostas" value={stats?.totalBets ?? 0} />
        <StatCard label="Taxa de Acerto" value={`${stats?.winRate ?? 0}%`} positive />
        <StatCard label="Lucro/Prejuízo" value={fmt(stats?.profitLoss ?? 0)} positive={(stats?.profitLoss ?? 0) >= 0} />
      </div>

      <div className="flex gap-2 mb-5">
        {["all", "won", "lost", "pending"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${filter === f ? "bg-[#C9A84C] text-black" : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"}`}>
            {f === "all" ? "Todas" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {bets.map((bet) => (
          <div key={bet.id} onClick={() => navigate(`/history/${bet.id}`)}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 hover:border-yellow-500/20 hover:cursor-pointer transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[bet.status] ?? ""}`}>
                    {STATUS_LABELS[bet.status] ?? bet.status}
                  </span>
                  <span className="text-[11px] text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full capitalize">{bet.type}</span>
                  <span className="text-[11px] text-[#5A5750]">{new Date(bet.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="space-y-1">
                  {(bet.selections ?? []).map((sel, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[#9B9590] truncate">{sel.match_label}</span>
                      <span className="text-[#5A5750]">·</span>
                      <span className="font-medium text-[#F0EDE6] flex-shrink-0">{sel.label}</span>
                      <span className="text-[#C9A84C] text-xs flex-shrink-0">@{sel.odd.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-[#5A5750] mb-0.5">Apostado</p>
                <p className="text-sm font-semibold">{fmt(bet.stake)}</p>
                {bet.status === "won" && (
                  <>
                    <p className="text-[11px] text-[#5A5750] mt-1.5 mb-0.5">Ganho</p>
                    <p className="text-sm font-bold text-green-400">{fmt(bet.actual_payout ?? 0)}</p>
                  </>
                )}
                {bet.status === "lost" && <p className="text-xs text-red-400 mt-1.5">R$ 0,00</p>}
                {bet.status === "pending" && <p className="text-xs text-yellow-400 mt-1.5">⏳ Aguardando</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bets.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">📋</div>
          <p className="text-[#5A5750]">Nenhuma aposta encontrada</p>
        </div>
      )}

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-[#111318] border border-white/[0.06] rounded-lg text-sm text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-40 transition-all">
            ← Anterior
          </button>
          <span className="text-sm text-[#5A5750]">{page} / {meta.totalPages}</span>
          <button disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-[#111318] border border-white/[0.06] rounded-lg text-sm text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-40 transition-all">
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
