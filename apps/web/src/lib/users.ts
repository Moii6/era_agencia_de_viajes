import { apiFetch } from "./api";

export type UserRole = "OWNER" | "ADMIN" | "AGENT" | "GUIDE";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type AgencyUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  // Consensus approval workflow: requestedByUserId is set whenever this user
  // has something awaiting sign-off — either the user itself (status
  // PENDING) or a proposed edit staged in pendingName/pendingEmail/pendingRole.
  // Applying it needs every other active OWNER's approval, tracked here as
  // they come in — the frontend doesn't know the required count on its own,
  // it's derived from how many active OWNERs exist (see UsersSection).
  requestedByUserId: string | null;
  requestedBy: { id: string; name: string } | null;
  pendingName: string | null;
  pendingEmail: string | null;
  pendingRole: UserRole | null;
  approvedByUserIds: string[];
};

export type UserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export function listUsers() {
  return apiFetch<AgencyUser[]>("/users");
}

export function getMe() {
  return apiFetch<AgencyUser>("/users/me");
}

export function createUser(input: UserInput) {
  return apiFetch<AgencyUser>("/users", { method: "POST", body: JSON.stringify(input) });
}

export function updateUser(id: string, input: UserUpdateInput) {
  return apiFetch<AgencyUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function approveUser(id: string) {
  return apiFetch<AgencyUser>(`/users/${id}/approve`, { method: "POST" });
}

export function rejectUser(id: string) {
  return apiFetch<AgencyUser>(`/users/${id}/reject`, { method: "POST" });
}

export function deactivateUser(id: string) {
  return apiFetch<AgencyUser>(`/users/${id}/deactivate`, { method: "POST" });
}

export function reactivateUser(id: string) {
  return apiFetch<AgencyUser>(`/users/${id}/reactivate`, { method: "POST" });
}
