import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister, getApiError } from "../hooks/api/useAuth";

const STEPS = ["Dados Pessoais", "Acesso", "Verificação"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    name: "", cpf: "", birthdate: "", phone: "",
    email: "", password: "", confirmPassword: "", code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useRegister();
  const apiError = register.error ? getApiError(register.error) : "";

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validateStep = () => {
    const err: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) err.name = "Informe seu nome completo";
      if (!form.cpf.trim()) err.cpf = "Informe seu CPF";
      if (!form.birthdate) err.birthdate = "Informe sua data de nascimento";
      if (!form.phone.trim()) err.phone = "Informe seu telefone";
    }
    if (step === 1) {
      if (!form.email.trim()) err.email = "Informe seu e-mail";
      if (!form.password) err.password = "Crie uma senha";
      else if (form.password.length < 8) err.password = "Mínimo 8 caracteres";
      else if (!/[A-Z]/.test(form.password)) err.password = "Precisa de ao menos uma maiúscula";
      else if (!/[0-9]/.test(form.password)) err.password = "Precisa de ao menos um número";
      if (form.password !== form.confirmPassword) err.confirmPassword = "Senhas não conferem";
      if (!agreed) err.agreed = "Aceite os termos para continuar";
    }
    if (step === 2) {
      if (!form.code || form.code.length < 6) err.code = "Digite o código de 6 dígitos";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 1) { setStep((s) => s + 1); return; }
    if (step === 1) { setStep(2); return; }
    // step 2 — submeter
    register.mutate({
      name: form.name,
      email: form.email,
      cpf: form.cpf,
      phone: form.phone,
      birthdate: form.birthdate,
      password: form.password,
    }, { onSuccess: () => navigate("/") });
  };

  const inputCls = (key: string) =>
    `w-full bg-[#181C23] border ${errors[key] ? "border-red-500/40" : "border-white/[0.06]"} rounded-xl px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#5A5750] focus:outline-none focus:border-[#C9A84C]/40 transition-colors`;

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[11px] text-[#5A5750] uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#C9A84C] rounded-xl flex items-center justify-center text-black font-bold text-xl mb-3">B</div>
          <span className="font-display text-3xl tracking-[4px] text-[#C9A84C]">BETFORGE</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${i < step ? "bg-green-500 text-white" : i === step ? "bg-[#C9A84C] text-black" : "bg-[#1E2330] text-[#5A5750] border border-white/[0.06]"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${i === step ? "text-[#C9A84C]" : "text-[#5A5750]"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 mb-4 transition-all ${i < step ? "bg-green-500/50" : "bg-white/[0.05]"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6">
          <h1 className="font-display text-2xl tracking-wide mb-5">
            {step === 0 && "DADOS PESSOAIS"}{step === 1 && "CRIAR ACESSO"}{step === 2 && "VERIFICAÇÃO"}
          </h1>

          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <Field label="Nome completo" error={errors.name}>
                <input type="text" placeholder="João da Silva" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls("name")} />
              </Field>
              <Field label="CPF" error={errors.cpf}>
                <input type="text" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} className={inputCls("cpf")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nascimento" error={errors.birthdate}>
                  <input type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} className={inputCls("birthdate") + " [color-scheme:dark]"} />
                </Field>
                <Field label="Telefone" error={errors.phone}>
                  <input type="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls("phone")} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="E-mail" error={errors.email}>
                <input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls("email")} />
              </Field>
              <Field label="Senha" error={errors.password}>
                <input type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls("password")} />
                <div className="flex gap-1 mt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${form.password.length === 0 ? "bg-white/[0.06]" : form.password.length < 6 ? i < 1 ? "bg-red-400" : "bg-white/[0.06]" : form.password.length < 8 ? i < 2 ? "bg-yellow-400" : "bg-white/[0.06]" : form.password.length < 12 ? i < 3 ? "bg-green-400" : "bg-white/[0.06]" : "bg-green-400"}`} />
                  ))}
                </div>
              </Field>
              <Field label="Confirmar senha" error={errors.confirmPassword}>
                <input type="password" placeholder="Repita a senha" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className={inputCls("confirmPassword")} />
              </Field>
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <button type="button" onClick={() => { setAgreed((v) => !v); setErrors((e) => { const n = { ...e }; delete n.agreed; return n; }); }}
                    className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-all mt-0.5 ${agreed ? "bg-[#C9A84C] border-[#C9A84C] text-black text-xs" : "border-white/[0.15] bg-[#181C23]"}`}>
                    {agreed && "✓"}
                  </button>
                  <span className="text-[12px] text-[#9B9590] leading-relaxed">Li e aceito os <span className="text-[#C9A84C]">Termos de Uso</span> e a <span className="text-[#C9A84C]">Política de Privacidade</span></span>
                </label>
                {errors.agreed && <p className="text-red-400 text-[11px] mt-1 ml-8">{errors.agreed}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-[#181C23] border border-white/[0.06] rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm text-[#9B9590]">Criando sua conta...</p>
                <p className="text-sm font-semibold text-[#F0EDE6] mt-0.5">{form.email}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="flex-1 bg-[#181C23] border border-white/[0.06] hover:border-white/20 text-[#9B9590] hover:text-[#F0EDE6] text-sm py-2.5 rounded-xl transition-all">
                ← Voltar
              </button>
            )}
            <button onClick={handleNext} disabled={register.isPending}
              className="flex-1 bg-[#C9A84C] hover:bg-[#F0D080] disabled:opacity-60 text-black font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              {register.isPending ? (
                <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Criando...</>
              ) : step === 2 ? "Confirmar →" : "Continuar →"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#5A5750] mt-5">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-[#C9A84C] hover:text-[#F0D080] transition-colors font-medium no-underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
