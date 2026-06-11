import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUserStats, useBalance, useUpdateProfile } from "../hooks/api/useUser";
import { useLogout } from "../hooks/api/useAuth";
import { useBets } from "../hooks/api/useBets";
import { getApiError } from "../services/api";

const TABS = ["Visão Geral", "Dados Pessoais", "Segurança"];
const LEVEL_ICONS = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎", diamond: "💎" };
const STATUS_STYLES = { won: "text-green-400 bg-green-400/10", lost: "text-red-400 bg-red-400/10", pending: "text-yellow-400 bg-yellow-400/10" };
const STATUS_LABELS = { won: "Ganhou", lost: "Perdeu", pending: "Em aberto" };

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: stats, isLoading: loadingStats } = useUserStats();
  const { data: balance } = useBalance();
  const { data: betsData } = useBets({ limit: 3 });
  const updateProfile = useUpdateProfile();
  const logout = useLogout();

  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [editMode, setEditMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const recentBets = betsData?.data?.slice(0, 3) ?? [];

  const handleStartEdit = () => {
    setEditForm({ name: profile?.name ?? "", phone: profile?.phone ?? "" });
    setEditMode(true);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(editForm, {
      onSuccess: () => {
        setEditMode(false);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      },
    });
  };

  if (loadingProfile || loadingStats) {
    return (
      <div className="p-5">
        <div className="h-40 bg-[#111318] rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#111318] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const fmt = (n) => n?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) ?? "0,00";
  const initials = profile?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="p-5 max-w-full mx-auto">
      {/* Profile Header */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1E2330] border-2 border-[#C9A84C]/30 flex items-center justify-center font-display text-2xl tracking-widest text-[#C9A84C]">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl tracking-wide">{profile?.name?.toUpperCase()}</h1>
            <p className="text-[#9B9590] text-sm">{profile?.email} · Membro desde {profile ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : ""}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {LEVEL_ICONS[profile?.level ?? "bronze"]} Nível {profile?.level ?? "bronze"}
              </span>
              {profile?.kyc_status === "verified" && (
                <span className="bg-green-400/10 text-green-400 text-[11px] px-2 py-0.5 rounded-full">✓ Verificado</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">Saldo disponível</p>
            <p className="font-display text-3xl text-[#C9A84C]">R$ {fmt(balance?.balance ?? profile?.balance)}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => navigate("/deposit")} className="bg-[#C9A84C] hover:bg-[#F0D080] text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Depositar</button>
              <button onClick={() => navigate("/withdraw")} className="bg-[#1E2330] hover:bg-[#252A38] text-[#F0EDE6] text-xs px-3 py-1.5 rounded-lg transition-colors border border-white/[0.06]">Sacar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px ${activeTab === tab ? "text-[#C9A84C] border-[#C9A84C]" : "text-[#5A5750] border-transparent hover:text-[#9B9590]"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Visão Geral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Apostado", value: `R$ ${fmt(stats?.totalStaked)}` },
              { label: "Total de Apostas", value: stats?.totalBets ?? 0 },
              { label: "Taxa de Acerto", value: `${stats?.winRate ?? 0}%`, positive: true },
              { label: "Lucro / Prejuízo", value: `R$ ${fmt(stats?.profitLoss)}`, positive: (stats?.profitLoss ?? 0) >= 0 },
            ].map((c, i) => (
              <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[11px] text-[#5A5750] uppercase tracking-wider mb-1">{c.label}</p>
                <p className={`text-xl font-semibold ${c.positive ? "text-green-400" : ""}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display text-lg tracking-wide">APOSTAS RECENTES</h2>
              <button onClick={() => navigate("/history")} className="text-[#C9A84C] text-xs hover:underline">Ver todas →</button>
            </div>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <div key={bet.id} onClick={() => navigate(`/history/${bet.id}`)}
                  className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-yellow-500/20 transition-all">
                  <div>
                    <p className="text-sm font-medium">{bet.selections?.[0]?.match_label ?? "Aposta"}</p>
                    <p className="text-xs text-[#5A5750]">{new Date(bet.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[bet.status] ?? ""}`}>{STATUS_LABELS[bet.status] ?? bet.status}</span>
                    <p className="text-sm font-semibold mt-1">R$ {bet.stake.toFixed(2).replace(".", ",")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Dados Pessoais" && (
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-4 max-w-lg">
          {updateSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400 text-sm">✅ Perfil atualizado com sucesso!</div>
          )}
          {updateProfile.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{getApiError(updateProfile.error)}</div>
          )}
          {[
            { label: "Nome completo", key: "name", value: editMode ? editForm.name : profile?.name ?? "" },
            { label: "E-mail", key: "email", value: profile?.email ?? "", disabled: true },
            { label: "Telefone", key: "phone", value: editMode ? editForm.phone : profile?.phone ?? "" },
          ].map(({ label, key, value, disabled }) => (
            <div key={key}>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">{label}</label>
              <input value={value} disabled={!editMode || disabled}
                onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] focus:outline-none focus:border-[#C9A84C]/40 disabled:opacity-50 transition-colors" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            {!editMode ? (
              <button onClick={handleStartEdit} className="bg-[#C9A84C] hover:bg-[#F0D080] text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">Editar Perfil</button>
            ) : (
              <>
                <button onClick={handleSaveProfile} disabled={updateProfile.isPending}
                  className="bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-60 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                  {updateProfile.isPending && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  Salvar
                </button>
                <button onClick={() => setEditMode(false)} className="bg-[#1E2330] border border-white/[0.06] text-[#9B9590] text-sm px-6 py-2.5 rounded-xl transition-colors">Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "Segurança" && (
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 max-w-lg">
          <h3 className="font-semibold text-[#F0EDE6] mb-4">Sessão atual</h3>
          <p className="text-sm text-[#9B9590] mb-6">Último acesso: {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString("pt-BR") : "Agora"}</p>
          <button onClick={() => logout.mutate()} disabled={logout.isPending}
            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2">
            {logout.isPending ? <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : null}
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}
