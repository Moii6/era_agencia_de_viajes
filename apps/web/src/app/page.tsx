"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { setSession } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@agenciadeprueba.mx");
  const [password, setPassword] = useState("changeme123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? "Credenciales inválidas");
      }

      setSession(data.accessToken, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
        <section className="flex flex-col justify-between bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 p-8 text-white lg:p-12">
          <div>
            <div className="mb-8 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-50">
              Travify
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Haz que cada viaje cobre sentido.</h1>
            <p className="mt-4 max-w-md text-sm text-teal-50/90">
              Centraliza el CRM, la operación del viaje y la administración del negocio desde un único panel.
            </p>
          </div>

          <div className="mt-10 space-y-3 text-sm text-teal-50/90">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-200" />
              Control de clientes y seguimiento
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-200" />
              Cotizaciones y reservas conectadas
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-200" />
              Autenticación segura por tenant y rol
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-600">Iniciar sesión</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Bienvenido a Travify</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                  placeholder="tu@agencia.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Iniciando sesión..." : "Entrar"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Credenciales de prueba</p>
              <p className="mt-1">Email: owner@agenciadeprueba.mx</p>
              <p>Password: changeme123</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
