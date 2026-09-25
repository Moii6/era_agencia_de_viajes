import { apiFetch } from "./api";

export type TripStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "COMPLETED" | "CANCELLED";

export type Trip = {
  id: string;
  name: string;
  destination: string | null;
  departureDate: string;
  departureTime: string | null;
  departurePoint: string;
  returnDate: string;
  returnTime: string | null;
  returnPoint: string;
  transportIncluded: boolean;
  transportNotes: string | null;
  lodgingIncluded: boolean;
  hotelProviderId: string | null;
  capacity: number;
  minimumDepositAmount: string;
  status: TripStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  hotelProvider?: { id: string; name: string } | null;
  _count?: { buses: number; roomTypes: number; activities: number; quotes: number };
};

export type Bus = {
  id: string;
  tripId: string;
  label: string;
  providerId: string | null;
  seatCapacity: number;
  plateOrUnitNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverLicense: string | null;
  notes: string | null;
  // Only present on the list returned by listBuses (used to offer a
  // pick-from-available-seats list) — absent on create/update responses.
  seatAssignments?: { seatNumber: string }[];
};

export type RoomType = {
  id: string;
  tripId: string;
  name: string;
  characteristics: string | null;
  maxOccupancy: number;
  quantityAvailable: number | null;
};

export type Activity = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  scheduledAt: string | null;
  hasExtraCost: boolean;
  price: string | null;
  currency: string;
};

export type TripDetail = Trip & {
  buses: Bus[];
  roomTypes: RoomType[];
  activities: Activity[];
};

export type TripInput = {
  name: string;
  destination?: string;
  departureDate: string;
  departureTime?: string;
  departurePoint: string;
  returnDate: string;
  returnTime?: string;
  returnPoint: string;
  transportIncluded?: boolean;
  transportNotes?: string;
  lodgingIncluded?: boolean;
  hotelProviderId?: string;
  capacity: number;
  minimumDepositAmount: number;
  notes?: string;
};

export type TripUpdateInput = Partial<TripInput> & { status?: TripStatus };

export type BusInput = {
  label: string;
  providerId?: string;
  seatCapacity: number;
  plateOrUnitNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverLicense?: string;
  notes?: string;
};

export type RoomTypeInput = {
  name: string;
  characteristics?: string;
  maxOccupancy: number;
  quantityAvailable?: number;
};

export type ActivityInput = {
  name: string;
  description?: string;
  scheduledAt?: string;
  hasExtraCost: boolean;
  price?: number;
  currency?: string;
};

// --- Trips ---

export function listTrips(status?: TripStatus) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Trip[]>(`/trips${qs}`);
}

export function getTrip(id: string) {
  return apiFetch<TripDetail>(`/trips/${id}`);
}

export function createTrip(input: TripInput) {
  return apiFetch<Trip>("/trips", { method: "POST", body: JSON.stringify(input) });
}

export function updateTrip(id: string, input: TripUpdateInput) {
  return apiFetch<Trip>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// --- Buses ---

export function listBuses(tripId: string) {
  return apiFetch<Bus[]>(`/trips/${tripId}/buses`);
}

export function createBus(tripId: string, input: BusInput) {
  return apiFetch<Bus>(`/trips/${tripId}/buses`, { method: "POST", body: JSON.stringify(input) });
}

export function updateBus(tripId: string, busId: string, input: Partial<BusInput>) {
  return apiFetch<Bus>(`/trips/${tripId}/buses/${busId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteBus(tripId: string, busId: string) {
  return apiFetch<Bus>(`/trips/${tripId}/buses/${busId}`, { method: "DELETE" });
}

// --- Room types ---

export function listRoomTypes(tripId: string) {
  return apiFetch<RoomType[]>(`/trips/${tripId}/room-types`);
}

export function createRoomType(tripId: string, input: RoomTypeInput) {
  return apiFetch<RoomType>(`/trips/${tripId}/room-types`, { method: "POST", body: JSON.stringify(input) });
}

export function updateRoomType(tripId: string, roomTypeId: string, input: Partial<RoomTypeInput>) {
  return apiFetch<RoomType>(`/trips/${tripId}/room-types/${roomTypeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRoomType(tripId: string, roomTypeId: string) {
  return apiFetch<RoomType>(`/trips/${tripId}/room-types/${roomTypeId}`, { method: "DELETE" });
}

// --- Activities ---

export function listActivities(tripId: string) {
  return apiFetch<Activity[]>(`/trips/${tripId}/activities`);
}

export function createActivity(tripId: string, input: ActivityInput) {
  return apiFetch<Activity>(`/trips/${tripId}/activities`, { method: "POST", body: JSON.stringify(input) });
}

export function updateActivity(tripId: string, activityId: string, input: Partial<ActivityInput>) {
  return apiFetch<Activity>(`/trips/${tripId}/activities/${activityId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteActivity(tripId: string, activityId: string) {
  return apiFetch<Activity>(`/trips/${tripId}/activities/${activityId}`, { method: "DELETE" });
}
