"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import {
  CheckInLeg,
  listCheckIns,
  SeatCheckInRow,
  startReturnCheckIn,
  submitCheckIn,
  TripPhase,
} from "@/lib/trips";

const PHASE_LABELS: Record<TripPhase, string> = {
  CHECKIN_DEPARTURE: "Check-in de salida",
  EN_DESTINO: "En destino",
  CHECKIN_RETURN: "Check-in de regreso",
  RETURN_TRANSFER: "Traslado de regreso",
};

function groupByBus(rows: SeatCheckInRow[]) {
  const groups = new Map<string, { bus: { id: string; label: string }; rows: SeatCheckInRow[] }>();
  for (const row of rows) {
    if (!groups.has(row.bus.id)) {
      groups.set(row.bus.id, { bus: row.bus, rows: [] });
    }
    groups.get(row.bus.id)!.rows.push(row);
  }
  // seatNumber is free text ("10" would sort before "2" as a string), same
  // reasoning as the seated-passengers list on BusesSection.
  return Array.from(groups.values()).map((group) => ({
    ...group,
    rows: [...group.rows].sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber)),
  }));
}

type CheckInSectionProps = {
  tripId: string;
  currentPhase: TripPhase | null;
  canAct: boolean;
  onAdvance: () => void;
};

export function CheckInSection({ tripId, currentPhase, canAct, onAdvance }: CheckInSectionProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [rows, setRows] = useState<SeatCheckInRow[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const activeLeg: CheckInLeg | null =
    currentPhase === "CHECKIN_DEPARTURE" ? "DEPARTURE" : currentPhase === "CHECKIN_RETURN" ? "RETURN" : null;

  async function load(leg: CheckInLeg) {
    try {
      setRows(await listCheckIns(tripId, leg));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el check-in");
    }
  }

  useEffect(() => {
    if (activeLeg) {
      setRows(null);
      load(activeLeg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, activeLeg]);

  async function handleCheckIn(row: SeatCheckInRow, checkedIn: boolean) {
    if (!activeLeg) return;
    setSavingId(row.id);
    try {
      await submitCheckIn(tripId, {
        seatAssignmentId: row.id,
        leg: activeLeg,
        checkedIn,
        note: notes[row.id] || undefined,
      });
      toast.success(checkedIn ? "Check-in registrado" : "Falta registrada");
      await load(activeLeg);
      onAdvance();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo registrar el check-in";
      setError(message);
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleStartReturn() {
    if (!(await confirm("¿Iniciar el check-in de regreso para este viaje?", { confirmLabel: "Iniciar" })))
      return;
    try {
      await startReturnCheckIn(tripId);
      toast.success("Check-in de regreso iniciado");
      onAdvance();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo iniciar el check-in de regreso";
      setError(message);
      toast.error(message);
    }
  }

  if (!currentPhase) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Seguimiento del viaje</h3>
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
          {PHASE_LABELS[currentPhase]}
        </span>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      {currentPhase === "EN_DESTINO" ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            El viaje está en destino. Cuando sea momento de volver, inicia el check-in de regreso.
          </p>
          {canAct ? (
            <button
              onClick={handleStartReturn}
              className="mt-3 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              Iniciar check-in de regreso
            </button>
          ) : null}
        </div>
      ) : currentPhase === "RETURN_TRANSFER" ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
          Todos los asientos completaron el check-in de regreso — el grupo va en camino de vuelta.
        </div>
      ) : rows === null ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : (
        <div className="mt-3 space-y-4">
          {groupByBus(rows).map(({ bus, rows: busRows }) => {
            const doneCount = busRows.filter((r) => r.checkIns.length > 0).length;
            return (
              <div key={bus.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{bus.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doneCount}/{busRows.length} con check-in
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {busRows.map((row) => {
                    const checkIn = row.checkIns[0];
                    const name = row.traveler?.fullName ?? row.tripGuide?.user.name ?? "Sin asignar";
                    const roleTag = row.traveler?.isHolder
                      ? "Titular"
                      : row.tripGuide?.isLead
                        ? "Guía líder"
                        : row.tripGuide
                          ? "Guía"
                          : null;
                    return (
                      <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100">
                            #{row.seatNumber} {name}
                            {roleTag ? (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {roleTag}
                              </span>
                            ) : null}
                          </p>
                          {checkIn ? (
                            <p
                              className={`text-xs ${checkIn.checkedIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                            >
                              {checkIn.checkedIn ? "Presente" : "No llegó"}
                              {checkIn.note ? ` — ${checkIn.note}` : ""}
                            </p>
                          ) : canAct ? (
                            <input
                              type="text"
                              placeholder="Nota (opcional)"
                              value={notes[row.id] ?? ""}
                              onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                              className="mt-1 w-40 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500">Sin check-in</p>
                          )}
                        </div>
                        {canAct && !checkIn ? (
                          <div className="flex shrink-0 gap-2">
                            <button
                              disabled={savingId === row.id}
                              onClick={() => handleCheckIn(row, true)}
                              className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-400"
                            >
                              Presente
                            </button>
                            <button
                              disabled={savingId === row.id}
                              onClick={() => handleCheckIn(row, false)}
                              className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              No llegó
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
