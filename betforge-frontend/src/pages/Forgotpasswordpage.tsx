import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STEPS = ["E-mail", "Código", "Nova Senha"];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);

  const validate = () => {
    const e = {};
    if (step === 0 && !email.includes("@")) e.email = "E-mail inválido";
    if (step === 1 && code.length < 6) e.code = "Digite os 6 dígitos";
    if (step === 2) {
      if (password.length < 8) e.password = "Mínimo 8 caracteres";
      if (password !== confirm) e.confirm = "Senhas não conferem";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step < 2) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep((s) => s + 1);
        if (step === 0) startResendTimer();
      }, 1000);
    } else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        navigate("/login");
      }, 1200);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };

  const inputCls = (key) =>
    `w-full bg-[#181C23] border ${errors[key] ? "border-red-500/40" : "border-white/[0.06]"} 
     rounded-xl px-4 py-3 text-sm text-[#F0EDE6] placeholder-[#5A5750] 
     focus:outline-none focus:border-[#C9A84C]/40 transition-colors`;

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/login"
            className="flex items-center gap-2 no-underline mb-1"
          >
            <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center text-black font-bold text-lg">
              B
            </div>
            <span className="font-display text-2xl tracking-[4px] text-[#C9A84C]">
              BETFORGE
            </span>
          </Link>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < step
                      ? "bg-green-500 text-white"
                      : i === step
                        ? "bg-[#C9A84C] text-black"
                        : "bg-[#1E2330] text-[#5A5750] border border-white/[0.06]"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 ${i === step ? "text-[#C9A84C]" : "text-[#5A5750]"}`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mb-4 ${i < step ? "bg-green-500/50" : "bg-white/[0.05]"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6">
          {/* Step 0 — E-mail */}
          {step === 0 && (
            <>
              <h1 className="font-display text-2xl tracking-wide mb-1">
                RECUPERAR SENHA
              </h1>
              <p className="text-[#9B9590] text-sm mb-5 leading-relaxed">
                Digite seu e-mail e enviaremos um código de verificação.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    E-mail cadastrado
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    className={inputCls("email")}
                    autoFocus
                  />
                  {errors.email && (
                    <p className="text-red-400 text-[11px] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 1 — Código */}
          {step === 1 && (
            <>
              <h1 className="font-display text-2xl tracking-wide mb-1">
                VERIFICAR CÓDIGO
              </h1>
              <div className="bg-[#181C23] border border-white/[0.06] rounded-xl p-4 mb-5 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">📧</span>
                <div>
                  <p className="text-[12px] text-[#9B9590]">
                    Código enviado para
                  </p>
                  <p className="text-sm font-semibold text-[#F0EDE6]">
                    {email}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setErrors({});
                    }}
                    className={
                      inputCls("code") +
                      " text-center text-2xl tracking-[14px] font-display"
                    }
                    autoFocus
                  />
                  {errors.code && (
                    <p className="text-red-400 text-[11px] mt-1">
                      {errors.code}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setLoading(false);
                      startResendTimer();
                    }, 800);
                  }}
                  className="text-[12px] w-full text-center transition-colors disabled:cursor-not-allowed"
                  style={{ color: resendCooldown > 0 ? "#5A5750" : "#C9A84C" }}
                >
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : "Reenviar código"}
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Nova senha */}
          {step === 2 && (
            <>
              <h1 className="font-display text-2xl tracking-wide mb-1">
                NOVA SENHA
              </h1>
              <p className="text-[#9B9590] text-sm mb-5">
                Crie uma senha forte com pelo menos 8 caracteres.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    className={inputCls("password")}
                    autoFocus
                  />
                  {/* Strength bar */}
                  <div className="flex gap-1 mt-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          password.length === 0
                            ? "bg-white/[0.06]"
                            : password.length < 6
                              ? i < 1
                                ? "bg-red-400"
                                : "bg-white/[0.06]"
                              : password.length < 8
                                ? i < 2
                                  ? "bg-yellow-400"
                                  : "bg-white/[0.06]"
                                : password.length < 12
                                  ? i < 3
                                    ? "bg-green-400"
                                    : "bg-white/[0.06]"
                                  : "bg-green-400"
                        }`}
                      />
                    ))}
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-[11px] mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setErrors({});
                    }}
                    className={inputCls("confirm")}
                  />
                  {errors.confirm && (
                    <p className="text-red-400 text-[11px] mt-1">
                      {errors.confirm}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <button
            onClick={next}
            disabled={loading}
            className="w-full bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-60 text-black font-semibold text-sm py-3 rounded-xl transition-colors mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Aguarde...
              </>
            ) : step === 2 ? (
              "Redefinir senha"
            ) : (
              "Continuar →"
            )}
          </button>
        </div>

        <p className="text-center text-sm text-[#5A5750] mt-5">
          Lembrou a senha?{" "}
          <Link
            to="/login"
            className="text-[#C9A84C] hover:text-[#F0D080] transition-colors no-underline font-medium"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
