import { apiFetch } from "./api";

export type ReservationStatus = "PENDING_DEPOSIT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// CONFIRMED is deliberately not a manual target — it's reached automatically
// when the initial deposit is registered (mirrors the backend's ALLOWED_TRANSITIONS).
export const RESERVATION_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING_DEPOSIT: ["CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export type TravelerType = "ADULT" | "MINOR";

export type SeatAssignment = {
  id: string;
  tripId: string;
  busId: string;
  seatNumber: string;
  travelerId: string;
  bus?: { id: string; label: string };
};

export type Traveler = {
  id: string;
  reservationId: string;
  quoteOccupancyId: string;
  fullName: string;
  age: number;
  phone: string | null;
  type: TravelerType;
  isHolder: boolean;
  documentId: string | null;
  notes: string | null;
  seatAssignment?: SeatAssignment | null;
};

export type Deposit = {
  id: string;
  reservationId: string;
  amount: string;
  date: string;
  isInitialDeposit: boolean;
  note: string | null;
  createdByUserId: string;
};

export type Reservation = {
  id: string;
  tenantId: string;
  quoteId: string;
  status: ReservationStatus;
  touristAccessToken: string;
  createdAt: string;
  updatedAt: string;
  quote?: {
    id: string;
    total: string;
    client: { id: string; name: string };
    trip: { id: string; name: string; departureDate: string };
  };
  _count?: { travelers: number; deposits: number };
};

export type ReservationDetail = Reservation & {
  quote: {
    id: string;
    total: string;
    client: { id: string; name: string; email: string | null; phone: string | null };
    trip: { id: string; name: string; departureDate: string; minimumDepositAmount: string };
  };
  travelers: Traveler[];
  deposits: Deposit[];
  depositsSum: number;
  balance: number;
};

export type ReservationInput = { quoteId: string };
export type ReservationUpdateInput = { status: ReservationStatus };

export type TravelerInput = {
  quoteOccupancyId: string;
  fullName: string;
  age: number;
  phone?: string;
  type: TravelerType;
  isHolder?: boolean;
  documentId?: string;
  notes?: string;
};

export type TravelerUpdateInput = Partial<Omit<TravelerInput, "quoteOccupancyId">>;

export type AssignSeatInput = { busId: string; seatNumber: string };

export type DepositInput = {
  amount: number;
  date: string;
  isInitialDeposit?: boolean;
  note?: string;
};

// --- Reservations ---

export function listReservations(params?: { status?: ReservationStatus; clientId?: string; tripId?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.clientId) qs.set("clientId", params.clientId);
  if (params?.tripId) qs.set("tripId", params.tripId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Reservation[]>(`/reservations${suffix}`);
}

export function getReservation(id: string) {
  return apiFetch<ReservationDetail>(`/reservations/${id}`);
}

export function createReservation(input: ReservationInput) {
  return apiFetch<Reservation>("/reservations", { method: "POST", body: JSON.stringify(input) });
}

export function updateReservation(id: string, input: ReservationUpdateInput) {
  return apiFetch<Reservation>(`/reservations/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// --- Travelers ---

export function createTraveler(reservationId: string, input: TravelerInput) {
  return apiFetch<Traveler>(`/reservations/${reservationId}/travelers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTraveler(reservationId: string, travelerId: string, input: TravelerUpdateInput) {
  return apiFetch<Traveler>(`/reservations/${reservationId}/travelers/${travelerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTraveler(reservationId: string, travelerId: string) {
  return apiFetch<Traveler>(`/reservations/${reservationId}/travelers/${travelerId}`, { method: "DELETE" });
}

export function assignSeat(reservationId: string, travelerId: string, input: AssignSeatInput) {
  return apiFetch<SeatAssignment>(`/reservations/${reservationId}/travelers/${travelerId}/seat`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function unassignSeat(reservationId: string, travelerId: string) {
  return apiFetch<void>(`/reservations/${reservationId}/travelers/${travelerId}/seat`, { method: "DELETE" });
}

// --- Deposits ---

export function createDeposit(reservationId: string, input: DepositInput) {
  return apiFetch<Deposit>(`/reservations/${reservationId}/deposits`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
