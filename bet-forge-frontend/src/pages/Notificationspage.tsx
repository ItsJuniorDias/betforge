import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "won",
    title: "Aposta Ganha! 🎉",
    body: "Flamengo vs Palmeiras — sua aposta em Flamengo foi premiada.",
    detail: "+ R$ 55,00",
    detailCls: "text-green-400",
    time: "Há 2 horas",
    date: "Hoje",
    read: false,
    action: { label: "Ver comprovante", route: "/history/bh-1" },
  },
  {
    id: "n2",
    type: "deposit",
    title: "Depósito confirmado",
    body: "Seu depósito via Pix de R$ 200,00 foi processado com sucesso.",
    detail: "+ R$ 200,00",
    detailCls: "text-green-400",
    time: "Há 5 horas",
    date: "Hoje",
    read: false,
    action: { label: "Ver saldo", route: "/account" },
  },
  {
    id: "n3",
    type: "promo",
    title: "Freebet disponível 🎁",
    body: "Você ganhou R$ 20,00 em freebets por atingir a meta semanal.",
    detail: "R$ 20 freebet",
    detailCls: "text-[#C9A84C]",
    time: "Há 1 dia",
    date: "Ontem",
    read: false,
    action: { label: "Usar agora", route: "/promotions" },
  },
  {
    id: "n4",
    type: "lost",
    title: "Resultado da sua aposta",
    body: "Man City vs Arsenal — sua múltipla não foi premiada desta vez.",
    detail: "- R$ 30,00",
    detailCls: "text-red-400",
    time: "Há 2 dias",
    date: "Ontem",
    read: true,
    action: { label: "Ver histórico", route: "/history" },
  },
  {
    id: "n5",
    type: "withdraw",
    title: "Saque aprovado ✅",
    body: "Seu saque de R$ 300,00 via Pix foi processado.",
    detail: "- R$ 300,00",
    detailCls: "text-[#9B9590]",
    time: "Há 3 dias",
    date: "28/05/2026",
    read: true,
    action: { label: "Ver extrato", route: "/history" },
  },
  {
    id: "n6",
    type: "promo",
    title: "Odds turbinadas — Champions",
    body: "Hoje tem odds especiais para os jogos da Champions League. Aproveite!",
    detail: "Expira hoje",
    detailCls: "text-yellow-400",
    time: "Há 4 dias",
    date: "27/05/2026",
    read: true,
    action: { label: "Ver jogos", route: "/sports" },
  },
  {
    id: "n7",
    type: "security",
    title: "Novo acesso detectado",
    body: "Login realizado de São Paulo, SP • Chrome / Mac. Se não foi você, altere sua senha.",
    detail: null,
    detailCls: "",
    time: "Há 5 dias",
    date: "26/05/2026",
    read: true,
    action: { label: "Verificar conta", route: "/account" },
  },
  {
    id: "n8",
    type: "pending",
    title: "Aposta em andamento ⏳",
    body: "Lakers vs Celtics ainda está em aberto. Resultado em breve.",
    detail: "R$ 100 apostado",
    detailCls: "text-yellow-400",
    time: "Há 3 dias",
    date: "28/05/2026",
    read: true,
    action: { label: "Ver aposta", route: "/history/bh-3" },
  },
];

const TYPE_ICONS = {
  won: { icon: "🏆", bg: "bg-green-500/10", border: "border-green-500/20" },
  lost: { icon: "❌", bg: "bg-red-500/10", border: "border-red-500/15" },
  deposit: { icon: "💰", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/20" },
  withdraw: { icon: "🏦", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  promo: { icon: "🎁", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  security: {
    icon: "🔐",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  pending: {
    icon: "⏳",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
};

const FILTERS = ["Todas", "Apostas", "Financeiro", "Promoções", "Segurança"];
const FILTER_MAP = {
  Apostas: ["won", "lost", "pending"],
  Financeiro: ["deposit", "withdraw"],
  Promoções: ["promo"],
  Segurança: ["security"],
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState("Todas");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const filtered =
    filter === "Todas"
      ? notifications
      : notifications.filter((n) =>
          (FILTER_MAP[filter] || []).includes(n.type),
        );

  // Agrupar por data
  const grouped = filtered.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = [];
    acc[n.date].push(n);
    return acc;
  }, {});

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
            onClick={markAllRead}
            className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
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

      {/* Lista agrupada */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔔</div>
          <p className="text-[#5A5750]">Nenhuma notificação nesta categoria</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-5">
          <p className="text-[11px] font-semibold text-[#5A5750] uppercase tracking-widest mb-3">
            {date}
          </p>
          <div className="space-y-2">
            {items.map((notif) => {
              const t = TYPE_ICONS[notif.type] || TYPE_ICONS.promo;
              return (
                <div
                  key={notif.id}
                  className={`relative bg-[#111318] border ${notif.read ? "border-white/[0.06]" : "border-[#C9A84C]/20"} 
                    rounded-xl p-4 transition-all hover:border-white/15 group`}
                >
                  {/* Indicador não lido */}
                  {!notif.read && (
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
                          className={`text-[13px] font-semibold ${notif.read ? "text-[#9B9590]" : "text-[#F0EDE6]"}`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#5A5750] flex-shrink-0 mt-0.5">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5A5750] leading-relaxed mb-2">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-3">
                        {notif.detail && (
                          <span
                            className={`text-xs font-semibold ${notif.detailCls}`}
                          >
                            {notif.detail}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            markRead(notif.id);
                            navigate(notif.action.route);
                          }}
                          className="text-[12px] text-[#C9A84C] hover:text-[#F0D080] transition-colors font-medium"
                        >
                          {notif.action.label} →
                        </button>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="ml-auto text-[11px] text-[#3A3730] hover:text-[#5A5750] transition-colors opacity-0 group-hover:opacity-100"
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
