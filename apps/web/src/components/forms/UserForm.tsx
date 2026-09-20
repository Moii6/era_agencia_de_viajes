"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { UserInput, UserRole } from "@/lib/users";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "AGENT", label: "Agente" },
  { value: "GUIDE", label: "Guía" },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type UserFormProps = {
  onSubmit: (input: UserInput) => Promise<unknown>;
  onCancel: () => void;
};

export function UserForm({ onSubmit, onCancel }: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("AGENT");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({ name, email, password, role });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el usuario");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre *
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
          minLength={2}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Contraseña *
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
        />
      </div>

      <div>
        <label htmlFor="role" className={labelClass}>
          Rol *
        </label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          {isSaving ? "Guardando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
