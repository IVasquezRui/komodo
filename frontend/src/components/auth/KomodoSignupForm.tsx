"use client";
import React, { useState } from "react";
import { z } from "zod";
import { IconEye, IconEyeOff, IconWifiOff, IconCheck } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KomodoButton } from "@/components/ui/KomodoButton";
import { registerAccount } from "@/api/client";
import type { AuthenticatedUser } from "@/components/layout/KomodoSidebar";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(2, "Ingresa tu nombre (mínimo 2 caracteres)."),
    lastName: z.string().trim().min(2, "Ingresa tu apellido (mínimo 2 caracteres)."),
    docPrefix: z.enum(["V", "E", "P"]),
    docNumber: z
      .string()
      .trim()
      .regex(/^\d{6,10}$/, "Cédula o pasaporte inválido (6 a 10 dígitos numéricos)."),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+58\s?(412|414|416|424|426)[- ]?\d{7}$/,
        "Usa formato venezolano válido: +58 412-1234567"
      ),
    email: z.string().trim().email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .regex(/[A-Za-z]/, "Debe incluir al menos una letra.")
      .regex(/\d/, "Debe incluir al menos un número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export interface KomodoSignupFormProps {
  onSuccess: (user: AuthenticatedUser, tokens: { accessToken: string; refreshToken: string }) => void;
  onSwitchToLogin?: () => void;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `kmd-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const KomodoSignupForm: React.FC<KomodoSignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [docPrefix, setDocPrefix] = useState<"V" | "E" | "P">("V");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("+58 412-");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [attemptKey] = useState<string>(() => generateIdempotencyKey());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    setIsOfflineError(false);

    const parsed = signupSchema.safeParse({
      firstName,
      lastName,
      docPrefix,
      docNumber,
      phone,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOfflineError(true);
      setSubmitError(
        "Sin conexión a internet. Conservamos tus datos ingresados para que reintentes al recuperar señal."
      );
      return;
    }

    setSubmitting(true);
    try {
      const cleanPhone = parsed.data.phone.replace(/\s+/g, "");
      const res = await registerAccount({
        full_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        phone_number: cleanPhone,
        email: parsed.data.email,
        password: parsed.data.password,
        doc_type: parsed.data.docPrefix,
        doc_number: parsed.data.docNumber,
        idempotency_key: attemptKey,
      });

      setSuccessMsg("Cuenta Komodo creada correctamente.");
      onSuccess(
        {
          id: res.user.id,
          fullName: res.user.full_name,
          email: res.user.email,
          phoneNumber: res.user.phone_number,
          role: res.user.role,
        },
        {
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
        }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo conectar con Komodo Core. Tus datos permanecen seguros.";
      if (
        message.toLowerCase().includes("fetch") ||
        message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("conexión")
      ) {
        setIsOfflineError(true);
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-violet-500/25 bg-[#15102B] p-6 md:p-8 shadow-komodo">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 px-3 py-1 text-[11px] font-bold text-violet-200 mb-3">
          Registro Seguro INTT
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Crea tu cuenta en Komodo
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">
          Compra rápida de pasajes interurbanos en Venezuela con respaldo offline y código QR verificado.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className={cn(
            "mb-5 rounded-xl border p-3.5 text-xs font-semibold flex items-start gap-2.5",
            isOfflineError
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-200"
          )}
        >
          {isOfflineError && <IconWifiOff className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />}
          <span>{submitError}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-200 flex items-center gap-2">
          <IconCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabelInputContainer>
            <Label htmlFor="komodo-firstname">Nombre</Label>
            <Input
              id="komodo-firstname"
              placeholder="María"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {fieldErrors.firstName && (
              <p className="text-[11px] font-medium text-rose-400">{fieldErrors.firstName}</p>
            )}
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="komodo-lastname">Apellido</Label>
            <Input
              id="komodo-lastname"
              placeholder="García"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {fieldErrors.lastName && (
              <p className="text-[11px] font-medium text-rose-400">{fieldErrors.lastName}</p>
            )}
          </LabelInputContainer>
        </div>

        {/* Cédula de Identidad / Documento */}
        <LabelInputContainer>
          <Label htmlFor="komodo-docnumber">Cédula de Identidad / Documento</Label>
          <div className="flex gap-2">
            <select
              aria-label="Tipo de documento"
              value={docPrefix}
              onChange={(e) => setDocPrefix(e.target.value as "V" | "E" | "P")}
              className="min-h-11 rounded-[10px] border border-violet-500/25 bg-[#191333] px-3 text-sm font-bold text-violet-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="V">V-</option>
              <option value="E">E-</option>
              <option value="P">P-</option>
            </select>
            <div className="flex-1">
              <Input
                id="komodo-docnumber"
                placeholder="21948572"
                inputMode="numeric"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>
          </div>
          {fieldErrors.docNumber && (
            <p className="text-[11px] font-medium text-rose-400">{fieldErrors.docNumber}</p>
          )}
        </LabelInputContainer>

        {/* Teléfono WhatsApp / Pago Móvil */}
        <LabelInputContainer>
          <Label htmlFor="komodo-phone">Teléfono (WhatsApp / Pago Móvil)</Label>
          <Input
            id="komodo-phone"
            placeholder="+58 412-1234567"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldErrors.phone && (
            <p className="text-[11px] font-medium text-rose-400">{fieldErrors.phone}</p>
          )}
        </LabelInputContainer>

        {/* Correo Electrónico */}
        <LabelInputContainer>
          <Label htmlFor="komodo-email">Correo Electrónico</Label>
          <Input
            id="komodo-email"
            placeholder="maria.garcia@correo.ve"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email && (
            <p className="text-[11px] font-medium text-rose-400">{fieldErrors.email}</p>
          )}
        </LabelInputContainer>

        {/* Contraseña & Confirmación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabelInputContainer>
            <Label htmlFor="komodo-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="komodo-password"
                placeholder="Mín. 8 caracteres"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] font-medium text-rose-400">{fieldErrors.password}</p>
            )}
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="komodo-confirm-password">Confirmar Contraseña</Label>
            <Input
              id="komodo-confirm-password"
              placeholder="Repite tu contraseña"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] font-medium text-rose-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </LabelInputContainer>
        </div>

        {/* Botón principal Komodo con BottomGradient */}
        <div className="pt-2">
          <KomodoButton
            type="submit"
            variant="primary"
            loading={submitting}
            className="group/btn relative w-full min-h-11"
          >
            <span>{submitting ? "Creando cuenta..." : "Crear cuenta en Komodo →"}</span>
            <BottomGradient />
          </KomodoButton>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent my-4" />

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-slate-300 hover:text-white transition"
          >
            ¿Ya tienes cuenta?{" "}
            <span className="font-bold text-[#10B981] hover:underline">Inicia sesión</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const BottomGradient: React.FC = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-8 -bottom-px mx-auto block h-px w-2/3 bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

export const LabelInputContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-1.5", className)}>
      {children}
    </div>
  );
};
