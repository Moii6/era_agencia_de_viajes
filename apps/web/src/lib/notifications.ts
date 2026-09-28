import { apiFetch } from "./api";

export type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
};

export function listNotifications() {
  return apiFetch<Notification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch<void>("/notifications/read-all", { method: "POST" });
}
