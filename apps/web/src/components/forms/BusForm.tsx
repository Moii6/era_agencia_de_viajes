"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { listProviders, Provider } from "@/lib/providers";
import { Bus, BusInput } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type BusFormProps = {
  bus?: Bus;
  onSubmit: (input: BusInput) => Promise<unknown>;
  onCancel: () => void;
};

export function BusForm({ bus, onSubmit, onCancel }: BusFormProps) {
  const toast = useToast();
  const [label, setLabel] = useState(bus?.label ?? "");
  const [providerId, setProviderId] = useState(bus?.providerId ?? "");
  const [seatCapacity, setSeatCapacity] = useState(bus?.seatCapacity?.toString() ?? "");
  const [plateOrUnitNumber, setPlateOrUnitNumber] = useState(bus?.plateOrUnitNumber ?? "");
  const [driverName, setDriverName] = useState(bus?.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(bus?.driverPhone ?? "");
  const [notes, setNotes] = useState(bus?.notes ?? "");

  const [transporters, setTransporters] = useState<Provider[] | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listProviders("TRANSPORT")
      .then(setTransporters)
      .catch(() => setTransporters([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        label,
        providerId: providerId || undefined,
        seatCapacity: Number(seatCapacity),
        plateOrUnitNumber: plateOrUnitNumber || undefined,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar el autobús";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="label" className={labelClass}>
            Etiqueta *
          </label>
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            placeholder="Autobús 1"
            required
          />
        </div>
        <div>
          <label htmlFor="seatCapacity" className={labelClass}>
            Asientos *
          </label>
          <input
            id="seatCapacity"
            type="number"
            min={1}
            value={seatCapacity}
            onChange={(e) => setSeatCapacity(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="providerId" className={labelClass}>
          Transportista
        </label>
        <select
          id="providerId"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className={inputClass}
        >
          <option value="">Sin seleccionar</option>
          {(transporters ?? []).map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="plateOrUnitNumber" className={labelClass}>
          Placa / número de unidad
        </label>
        <input
          id="plateOrUnitNumber"
          value={plateOrUnitNumber}
          onChange={(e) => setPlateOrUnitNumber(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="driverName" className={labelClass}>
            Chofer
          </label>
          <input
            id="driverName"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="driverPhone" className={labelClass}>
            Teléfono del chofer
          </label>
          <input
            id="driverPhone"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          rows={2}
        />
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
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
