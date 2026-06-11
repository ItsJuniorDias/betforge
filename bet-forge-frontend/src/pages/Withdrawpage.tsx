import { useState } from "react";

const BALANCE = 1250.0;

const METHODS = [
  {
    id: "pix",
    label: "Pix",
    icon: "⚡",
    badge: "Instantâneo",
    badgeClass: "text-green-400 bg-green-400/10",
    description: "Chave CPF, e-mail ou telefone",
    min: 20,
    max: 50000,
    fee: 0,
    time: "Segundos",
  },
  {
    id: "bank",
    label: "TED / Transferência",
    icon: "🏦",
    badge: "Mesmo dia",
    badgeClass: "text-blue-400 bg-blue-400/10",
    description: "Qualquer banco do Brasil",
    min: 50,
    max: 20000,
    fee: 0,
    time: "Até 1 dia útil",
  },
  {
    id: "crypto",
    label: "Criptomoeda",
    icon: "🪙",
    badge: "Até 1h",
    badgeClass: "text-purple-400 bg-purple-400/10",
    description: "Bitcoin, Ethereum, USDT",
    min: 100,
    max: 100000,
    fee: 0,
    time: "Até 60 minutos",
  },
];

const QUICK_AMOUNTS = [100, 200, 500, 750, 1000];

const RECENT_WITHDRAWALS = [
  {
    date: "28/05/2026",
    method: "Pix",
    amount: 300,
    status: "Aprovado",
    statusClass: "text-green-400",
  },
  {
    date: "15/05/2026",
    method: "TED",
    amount: 500,
    status: "Aprovado",
    statusClass: "text-green-400",
  },
  {
    date: "02/05/2026",
    method: "Pix",
    amount: 150,
    status: "Aprovado",
    statusClass: "text-green-400",
  },
];

const PIX_KEY_TYPES = [
  { id: "cpf", label: "CPF", placeholder: "000.000.000-00" },
  { id: "email", label: "E-mail", placeholder: "seu@email.com" },
  { id: "phone", label: "Telefone", placeholder: "+55 11 99999-0000" },
  {
    id: "random",
    label: "Chave aleatória",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
];

// ── Review step ──────────────────────────────────────────────────────────────
function ReviewStep({
  amount,
  method,
  pixKeyType,
  pixKey,
  bankData,
  onBack,
  onConfirm,
}) {
  const [confirmed, setConfirmed] = useState(false);

  const destination =
    method.id === "pix"
      ? `Chave ${pixKeyType?.label}: ${pixKey || "—"}`
      : method.id === "bank"
        ? `${bankData.bank || "—"} · Ag ${bankData.agency || "—"} · Cc ${bankData.account || "—"}`
        : `${bankData.coin || "Bitcoin"} · ${(bankData.wallet || "").slice(0, 16) || "—"}…`;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Summary card */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-4">
          Confirme os dados
        </p>
        <div className="space-y-3">
          {[
            {
              label: "Valor do saque",
              value: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              gold: true,
            },
            { label: "Método", value: `${method.icon} ${method.label}` },
            { label: "Destino", value: destination },
            { label: "Taxa", value: "Grátis", green: true },
            { label: "Prazo", value: method.time },
            {
              label: "Saldo restante",
              value: `R$ ${(BALANCE - amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            },
          ].map((r) => (
            <div
              key={r.label}
              className="flex justify-between items-start gap-4"
            >
              <span className="text-[12px] text-[#5A5750] uppercase tracking-wide flex-shrink-0">
                {r.label}
              </span>
              <span
                className={`text-sm font-semibold text-right ${r.gold ? "text-[#C9A84C]" : r.green ? "text-green-400" : "text-[#F0EDE6]"}`}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] mt-4 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[#9B9590]">Você receberá</span>
            <p className="font-display text-4xl text-[#C9A84C]">
              R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 cursor-pointer">
        <div
          onClick={() => setConfirmed((v) => !v)}
          className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
            confirmed
              ? "bg-[#C9A84C] border-[#C9A84C]"
              : "border-white/20 bg-transparent"
          }`}
        >
          {confirmed && (
            <span className="text-black text-[11px] font-bold">✓</span>
          )}
        </div>
        <span className="text-[12px] text-[#9B9590] leading-relaxed">
          Confirmo que os dados acima estão corretos e autorizo o saque. Estou
          ciente que transações aprovadas não podem ser canceladas.
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] hover:border-white/20 text-sm transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={!confirmed}
          className="flex-[2] py-3 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-40 disabled:cursor-not-allowed text-black font-display text-xl tracking-widest transition-colors"
        >
          CONFIRMAR SAQUE
        </button>
      </div>
    </div>
  );
}

// ── Success step ─────────────────────────────────────────────────────────────
function SuccessStep({ amount, method, onDone }) {
  return (
    <div className="text-center space-y-5 py-4 animate-fadeIn">
      <div className="w-20 h-20 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center text-4xl mx-auto animate-pulse2">
        ✓
      </div>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-green-400 mb-1">
          SAQUE SOLICITADO
        </h2>
        <p className="text-[#9B9590] text-sm">
          Seu pedido foi registrado com sucesso
        </p>
      </div>

      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3">
        {[
          {
            label: "Valor",
            value: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            gold: true,
          },
          { label: "Método", value: `${method.icon} ${method.label}` },
          { label: "Prazo estimado", value: method.time },
          {
            label: "Protocolo",
            value: `#WD${Date.now().toString().slice(-8)}`,
          },
          { label: "Status", value: "⏳ Em processamento", yellow: true },
          {
            label: "Novo saldo",
            value: `R$ ${(BALANCE - amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-[12px] text-[#5A5750] uppercase tracking-wide">
              {r.label}
            </span>
            <span
              className={`text-sm font-semibold ${r.gold ? "text-[#C9A84C]" : r.yellow ? "text-yellow-400" : "text-[#F0EDE6]"}`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#1E2330] border border-white/[0.06] rounded-xl px-4 py-3 text-left space-y-1.5">
        {[
          "📧 Você receberá uma confirmação por e-mail",
          "🔔 Acompanhe o status em Histórico > Saques",
          "💬 Dúvidas? Acesse nosso suporte 24h",
        ].map((t) => (
          <p key={t} className="text-[12px] text-[#9B9590]">
            {t}
          </p>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 py-3 rounded-xl border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] hover:border-white/20 text-sm transition-all"
        >
          Novo saque
        </button>
        <button
          onClick={onDone}
          className="flex-[2] py-3 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] text-black font-display text-xl tracking-widest transition-colors"
        >
          VER HISTÓRICO
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WithdrawPage() {
  const [method, setMethod] = useState("pix");
  const [amount, setAmount] = useState(200);
  const [step, setStep] = useState("form"); // form | review | success

  // Pix fields
  const [pixKeyType, setPixKeyType] = useState(PIX_KEY_TYPES[0]);
  const [pixKey, setPixKey] = useState("");

  // Bank fields
  const [bankData, setBankData] = useState({
    bank: "",
    agency: "",
    account: "",
    digit: "",
  });

  // Crypto fields
  const [cryptoData, setCryptoData] = useState({ coin: "Bitcoin", wallet: "" });

  const selected = METHODS.find((m) => m.id === method);
  const remaining = BALANCE - amount;
  const isAmountValid =
    amount >= selected.min && amount <= Math.min(selected.max, BALANCE);

  function handleContinue() {
    if (!isAmountValid) return;
    setStep("review");
  }

  if (step === "review")
    return (
      <div className="p-5 max-w-full">
        <h1 className="font-display text-4xl tracking-wide mb-6">
          REVISAR SAQUE
        </h1>
        <ReviewStep
          amount={amount}
          method={selected}
          pixKeyType={pixKeyType}
          pixKey={pixKey}
          bankData={method === "bank" ? bankData : cryptoData}
          onBack={() => setStep("form")}
          onConfirm={() => setStep("success")}
        />
      </div>
    );

  if (step === "success")
    return (
      <div className="p-5 max-w-full">
        <h1 className="font-display text-4xl tracking-wide mb-6">SAQUE</h1>
        <SuccessStep
          amount={amount}
          method={selected}
          onDone={() => setStep("form")}
        />
      </div>
    );

  return (
    <div className="p-5 max-w-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl tracking-wide">SACAR</h1>
        <div className="bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] text-[#5A5750] uppercase tracking-wider">
            Saldo disponível
          </p>
          <p className="font-display text-xl text-[#C9A84C]">
            R$ {BALANCE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-yellow-400/5 border border-yellow-400/15 rounded-xl px-4 py-3 mb-5">
        <span className="text-yellow-400 text-base flex-shrink-0 mt-0.5">
          ⚠️
        </span>
        <p className="text-[12px] text-[#9B9590] leading-relaxed">
          Saques estão sujeitos a verificação de identidade. Certifique-se de
          que seus dados cadastrais estão atualizados para evitar atrasos no
          processamento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">
          {/* Method selector */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Método de saque
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`relative flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                    method === m.id
                      ? "bg-yellow-500/[0.06] border-[#C9A84C]"
                      : "bg-[#181C23] border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  {method === m.id && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#C9A84C] flex items-center justify-center text-black text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                  <span className="text-2xl">{m.icon}</span>
                  <span
                    className={`text-sm font-semibold ${method === m.id ? "text-[#F0EDE6]" : "text-[#9B9590]"}`}
                  >
                    {m.label}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full self-start ${m.badgeClass}`}
                  >
                    {m.badge}
                  </span>
                  <span className="text-[11px] text-[#5A5750]">
                    {m.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Valor do saque
              </p>
              <button
                onClick={() => setAmount(BALANCE)}
                className="text-[11px] text-[#C9A84C] hover:text-[#F0D080] transition-colors font-medium"
              >
                Sacar tudo
              </button>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  disabled={v > BALANCE}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border disabled:opacity-30 disabled:cursor-not-allowed ${
                    amount === v
                      ? "bg-[#C9A84C] border-[#C9A84C] text-black"
                      : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20 hover:text-[#F0EDE6]"
                  }`}
                >
                  R$ {v}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5750] font-semibold text-sm pointer-events-none">
                R$
              </span>
              <input
                type="number"
                value={amount}
                min={selected.min}
                max={Math.min(selected.max, BALANCE)}
                onChange={(e) =>
                  setAmount(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl pl-10 pr-4 py-3 text-lg font-semibold text-[#F0EDE6] focus:outline-none transition-colors"
              />
            </div>

            {/* Balance bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-[#5A5750] mb-1.5">
                <span>R$ 0</span>
                <span>
                  R${" "}
                  {BALANCE.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="h-1.5 bg-[#1E2330] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (amount / BALANCE) * 100)}%`,
                    background: amount > BALANCE ? "#E74C3C" : "#C9A84C",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-[#5A5750]">
                Mín: R$ {selected.min} · Máx: R${" "}
                {Math.min(selected.max, BALANCE).toLocaleString("pt-BR")}
              </span>
              {amount > 0 && amount <= BALANCE && (
                <span className="text-[#9B9590]">
                  Restante:{" "}
                  <span className="text-[#F0EDE6] font-medium">
                    R${" "}
                    {remaining.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </span>
              )}
              {amount > BALANCE && (
                <span className="text-red-400 font-medium">
                  Saldo insuficiente
                </span>
              )}
            </div>
          </div>

          {/* Pix key fields */}
          {method === "pix" && (
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Chave Pix de destino
              </p>

              {/* Key type selector */}
              <div className="grid grid-cols-4 gap-2">
                {PIX_KEY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setPixKeyType(t);
                      setPixKey("");
                    }}
                    className={`py-2 rounded-lg border text-[12px] font-medium transition-all ${
                      pixKeyType.id === t.id
                        ? "bg-yellow-500/[0.08] border-[#C9A84C] text-[#C9A84C]"
                        : "bg-[#181C23] border-white/[0.06] text-[#9B9590] hover:border-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  {pixKeyType.label}
                </label>
                <input
                  type="text"
                  placeholder={pixKeyType.placeholder}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors"
                />
              </div>

              {/* Saved keys */}
              <div>
                <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-2">
                  Chaves salvas
                </p>
                {[
                  {
                    type: "CPF",
                    key: "***.***.***-52",
                    label: "Minha chave principal",
                  },
                  {
                    type: "E-mail",
                    key: "joao***@gmail.com",
                    label: "E-mail pessoal",
                  },
                ].map((k) => (
                  <div
                    key={k.key}
                    onClick={() => {
                      setPixKey(k.key);
                      setPixKeyType(
                        PIX_KEY_TYPES.find((t) => t.label === k.type) ||
                          PIX_KEY_TYPES[0],
                      );
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#181C23] border border-white/[0.06] hover:border-[#C9A84C]/40 cursor-pointer transition-all mb-1.5 group"
                  >
                    <div>
                      <p className="text-[12px] font-medium group-hover:text-[#F0EDE6] transition-colors">
                        {k.key}
                      </p>
                      <p className="text-[10px] text-[#5A5750]">
                        {k.type} · {k.label}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity">
                      Usar →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank transfer fields */}
          {method === "bank" && (
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Dados bancários
              </p>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Banco
                </label>
                <select
                  value={bankData.bank}
                  onChange={(e) =>
                    setBankData((p) => ({ ...p, bank: e.target.value }))
                  }
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors appearance-none"
                >
                  <option value="">Selecione o banco</option>
                  {[
                    "001 - Banco do Brasil",
                    "033 - Santander",
                    "077 - Inter",
                    "104 - Caixa Econômica",
                    "237 - Bradesco",
                    "260 - Nubank",
                    "341 - Itaú",
                    "756 - Sicoob",
                  ].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Agência
                  </label>
                  <input
                    type="text"
                    placeholder="0000"
                    value={bankData.agency}
                    onChange={(e) =>
                      setBankData((p) => ({
                        ...p,
                        agency: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors font-mono"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Conta
                  </label>
                  <input
                    type="text"
                    placeholder="00000-0"
                    value={bankData.account}
                    onChange={(e) =>
                      setBankData((p) => ({ ...p, account: e.target.value }))
                    }
                    className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Tipo
                  </label>
                  <select
                    value={bankData.type}
                    onChange={(e) =>
                      setBankData((p) => ({ ...p, type: e.target.value }))
                    }
                    className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors"
                  >
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Titular da conta (deve ser o mesmo CPF cadastrado)
                </label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Crypto fields */}
          {method === "crypto" && (
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Endereço de destino
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "Bitcoin",
                    icon: "₿",
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10 border-yellow-400/30",
                  },
                  {
                    id: "Ethereum",
                    icon: "Ξ",
                    color: "text-blue-400",
                    bg: "bg-blue-400/10 border-blue-400/30",
                  },
                  {
                    id: "USDT",
                    icon: "₮",
                    color: "text-green-400",
                    bg: "bg-green-400/10 border-green-400/30",
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCryptoData((p) => ({ ...p, coin: c.id }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      cryptoData.coin === c.id
                        ? c.bg
                        : "bg-[#181C23] border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <span className={`font-display text-xl ${c.color}`}>
                      {c.icon}
                    </span>
                    <span className="text-[12px] text-[#9B9590]">{c.id}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Endereço da carteira {cryptoData.coin}
                </label>
                <input
                  type="text"
                  placeholder={
                    cryptoData.coin === "Bitcoin"
                      ? "bc1q..."
                      : cryptoData.coin === "Ethereum"
                        ? "0x..."
                        : "T..."
                  }
                  value={cryptoData.wallet}
                  onChange={(e) =>
                    setCryptoData((p) => ({ ...p, wallet: e.target.value }))
                  }
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors font-mono"
                />
                <p className="text-[11px] text-[#5A5750] mt-1.5">
                  ⚠️ Verifique o endereço cuidadosamente. Transações em
                  blockchain são irreversíveis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: summary ── */}
        <div className="space-y-4">
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sticky top-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-4">
              Resumo do Saque
            </p>

            <div className="space-y-3 mb-4">
              {[
                {
                  label: "Método",
                  value: `${selected.icon} ${selected.label}`,
                },
                { label: "Prazo", value: selected.time },
                { label: "Taxa", value: "Grátis", green: true },
                {
                  label: "Você solicita",
                  value: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-[#9B9590]">{r.label}</span>
                  <span
                    className={`font-semibold ${r.green ? "text-green-400" : ""}`}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] pt-4 mb-5">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-[#9B9590]">Você receberá</span>
                <p
                  className={`font-display text-3xl leading-none ${amount > BALANCE ? "text-red-400" : "text-[#C9A84C]"}`}
                >
                  R${" "}
                  {amount > 0
                    ? amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })
                    : "0,00"}
                </p>
              </div>
              {amount > 0 && amount <= BALANCE && (
                <p className="text-right text-[11px] text-[#5A5750]">
                  Saldo restante: R${" "}
                  {remaining.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={!isAmountValid}
              className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-40 disabled:cursor-not-allowed text-black font-display text-xl tracking-widest transition-colors"
            >
              CONTINUAR
            </button>

            {!isAmountValid && amount > 0 && (
              <p className="text-center text-[11px] text-red-400 mt-2">
                {amount > BALANCE
                  ? "Saldo insuficiente"
                  : `Valor mínimo: R$ ${selected.min}`}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
              {["🔒 SSL", "🛡️ PCI", "✓ Criptografado"].map((b) => (
                <span key={b} className="text-[10px] text-[#5A5750]">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Limits info */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Limites de saque
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Diário", used: 300, total: 2000 },
                { label: "Semanal", used: 300, total: 5000 },
                { label: "Mensal", used: 950, total: 20000 },
              ].map((l) => (
                <div key={l.label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-[#9B9590]">{l.label}</span>
                    <span className="text-[#5A5750]">
                      R$ {l.used.toLocaleString("pt-BR")} / R${" "}
                      {l.total.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-1 bg-[#1E2330] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A84C] rounded-full"
                      style={{ width: `${(l.used / l.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent withdrawals */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Saques Recentes
            </p>
            <div className="space-y-3">
              {RECENT_WITHDRAWALS.map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium">{r.method}</p>
                    <p className="text-[10px] text-[#5A5750]">{r.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold">
                      R${" "}
                      {r.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className={`text-[10px] ${r.statusClass}`}>{r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
