import { useState } from "react";
import { useTransactions } from "../hooks/api/useFinancial";
import { useBalance } from "../hooks/api/useUser";
import { useNavigate } from "react-router-dom";
import type { Transaction, TransactionType } from "../types/api";

// ─── Labels e Estilos ─────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Depósito",
  withdraw: "Saque",
  bet_stake: "Aposta",
  bet_win: "Ganho",
  bet_refund: "Reembolso",
  bonus: "Bônus",
};

const TYPE_ICONS: Record<TransactionType, string> = {
  deposit: "⬇️",
  withdraw: "⬆️",
  bet_stake: "🎯",
  bet_win: "🏆",
  bet_refund: "↩️",
  bonus: "🎁",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  completed: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
  cancelled: "text-[#5A5750] bg-[#1E2330]",
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão",
  boleto: "Boleto",
  crypto: "Crypto",
  ted: "TED",
};

// Tipos que representam entrada de dinheiro (valor positivo no extrato)
const CREDIT_TYPES: TransactionType[] = ["deposit", "bet_win", "bet_refund", "bonus"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Componente de linha de transação ─────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = CREDIT_TYPES.includes(tx.type);
  const isDebit = !isCredit;
  const completed = tx.status === "completed";

  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className="w-10 h-10 rounded-full bg-[#1E2330] flex items-center justify-center text-lg flex-shrink-0">
          {TYPE_ICONS[tx.type] ?? "💰"}
        </div>

        {/* Descrição */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-[#F0EDE6]">
              {TYPE_LABELS[tx.type] ?? tx.type}
            </span>
            {tx.method && (
              <span className="text-[11px] text-[#5A5750] bg-[#1E2330] px-2 py-0.5 rounded-full">
                {METHOD_LABELS[tx.method] ?? tx.method}
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                STATUS_STYLES[tx.status] ?? ""
              }`}
            >
              {STATUS_LABELS[tx.status] ?? tx.status}
            </span>
          </div>
          <p className="text-[11px] text-[#5A5750]">
            {formatDate(tx.created_at)}
          </p>
          {tx.metadata && tx.type === "deposit" && (tx.metadata as any).pixKey && (
            <p className="text-[11px] text-[#5A5750] mt-0.5 truncate">
              Chave: {String((tx.metadata as any).pixKey)}
            </p>
          )}
        </div>

        {/* Valor */}
        <div className="text-right flex-shrink-0">
          <p
            className={`text-base font-bold ${
              !completed
                ? "text-[#9B9590]"
                : isCredit
                ? "text-green-400"
                : isDebit
                ? "text-red-400"
                : "text-[#F0EDE6]"
            }`}
          >
            {isCredit ? "+" : "-"}R$ {fmt(tx.amount)}
          </p>
          {tx.processed_at && (
            <p className="text-[10px] text-[#5A5750] mt-0.5">
              Processado em {new Date(tx.processed_at).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filtros disponíveis ──────────────────────────────────────────────────────

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "deposit", label: "Depósitos" },
  { id: "withdraw", label: "Saques" },
  { id: "bet_stake", label: "Apostas" },
  { id: "bet_win", label: "Ganhos" },
  { id: "bonus", label: "Bônus" },
] as const;

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useTransactions({
    page,
    limit: 15,
    type: typeFilter || undefined,
  });

  const { data: balance } = useBalance();

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <div className="h-8 bg-[#111318] rounded-lg w-72 mb-6 animate-pulse" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-[#111318] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111318] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-5 text-center py-20">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-[#9B9590]">Erro ao carregar transações.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-[#C9A84C] text-sm hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-6">
        EXTRATO FINANCEIRO
      </h1>

      {/* ── Cards de saldo ───────────────────────────────────────────────── */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">
              Saldo Total
            </p>
            <p className="text-xl font-semibold text-[#C9A84C]">
              R$ {fmt(balance.balance)}
            </p>
          </div>
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">
              Disp. para Saque
            </p>
            <p className="text-xl font-semibold text-green-400">
              R$ {fmt((balance as any).withdrawableBalance ?? balance.balance)}
            </p>
          </div>
          {(balance as any).lockedDeposits?.length > 0 && (
            <div className="bg-[#111318] border border-amber-500/20 rounded-xl p-4">
              <p className="text-[11px] text-amber-400/70 uppercase tracking-wider mb-1">
                Em Carência
              </p>
              <p className="text-xl font-semibold text-amber-400">
                R$ {fmt(balance.balance - ((balance as any).withdrawableBalance ?? balance.balance))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Ação rápida ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => navigate("/deposit")}
          className="flex-1 bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm py-2.5 rounded-xl transition-colors"
        >
          + Depositar
        </button>
        <button
          onClick={() => navigate("/withdraw")}
          className="flex-1 bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm py-2.5 rounded-xl transition-colors"
        >
          Sacar
        </button>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setTypeFilter(f.id);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              typeFilter === f.id
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Lista de transações ──────────────────────────────────────────── */}
      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">💳</div>
          <p className="text-[#5A5750]">Nenhuma transação encontrada</p>
          {typeFilter && (
            <button
              onClick={() => setTypeFilter("")}
              className="mt-3 text-[#C9A84C] text-sm hover:underline"
            >
              Ver todas as transações
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      {/* ── Paginação ─────────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-[#111318] border border-white/[0.06] rounded-lg text-sm text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-40 transition-all"
          >
            ← Anterior
          </button>
          <span className="text-sm text-[#5A5750]">
            {page} / {meta.totalPages}
          </span>
          <button
            disabled={page === meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-[#111318] border border-white/[0.06] rounded-lg text-sm text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-40 transition-all"
          >
            Próxima →
          </button>
        </div>
      )}

      {meta && (
        <p className="text-center text-[11px] text-[#5A5750] mt-4">
          {meta.total} transaç{meta.total === 1 ? "ão" : "ões"} no total
        </p>
      )}
    </div>
  );
}
