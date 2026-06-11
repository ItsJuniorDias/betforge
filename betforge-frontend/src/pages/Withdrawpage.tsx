import { useState } from "react";
import { useWithdraw } from "../hooks/api/useFinancial";
import { useBalance } from "../hooks/api/useUser";
import { getApiError } from "../services/api";

const METHODS = [
  { id: "pix", label: "Pix", icon: "⚡", badge: "Instantâneo", badgeClass: "text-green-400 bg-green-400/10", description: "Chave CPF, e-mail ou telefone", min: 20, max: 50000 },
  { id: "ted", label: "TED / Transferência", icon: "🏦", badge: "Mesmo dia", badgeClass: "text-blue-400 bg-blue-400/10", description: "Qualquer banco do Brasil", min: 50, max: 20000 },
  { id: "crypto", label: "Criptomoeda", icon: "🪙", badge: "Até 1h", badgeClass: "text-purple-400 bg-purple-400/10", description: "Bitcoin, Ethereum, USDT", min: 100, max: 100000 },
] as const;

const QUICK_AMOUNTS = [100, 200, 500, 750, 1000];
type MethodId = typeof METHODS[number]["id"];

export default function WithdrawPage() {
  const [method, setMethod] = useState<MethodId>("pix");
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const withdraw = useWithdraw();
  const { data: balance } = useBalance();
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const numAmount = parseFloat(amount) || 0;

  const handleWithdraw = () => {
    if (numAmount < selectedMethod.min) return;
    withdraw.mutate(
      { amount: numAmount, method, pixKey: method === "pix" ? pixKey : undefined },
      {
        onSuccess: (res) => {
          setSuccessMsg(res.message);
          setSuccess(true);
          setAmount("");
          setPixKey("");
          setTimeout(() => setSuccess(false), 5000);
        },
      }
    );
  };

  const apiError = withdraw.error ? getApiError(withdraw.error) : "";
  const currentBalance = balance?.balance ?? 0;

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-2">SACAR</h1>
      <p className="text-[#5A5750] text-sm mb-6">Disponível: <span className="text-[#C9A84C] font-semibold">R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">✅ {successMsg}</div>
      )}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">⚠️ {apiError}</div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {METHODS.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className={`bg-[#111318] border rounded-xl p-4 text-left transition-all ${method === m.id ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-white/[0.06] hover:border-white/20"}`}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeClass}`}>{m.badge}</span>
            </div>
            <p className="font-semibold text-sm text-[#F0EDE6]">{m.label}</p>
            <p className="text-[12px] text-[#5A5750] mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-[#F0EDE6]">Valor do saque</h2>

        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className={`flex-1 py-2 text-sm rounded-xl border transition-all ${String(v) === amount ? "bg-[#C9A84C]/15 border-[#C9A84C] text-[#C9A84C]" : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"}`}>
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 focus-within:border-[#C9A84C]/40 transition-colors">
          <span className="text-[#5A5750] mr-2 text-sm">R$</span>
          <input type="number" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-[#F0EDE6] text-lg font-semibold focus:outline-none placeholder-[#5A5750]" />
        </div>
        <p className="text-[11px] text-[#5A5750]">Mín: R$ {selectedMethod.min} · Máx: R$ {selectedMethod.max.toLocaleString("pt-BR")}</p>

        {method === "pix" && (
          <div>
            <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">Chave Pix</label>
            <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={(e) => setPixKey(e.target.value)}
              className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
          </div>
        )}

        {numAmount > currentBalance && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">Saldo insuficiente</div>
        )}

        <button onClick={handleWithdraw}
          disabled={withdraw.isPending || numAmount < selectedMethod.min || numAmount > currentBalance || (method === "pix" && !pixKey)}
          className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-50 disabled:cursor-not-allowed text-black font-display text-lg tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {withdraw.isPending ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Processando...</> : "SOLICITAR SAQUE"}
        </button>
      </div>
    </div>
  );
}
