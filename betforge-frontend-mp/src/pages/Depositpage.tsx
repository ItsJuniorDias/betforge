import { useState, useEffect, useRef } from "react";
import { useDeposit, useCancelDeposit } from "../hooks/api/useFinancial";
import { useBalance } from "../hooks/api/useUser";
import { getApiError } from "../services/api";
import type {
  DepositResponse,
  PixPaymentData,
  BoletoPaymentData,
  CreditCardPaymentData,
} from "../types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const METHODS = [
  {
    id: "pix" as const,
    label: "PIX",
    icon: "⚡",
    badge: "Instantâneo",
    badgeClass: "text-green-400 bg-green-400/10",
    description: "Transferência instantânea 24h",
    min: 10,
    max: 50000,
  },
  {
    id: "credit_card" as const,
    label: "Cartão de Crédito",
    icon: "💳",
    badge: "Até 5min",
    badgeClass: "text-blue-400 bg-blue-400/10",
    description: "Visa, Mastercard, Elo, Hipercard",
    min: 20,
    max: 10000,
  },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

// ─── Mercado Pago JS SDK ──────────────────────────────────────────────────────

declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale: string },
    ) => {
      cardForm: (config: {
        amount: string;
        autoMount: boolean;
        form: {
          id: string;
          cardNumber: { id: string; placeholder: string };
          expirationDate: { id: string; placeholder: string };
          securityCode: { id: string; placeholder: string };
          cardholderName: { id: string; placeholder: string };
          issuer: { id: string };
          installments: { id: string };
          identificationType: { id: string };
          identificationNumber: { id: string; placeholder: string };
          cardholderEmail: { id: string; placeholder: string };
        };
        callbacks: {
          onFormMounted: (error?: Error) => void;
          onSubmit: (event: Event) => Promise<void>;
          onFetching: (resource: string) => () => void;
        };
      }) => { unmount: () => void };
    };
  }
}

// ─── Helper: countdown ───────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expirado");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

// ─── Sub-componente: Resultado PIX ───────────────────────────────────────────

function PixResult({
  data,
  transactionId,
  amount,
}: {
  data: PixPaymentData;
  transactionId: string;
  amount: number;
}) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(data.expiresAt);
  const cancel = useCancelDeposit();

  const copyCode = () => {
    navigator.clipboard.writeText(data.qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // O MP retorna qrCodeBase64 como imagem PNG em base64
  const qrSrc = data.qrCodeBase64
    ? `data:image/png;base64,${data.qrCodeBase64}`
    : data.ticketUrl
      ? undefined
      : undefined;

  return (
    <div className="bg-[#111318] border border-[#C9A84C]/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#F0EDE6]">PIX gerado!</p>
          <p className="text-xs text-[#5A5750] mt-0.5">
            R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ·
            Expira em{" "}
            <span className="text-[#C9A84C] font-semibold">{countdown}</span>
          </p>
        </div>
        <span className="text-3xl">⚡</span>
      </div>

      {/* QR Code — imagem base64 do MP */}
      {qrSrc && (
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-xl">
            <img
              src={qrSrc}
              alt="QR Code PIX"
              className="w-44 h-44 object-contain"
            />
          </div>
        </div>
      )}

      {/* Fallback: link para o ticket MP */}
      {!qrSrc && data.ticketUrl && (
        <a
          href={data.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] rounded-xl text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors"
        >
          📲 Abrir QR Code PIX
        </a>
      )}

      {/* Código copia e cola */}
      <div>
        <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1.5">
          Copia e Cola
        </p>
        <div className="flex items-center gap-2 bg-[#181C23] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <p className="flex-1 text-[11px] text-[#9B9590] font-mono truncate">
            {data.qrCode}
          </p>
          <button
            onClick={copyCode}
            className="shrink-0 text-[11px] font-semibold text-[#C9A84C] hover:text-[#F0D080] transition-colors px-2 py-1 rounded-lg bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-xs leading-relaxed">
        Abra o app do seu banco → PIX → Copia e Cola ou escaneie o QR Code. Seu
        saldo será creditado automaticamente após o pagamento.
      </div>

      <button
        onClick={() => cancel.mutate(transactionId)}
        disabled={cancel.isPending}
        className="w-full py-2 text-sm text-[#5A5750] hover:text-red-400 transition-colors"
      >
        {cancel.isPending ? "Cancelando..." : "Cancelar cobrança"}
      </button>
    </div>
  );
}

// ─── Sub-componente: Resultado Boleto ────────────────────────────────────────

function BoletoResult({
  data,
  transactionId,
}: {
  data: BoletoPaymentData;
  transactionId: string;
}) {
  const [copied, setCopied] = useState(false);
  const cancel = useCancelDeposit();

  const copyLine = () => {
    navigator.clipboard.writeText(data.boletoLine).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-[#111318] border border-yellow-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#F0EDE6]">Boleto gerado!</p>
          <p className="text-xs text-[#5A5750] mt-0.5">
            Vencimento:{" "}
            <span className="text-yellow-400 font-semibold">
              {data.dueAt?.split("T")[0]}
            </span>
          </p>
        </div>
        <span className="text-3xl">🏦</span>
      </div>

      {/* Linha digitável */}
      <div>
        <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1.5">
          Linha Digitável
        </p>
        <div className="flex items-center gap-2 bg-[#181C23] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <p className="flex-1 text-[11px] text-[#9B9590] font-mono truncate">
            {data.boletoLine}
          </p>
          <button
            onClick={copyLine}
            className="shrink-0 text-[11px] font-semibold text-[#C9A84C] hover:text-[#F0D080] transition-colors px-2 py-1 rounded-lg bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {data.boletoPdf && (
        <a
          href={data.boletoPdf}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded-xl text-sm font-semibold hover:bg-yellow-400/20 transition-colors"
        >
          📄 Abrir boleto / pagar online
        </a>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-xs leading-relaxed">
        Pague o boleto em qualquer banco, lotérica ou pelo app bancário. Após a
        compensação (até 3 dias úteis) seu saldo será creditado.
      </div>

      <button
        onClick={() => cancel.mutate(transactionId)}
        disabled={cancel.isPending}
        className="w-full py-2 text-sm text-[#5A5750] hover:text-red-400 transition-colors"
      >
        {cancel.isPending ? "Cancelando..." : "Cancelar boleto"}
      </button>
    </div>
  );
}

// ─── Sub-componente: Resultado Cartão ────────────────────────────────────────

function CreditCardResult({
  data,
  amount,
}: {
  data: CreditCardPaymentData;
  amount: number;
}) {
  if (data.approved) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center space-y-2">
        <p className="text-4xl">✅</p>
        <p className="font-semibold text-green-400 text-lg">
          Depósito aprovado!
        </p>
        <p className="text-[#9B9590] text-sm">
          R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
          creditado no seu saldo.
        </p>
        {data.paymentMethodId && (
          <p className="text-xs text-[#5A5750]">
            {data.paymentMethodId.toUpperCase()} •••• {data.lastFour}
            {data.installments && data.installments > 1
              ? ` · ${data.installments}x`
              : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center space-y-2">
      <p className="text-4xl">❌</p>
      <p className="font-semibold text-red-400 text-lg">
        Pagamento não aprovado
      </p>
      <p className="text-[#9B9590] text-sm">
        {data.statusDetail
          ? `Motivo: ${data.statusDetail}`
          : "Verifique os dados do cartão ou tente outro método."}
      </p>
    </div>
  );
}

// ─── Sub-componente: Formulário Cartão (Mercado Pago CardForm) ───────────────

function CardForm({
  amount,
  onTokenReady,
}: {
  amount: number;
  onTokenReady: (token: string, installments: number, issuerId: string) => void;
}) {
  const formRef = useRef<ReturnType<
    InstanceType<typeof window.MercadoPago>["cardForm"]
  > | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sdkError, setSdkError] = useState("");

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string;
  // Ref para garantir que o componente ainda está montado ao inicializar
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Aguarda o próximo tick para garantir que todos os divs do formulário
    // já estejam commitados no DOM antes de o SDK tentar localizá-los.
    // Sem esse delay, o cardForm dispara antes do React renderizar os elementos,
    // causando o erro "Erro ao montar formulário do cartão".
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;

      const existingScript = document.getElementById("mp-sdk");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "mp-sdk";
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.onload = () => {
          if (isMountedRef.current) initForm();
        };
        document.head.appendChild(script);
      } else if (window.MercadoPago) {
        initForm();
      } else {
        existingScript.addEventListener("load", () => {
          if (isMountedRef.current) initForm();
        });
      }
    }, 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      // O SDK lança exceção se unmount() for chamado antes do cardForm
      // terminar de montar — envolvemos em try-catch para evitar o crash.
      try {
        formRef.current?.unmount();
      } catch (_) {
        // ignora: "CardForm is not mounted"
      }
      formRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const initForm = () => {
    if (!window.MercadoPago || !publicKey) {
      setSdkError(
        "Chave pública do Mercado Pago não configurada (VITE_MP_PUBLIC_KEY).",
      );
      return;
    }

    // Verifica se os elementos essenciais do formulário já existem no DOM.
    // Se não, aguarda mais 100ms e tenta novamente (race condition com React commit).
    const requiredIds = [
      "mp-card-number",
      "mp-expiration-date",
      "mp-security-code",
      "mp-cardholder-name",
    ];
    const allPresent = requiredIds.every((id) => document.getElementById(id));
    if (!allPresent) {
      setTimeout(() => {
        if (isMountedRef.current) initForm();
      }, 100);
      return;
    }

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

    formRef.current = mp.cardForm({
      amount: String(amount),
      autoMount: true,
      form: {
        id: "mp-card-form",
        cardNumber: {
          id: "mp-card-number",
          placeholder: "0000 0000 0000 0000",
        },
        expirationDate: { id: "mp-expiration-date", placeholder: "MM/AA" },
        securityCode: { id: "mp-security-code", placeholder: "CVV" },
        cardholderName: {
          id: "mp-cardholder-name",
          placeholder: "Nome como no cartão",
        },
        issuer: { id: "mp-issuer" },
        installments: { id: "mp-installments" },
        identificationType: { id: "mp-identification-type" },
        identificationNumber: {
          id: "mp-identification-number",
          placeholder: "000.000.000-00",
        },
        cardholderEmail: {
          id: "mp-cardholder-email",
          placeholder: "seu@email.com",
        },
      },
      callbacks: {
        onFormMounted: (err) => {
          if (err) {
            console.error("[MercadoPago] onFormMounted error:", err);
            setSdkError("Erro ao montar formulário do cartão.");
            return;
          }
          setMounted(true);
        },
        onSubmit: async (event) => {
          event.preventDefault();
          setLoading(true);
          try {
            const { token, installments, issuerId } = (
              formRef.current as any
            ).getCardFormData();
            onTokenReady(token, Number(installments), issuerId ?? "");
          } catch {
            setSdkError("Erro ao gerar token do cartão. Verifique os dados.");
          } finally {
            setLoading(false);
          }
        },
        onFetching: (resource) => {
          setLoading(true);
          return () => {
            if (resource !== "cardToken") setLoading(false);
          };
        },
      },
    });
  };

  if (sdkError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
        ⚠️ {sdkError}
      </div>
    );
  }

  return (
    // O id "mp-card-form" é referenciado pelo SDK — não remover
    <div id="mp-card-form" className="space-y-3">
      {/* Número */}
      <div>
        <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
          Número do Cartão
        </label>
        <input
          id="mp-card-number"
          className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
          type="text"
          placeholder="0000 0000 0000 0000"
          autoComplete="cc-number"
        />
      </div>

      {/* Nome */}
      <div>
        <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
          Nome no Cartão
        </label>
        <input
          id="mp-cardholder-name"
          className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
          type="text"
          placeholder="Nome como no cartão"
          autoComplete="cc-name"
        />
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
            Validade
          </label>
          <input
            id="mp-expiration-date"
            className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
            type="text"
            placeholder="MM/AA"
            autoComplete="cc-exp"
          />
        </div>
        <div>
          <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
            CVV
          </label>
          <input
            id="mp-security-code"
            className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
            type="text"
            placeholder="CVV"
            autoComplete="cc-csc"
          />
        </div>
      </div>

      {/* CPF (identificação) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
            Tipo doc.
          </label>
          <select
            id="mp-identification-type"
            className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] h-10 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
            CPF
          </label>
          <input
            id="mp-identification-number"
            className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
            type="text"
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      {/* E-mail */}
      <div>
        <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
          E-mail
        </label>
        <input
          id="mp-cardholder-email"
          className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 focus:outline-none transition-colors h-10"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
        />
      </div>

      {/* Parcelas (populado automaticamente pelo SDK após detectar bandeira) */}
      <div>
        <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
          Parcelas
        </label>
        <select
          id="mp-installments"
          className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] h-10 focus:outline-none"
        />
      </div>

      {/* Campos ocultos usados internamente pelo SDK */}
      <select id="mp-issuer" className="hidden" />

      <button
        type="submit"
        disabled={!mounted || loading}
        className="w-full py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#C9A84C]/20 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
            Validando cartão…
          </>
        ) : (
          "Confirmar dados do cartão →"
        )}
      </button>

      <p className="text-[10px] text-[#5A5750] text-center">
        🔒 Dados criptografados via Mercado Pago. Não armazenamos seu cartão.
      </p>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function DepositPage() {
  const [method, setMethod] = useState<MethodId>("pix");
  const [amount, setAmount] = useState("");
  const [depositResult, setDepositResult] = useState<DepositResponse | null>(
    null,
  );
  const [step, setStep] = useState<"form" | "result">("form");

  const deposit = useDeposit();
  const { data: balance } = useBalance();
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const numAmount = parseFloat(amount) || 0;
  const apiError = deposit.error ? getApiError(deposit.error) : "";

  const resetFlow = () => {
    setDepositResult(null);
    setAmount("");
    setStep("form");
    deposit.reset();
  };

  const handleMethodChange = (id: MethodId) => {
    setMethod(id);
    resetFlow();
  };

  const handleDeposit = (
    token?: string,
    installments?: number,
    issuerId?: string,
  ) => {
    if (numAmount < selectedMethod.min) return;

    const payload =
      method === "credit_card"
        ? {
            amount: numAmount,
            method,
            cardToken: token,
            installments: installments ?? 1,
            issuerId,
          }
        : { amount: numAmount, method };

    deposit.mutate(payload as Parameters<typeof deposit.mutate>[0], {
      onSuccess: (res) => {
        setDepositResult(res);
        setStep("result");
      },
    });
  };

  // ─── Render: tela de resultado ─────────────────────────────────────────────

  if (step === "result" && depositResult) {
    const pd = depositResult.paymentData as Record<string, unknown>;

    return (
      <div className="p-5 max-w-2xl mx-auto">
        <button
          onClick={resetFlow}
          className="flex items-center gap-1.5 text-sm text-[#5A5750] hover:text-[#F0EDE6] mb-5 transition-colors"
        >
          ← Novo depósito
        </button>

        {method === "pix" && (
          <PixResult
            data={pd as unknown as PixPaymentData}
            transactionId={depositResult.transaction.id}
            amount={numAmount}
          />
        )}
        {method === "boleto" && (
          <BoletoResult
            data={pd as unknown as BoletoPaymentData}
            transactionId={depositResult.transaction.id}
          />
        )}
        {method === "credit_card" && (
          <CreditCardResult
            data={pd as unknown as CreditCardPaymentData}
            amount={numAmount}
          />
        )}
        {method === "crypto" && (
          <div className="bg-[#111318] border border-purple-500/20 rounded-2xl p-5 text-center space-y-2">
            <p className="text-3xl">🪙</p>
            <p className="font-semibold text-[#F0EDE6]">
              Solicitação registrada
            </p>
            <p className="text-sm text-[#9B9590]">{depositResult.message}</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: formulário ────────────────────────────────────────────────────

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl tracking-wide mb-2">DEPOSITAR</h1>
      <p className="text-[#5A5750] text-sm mb-6">
        Saldo atual:{" "}
        <span className="text-[#C9A84C] font-semibold">
          R${" "}
          {balance?.balance.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          }) ?? "..."}
        </span>
      </p>

      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
          ⚠️ {apiError}
        </div>
      )}

      {/* Método */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleMethodChange(m.id)}
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

      {/* Valor */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-[#F0EDE6]">Valor do depósito</h2>

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

        <div className="flex items-center bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-3 focus-within:border-[#C9A84C]/40 transition-colors">
          <span className="text-[#5A5750] mr-2 text-sm">R$</span>
          <input
            type="number"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={selectedMethod.min}
            max={selectedMethod.max}
            className="flex-1 bg-transparent text-[#F0EDE6] text-lg font-semibold focus:outline-none placeholder-[#5A5750]"
          />
        </div>

        <p className="text-[11px] text-[#5A5750]">
          Mín: R$ {selectedMethod.min} · Máx: R${" "}
          {selectedMethod.max.toLocaleString("pt-BR")}
        </p>

        {/* Formulário Mercado Pago CardForm (cartão) */}
        {method === "credit_card" && numAmount >= selectedMethod.min && (
          <CardForm
            amount={numAmount}
            onTokenReady={(token, installments, issuerId) =>
              handleDeposit(token, installments, issuerId)
            }
          />
        )}

        {/* Botão principal (não mostra para cartão) */}
        {method !== "credit_card" && (
          <button
            onClick={() => handleDeposit()}
            disabled={deposit.isPending || numAmount < selectedMethod.min}
            className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-50 disabled:cursor-not-allowed text-black font-display text-lg tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {deposit.isPending ? (
              <>
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Gerando…
              </>
            ) : method === "pix" ? (
              "GERAR QR CODE PIX"
            ) : method === "boleto" ? (
              "GERAR BOLETO"
            ) : (
              "DEPOSITAR AGORA"
            )}
          </button>
        )}

        {method === "credit_card" && deposit.isPending && (
          <div className="flex items-center justify-center gap-2 py-3 text-[#C9A84C]">
            <span className="w-5 h-5 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
            Processando pagamento…
          </div>
        )}
      </div>
    </div>
  );
}
