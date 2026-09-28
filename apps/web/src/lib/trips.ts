import { apiFetch } from "./api";

export type TripStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// Only meaningful once status = IN_PROGRESS (null otherwise).
export type TripPhase = "CHECKIN_DEPARTURE" | "EN_DESTINO" | "CHECKIN_RETURN" | "RETURN_TRANSFER";

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
  currentPhase: TripPhase | null;
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
  // pick-from-available-seats list and show who's already seated) — absent
  // on create/update responses. Exactly one of traveler/tripGuide is set.
  seatAssignments?: {
    seatNumber: string;
    traveler: { id: string; fullName: string; isHolder: boolean } | null;
    tripGuide: { id: string; isLead: boolean; user: { id: string; name: string } } | null;
  }[];
};

export type RoomType = {
  id: string;
  tripId: string;
  name: string;
  characteristics: string | null;
  maxOccupancy: number;
  quantityAvailable: number | null;
  // Only present on the list returned by listRoomTypes — how many of its
  // occupancies belong to a CONFIRMED/COMPLETED reservation (a room only
  // counts as taken once the booking is actually confirmed, not just
  // quoted). Absent on create/update responses.
  _count?: { occupancies: number };
};

export type TripGuide = {
  id: string;
  tripId: string;
  userId: string;
  isLead: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
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
  // Required at creation (TripUpdateInput makes it optional again for
  // edits via Partial<TripInput>) — see CreateTripDto.
  departureTime: string;
  departurePoint: string;
  returnDate: string;
  returnTime: string;
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

export type TripGuideInput = {
  userId: string;
  isLead?: boolean;
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

// --- Guides ---

export function listTripGuides(tripId: string) {
  return apiFetch<TripGuide[]>(`/trips/${tripId}/guides`);
}

export function createTripGuide(tripId: string, input: TripGuideInput) {
  return apiFetch<TripGuide>(`/trips/${tripId}/guides`, { method: "POST", body: JSON.stringify(input) });
}

export function deleteTripGuide(tripId: string, guideId: string) {
  return apiFetch<TripGuide>(`/trips/${tripId}/guides/${guideId}`, { method: "DELETE" });
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

// --- Check-ins ---

export type CheckInLeg = "DEPARTURE" | "RETURN";

export type TripCheckIn = {
  id: string;
  seatAssignmentId: string;
  leg: CheckInLeg;
  checkedIn: boolean;
  note: string | null;
};

// One row per seat (traveler or guide) on a bus of the trip, with its
// check-in record for whichever leg was requested — absent (empty array)
// until someone checks that seat in.
export type SeatCheckInRow = {
  id: string;
  seatNumber: string;
  bus: { id: string; label: string };
  traveler: { id: string; fullName: string; isHolder: boolean } | null;
  tripGuide: { id: string; isLead: boolean; user: { id: string; name: string } } | null;
  checkIns: TripCheckIn[];
};

export type CheckInInput = {
  seatAssignmentId: string;
  leg: CheckInLeg;
  checkedIn?: boolean;
  note?: string;
};

export function listCheckIns(tripId: string, leg: CheckInLeg) {
  return apiFetch<SeatCheckInRow[]>(`/trips/${tripId}/checkins?leg=${leg}`);
}

export function submitCheckIn(tripId: string, input: CheckInInput) {
  return apiFetch<TripCheckIn>(`/trips/${tripId}/checkins`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function startReturnCheckIn(tripId: string) {
  return apiFetch<Trip>(`/trips/${tripId}/checkins/start-return`, { method: "POST" });
}
