"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { DepositInput } from "@/lib/reservations";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type DepositFormProps = {
  minimumInitialAmount: number;
  hasInitialDeposit: boolean;
  onSubmit: (input: DepositInput) => Promise<unknown>;
  onCancel: () => void;
};

export function DepositForm({ minimumInitialAmount, hasInitialDeposit, onSubmit, onCancel }: DepositFormProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isInitialDeposit, setIsInitialDeposit] = useState(!hasInitialDeposit);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        amount: Number(amount),
        date,
        isInitialDeposit: !hasInitialDeposit && isInitialDeposit,
        note: note || undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el anticipo");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hasInitialDeposit ? (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isInitialDeposit}
            onChange={(e) => setIsInitialDeposit(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600 dark:border-slate-600 dark:accent-teal-500"
          />
          Es el anticipo inicial (mínimo ${minimumInitialAmount} — confirma la reserva)
        </label>
      ) : null}

      <div>
        <label htmlFor="amount" className={labelClass}>
          Monto (MXN) *
        </label>
        <input
          id="amount"
          type="number"
          min={0.01}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>
          Fecha *
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="note" className={labelClass}>
          Nota
        </label>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} rows={2} />
      </div>

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
          disabled={isSaving}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          {isSaving ? "Guardando..." : "Registrar anticipo"}
        </button>
      </div>
    </form>
  );
}
