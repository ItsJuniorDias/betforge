import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogin, getApiError } from "../hooks/api/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  const login = useLogin();
  const error = login.error ? getApiError(login.error) : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) return;

    login.mutate(form, { onSuccess: () => navigate("/", { replace: true }) });
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A84C]/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#C9A84C] rounded-xl flex items-center justify-center text-black font-bold text-xl mb-3">
            B
          </div>
          <span className="font-display text-3xl tracking-[4px] text-[#C9A84C]">
            BETFORGE
          </span>
          <p className="text-[#5A5750] text-sm mt-1">
            Sua plataforma de apostas
          </p>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6">
          <h1 className="font-display text-2xl tracking-wide mb-5">ENTRAR</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-[#5A5750] uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-[11px] text-[#C9A84C] hover:text-[#F0D080] transition-colors"
                  onClick={() => navigate("/forgot-password")}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full bg-[#181C23] border border-white/[0.06] rounded-xl px-4 py-2.5 pr-10 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5750] hover:text-[#9B9590] transition-colors text-base"
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold text-sm py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {login.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#5A5750] mt-5">
          Não tem uma conta?{" "}
          <Link
            to="/register"
            className="text-[#C9A84C] hover:text-[#F0D080] transition-colors font-medium no-underline"
          >
            Cadastre-se grátis
          </Link>
        </p>
        <p className="text-center text-[10px] text-[#3A3730] mt-4 leading-relaxed">
          Jogue com responsabilidade. Apostas envolvem risco.
          <br />
          Proibido para menores de 18 anos.
        </p>
      </div>
    </div>
  );
}
