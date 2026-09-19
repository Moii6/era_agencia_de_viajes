import { apiFetch } from "./api";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["SENT", "REJECTED", "EXPIRED"],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export type QuoteOccupancyActivity = {
  id: string;
  quoteOccupancyId: string;
  activityId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  activity?: { id: string; name: string };
};

export type QuoteOccupancy = {
  id: string;
  quoteId: string;
  roomTypeId: string;
  label: string | null;
  adults: number;
  minors: number;
  unitPriceAdult: string;
  unitPriceMinor: string;
  subtotal: string;
  roomType?: { id: string; name: string };
  activities?: QuoteOccupancyActivity[];
};

export type Quote = {
  id: string;
  clientId: string;
  tripId: string;
  userId: string;
  validUntil: string | null;
  notes: string | null;
  subtotal: string;
  total: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
  trip?: { id: string; name: string; departureDate: string };
  _count?: { occupancies: number };
};

export type QuoteDetail = Quote & {
  client: { id: string; name: string; email: string | null; phone: string | null };
  trip: { id: string; name: string; departureDate: string; returnDate: string };
  occupancies: QuoteOccupancy[];
};

export type QuoteInput = {
  clientId: string;
  tripId: string;
  validUntil?: string;
  notes?: string;
};

export type QuoteUpdateInput = {
  validUntil?: string;
  notes?: string;
  status?: QuoteStatus;
};

export type OccupancyInput = {
  roomTypeId: string;
  label?: string;
  adults: number;
  minors: number;
};

export type OccupancyUpdateInput = Partial<Omit<OccupancyInput, "roomTypeId">>;

export type OccupancyActivityInput = {
  activityId: string;
  quantity: number;
};

// --- Quotes ---

export function listQuotes(params?: { status?: QuoteStatus; clientId?: string; tripId?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.clientId) qs.set("clientId", params.clientId);
  if (params?.tripId) qs.set("tripId", params.tripId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Quote[]>(`/quotes${suffix}`);
}

export function getQuote(id: string) {
  return apiFetch<QuoteDetail>(`/quotes/${id}`);
}

export function createQuote(input: QuoteInput) {
  return apiFetch<Quote>("/quotes", { method: "POST", body: JSON.stringify(input) });
}

export function updateQuote(id: string, input: QuoteUpdateInput) {
  return apiFetch<Quote>(`/quotes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteQuote(id: string) {
  return apiFetch<Quote>(`/quotes/${id}`, { method: "DELETE" });
}

// --- Occupancies ---

export function createOccupancy(quoteId: string, input: OccupancyInput) {
  return apiFetch<QuoteOccupancy>(`/quotes/${quoteId}/occupancies`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOccupancy(quoteId: string, occupancyId: string, input: OccupancyUpdateInput) {
  return apiFetch<QuoteOccupancy>(`/quotes/${quoteId}/occupancies/${occupancyId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteOccupancy(quoteId: string, occupancyId: string) {
  return apiFetch<QuoteOccupancy>(`/quotes/${quoteId}/occupancies/${occupancyId}`, { method: "DELETE" });
}

// --- Occupancy activities ---

export function createOccupancyActivity(quoteId: string, occupancyId: string, input: OccupancyActivityInput) {
  return apiFetch<QuoteOccupancyActivity>(`/quotes/${quoteId}/occupancies/${occupancyId}/activities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteOccupancyActivity(quoteId: string, occupancyId: string, lineId: string) {
  return apiFetch<QuoteOccupancyActivity>(`/quotes/${quoteId}/occupancies/${occupancyId}/activities/${lineId}`, {
    method: "DELETE",
  });
}
