import { useState } from "react";
import { useWithdraw } from "../hooks/api/useFinancial";
import { useBalance } from "../hooks/api/useUser";
import { getApiError } from "../services/api";
import type { WithdrawPayload } from "../types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const METHODS = [
  {
    id: "pix" as const,
    label: "PIX",
    icon: "⚡",
    badge: "Instantâneo",
    badgeClass: "text-green-400 bg-green-400/10",
    description: "Chave CPF, e-mail ou telefone",
    min: 20,
    max: 50000,
  },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

const PIX_KEY_TYPES = [
  { id: "cpf" as const, label: "CPF", placeholder: "000.000.000-00" },
  { id: "email" as const, label: "E-mail", placeholder: "seu@email.com" },
  { id: "phone" as const, label: "Telefone", placeholder: "+55 11 99999-9999" },
  {
    id: "random_key" as const,
    label: "Chave Aleatória",
    placeholder: "Cole sua chave aqui",
  },
];

const QUICK_AMOUNTS = [100, 200, 500, 750, 1000];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function WithdrawPage() {
  const [method, setMethod] = useState<MethodId>("pix");
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] =
    useState<WithdrawPayload["pixKeyType"]>("cpf");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const withdraw = useWithdraw();
  const { data: balance } = useBalance();
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const numAmount = parseFloat(amount) || 0;

  // Usa withdrawableBalance se disponível; caso contrário, usa balance como fallback
  const currentBalance = balance?.balance ?? 0;
  const withdrawableBalance = balance?.withdrawableBalance ?? currentBalance;
  const lockedDeposits = balance?.lockedDeposits ?? [];
  const totalLocked = currentBalance - withdrawableBalance;

  const apiError = withdraw.error ? getApiError(withdraw.error) : "";

  const handleWithdraw = () => {
    if (numAmount < selectedMethod.min || numAmount > withdrawableBalance)
      return;

    const payload: WithdrawPayload =
      method === "pix"
        ? { amount: numAmount, method, pixKey, pixKeyType }
        : { amount: numAmount, method };

    withdraw.mutate(payload, {
      onSuccess: (res) => {
        setSuccessMsg(res.message);
        setSuccess(true);
        setAmount("");
        setPixKey("");
        setTimeout(() => setSuccess(false), 8000);
      },
    });
  };

  const isSubmitDisabled =
    withdraw.isPending ||
    numAmount < selectedMethod.min ||
    numAmount > withdrawableBalance ||
    (method === "pix" && !pixKey);

  const selectedPixKeyConfig = PIX_KEY_TYPES.find((k) => k.id === pixKeyType)!;

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-2">SACAR</h1>

      {/* ── Resumo de Saldo ─────────────────────────────────────────────────── */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4 mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5A5750]">Saldo total</span>
          <span className="text-[#F0EDE6] font-semibold">
            R$ {formatBRL(currentBalance)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5A5750]">Disponível para saque</span>
          <span className="text-[#C9A84C] font-bold text-base">
            R$ {formatBRL(withdrawableBalance)}
          </span>
        </div>

        {totalLocked > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5A5750]">Em carência</span>
            <span className="text-amber-400/70">
              R$ {formatBRL(totalLocked)}
            </span>
          </div>
        )}
      </div>

      {/* ── Aviso de carência ───────────────────────────────────────────────── */}
      {lockedDeposits.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-5">
          <p className="text-amber-400 text-sm font-semibold mb-1">
            🔒 Depósitos em período de carência
          </p>
          <p className="text-amber-400/70 text-xs mb-2">
            Para proteger sua conta, depósitos ficam disponíveis para saque após
            3 dias da confirmação.
          </p>
          <div className="space-y-1">
            {lockedDeposits.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-amber-300/60"
              >
                <span>R$ {formatBRL(d.amount)}</span>
                <span>Libera em {formatDate(d.availableAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Feedback de sucesso / erro ──────────────────────────────────────── */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">
          ✅ {successMsg}
        </div>
      )}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
          ⚠️ {apiError}
        </div>
      )}

      {/* ── Método ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMethod(m.id);
              setAmount("");
            }}
            className={`bg-[#111318] border rounded-xl p-4 text-left transition-all ${
              method === m.id
                ? "border-[#C9A84C]/40 bg-[#C9A84C]/5"
                : "border-white/[0.06] hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeClass}`}
              >
                {m.badge}
              </span>
            </div>
            <p className="font-semibold text-sm text-[#F0EDE6]">{m.label}</p>
            <p className="text-[12px] text-[#5A5750] mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>

      {/* ── Formulário ─────────────────────────────────────────────────────── */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-[#F0EDE6]">Valor do saque</h2>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                String(v) === amount
                  ? "bg-[#C9A84C]/15 border-[#C9A84C] text-[#C9A84C]"
                  : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Valor livre */}
        <div className="flex items-center bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 focus-within:border-[#C9A84C]/40 transition-colors">
          <span className="text-[#5A5750] mr-2 text-sm">R$</span>
          <input
            type="number"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-[#F0EDE6] text-lg font-semibold focus:outline-none placeholder-[#5A5750]"
          />
        </div>

        <p className="text-[11px] text-[#5A5750]">
          Mín: R$ {selectedMethod.min} · Disponível: R${" "}
          {formatBRL(withdrawableBalance)}
        </p>

        {/* PIX */}
        {method === "pix" && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                Tipo de Chave PIX
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PIX_KEY_TYPES.map((kt) => (
                  <button
                    key={kt.id}
                    onClick={() => {
                      setPixKeyType(kt.id);
                      setPixKey("");
                    }}
                    className={`py-2 text-[11px] font-semibold rounded-xl border transition-all ${
                      pixKeyType === kt.id
                        ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-white/[0.06] text-[#9B9590] hover:border-white/20"
                    }`}
                  >
                    {kt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                Chave PIX ({selectedPixKeyConfig.label})
              </label>
              <input
                type="text"
                placeholder={selectedPixKeyConfig.placeholder}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3 text-green-400/70 text-xs">
              ⚡ O PIX é enviado automaticamente para sua chave após aprovação.
            </div>
          </div>
        )}

        {/* Aviso saldo insuficiente */}
        {numAmount > withdrawableBalance && numAmount > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">
            {totalLocked > 0
              ? `Você tem R$ ${formatBRL(totalLocked)} em carência. Saldo disponível: R$ ${formatBRL(withdrawableBalance)}.`
              : "Saldo insuficiente para este saque."}
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={isSubmitDisabled}
          className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-50 disabled:cursor-not-allowed text-black font-display text-lg tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {withdraw.isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Processando…
            </>
          ) : (
            "SOLICITAR SAQUE"
          )}
        </button>
      </div>
    </div>
  );
}
