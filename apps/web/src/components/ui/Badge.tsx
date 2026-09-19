type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
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
};

const LABELS: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospecto",
  CUSTOMER: "Cliente",
  INACTIVE: "Inactivo",
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
