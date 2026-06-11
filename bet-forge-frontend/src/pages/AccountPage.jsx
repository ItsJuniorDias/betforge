import { useState } from "react";
import { userStats, betHistory } from "../data/mockData";
import { useNavigate } from "react-router-dom";

const TABS = ["Visão Geral", "Dados Pessoais", "Segurança", "Limites"];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("Visão Geral");

  const navigate = useNavigate();

  const recentBets = betHistory.slice(0, 3);

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Profile header */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1E2330] border-2 border-[#C9A84C]/30 flex items-center justify-center font-display text-2xl tracking-widest text-[#C9A84C]">
            JS
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl tracking-wide">JOÃO SILVA</h1>
            <p className="text-[#9B9590] text-sm">
              joao.silva@email.com · Membro desde Jan 2024
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                🥇 Nível Gold
              </span>
              <span className="bg-green-400/10 text-green-400 text-[11px] px-2 py-0.5 rounded-full">
                ✓ Verificado
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">
              Saldo disponível
            </p>
            <p className="font-display text-3xl text-[#C9A84C]">R$ 1.250,00</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => navigate("/deposit")}
                className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Depositar
              </button>

              <button
                onClick={() => navigate("/withdraw")}
                className="bg-[#1E2330] hover:bg-[#252A38] text-[#F0EDE6] text-xs px-3 py-1.5 rounded-lg transition-colors border border-white/[0.06]"
              >
                Sacar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "text-[#C9A84C] border-[#C9A84C]"
                : "text-[#5A5750] border-transparent hover:text-[#9B9590]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Visão Geral" && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total de Apostas", value: userStats.totalBets },
              {
                label: "Apostas Ganhas",
                value: userStats.wonBets,
                positive: true,
              },
              {
                label: "Taxa de Acerto",
                value: `${userStats.winRate}%`,
                positive: true,
              },
              { label: "Odd Média", value: userStats.avgOdd.toFixed(2) },
              {
                label: "Total Apostado",
                value: `R$ ${userStats.totalStaked.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              },
              {
                label: "Total Ganho",
                value: `R$ ${userStats.totalWon.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                positive: true,
              },
              {
                label: "Lucro Líquido",
                value: `R$ ${userStats.profitLoss.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                positive: true,
              },
              { label: "Em Aberto", value: userStats.pendingBets },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-[#111318] border border-white/[0.06] rounded-xl p-3.5"
              >
                <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
                  {s.label}
                </p>
                <p
                  className={`text-lg font-semibold ${s.positive ? "text-green-400" : ""}`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Win rate bar */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#9B9590]">Taxa de Acerto</span>
              <span className="font-semibold text-green-400">
                {userStats.winRate}%
              </span>
            </div>
            <div className="h-2 bg-[#1E2330] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C9A84C] to-green-400 rounded-full transition-all"
                style={{ width: `${userStats.winRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#5A5750] mt-1.5">
              <span>{userStats.wonBets} ganhas</span>
              <span>{userStats.lostBets} perdidas</span>
            </div>
          </div>

          {/* Recent bets */}
          <div>
            <h2 className="font-display text-xl tracking-wide mb-3">
              APOSTAS RECENTES
            </h2>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {bet.selections[0].match}
                    </p>
                    <p className="text-[12px] text-[#9B9590]">
                      {bet.date} · {bet.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                        bet.status === "won"
                          ? "text-green-400 bg-green-400/10"
                          : bet.status === "lost"
                            ? "text-red-400 bg-red-400/10"
                            : "text-yellow-400 bg-yellow-400/10"
                      }`}
                    >
                      {bet.status === "won"
                        ? "Ganhou"
                        : bet.status === "lost"
                          ? "Perdeu"
                          : "Em aberto"}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      R$ {bet.stake.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Dados Pessoais" && (
        <div className="space-y-4 max-w-lg">
          {[
            { label: "Nome completo", value: "João Silva", type: "text" },
            { label: "E-mail", value: "joao.silva@email.com", type: "email" },
            { label: "Telefone", value: "+55 11 99999-0000", type: "tel" },
            { label: "CPF", value: "***.***.***-00", type: "text" },
            { label: "Data de Nascimento", value: "01/01/1990", type: "date" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                {f.label}
              </label>
              <input
                type={f.type}
                defaultValue={f.value}
                className="w-full bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>
          ))}
          <button className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors mt-2">
            Salvar Alterações
          </button>
        </div>
      )}

      {activeTab === "Segurança" && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <h3 className="font-semibold mb-3">Alterar Senha</h3>
            {["Senha atual", "Nova senha", "Confirmar nova senha"].map(
              (label) => (
                <div key={label} className="mb-3">
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    {label}
                  </label>
                  <input
                    type="password"
                    className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                </div>
              ),
            )}
            <button className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
              Atualizar Senha
            </button>
          </div>
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-0.5">
                  Autenticação em 2 fatores
                </h3>
                <p className="text-[13px] text-[#9B9590]">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <button className="bg-[#1E2330] hover:bg-[#252A38] border border-white/[0.06] text-sm px-4 py-2 rounded-lg transition-colors">
                Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Limites" && (
        <div className="space-y-4 max-w-lg">
          <p className="text-[13px] text-[#9B9590] bg-[#1E2330] rounded-xl p-4">
            ℹ️ Configure limites de depósito, aposta e perda para apostar com
            responsabilidade.
          </p>
          {[
            { label: "Limite de depósito diário", value: "R$ 500,00" },
            { label: "Limite de depósito semanal", value: "R$ 2.000,00" },
            { label: "Limite de aposta por evento", value: "R$ 200,00" },
            { label: "Limite de perda mensal", value: "R$ 1.000,00" },
          ].map((l) => (
            <div
              key={l.label}
              className="bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-[#9B9590]">{l.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{l.value}</span>
                <button className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] transition-colors">
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
