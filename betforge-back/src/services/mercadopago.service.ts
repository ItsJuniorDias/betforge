/**
 * Mercado Pago API Service
 * Documentação: https://www.mercadopago.com.br/developers/pt/reference
 *
 * Cobre:
 *  - PIX: payment com QR code
 *  - Cartão de crédito: payment com token
 *  - Boleto bancário: payment com boleto
 *  - Saque via PIX (disbursement / payout)
 *  - Cancelamento de payment
 *  - Buscar payment
 */

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

// ─── Tipos Internos ───────────────────────────────────────────────────────────

export interface MpPixPayment {
  id: number;
  status: string; // 'pending' | 'approved' | 'rejected' | 'cancelled'
  status_detail: string;
  transaction_amount: number; // reais (float)
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  date_of_expiration: string;
}

export interface MpBoletoPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  barcode: { content: string };
  transaction_details: { external_resource_url: string };
  date_of_expiration: string;
}

export interface MpCreditCardPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  installments: number;
  payment_method_id: string; // 'visa', 'mastercard', etc.
  card: { last_four_digits: string; cardholder: { name: string } };
}

export interface MpPayout {
  id: string;
  status: string; // 'scheduled' | 'processed' | 'failed'
  amount: number;
  date_created: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBaseHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
    "X-Idempotency-Key": "", // será preenchida por chamada
  };
}

async function mpRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const url = `${env.MP_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
  };

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as any;

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      data?.cause?.[0]?.description ||
      `Mercado Pago error ${res.status}`;
    logger.error("Mercado Pago API error", {
      status: res.status,
      path,
      body: data,
    });
    throw new AppError(`Mercado Pago: ${msg}`, 502, "MP_ERROR");
  }

  return data as T;
}

// ─── PIX ──────────────────────────────────────────────────────────────────────

/**
 * Cria pagamento PIX com QR code.
 * O Mercado Pago gera o QR automaticamente para payment_method_id = 'pix'.
 */
export async function createPixPayment(params: {
  amountReais: number;
  description: string;
  orderId: string; // ID interno da transação (external_reference)
  payerEmail: string;
  payerCpf: string; // apenas dígitos
  payerFirstName: string;
  payerLastName: string;
  expiresInMinutes?: number; // default 60
}): Promise<MpPixPayment> {
  const expiresAt = new Date(
    Date.now() + (params.expiresInMinutes ?? 60) * 60 * 1000,
  ).toISOString();

  return mpRequest<MpPixPayment>(
    "POST",
    "/v1/payments",
    {
      transaction_amount: params.amountReais,
      description: params.description,
      payment_method_id: "pix",
      date_of_expiration: expiresAt,
      payer: {
        email: params.payerEmail,
        first_name: params.payerFirstName,
        last_name: params.payerLastName,
        identification: { type: "CPF", number: params.payerCpf },
      },
      external_reference: params.orderId,
      notification_url: env.MP_WEBHOOK_URL,
    },
    params.orderId, // idempotency key
  );
}

// ─── Boleto ───────────────────────────────────────────────────────────────────

export async function createBoletoPayment(params: {
  amountReais: number;
  description: string;
  orderId: string;
  payerEmail: string;
  payerCpf: string;
  payerFirstName: string;
  payerLastName: string;
  dueDays?: number; // default 3
}): Promise<MpBoletoPayment> {
  const dueDate = new Date(
    Date.now() + (params.dueDays ?? 3) * 24 * 3600 * 1000,
  )
    .toISOString()
    .split("T")[0]; // YYYY-MM-DD

  return mpRequest<MpBoletoPayment>(
    "POST",
    "/v1/payments",
    {
      transaction_amount: params.amountReais,
      description: params.description,
      payment_method_id: "bolbradesco", // boleto Bradesco — mais aceito no MP BR
      date_of_expiration: `${dueDate}T23:59:59.000-03:00`,
      payer: {
        email: params.payerEmail,
        first_name: params.payerFirstName,
        last_name: params.payerLastName,
        identification: { type: "CPF", number: params.payerCpf },
      },
      external_reference: params.orderId,
      notification_url: env.MP_WEBHOOK_URL,
    },
    params.orderId,
  );
}

// ─── Cartão de Crédito ────────────────────────────────────────────────────────

export async function createCreditCardPayment(params: {
  amountReais: number;
  description: string;
  orderId: string;
  payerEmail: string;
  payerCpf: string;
  payerFirstName: string;
  payerLastName: string;
  cardToken: string; // token gerado pelo MP.js no frontend
  installments?: number;
  issuerId?: string; // opcional — emissora do cartão
}): Promise<MpCreditCardPayment> {
  return mpRequest<MpCreditCardPayment>(
    "POST",
    "/v1/payments",
    {
      transaction_amount: params.amountReais,
      description: params.description,
      token: params.cardToken,
      installments: params.installments ?? 1,
      issuer_id: params.issuerId,
      payer: {
        email: params.payerEmail,
        first_name: params.payerFirstName,
        last_name: params.payerLastName,
        identification: { type: "CPF", number: params.payerCpf },
      },
      external_reference: params.orderId,
      notification_url: env.MP_WEBHOOK_URL,
      statement_descriptor: "BETFORGE",
    },
    params.orderId,
  );
}

// ─── Cancelar Payment ─────────────────────────────────────────────────────────

export async function cancelPayment(paymentId: string): Promise<void> {
  await mpRequest("PUT", `/v1/payments/${paymentId}`, { status: "cancelled" });
}

// ─── Buscar Payment ───────────────────────────────────────────────────────────

export async function getPayment(paymentId: string): Promise<any> {
  return mpRequest("GET", `/v1/payments/${paymentId}`);
}

// ─── Saque via PIX (Payout) ───────────────────────────────────────────────────

/**
 * Realiza transferência PIX via Mercado Pago Payouts.
 * Requer conta MP com permissão de Disbursements habilitada.
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/money-out/landing
 */
export async function createPixPayout(params: {
  amountReais: number;
  pixKey: string;
  pixKeyType: "cpf" | "email" | "phone" | "random_key";
  holderName: string;
  holderDocument: string;
  orderId: string;
}): Promise<MpPayout> {
  const mpKeyTypeMap: Record<string, string> = {
    cpf: "CPF",
    email: "EMAIL",
    phone: "PHONE",
    random_key: "EVP",
  };

  return mpRequest<MpPayout>(
    "POST",
    "/v1/settlements", // ✅ endpoint correto
    {
      external_reference: params.orderId,
      description: `Saque BetForge #${params.orderId.slice(0, 8)}`,
      receiver: {
        type: "pix",
        key: params.pixKey,
        key_type: mpKeyTypeMap[params.pixKeyType] ?? "CPF",
      },
      amount: {
        value: params.amountReais,
        currency_id: "BRL",
      },
      payer: {
        name: params.holderName,
        document: { type: "CPF", number: params.holderDocument },
      },
    },
    params.orderId,
  );
}
