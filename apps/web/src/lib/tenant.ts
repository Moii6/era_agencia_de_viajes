import { apiFetch } from "./api";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  representativeName: string | null;
  address: string | null;
  contacts: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    users: number;
    clients: number;
    trips: number;
  };
};

export type TenantInput = {
  name?: string;
  representativeName?: string;
  address?: string;
  contacts?: string[];
  notes?: string;
};

export function getTenant() {
  return apiFetch<Tenant>("/tenants/me");
}

export function updateTenant(input: TenantInput) {
  return apiFetch<Tenant>("/tenants/me", { method: "PATCH", body: JSON.stringify(input) });
}
