import { useNavigate } from "react-router-dom";
import { promotions } from "../data/mockData";

// Mapeia cada promoção para a rota de destino correta
const PROMO_ROUTES = {
  "promo-1": "/deposit", // Bônus de Boas-Vindas → ir para Depositar
  "promo-2": "/sports", // Freebet Semanal → ir para Esportes para apostar
  "promo-3": "/sports", // Odds Turbinadas → ir para Esportes
  "promo-4": "/history", // Cashback → ver Histórico para ativar
  "promo-5": "/sports", // Seguro de Aposta → ir para Esportes
  "promo-6": "/account", // Indicação → ir para Conta
};

export default function PromotionsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-5 max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide">PROMOÇÕES</h1>
        <p className="text-[#9B9590] text-sm mt-1">
          Aproveite nossas ofertas exclusivas e maximize seus ganhos
        </p>
      </div>

      {/* Featured promo — clica em Depositar */}
      <div className="relative bg-gradient-to-r from-[#111318] to-[#1E2330] border border-yellow-500/20 rounded-2xl p-6 mb-6 overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[100px] opacity-10 pointer-events-none">
          🎁
        </div>
        <span className="inline-block bg-[#C9A84C] text-black text-[11px] font-bold uppercase px-3 py-1 rounded-full mb-3">
          🔥 Mais Popular
        </span>
        <h2 className="font-display text-3xl tracking-wide mb-2">
          BÔNUS DE <span className="text-[#C9A84C]">BOAS-VINDAS</span>
        </h2>
        <p className="text-[#9B9590] text-sm mb-4 max-w-md">
          Faça seu primeiro depósito e receba 100% de bônus em apostas
          esportivas até R$ 500. Sem complicação.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/deposit")}
            className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Resgatar Agora
          </button>
          <span className="text-[12px] text-[#5A5750]">
            Sem prazo de expiração
          </span>
        </div>
      </div>

      {/* Casino promo banner */}
      <div className="relative bg-[#111318] border border-purple-500/20 rounded-2xl p-5 mb-6 overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] opacity-10 pointer-events-none">
          🎰
        </div>
        <span className="inline-block bg-purple-500/10 text-purple-400 text-[11px] font-bold uppercase px-3 py-1 rounded-full mb-3">
          ✨ Cassino
        </span>
        <h2 className="font-display text-2xl tracking-wide mb-1">
          200 FREE SPINS <span className="text-purple-400">NO CASSINO</span>
        </h2>
        <p className="text-[#9B9590] text-sm mb-4 max-w-md">
          Deposite R$ 100 ou mais e ganhe 200 giros grátis nos melhores slots.
          Válido para novos clientes.
        </p>
        <button
          onClick={() => navigate("/casino")}
          className="bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          Jogar no Cassino →
        </button>
      </div>

      {/* Promo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((p) => (
          <div
            key={p.id}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-5 hover:border-yellow-500/20 transition-all group cursor-pointer"
            onClick={() => navigate(PROMO_ROUTES[p.id] || "/")}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{p.icon}</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.badgeClass}`}
              >
                {p.badge}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] mb-2">{p.title}</h3>
            <p className="text-[13px] text-[#9B9590] leading-relaxed mb-4">
              {p.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#5A5750]">⏰ {p.expiry}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(PROMO_ROUTES[p.id] || "/");
                }}
                className="text-[13px] text-[#C9A84C] hover:text-[#F0D080] font-medium transition-colors group-hover:translate-x-0.5 transition-transform"
              >
                {p.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Terms */}
      <p className="text-[11px] text-[#5A5750] mt-6 leading-relaxed">
        * Todas as promoções estão sujeitas a termos e condições. Jogue com
        responsabilidade. Para maiores informações, consulte nossa política de
        bônus.
      </p>
    </div>
  );
}
