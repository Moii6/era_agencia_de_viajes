import { apiFetch } from "./api";

export type ClientStage = "LEAD" | "PROSPECT" | "CUSTOMER" | "INACTIVE";

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: ClientStage;
  source: string | null;
  notes: string | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  name: string;
  email?: string;
  phone?: string;
  stage?: ClientStage;
  source?: string;
  notes?: string;
};

export function listClients(stage?: ClientStage) {
  const qs = stage ? `?stage=${stage}` : "";
  return apiFetch<Client[]>(`/clients${qs}`);
}

export function createClient(input: ClientInput) {
  return apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(input) });
}

export function updateClient(id: string, input: Partial<ClientInput>) {
  return apiFetch<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteClient(id: string) {
  return apiFetch<Client>(`/clients/${id}`, { method: "DELETE" });
}
