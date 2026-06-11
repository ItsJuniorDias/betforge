import { useParams, useNavigate, Link } from "react-router-dom";
import { betHistory } from "../data/mockData";

const STATUS = {
  won: {
    label: "Ganhou",
    cls: "text-green-400 bg-green-400/10",
    border: "border-green-500/20",
    icon: "✅",
  },
  lost: {
    label: "Perdeu",
    cls: "text-red-400 bg-red-400/10",
    border: "border-red-500/20",
    icon: "❌",
  },
  pending: {
    label: "Em aberto",
    cls: "text-yellow-400 bg-yellow-400/10",
    border: "border-yellow-500/20",
    icon: "⏳",
  },
};

export default function BetDetailPage() {
  const { betId } = useParams();
  const navigate = useNavigate();

  const bet = betHistory.find((b) => b.id === betId) || betHistory[0];
  const s = STATUS[bet.status];
  const fmt = (n) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const totalOdd = bet.selections.reduce((acc, sel) => acc * sel.odd, 1);

  return (
    <div className="p-5 max-w-xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate("/history")}
        className="text-[13px] text-[#5A5750] hover:text-[#9B9590] transition-colors flex items-center gap-1.5 mb-5"
      >
        ← Histórico
      </button>

      {/* Header do comprovante */}
      <div className={`bg-[#111318] border ${s.border} rounded-2xl p-5 mb-4`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{s.icon}</span>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${s.cls}`}
              >
                {s.label}
              </span>
              <span className="text-xs text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full">
                {bet.type}
              </span>
            </div>
            <p className="text-[12px] text-[#5A5750] mt-1">🗓 {bet.date}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider">
              ID da aposta
            </p>
            <p className="font-mono text-xs text-[#9B9590] mt-0.5">
              {bet.id.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Financeiro */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#181C23] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
              Apostado
            </p>
            <p className="text-base font-bold text-[#F0EDE6]">
              R$ {fmt(bet.stake)}
            </p>
          </div>
          <div className="bg-[#181C23] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
              Odd total
            </p>
            <p className="text-base font-bold text-[#F0EDE6]">
              {totalOdd.toFixed(2)}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center ${
              bet.status === "won"
                ? "bg-green-500/10"
                : bet.status === "lost"
                  ? "bg-red-500/10"
                  : "bg-yellow-500/10"
            }`}
          >
            <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
              {bet.status === "won"
                ? "Ganho"
                : bet.status === "lost"
                  ? "Retorno"
                  : "Potencial"}
            </p>
            <p
              className={`text-base font-bold ${
                bet.status === "won"
                  ? "text-green-400"
                  : bet.status === "lost"
                    ? "text-red-400"
                    : "text-yellow-400"
              }`}
            >
              {bet.status === "won"
                ? `R$ ${fmt(bet.payout)}`
                : bet.status === "lost"
                  ? "R$ 0,00"
                  : `R$ ${fmt(bet.stake * totalOdd)}`}
            </p>
          </div>
        </div>

        {/* Lucro/Prejuízo */}
        {bet.status !== "pending" && (
          <div
            className={`mt-3 rounded-xl px-4 py-2.5 flex justify-between items-center ${
              bet.status === "won"
                ? "bg-green-500/5 border border-green-500/15"
                : "bg-red-500/5 border border-red-500/15"
            }`}
          >
            <span className="text-sm text-[#9B9590]">Lucro / Prejuízo</span>
            <span
              className={`font-bold text-base ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}
            >
              {bet.status === "won" ? "+" : "-"} R${" "}
              {fmt(
                Math.abs(
                  bet.status === "won" ? bet.payout - bet.stake : bet.stake,
                ),
              )}
            </span>
          </div>
        )}
      </div>

      {/* Seleções */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide">SELEÇÕES</h2>
          <span className="text-[12px] text-[#5A5750]">
            {bet.selections.length}{" "}
            {bet.selections.length === 1 ? "jogo" : "jogos"}
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {bet.selections.map((sel, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">
                    {i === 0 && bet.type === "Múltipla"
                      ? "Acumuladora"
                      : bet.type}
                  </p>
                  <p className="text-sm text-[#9B9590] truncate">{sel.match}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-semibold text-[#F0EDE6]">
                      {sel.pick}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-[#5A5750] mb-1">Odd</p>
                  <p className="text-lg font-bold text-[#C9A84C]">
                    {sel.odd.toFixed(2)}
                  </p>
                  <div
                    className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${
                      bet.status === "won"
                        ? "text-green-400 bg-green-400/10"
                        : bet.status === "lost"
                          ? "text-red-400 bg-red-400/10"
                          : "text-yellow-400 bg-yellow-400/10"
                    }`}
                  >
                    {STATUS[bet.status].label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linha do tempo da aposta */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 mb-4">
        <h2 className="font-display text-lg tracking-wide mb-4">
          LINHA DO TEMPO
        </h2>
        <div className="space-y-0">
          {[
            { label: "Aposta registrada", time: bet.date, done: true },
            {
              label: "Jogo(s) iniciado(s)",
              time: "Durante o evento",
              done: true,
            },
            {
              label:
                bet.status === "pending"
                  ? "Aguardando resultado"
                  : "Resultado processado",
              time: bet.status === "pending" ? "Em breve" : bet.date,
              done: bet.status !== "pending",
            },
            ...(bet.status === "won"
              ? [{ label: "Crédito na conta", time: "Automático", done: true }]
              : []),
          ].map((item, i, arr) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    item.done
                      ? "bg-green-500 text-white"
                      : "bg-[#1E2330] border border-white/[0.06] text-[#5A5750]"
                  }`}
                >
                  {item.done ? "✓" : "○"}
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={`w-px h-6 mt-1 ${item.done ? "bg-green-500/30" : "bg-white/[0.06]"}`}
                  />
                )}
              </div>
              <div className="pb-4 flex-1">
                <p
                  className={`text-sm font-medium ${item.done ? "text-[#F0EDE6]" : "text-[#5A5750]"}`}
                >
                  {item.label}
                </p>
                <p className="text-[11px] text-[#5A5750] mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(bet.id.toUpperCase());
          }}
          className="flex-1 bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          📋 Copiar ID
        </button>
        <button className="flex-1 bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          📤 Compartilhar
        </button>
        {bet.status === "pending" && (
          <button className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm py-3 rounded-xl transition-all">
            Cancelar
          </button>
        )}
      </div>

      {/* Mais apostas */}
      <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
        <p className="text-[12px] text-[#5A5750] mb-3">
          Outras apostas recentes
        </p>
        <div className="space-y-2">
          {betHistory
            .filter((b) => b.id !== bet.id)
            .slice(0, 3)
            .map((b) => (
              <Link
                key={b.id}
                to={`/history/${b.id}`}
                className="flex items-center justify-between bg-[#111318] border border-white/[0.06] hover:border-yellow-500/20 rounded-xl px-4 py-3 no-underline transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{STATUS[b.status].icon}</span>
                  <div>
                    <p className="text-[12px] font-medium text-[#F0EDE6]">
                      {b.selections[0].match}
                    </p>
                    <p className="text-[10px] text-[#5A5750]">{b.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${STATUS[b.status].cls.split(" ")[0]}`}
                  >
                    {STATUS[b.status].label}
                  </p>
                  <p className="text-[11px] text-[#5A5750]">
                    R$ {fmt(b.stake)}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
