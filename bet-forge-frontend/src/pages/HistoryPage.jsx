import { useState } from "react";
import { betHistory, userStats } from "../data/mockData";

const STATUS_LABELS = { won: "Ganhou", lost: "Perdeu", pending: "Em aberto" };
const STATUS_STYLES = {
  won: "text-green-400 bg-green-400/10",
  lost: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
};

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? betHistory
      : betHistory.filter((b) => b.status === filter);

  const totalWon = betHistory
    .filter((b) => b.status === "won")
    .reduce((a, b) => a + b.payout - b.stake, 0);
  const totalStaked = betHistory.reduce((a, b) => a + b.stake, 0);

  return (
    <div className="p-5 max-w-full mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-6">
        HISTÓRICO DE APOSTAS
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Apostado",
            value: `R$ ${totalStaked.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            sub: null,
          },
          { label: "Total de Apostas", value: betHistory.length, sub: null },
          {
            label: "Taxa de Acerto",
            value: `${userStats.winRate}%`,
            sub: null,
            positive: true,
          },
          {
            label: "Lucro/Prejuízo",
            value: `R$ ${totalWon.toFixed(2).replace(".", ",")}`,
            positive: totalWon >= 0,
          },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-4"
          >
            <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">
              {c.label}
            </p>
            <p
              className={`text-xl font-semibold ${c.positive ? "text-green-400" : ""}`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "won", "lost", "pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              filter === f
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Bet list */}
      <div className="space-y-3">
        {filtered.map((bet) => (
          <div
            key={bet.id}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[bet.status]}`}
                  >
                    {STATUS_LABELS[bet.status]}
                  </span>
                  <span className="text-[11px] text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full">
                    {bet.type}
                  </span>
                  <span className="text-[11px] text-[#5A5750]">{bet.date}</span>
                </div>
                <div className="space-y-1">
                  {bet.selections.map((sel, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[#9B9590] truncate">
                        {sel.match}
                      </span>
                      <span className="text-[#5A5750]">·</span>
                      <span className="font-medium text-[#F0EDE6] flex-shrink-0">
                        {sel.pick}
                      </span>
                      <span className="text-[#C9A84C] text-xs flex-shrink-0">
                        @{sel.odd.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-[#5A5750] mb-0.5">Apostado</p>
                <p className="text-sm font-semibold">
                  R$ {bet.stake.toFixed(2).replace(".", ",")}
                </p>
                {bet.status !== "pending" && (
                  <>
                    <p className="text-[11px] text-[#5A5750] mt-1.5 mb-0.5">
                      {bet.status === "won" ? "Ganho" : "Retorno"}
                    </p>
                    <p
                      className={`text-sm font-bold ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}
                    >
                      {bet.status === "won"
                        ? `R$ ${bet.payout.toFixed(2).replace(".", ",")}`
                        : "R$ 0,00"}
                    </p>
                  </>
                )}
                {bet.status === "pending" && (
                  <p className="text-xs text-yellow-400 mt-1.5">
                    ⏳ Aguardando
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">📋</div>
          <p className="text-[#5A5750]">Nenhuma aposta encontrada</p>
        </div>
      )}
    </div>
  );
}
