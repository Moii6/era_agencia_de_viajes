"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { listProviders, Provider } from "@/lib/providers";
import { Trip, TripInput } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const sectionTitleClass = "mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500";

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

type TripFormProps = {
  trip?: Trip;
  onSubmit: (input: TripInput) => Promise<unknown>;
  onCancel: () => void;
};

export function TripForm({ trip, onSubmit, onCancel }: TripFormProps) {
  const [name, setName] = useState(trip?.name ?? "");
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [departureDate, setDepartureDate] = useState(toDateInput(trip?.departureDate));
  const [departureTime, setDepartureTime] = useState(trip?.departureTime ?? "");
  const [departurePoint, setDeparturePoint] = useState(trip?.departurePoint ?? "");
  const [returnDate, setReturnDate] = useState(toDateInput(trip?.returnDate));
  const [returnTime, setReturnTime] = useState(trip?.returnTime ?? "");
  const [returnPoint, setReturnPoint] = useState(trip?.returnPoint ?? "");
  const [transportIncluded, setTransportIncluded] = useState(trip?.transportIncluded ?? true);
  const [transportNotes, setTransportNotes] = useState(trip?.transportNotes ?? "");
  const [lodgingIncluded, setLodgingIncluded] = useState(trip?.lodgingIncluded ?? true);
  const [hotelProviderId, setHotelProviderId] = useState(trip?.hotelProviderId ?? "");
  const [capacity, setCapacity] = useState(trip?.capacity?.toString() ?? "");
  const [minimumDepositAmount, setMinimumDepositAmount] = useState(trip?.minimumDepositAmount ?? "");
  const [notes, setNotes] = useState(trip?.notes ?? "");

  const [hotels, setHotels] = useState<Provider[] | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listProviders("HOTEL")
      .then(setHotels)
      .catch(() => setHotels([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        destination: destination || undefined,
        departureDate,
        departureTime: departureTime || undefined,
        departurePoint,
        returnDate,
        returnTime: returnTime || undefined,
        returnPoint,
        transportIncluded,
        transportNotes: transportNotes || undefined,
        lodgingIncluded,
        hotelProviderId: lodgingIncluded && hotelProviderId ? hotelProviderId : undefined,
        capacity: Number(capacity),
        minimumDepositAmount: Number(minimumDepositAmount),
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el viaje");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className={sectionTitleClass}>Datos generales</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Nombre del viaje *
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Vallarta Septiembre"
              required
              minLength={2}
            />
          </div>
          <div>
            <label htmlFor="destination" className={labelClass}>
              Destino
            </label>
            <input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={inputClass}
              placeholder="Puerto Vallarta"
            />
          </div>
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>Salida</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="departureDate" className={labelClass}>
              Fecha *
            </label>
            <input
              id="departureDate"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="departureTime" className={labelClass}>
              Hora
            </label>
            <input
              id="departureTime"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className={inputClass}
              placeholder="08:00"
            />
          </div>
          <div>
            <label htmlFor="departurePoint" className={labelClass}>
              Punto *
            </label>
            <input
              id="departurePoint"
              value={departurePoint}
              onChange={(e) => setDeparturePoint(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>Retorno</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="returnDate" className={labelClass}>
              Fecha *
            </label>
            <input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="returnTime" className={labelClass}>
              Hora
            </label>
            <input
              id="returnTime"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className={inputClass}
              placeholder="18:00"
            />
          </div>
          <div>
            <label htmlFor="returnPoint" className={labelClass}>
              Punto *
            </label>
            <input
              id="returnPoint"
              value={returnPoint}
              onChange={(e) => setReturnPoint(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>Transporte y hospedaje</p>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={transportIncluded}
              onChange={(e) => setTransportIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600 dark:border-slate-600 dark:accent-teal-500"
            />
            Transporte incluido
          </label>
          {transportIncluded ? (
            <input
              value={transportNotes}
              onChange={(e) => setTransportNotes(e.target.value)}
              className={inputClass}
              placeholder="Autobús ejecutivo"
            />
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={lodgingIncluded}
              onChange={(e) => setLodgingIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600 dark:border-slate-600 dark:accent-teal-500"
            />
            Hospedaje incluido
          </label>
          {lodgingIncluded ? (
            <div>
              <label htmlFor="hotelProviderId" className={labelClass}>
                Hotel
              </label>
              <select
                id="hotelProviderId"
                value={hotelProviderId}
                onChange={(e) => setHotelProviderId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin seleccionar</option>
                {(hotels ?? []).map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
              {hotels?.length === 0 ? (
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  No hay hoteles en el catálogo de proveedores todavía.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>Capacidad y anticipo</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className={labelClass}>
              Cupo máximo *
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="minimumDepositAmount" className={labelClass}>
              Anticipo mínimo (MXN) *
            </label>
            <input
              id="minimumDepositAmount"
              type="number"
              min={0}
              step="0.01"
              value={minimumDepositAmount}
              onChange={(e) => setMinimumDepositAmount(e.target.value)}
              className={inputClass}
              required
            />
          </div>
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
          rows={3}
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
