import { useState } from "react";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: "🎰" },
  { id: "slots", label: "Slots", icon: "🎡" },
  { id: "live", label: "Ao Vivo", icon: "📡" },
  { id: "table", label: "Mesas", icon: "🃏" },
  { id: "crash", label: "Crash", icon: "🚀" },
  { id: "jackpot", label: "Jackpot", icon: "💎" },
];

const PROVIDERS = [
  "Todos",
  "Pragmatic",
  "Evolution",
  "NetEnt",
  "Microgaming",
  "Playtech",
];

const GAMES = [
  {
    id: 1,
    name: "Gates of Olympus",
    provider: "Pragmatic",
    cat: "slots",
    rtp: "96.5%",
    hot: true,
    new: false,
    emoji: "⚡",
    players: 1423,
  },
  {
    id: 2,
    name: "Sweet Bonanza",
    provider: "Pragmatic",
    cat: "slots",
    rtp: "96.5%",
    hot: true,
    new: false,
    emoji: "🍭",
    players: 987,
  },
  {
    id: 3,
    name: "Lightning Roulette",
    provider: "Evolution",
    cat: "live",
    rtp: "97.3%",
    hot: false,
    new: false,
    emoji: "⚡",
    players: 542,
  },
  {
    id: 4,
    name: "Crazy Time",
    provider: "Evolution",
    cat: "live",
    rtp: "96.1%",
    hot: true,
    new: false,
    emoji: "🎡",
    players: 2140,
  },
  {
    id: 5,
    name: "Aviator",
    provider: "Spribe",
    cat: "crash",
    rtp: "97.0%",
    hot: true,
    new: false,
    emoji: "✈️",
    players: 3201,
  },
  {
    id: 6,
    name: "JetX",
    provider: "SmartSoft",
    cat: "crash",
    rtp: "97.0%",
    hot: false,
    new: true,
    emoji: "🚀",
    players: 876,
  },
  {
    id: 7,
    name: "Blackjack VIP",
    provider: "Evolution",
    cat: "table",
    rtp: "99.5%",
    hot: false,
    new: false,
    emoji: "🂱",
    players: 214,
  },
  {
    id: 8,
    name: "Book of Dead",
    provider: "Play'n GO",
    cat: "slots",
    rtp: "96.2%",
    hot: false,
    new: false,
    emoji: "📖",
    players: 564,
  },
  {
    id: 9,
    name: "Mega Moolah",
    provider: "Microgaming",
    cat: "jackpot",
    rtp: "88.1%",
    hot: false,
    new: false,
    emoji: "🦁",
    players: 1102,
  },
  {
    id: 10,
    name: "Mega Fortune",
    provider: "NetEnt",
    cat: "jackpot",
    rtp: "96.6%",
    hot: false,
    new: true,
    emoji: "💰",
    players: 453,
  },
  {
    id: 11,
    name: "Dragon Tiger",
    provider: "Pragmatic",
    cat: "live",
    rtp: "96.7%",
    hot: false,
    new: true,
    emoji: "🐉",
    players: 388,
  },
  {
    id: 12,
    name: "Starburst",
    provider: "NetEnt",
    cat: "slots",
    rtp: "96.1%",
    hot: false,
    new: false,
    emoji: "⭐",
    players: 791,
  },
];

const JACKPOTS = [
  { name: "Mega Moolah", amount: "R$ 18.450.234,00", provider: "Microgaming" },
  { name: "Mega Fortune", amount: "R$ 4.832.100,00", provider: "NetEnt" },
  { name: "Divine Fortune", amount: "R$ 892.440,00", provider: "NetEnt" },
];

export default function CasinoPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeProvider, setActiveProvider] = useState("Todos");
  const [search, setSearch] = useState("");
  const [hoveredGame, setHoveredGame] = useState(null);

  const filtered = GAMES.filter((g) => {
    const matchCat = activeCategory === "all" || g.cat === activeCategory;
    const matchProv =
      activeProvider === "Todos" || g.provider === activeProvider;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchProv && matchSearch;
  });

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl tracking-wide flex items-center gap-3">
            🎰 CASSINO
          </h1>
          <p className="text-[#9B9590] text-sm mt-1">
            {GAMES.length} jogos disponíveis · Novos jogos toda semana
          </p>
        </div>
      </div>

      {/* Jackpot ticker */}
      <div className="bg-gradient-to-r from-[#1E1508] via-[#1A1710] to-[#1E1508] border border-[#C9A84C]/20 rounded-xl px-4 py-3 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C]">
            💎 Jackpots Progressivos
          </span>
        </div>
        <div className="flex items-center gap-6">
          {JACKPOTS.map((j, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0">
              {i > 0 && <div className="w-px h-8 bg-[#C9A84C]/10" />}
              <div>
                <p className="text-[10px] text-[#5A5750]">{j.name}</p>
                <p className="font-display text-lg text-[#C9A84C] tracking-wide leading-tight">
                  {j.amount}
                </p>
              </div>
            </div>
          ))}
          <div className="flex-1 min-w-4" />
          <button className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-xs font-bold px-4 py-1.5 rounded-lg flex-shrink-0 transition-colors">
            Jogar Jackpots
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? "bg-[#C9A84C] text-black"
                : "bg-[#111318] border border-white/[0.06] text-[#9B9590] hover:text-[#F0EDE6]"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Provider + Search row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeProvider === p
                  ? "bg-[#1E2330] text-[#C9A84C] border border-[#C9A84C]/30"
                  : "bg-[#111318] border border-white/[0.06] text-[#5A5750] hover:text-[#9B9590]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <input
            type="text"
            placeholder="🔍 Buscar jogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111318] border border-white/[0.06] rounded-xl pl-4 pr-3 py-2 text-[13px] text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/30 transition-colors w-48"
          />
        </div>
      </div>

      {/* Games grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((game) => (
            <div
              key={game.id}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              className="relative bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden cursor-pointer hover:border-yellow-500/30 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Game visual */}
              <div className="h-28 bg-[#181C23] flex items-center justify-center text-5xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111318]/60" />
                <span className="relative z-10">{game.emoji}</span>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {game.hot && (
                    <span className="text-[9px] font-bold uppercase bg-red-500/80 text-white px-1.5 py-0.5 rounded-full">
                      🔥 Hot
                    </span>
                  )}
                  {game.new && (
                    <span className="text-[9px] font-bold uppercase bg-[#C9A84C]/80 text-black px-1.5 py-0.5 rounded-full">
                      Novo
                    </span>
                  )}
                </div>

                {/* Hover overlay */}
                {hoveredGame === game.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <button className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                      Jogar ▶
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-[12px] font-semibold text-[#F0EDE6] truncate leading-tight">
                  {game.name}
                </p>
                <p className="text-[10px] text-[#5A5750] mt-0.5">
                  {game.provider}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#C9A84C]">
                    RTP {game.rtp}
                  </span>
                  <span className="text-[10px] text-[#5A5750]">
                    👥 {game.players.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🎰</div>
          <p className="text-[#5A5750]">Nenhum jogo encontrado</p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("all");
              setActiveProvider("Todos");
            }}
            className="mt-3 text-sm text-[#C9A84C] hover:text-[#F0D080] transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Load more */}
      {filtered.length > 0 && (
        <div className="text-center mt-8">
          <button className="bg-[#111318] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm px-8 py-3 rounded-xl transition-all">
            Carregar mais jogos
          </button>
        </div>
      )}

      {/* Responsible gaming footer */}
      <div className="mt-8 bg-[#111318] border border-white/[0.06] rounded-xl px-5 py-4 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-[12px] font-semibold text-[#9B9590] mb-0.5">
            Jogo Responsável
          </p>
          <p className="text-[11px] text-[#5A5750] leading-relaxed">
            Jogos de cassino devem ser uma forma de entretenimento. Jogue dentro
            de seus limites. Se sentir dificuldades em controlar seus gastos,
            utilize nossas ferramentas de autoexclusão ou busque ajuda
            profissional. Proibido para menores de 18 anos.
          </p>
        </div>
      </div>
    </div>
  );
}
