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
  {
    id: "ted" as const,
    label: "TED",
    icon: "🏦",
    badge: "Mesmo dia",
    badgeClass: "text-blue-400 bg-blue-400/10",
    description: "Qualquer banco do Brasil",
    min: 50,
    max: 20000,
  },
  {
    id: "crypto" as const,
    label: "Cripto",
    icon: "🪙",
    badge: "Até 1h",
    badgeClass: "text-purple-400 bg-purple-400/10",
    description: "Bitcoin, Ethereum, USDT",
    min: 100,
    max: 100000,
  },
] as const;

type MethodId = typeof METHODS[number]["id"];

const PIX_KEY_TYPES = [
  { id: "cpf" as const,        label: "CPF",              placeholder: "000.000.000-00" },
  { id: "email" as const,      label: "E-mail",           placeholder: "seu@email.com" },
  { id: "phone" as const,      label: "Telefone",         placeholder: "+55 11 99999-9999" },
  { id: "random_key" as const, label: "Chave Aleatória",  placeholder: "Cole sua chave aqui" },
];

const QUICK_AMOUNTS = [100, 200, 500, 750, 1000];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function WithdrawPage() {
  const [method, setMethod]         = useState<MethodId>("pix");
  const [amount, setAmount]         = useState("");
  const [pixKey, setPixKey]         = useState("");
  const [pixKeyType, setPixKeyType] = useState<WithdrawPayload["pixKeyType"]>("cpf");
  const [bankData, setBankData]     = useState({
    bank: "", agency: "", account: "", accountType: "checking" as const,
  });
  const [success, setSuccess]       = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const withdraw = useWithdraw();
  const { data: balance } = useBalance();
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const numAmount = parseFloat(amount) || 0;
  const currentBalance = balance?.balance ?? 0;
  const apiError = withdraw.error ? getApiError(withdraw.error) : "";

  const handleWithdraw = () => {
    if (numAmount < selectedMethod.min || numAmount > currentBalance) return;

    const payload: WithdrawPayload =
      method === "pix"
        ? { amount: numAmount, method, pixKey, pixKeyType }
        : method === "ted"
        ? { amount: numAmount, method, bankData }
        : { amount: numAmount, method };

    withdraw.mutate(payload, {
      onSuccess: (res) => {
        setSuccessMsg(res.message);
        setSuccess(true);
        setAmount("");
        setPixKey("");
        setTimeout(() => setSuccess(false), 6000);
      },
    });
  };

  const isSubmitDisabled =
    withdraw.isPending ||
    numAmount < selectedMethod.min ||
    numAmount > currentBalance ||
    (method === "pix" && !pixKey) ||
    (method === "ted" && (!bankData.bank || !bankData.agency || !bankData.account));

  const selectedPixKeyConfig = PIX_KEY_TYPES.find((k) => k.id === pixKeyType)!;

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-2">SACAR</h1>
      <p className="text-[#5A5750] text-sm mb-6">
        Disponível:{" "}
        <span className="text-[#C9A84C] font-semibold">
          R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </p>

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

      {/* Método */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setAmount(""); }}
            className={`bg-[#111318] border rounded-xl p-4 text-left transition-all ${
              method === m.id
                ? "border-[#C9A84C]/40 bg-[#C9A84C]/5"
                : "border-white/[0.06] hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeClass}`}>
                {m.badge}
              </span>
            </div>
            <p className="font-semibold text-sm text-[#F0EDE6]">{m.label}</p>
            <p className="text-[12px] text-[#5A5750] mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>

      {/* Formulário */}
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
          Mín: R$ {selectedMethod.min} · Máx: R${" "}
          {selectedMethod.max.toLocaleString("pt-BR")}
        </p>

        {/* PIX — tipo de chave + valor da chave */}
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
                    onClick={() => { setPixKeyType(kt.id); setPixKey(""); }}
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
              ⚡ Saques PIX são processados instantaneamente após aprovação.
            </div>
          </div>
        )}

        {/* TED */}
        {method === "ted" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Banco (código)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 341"
                  value={bankData.bank}
                  onChange={(e) => setBankData({ ...bankData, bank: e.target.value })}
                  className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Agência
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0001"
                  value={bankData.agency}
                  onChange={(e) => setBankData({ ...bankData, agency: e.target.value })}
                  className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                Conta
              </label>
              <input
                type="text"
                placeholder="Ex: 12345-6"
                value={bankData.account}
                onChange={(e) => setBankData({ ...bankData, account: e.target.value })}
                className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                Tipo de Conta
              </label>
              <select
                value={bankData.accountType}
                onChange={(e) =>
                  setBankData({ ...bankData, accountType: e.target.value as "checking" | "savings" })
                }
                className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
              </select>
            </div>
          </div>
        )}

        {/* Cripto */}
        {method === "crypto" && (
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl px-4 py-3 text-purple-300/70 text-xs">
            🪙 Após solicitar, entraremos em contato pelo e-mail cadastrado com as instruções.
          </div>
        )}

        {/* Aviso saldo insuficiente */}
        {numAmount > currentBalance && numAmount > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">
            Saldo insuficiente para este saque.
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
