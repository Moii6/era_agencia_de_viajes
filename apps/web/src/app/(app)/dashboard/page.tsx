"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { getUser, SessionUser } from "@/lib/auth";
import { formatDate, todayUTCDateOnly, toUTCDateOnly } from "@/lib/formats";
import { listTrips, Trip } from "@/lib/trips";

function TripCard({ label, trip, emptyMessage }: { label: string; trip: Trip | null; emptyMessage: string }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
      {trip ? (
        <button onClick={() => router.push(`/viajes/${trip.id}`)} className="mt-3 block w-full text-left">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-slate-900">{trip.name}</p>
            <Badge value={trip.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{trip.destination ?? "Sin destino especificado"}</p>
          <p className="mt-2 text-sm text-slate-700">
            {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
          </p>
        </button>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  // Same reasoning as the layout: start null (matches SSR), read the real
  // value only inside an effect to avoid a hydration mismatch.
  const [user, setUser] = useState<SessionUser | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    setUser(getUser());
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
      <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Bienvenido</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Usuario</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.name ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.email ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Rol</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.role ?? "-"}</p>
        </div>
      </div>

      {trips === null ? (
        <p className="mt-8 text-sm text-slate-500">Cargando viajes...</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
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
