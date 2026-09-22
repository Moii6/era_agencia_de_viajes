"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getPublicTenant, PublicTenant, registerForTenant } from "@/lib/registration";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function RegistroPage() {
  const params = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [tenantError, setTenantError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getPublicTenant(params.slug)
      .then(setTenant)
      .catch((err) => setTenantError(err instanceof ApiError ? err.message : "No se pudo cargar la agencia"));
  }, [params.slug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await registerForTenant(params.slug, { name, email, password });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar el registro");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
        <section className="flex flex-col justify-between bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 p-8 text-white lg:p-12">
          <div>
            <div className="mb-8 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-50">
              Travify
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Súmate al equipo.</h1>
            <p className="mt-4 max-w-md text-sm text-teal-50/90">
              {tenant
                ? `Solicita tu acceso a ${tenant.name}. Un OWNER debe aprobar tu registro antes de que puedas iniciar sesión.`
                : "Solicita tu acceso a la agencia. Un OWNER debe aprobar tu registro antes de que puedas iniciar sesión."}
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-8 lg:p-12 dark:bg-slate-900">
          <div className="w-full max-w-md">
            {tenantError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
                {tenantError}
              </div>
            ) : submitted ? (
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
                  Registro enviado
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Ya casi está listo
                </h2>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Tu solicitud quedó pendiente de aprobación. En cuanto un OWNER de{" "}
                  {tenant?.name ?? "la agencia"} la apruebe, podrás iniciar sesión con el correo y la
                  contraseña que registraste.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Ir a iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
                    Registro
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    {tenant ? `Únete a ${tenant.name}` : "Cargando..."}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Nombre completo
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      required
                      minLength={2}
                      disabled={!tenant}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="tu@correo.com"
                      required
                      disabled={!tenant}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      disabled={!tenant}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                      Confirmar contraseña
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      required
                      minLength={8}
                      disabled={!tenant}
                    />
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading || !tenant}
                    className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
                  >
                    {isLoading ? "Enviando..." : "Solicitar acceso"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
                    Inicia sesión
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
