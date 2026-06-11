import { useState } from "react";

const METHODS = [
  {
    id: "pix",
    label: "Pix",
    icon: "⚡",
    badge: "Instantâneo",
    badgeClass: "text-green-400 bg-green-400/10",
    description: "Transferência instantânea 24h",
    min: 10,
    max: 50000,
  },
  {
    id: "card",
    label: "Cartão de Crédito",
    icon: "💳",
    badge: "Até 5min",
    badgeClass: "text-blue-400 bg-blue-400/10",
    description: "Visa, Mastercard, Elo",
    min: 20,
    max: 10000,
  },
  {
    id: "boleto",
    label: "Boleto Bancário",
    icon: "🏦",
    badge: "Até 3 dias",
    badgeClass: "text-yellow-400 bg-yellow-400/10",
    description: "Compensação em até 3 dias úteis",
    min: 30,
    max: 5000,
  },
  {
    id: "crypto",
    label: "Criptomoeda",
    icon: "🪙",
    badge: "Até 30min",
    badgeClass: "text-purple-400 bg-purple-400/10",
    description: "Bitcoin, Ethereum, USDT",
    min: 50,
    max: 100000,
  },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const BONUSES = [
  {
    min: 100,
    label: "+50% bônus",
    desc: "Até R$ 50 extra",
    color: "text-[#C9A84C]",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    min: 300,
    label: "+75% bônus",
    desc: "Até R$ 225 extra",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
  },
  {
    min: 500,
    label: "+100% bônus",
    desc: "Até R$ 500 extra",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
];

const RECENT = [
  { date: "02/06/2026", method: "Pix", amount: 200, status: "Aprovado" },
  { date: "24/05/2026", method: "Cartão", amount: 100, status: "Aprovado" },
  { date: "10/05/2026", method: "Pix", amount: 500, status: "Aprovado" },
];

// ── Pix step ────────────────────────────────────────────────────────────────
function PixStep({ amount, onBack, onConfirm }) {
  const [copied, setCopied] = useState(false);
  const pixKey =
    "00020126580014br.gov.bcb.pix013636c3a4e2-bf17-4e3d-9921-c3b452020101";

  function copy() {
    navigator.clipboard.writeText(pixKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 text-center">
        {/* QR mock */}
        <div className="w-44 h-44 mx-auto rounded-xl bg-white p-3 mb-4 grid grid-cols-7 gap-0.5">
          {Array.from({ length: 49 }).map((_, i) => {
            const corners = [
              0, 1, 2, 6, 7, 13, 14, 8, 42, 43, 48, 47, 41, 35, 36,
            ];
            const dark = corners.includes(i) || Math.random() > 0.55;
            return (
              <div
                key={i}
                className={`rounded-[1px] ${dark ? "bg-black" : "bg-white"}`}
              />
            );
          })}
        </div>

        <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-1">
          Valor a pagar
        </p>
        <p className="font-display text-4xl text-[#C9A84C] mb-4">
          R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>

        {/* Pix copy-paste */}
        <div className="bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 text-left mb-3">
          <p className="text-[10px] text-[#5A5750] uppercase tracking-wider mb-1">
            Chave Pix (copia e cola)
          </p>
          <p className="text-[12px] text-[#9B9590] font-mono truncate">
            {pixKey.slice(0, 44)}…
          </p>
        </div>
        <button
          onClick={copy}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            copied
              ? "bg-green-400/10 border-green-400/30 text-green-400"
              : "bg-[#C9A84C] border-transparent text-black hover:bg-[#F0D080]"
          }`}
        >
          {copied ? "✓ Copiado!" : "Copiar Chave Pix"}
        </button>
      </div>

      <div className="bg-[#1E2330] border border-white/[0.06] rounded-xl px-4 py-3 space-y-1.5">
        {[
          "⏱ O pagamento é confirmado em segundos",
          "🔒 Transação criptografada e segura",
          "📱 Abra o app do seu banco e escaneie",
        ].map((t) => (
          <p key={t} className="text-[12px] text-[#9B9590]">
            {t}
          </p>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] hover:border-white/20 text-sm transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] py-3 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] text-black font-display text-xl tracking-widest transition-colors"
        >
          JÁ PAGUEI
        </button>
      </div>
    </div>
  );
}

// ── Success step ─────────────────────────────────────────────────────────────
function SuccessStep({ amount, method, onDone }) {
  return (
    <div className="text-center space-y-5 py-4 animate-fadeIn">
      <div className="w-20 h-20 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center text-4xl mx-auto">
        ✓
      </div>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-green-400 mb-1">
          DEPÓSITO REALIZADO
        </h2>
        <p className="text-[#9B9590] text-sm">
          Seu saldo foi atualizado com sucesso
        </p>
      </div>
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3">
        {[
          {
            label: "Valor depositado",
            value: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            gold: true,
          },
          { label: "Método", value: method },
          { label: "Status", value: "✓ Aprovado", green: true },
          { label: "Novo saldo", value: "R$ 1.450,00", gold: true },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-[12px] text-[#5A5750] uppercase tracking-wide">
              {r.label}
            </span>
            <span
              className={`text-sm font-semibold ${r.gold ? "text-[#C9A84C]" : r.green ? "text-green-400" : "text-[#F0EDE6]"}`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] text-black font-display text-xl tracking-widest transition-colors"
      >
        APOSTAR AGORA
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DepositPage() {
  const [method, setMethod] = useState("pix");
  const [amount, setAmount] = useState(200);
  const [step, setStep] = useState("form"); // form | pix | success
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const selected = METHODS.find((m) => m.id === method);
  const activeBonus =
    [...BONUSES].reverse().find((b) => amount >= b.min) || null;
  const bonusValue = activeBonus
    ? Math.min(
        amount *
          (activeBonus.label.includes("100")
            ? 1
            : activeBonus.label.includes("75")
              ? 0.75
              : 0.5),
        parseFloat(activeBonus.desc.replace(/[^0-9]/g, "")),
      )
    : 0;

  function handleSubmit() {
    if (method === "pix") {
      setStep("pix");
      return;
    }
    setStep("success");
  }

  if (step === "pix")
    return (
      <div className="p-5 max-w-[520px]">
        <h1 className="font-display text-4xl tracking-wide mb-6">
          DEPOSITAR VIA PIX
        </h1>
        <PixStep
          amount={amount}
          onBack={() => setStep("form")}
          onConfirm={() => setStep("success")}
        />
      </div>
    );

  if (step === "success")
    return (
      <div className="p-5 max-w-full">
        <h1 className="font-display text-4xl tracking-wide mb-6">DEPÓSITO</h1>
        <SuccessStep
          amount={amount}
          method={selected.label}
          onDone={() => setStep("form")}
        />
      </div>
    );

  return (
    <div className="p-5 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl tracking-wide">DEPOSITAR</h1>
        <div className="bg-[#111318] border border-white/[0.06] rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] text-[#5A5750] uppercase tracking-wider">
            Saldo atual
          </p>
          <p className="font-display text-xl text-[#C9A84C]">R$ 1.250,00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">
          {/* Payment methods */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Método de pagamento
            </p>
            <div className="grid grid-cols-2 gap-2.5">
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
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Valor do depósito
            </p>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5750] font-semibold text-sm">
                R$
              </span>
              <input
                type="number"
                value={amount}
                min={selected.min}
                max={selected.max}
                onChange={(e) =>
                  setAmount(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl pl-10 pr-4 py-3 text-lg font-semibold text-[#F0EDE6] focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#5A5750] mt-2">
              Mín: R$ {selected.min} · Máx: R${" "}
              {selected.max.toLocaleString("pt-BR")}
            </p>

            {/* Bonus banner */}
            {activeBonus && (
              <div
                className={`mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl border ${activeBonus.bg}`}
              >
                <div>
                  <p className={`text-sm font-bold ${activeBonus.color}`}>
                    🎁 {activeBonus.label} ativado!
                  </p>
                  <p className="text-[11px] text-[#9B9590]">
                    {activeBonus.desc} em bônus
                  </p>
                </div>
                <p className={`font-display text-xl ${activeBonus.color}`}>
                  +R${" "}
                  {Math.round(
                    amount *
                      (activeBonus.label.includes("100")
                        ? 1
                        : activeBonus.label.includes("75")
                          ? 0.75
                          : 0.5),
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Card fields — only for card method */}
          {method === "card" && (
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Dados do cartão
              </p>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Número do cartão
                </label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) =>
                    setCardData((p) => ({
                      ...p,
                      number: e.target.value
                        .replace(/\D/g, "")
                        .replace(/(.{4})/g, "$1 ")
                        .trim(),
                    }))
                  }
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors tracking-widest font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                  Nome no cartão
                </label>
                <input
                  type="text"
                  placeholder="JOÃO SILVA"
                  value={cardData.name}
                  onChange={(e) =>
                    setCardData((p) => ({
                      ...p,
                      name: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors uppercase tracking-wider"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) =>
                      setCardData((p) => ({
                        ...p,
                        expiry: e.target.value
                          .replace(/\D/g, "")
                          .replace(/^(\d{2})(\d)/, "$1/$2")
                          .slice(0, 5),
                      }))
                    }
                    className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData((p) => ({
                        ...p,
                        cvv: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="w-full bg-[#181C23] border border-white/[0.06] focus:border-[#C9A84C] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none transition-colors font-mono tracking-widest"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Crypto fields */}
          {method === "crypto" && (
            <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[11px] text-[#5A5750] uppercase tracking-widest">
                Selecione a moeda
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "btc",
                    label: "Bitcoin",
                    icon: "₿",
                    color: "text-yellow-400",
                  },
                  {
                    id: "eth",
                    label: "Ethereum",
                    icon: "Ξ",
                    color: "text-blue-400",
                  },
                  {
                    id: "usdt",
                    label: "USDT",
                    icon: "₮",
                    color: "text-green-400",
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#181C23] border border-white/[0.06] hover:border-white/20 transition-all"
                  >
                    <span className={`font-display text-xl ${c.color}`}>
                      {c.icon}
                    </span>
                    <span className="text-[12px] text-[#9B9590]">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: summary ── */}
        <div className="space-y-4">
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sticky top-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-4">
              Resumo
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#9B9590]">Método</span>
                <span className="font-medium flex items-center gap-1.5">
                  {selected.icon} {selected.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9B9590]">Valor</span>
                <span className="font-semibold">
                  R${" "}
                  {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {activeBonus && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#9B9590]">
                    Bônus ({activeBonus.label})
                  </span>
                  <span className="font-semibold text-green-400">
                    +R${" "}
                    {Math.round(
                      amount *
                        (activeBonus.label.includes("100")
                          ? 1
                          : activeBonus.label.includes("75")
                            ? 0.75
                            : 0.5),
                    ).toLocaleString("pt-BR")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#9B9590]">Taxa</span>
                <span className="text-green-400 font-medium">Grátis</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9B9590]">Prazo</span>
                <span className="font-medium">{selected.badge}</span>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-[#9B9590]">Total creditado</span>
                <div className="text-right">
                  <p className="font-display text-3xl text-[#C9A84C] leading-none">
                    R${" "}
                    {(
                      amount +
                      Math.round(
                        amount *
                          (activeBonus?.label.includes("100")
                            ? 1
                            : activeBonus?.label.includes("75")
                              ? 0.75
                              : activeBonus
                                ? 0.5
                                : 0),
                      )
                    ).toLocaleString("pt-BR")}
                  </p>
                  {activeBonus && (
                    <p className="text-[11px] text-green-400 mt-0.5">
                      inclui bônus
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={amount < selected.min}
              className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-40 disabled:cursor-not-allowed text-black font-display text-xl tracking-widest transition-colors"
            >
              {method === "pix"
                ? "GERAR PIX"
                : method === "boleto"
                  ? "GERAR BOLETO"
                  : "CONFIRMAR"}
            </button>

            {amount < selected.min && (
              <p className="text-center text-[11px] text-red-400 mt-2">
                Valor mínimo: R$ {selected.min}
              </p>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
              {["🔒 SSL", "🛡️ PCI", "✓ Criptografado"].map((b) => (
                <span key={b} className="text-[10px] text-[#5A5750]">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Bonus progress */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Nível de bônus
            </p>
            <div className="space-y-2">
              {BONUSES.map((b) => {
                const reached = amount >= b.min;
                return (
                  <div
                    key={b.min}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${reached ? b.bg : "border-transparent"}`}
                  >
                    <span
                      className={`text-sm font-bold w-4 text-center ${reached ? b.color : "text-[#5A5750]"}`}
                    >
                      {reached ? "✓" : "○"}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-[12px] font-semibold ${reached ? b.color : "text-[#5A5750]"}`}
                      >
                        {b.label}
                      </p>
                      <p className="text-[10px] text-[#5A5750]">
                        a partir de R$ {b.min}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${reached ? b.color : "text-[#5A5750]"}`}
                    >
                      {b.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent deposits */}
          <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-3">
              Depósitos Recentes
            </p>
            <div className="space-y-2">
              {RECENT.map((r, i) => (
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
                    <p className="text-[10px] text-green-400">{r.status}</p>
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
