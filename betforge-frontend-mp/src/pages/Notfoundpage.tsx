import { Link, useNavigate } from "react-router-dom";

const QUICK_LINKS = [
  { to: "/", label: "Início", icon: "🏠" },
  { to: "/sports", label: "Esportes", icon: "⚽" },
  { to: "/live", label: "Ao Vivo", icon: "📡" },
  { to: "/promotions", label: "Promoções", icon: "🎁" },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#C9A84C]/[0.02] blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.03]" />
      </div>

      <div className="relative z-10 max-w-md">
        {/* 404 display */}
        <div className="relative mb-6">
          <span className="font-display text-[140px] leading-none tracking-wider text-[#1A1D25] select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-5xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="font-display text-3xl tracking-wide mb-3">
          PÁGINA NÃO ENCONTRADA
        </h1>
        <p className="text-[#9B9590] text-sm leading-relaxed mb-8">
          Parece que essa jogada não foi bem. A página que você está buscando
          não existe ou foi movida. Mas não se preocupe — temos muito mais para
          você!
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            ← Voltar
          </button>
          <Link
            to="/"
            className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors no-underline"
          >
            Ir para o Início
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-white/[0.05] pt-6">
          <p className="text-[11px] text-[#5A5750] uppercase tracking-widest mb-4">
            Ir para
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center gap-2 bg-[#111318] border border-white/[0.06] hover:border-yellow-500/20 rounded-xl p-3 transition-all no-underline group"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-[12px] text-[#9B9590] group-hover:text-[#F0EDE6] transition-colors font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Support link */}
        <p className="text-[12px] text-[#5A5750] mt-8">
          Precisa de ajuda?{" "}
          <span className="text-[#C9A84C] hover:text-[#F0D080] cursor-pointer transition-colors">
            Fale com o suporte
          </span>
        </p>
      </div>
    </div>
  );
}
