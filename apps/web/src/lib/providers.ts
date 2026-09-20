import { apiFetch } from "./api";

export type ProviderType = "HOTEL" | "TRANSPORT" | "OTHER";

export type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  address: string | null;
  contactInfo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProviderInput = {
  name: string;
  type: ProviderType;
  address?: string;
  contactInfo?: string;
  notes?: string;
};

export function listProviders(type?: ProviderType) {
  const qs = type ? `?type=${type}` : "";
  return apiFetch<Provider[]>(`/providers${qs}`);
}

export function createProvider(input: ProviderInput) {
  return apiFetch<Provider>("/providers", { method: "POST", body: JSON.stringify(input) });
}

export function updateProvider(id: string, input: Partial<ProviderInput>) {
  return apiFetch<Provider>(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteProvider(id: string) {
  return apiFetch<Provider>(`/providers/${id}`, { method: "DELETE" });
}
