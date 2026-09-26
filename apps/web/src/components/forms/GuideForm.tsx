"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { TripGuideInput } from "@/lib/trips";
import { AgencyUser, listUsers } from "@/lib/users";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type GuideFormProps = {
  // Users already assigned as guides on this trip — excluded from the
  // picker so a duplicate assignment can't even be attempted from the UI.
  existingUserIds: string[];
  onSubmit: (input: TripGuideInput) => Promise<unknown>;
  onCancel: () => void;
};

export function GuideForm({ existingUserIds, onSubmit, onCancel }: GuideFormProps) {
  const toast = useToast();
  const [candidates, setCandidates] = useState<AgencyUser[] | null>(null);
  const [userId, setUserId] = useState("");
  const [isLead, setIsLead] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listUsers()
      .then((users) =>
        setCandidates(
          users.filter(
            (u) => u.role === "GUIDE" && u.status === "ACTIVE" && !existingUserIds.includes(u.id),
          ),
        ),
      )
      .catch(() => setCandidates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({ userId, isLead });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo agregar al guía";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="userId" className={labelClass}>
          Guía *
        </label>
        {candidates === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No hay usuarios con rol Guía disponibles para asignar.
          </p>
        ) : (
          <select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Selecciona un guía
            </option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={isLead}
          onChange={(e) => setIsLead(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600 dark:border-slate-600 dark:accent-teal-500"
        />
        Es el guía líder
      </label>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
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
          disabled={isSaving || !userId}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          {isSaving ? "Guardando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}
