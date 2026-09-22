import { apiFetch } from "./api";

export type PublicTenant = {
  id: string;
  name: string;
  slug: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export function getPublicTenant(slug: string) {
  return apiFetch<PublicTenant>(`/tenants/${slug}/public`);
}

export function registerForTenant(slug: string, input: RegisterInput) {
  return apiFetch<{ id: string; name: string; email: string }>(`/tenants/${slug}/register`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
