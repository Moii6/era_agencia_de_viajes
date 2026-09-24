type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300",
};

const STATUS_TONE: Record<string, Tone> = {
  // Client stage
  LEAD: "neutral",
  PROSPECT: "info",
  CUSTOMER: "success",
  INACTIVE: "danger",
  // Shared statuses (quote/reservation/trip)
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "neutral",
  PENDING_DEPOSIT: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "success",
  PUBLISHED: "info",
  CLOSED: "danger",
  // Provider type (categorical, not a status — tones just aid scanning)
  HOTEL: "info",
  TRANSPORT: "neutral",
  OTHER: "neutral",
  // User status/role
  ACTIVE: "success",
  PENDING: "warning",
  OWNER: "warning",
  ADMIN: "info",
  AGENT: "success",
  GUIDE: "neutral",
};

const LABELS: Record<string, string> = {
  LEAD: "Interesado",
  PROSPECT: "Prospecto",
  CUSTOMER: "Cliente",
  INACTIVE: "Inactivo",
  HOTEL: "Hotel",
  TRANSPORT: "Transportista",
  OTHER: "Otro",
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Expirada",
  PENDING_DEPOSIT: "Pendiente de anticipo",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completado",
  PUBLISHED: "Publicado",
  CLOSED: "Cerrado",
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  OWNER: "Propietario",
  ADMIN: "Administrador",
  AGENT: "Agente",
  GUIDE: "Guía",
};

export function Badge({ value }: { value: string }) {
  const tone = STATUS_TONE[value] ?? "neutral";
  const label = LABELS[value] ?? value;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
