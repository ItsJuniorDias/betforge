import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDismissNotification,
} from "../hooks/api/useNotifications";
import type { Notification, NotificationType } from "../services/notification.service";

// ─── Mapeamento de tipo → UI ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; bg: string; border: string }
> = {
  bet_settled: { icon: "🏆", bg: "bg-green-500/10", border: "border-green-500/20" },
  deposit_confirmed: { icon: "💰", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/20" },
  withdraw_processed: { icon: "🏦", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  promotion: { icon: "🎁", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  system: { icon: "🔐", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

const FILTER_LABELS = ["Todas", "Apostas", "Financeiro", "Promoções", "Sistema"];
const FILTER_MAP: Record<string, NotificationType[]> = {
  Apostas: ["bet_settled"],
  Financeiro: ["deposit_confirmed", "withdraw_processed"],
  Promoções: ["promotion"],
  Sistema: ["system"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 2) return `Há ${days} dias`;
  if (days === 1) return "Há 1 dia";
  if (hours >= 1) return `Há ${hours} hora${hours > 1 ? "s" : ""}`;
  if (mins >= 1) return `Há ${mins} minuto${mins > 1 ? "s" : ""}`;
  return "Agora mesmo";
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR");
}

/** Retorna a rota de ação com base no tipo e metadata da notificação */
function resolveAction(notif: Notification): { label: string; route: string } {
  const meta = notif.metadata ?? {};
  switch (notif.type) {
    case "bet_settled":
      return meta.bet_id
        ? { label: "Ver aposta", route: `/history/${meta.bet_id}` }
        : { label: "Ver histórico", route: "/history" };
    case "deposit_confirmed":
      return { label: "Ver saldo", route: "/account" };
    case "withdraw_processed":
      return { label: "Ver extrato", route: "/transactions" };
    case "promotion":
      return { label: "Ver promoções", route: "/promotions" };
    default:
      return { label: "Ver conta", route: "/account" };
  }
}

/** Extrai o "detail" (valor monetário ou info resumida) da metadata */
function resolveDetail(notif: Notification): { text: string; cls: string } | null {
  const meta = notif.metadata ?? {};
  const fmt = (v: unknown) =>
    `R$ ${Number(v)
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  if (notif.type === "bet_settled") {
    const event = meta.event as string;
    if (event === "bet_won" && meta.payout)
      return { text: `+ ${fmt(meta.payout)}`, cls: "text-green-400" };
    if (event === "bet_lost" && meta.stake)
      return { text: `- ${fmt(meta.stake)}`, cls: "text-red-400" };
    if (event === "bet_placed" && meta.stake)
      return { text: `${fmt(meta.stake)} apostado`, cls: "text-yellow-400" };
  }
  if (notif.type === "deposit_confirmed" && meta.amount)
    return { text: `+ ${fmt(meta.amount)}`, cls: "text-green-400" };
  if (notif.type === "withdraw_processed" && meta.amount) {
    const event = meta.event as string;
    if (event === "withdraw_failed")
      return { text: `Estornado ${fmt(meta.amount)}`, cls: "text-orange-400" };
    return { text: `- ${fmt(meta.amount)}`, cls: "text-[#9B9590]" };
  }
  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Todas");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: 30 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const dismiss = useDismissNotification();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Filtragem client-side (dados já estão carregados)
  const filtered =
    filter === "Todas"
      ? notifications
      : notifications.filter((n) =>
          (FILTER_MAP[filter] ?? []).includes(n.type),
        );

  // Agrupar por data
  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    const key = dateLabel(n.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  // ─── estados de loading / erro ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-5 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg mb-5 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 mb-2 animate-pulse"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-white/[0.06] rounded" />
                <div className="h-3 w-full bg-white/[0.04] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 max-w-2xl mx-auto text-center py-20">
        <div className="text-4xl mb-3 opacity-30">⚠️</div>
        <p className="text-[#9B9590] mb-4">Erro ao carregar notificações.</p>
        <button
          onClick={() => refetch()}
          className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-4xl tracking-wide flex items-center gap-3">
            NOTIFICAÇÕES
            {unreadCount > 0 && (
              <span className="bg-[#C9A84C] text-black text-sm font-bold px-2.5 py-0.5 rounded-full font-body tracking-normal">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-[#9B9590] text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors disabled:opacity-50"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTER_LABELS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              filter === f
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista vazia */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔔</div>
          <p className="text-[#5A5750]">
            {filter === "Todas"
              ? "Nenhuma notificação por enquanto"
              : "Nenhuma notificação nesta categoria"}
          </p>
        </div>
      )}

      {/* Lista agrupada por data */}
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-5">
          <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
            {date}
          </p>
          <div className="space-y-2">
            {items.map((notif) => {
              const t = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
              const action = resolveAction(notif);
              const detail = resolveDetail(notif);

              return (
                <div
                  key={notif.id}
                  className={`relative bg-[#111318] border ${
                    notif.is_read
                      ? "border-white/[0.06]"
                      : "border-[#C9A84C]/20"
                  } rounded-xl p-4 transition-all hover:border-white/15 group`}
                >
                  {/* Indicador não lido */}
                  {!notif.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C9A84C]" />
                  )}

                  <div className="flex gap-3">
                    {/* Ícone */}
                    <div
                      className={`w-10 h-10 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center text-lg flex-shrink-0`}
                    >
                      {t.icon}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p
                          className={`text-[13px] font-semibold ${
                            notif.is_read ? "text-[#9B9590]" : "text-[#F0EDE6]"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#5A5750] flex-shrink-0 mt-0.5">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5A5750] leading-relaxed mb-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3">
                        {detail && (
                          <span className={`text-xs font-semibold ${detail.cls}`}>
                            {detail.text}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            if (!notif.is_read) markRead.mutate(notif.id);
                            navigate(action.route);
                          }}
                          className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] transition-colors font-medium"
                        >
                          {action.label} →
                        </button>
                        <button
                          onClick={() => dismiss.mutate(notif.id)}
                          disabled={dismiss.isPending}
                          className="ml-auto text-[11px] text-[#3A3730] hover:text-[#5A5750] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                        >
                          Dispensar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Paginação (se necessário) */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-lg text-[13px] bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-30 transition-colors"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-[13px] text-[#5A5750]">
            {page} / {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
            className="px-4 py-1.5 rounded-lg text-[13px] bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6] disabled:opacity-30 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Preferências */}
      <div className="mt-6 bg-[#111318] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Preferências de notificação</p>
            <p className="text-[12px] text-[#5A5750] mt-0.5">
              Escolha o que deseja receber
            </p>
          </div>
          <button
            onClick={() => navigate("/account")}
            className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Configurar →
          </button>
        </div>
      </div>
    </div>
  );
}
