"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatDate, todayUTCDateOnly, toUTCDateOnly } from "@/lib/formats";
import { listTrips, Trip } from "@/lib/trips";

function TripCard({ label, trip, emptyMessage }: { label: string; trip: Trip | null; emptyMessage: string }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{label}</p>
      {trip ? (
        <button onClick={() => router.push(`/viajes/${trip.id}`)} className="mt-3 block w-full text-left">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{trip.name}</p>
            <Badge value={trip.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {trip.destination ?? "Sin destino especificado"}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
          </p>
        </button>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  const today = todayUTCDateOnly();
  // Only PUBLISHED trips count as "in progress" or "upcoming" — a DRAFT
  // trip isn't a real operational commitment yet, regardless of its dates.
  const activeTrips = (trips ?? []).filter((t) => t.status === "PUBLISHED");

  const ongoingTrip =
    activeTrips
      .filter((t) => toUTCDateOnly(t.departureDate) <= today && today <= toUTCDateOnly(t.returnDate))
      .sort((a, b) => toUTCDateOnly(a.departureDate) - toUTCDateOnly(b.departureDate))[0] ?? null;

  const upcomingTrip = ongoingTrip
    ? null
    : activeTrips
        .filter((t) => toUTCDateOnly(t.departureDate) > today)
        .sort((a, b) => toUTCDateOnly(a.departureDate) - toUTCDateOnly(b.departureDate))[0] ?? null;

  const latestCreatedTrip =
    (trips ?? []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
    null;

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Bienvenido</h1>

      {trips === null ? (
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">Cargando viajes...</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <TripCard
            label={ongoingTrip ? "Viaje en curso" : "Próximo viaje"}
            trip={ongoingTrip ?? upcomingTrip}
            emptyMessage="No hay viajes en curso ni próximos todavía."
          />
          <TripCard label="Último viaje creado" trip={latestCreatedTrip} emptyMessage="Todavía no se ha creado ningún viaje." />
        </div>
      )}
    </div>
  );
}
