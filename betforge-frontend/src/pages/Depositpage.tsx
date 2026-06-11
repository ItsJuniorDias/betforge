import { useState } from "react";
import { useDeposit } from "../hooks/api/useFinancial";
import { useBalance } from "../hooks/api/useUser";
import { getApiError } from "../services/api";

const METHODS = [
  { id: "pix", label: "Pix", icon: "⚡", badge: "Instantâneo", badgeClass: "text-green-400 bg-green-400/10", description: "Transferência instantânea 24h", min: 10, max: 50000 },
  { id: "credit_card", label: "Cartão de Crédito", icon: "💳", badge: "Até 5min", badgeClass: "text-blue-400 bg-blue-400/10", description: "Visa, Mastercard, Elo", min: 20, max: 10000 },
  { id: "boleto", label: "Boleto Bancário", icon: "🏦", badge: "Até 3 dias", badgeClass: "text-yellow-400 bg-yellow-400/10", description: "Compensação em até 3 dias úteis", min: 30, max: 5000 },
  { id: "crypto", label: "Criptomoeda", icon: "🪙", badge: "Até 30min", badgeClass: "text-purple-400 bg-purple-400/10", description: "Bitcoin, Ethereum, USDT", min: 50, max: 100000 },
] as const;

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

type MethodId = typeof METHODS[number]["id"];

export default function DepositPage() {
  const [method, setMethod] = useState<MethodId>("pix");
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const deposit = useDeposit();
  const { data: balance } = useBalance();
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const numAmount = parseFloat(amount) || 0;

  const handleDeposit = () => {
    if (numAmount < selectedMethod.min) return;
    deposit.mutate(
      { amount: numAmount, method },
      {
        onSuccess: (res) => {
          setSuccessMsg(res.message);
          setSuccess(true);
          setAmount("");
          setTimeout(() => setSuccess(false), 5000);
        },
      }
    );
  };

  const apiError = deposit.error ? getApiError(deposit.error) : "";

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-2">DEPOSITAR</h1>
      <p className="text-[#5A5750] text-sm mb-6">Saldo atual: <span className="text-[#C9A84C] font-semibold">R$ {balance?.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) ?? "..."}</span></p>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">✅ {successMsg}</div>
      )}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">⚠️ {apiError}</div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
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

      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="font-semibold text-[#F0EDE6] mb-4">Valor do depósito</h2>

        <div className="flex gap-2 mb-4">
          {QUICK_AMOUNTS.map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className={`flex-1 py-2 text-sm rounded-xl border transition-all ${String(v) === amount ? "bg-[#C9A84C]/15 border-[#C9A84C] text-[#C9A84C]" : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"}`}>
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 mb-2 focus-within:border-[#C9A84C]/40 transition-colors">
          <span className="text-[#5A5750] mr-2 text-sm">R$</span>
          <input type="number" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} min={selectedMethod.min} max={selectedMethod.max}
            className="flex-1 bg-transparent text-[#F0EDE6] text-lg font-semibold focus:outline-none placeholder-[#5A5750]" />
        </div>
        <p className="text-[11px] text-[#5A5750] mb-4">Mín: R$ {selectedMethod.min} · Máx: R$ {selectedMethod.max.toLocaleString("pt-BR")}</p>

        <button onClick={handleDeposit} disabled={deposit.isPending || numAmount < selectedMethod.min}
          className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-50 disabled:cursor-not-allowed text-black font-display text-lg tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {deposit.isPending ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Processando...</> : "DEPOSITAR AGORA"}
        </button>
      </div>
    </div>
  );
}
