import { apiFetch } from "./api";

export type UserRole = "OWNER" | "ADMIN" | "AGENT" | "GUIDE";
export type UserStatus = "ACTIVE" | "INACTIVE";

export type AgencyUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export function listUsers() {
  return apiFetch<AgencyUser[]>("/users");
}

export function createUser(input: UserInput) {
  return apiFetch<AgencyUser>("/users", { method: "POST", body: JSON.stringify(input) });
}
