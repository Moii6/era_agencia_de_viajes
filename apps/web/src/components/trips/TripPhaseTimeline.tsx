import { formatDateTime } from "@/lib/formats";
import { Trip } from "@/lib/trips";

type StepState = "done" | "current" | "pending";

type Step = {
  label: string;
  location: string;
  timestamp: string | null;
  icon: React.ReactNode;
};

const iconClass = "h-4 w-4";

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4m0 0h13l-3 4 3 4H5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5h6v2H9zM9 12l2 2 4-4.5" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
      <rect x="3" y="5" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M3 11h18M7 16v2M17 16v2" />
      <circle cx="7.5" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckeredFlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4m0 1h6l1 2h6l-2 3 2 3h-6l-1-2H5" />
    </svg>
  );
}

export function TripPhaseTimeline({ trip }: { trip: Trip }) {
  if (!trip.currentPhase) return null;

  const steps: Step[] = [
    {
      label: "Check-in de salida",
      location: trip.departurePoint,
      timestamp: trip.phaseCheckinDepartureAt,
      icon: <FlagIcon />,
    },
    {
      label: "En destino",
      location: trip.destination ?? trip.hotelProvider?.name ?? "—",
      timestamp: trip.phaseEnDestinoAt,
      icon: <MapPinIcon />,
    },
    {
      label: "Check-in de regreso",
      location: trip.destination ?? "—",
      timestamp: trip.phaseCheckinReturnAt,
      icon: <ClipboardCheckIcon />,
    },
    {
      label: "Traslado de regreso",
      location: trip.returnPoint,
      timestamp: trip.phaseReturnTransferAt,
      icon: <BusIcon />,
    },
    {
      label: "Viaje completado",
      location: trip.returnPoint,
      timestamp: trip.completedAt,
      icon: <CheckeredFlagIcon />,
    },
  ];

  const phaseOrder: NonNullable<Trip["currentPhase"]>[] = [
    "CHECKIN_DEPARTURE",
    "EN_DESTINO",
    "CHECKIN_RETURN",
    "RETURN_TRANSFER",
  ];
  const currentIndex = trip.status === "COMPLETED" ? 5 : phaseOrder.indexOf(trip.currentPhase);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
        Seguimiento del viaje
      </p>
      <div className="mt-5">
        {steps.map((step, i) => {
          const state: StepState = i < currentIndex ? "done" : i === currentIndex ? "current" : "pending";
          const isLast = i === steps.length - 1;

          return (
            <div key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    state === "done"
                      ? "bg-teal-600 text-white dark:bg-teal-500"
                      : state === "current"
                        ? "bg-teal-50 text-teal-600 ring-2 ring-teal-500 dark:bg-teal-500/10 dark:text-teal-400"
                        : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                  }`}
                >
                  {state === "done" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={iconClass}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={state === "current" ? "animate-pulse" : ""}>{step.icon}</span>
                  )}
                </span>
                {!isLast ? (
                  <span
                    className={`w-px flex-1 ${state === "done" ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"}`}
                  />
                ) : null}
              </div>
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-semibold ${
                    state === "pending"
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {step.label}
                </p>
                {state !== "pending" ? (
                  <>
                    {step.timestamp ? (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(step.timestamp)}
                      </p>
                    ) : null}
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPinIcon />
                      {step.location}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Pendiente</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
