"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { ApiError } from "@/lib/api";
import { Activity, ActivityInput, createActivity, deleteActivity, listActivities, updateActivity } from "@/lib/trips";

export function ActivitiesSection({ tripId }: { tripId: string }) {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  async function load() {
    try {
      setActivities(await listActivities(tripId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las actividades");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleSubmit(input: ActivityInput) {
    if (modalMode === "edit" && editingActivity) {
      await updateActivity(tripId, editingActivity.id, input);
    } else {
      await createActivity(tripId, input);
    }
    setModalMode(null);
    setEditingActivity(null);
    await load();
  }

  async function handleDelete(activity: Activity) {
    if (!confirm(`¿Eliminar la actividad "${activity.name}"?`)) return;
    try {
      await deleteActivity(tripId, activity.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la actividad");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actividades opcionales</h3>
        <button
          onClick={() => {
            setEditingActivity(null);
            setModalMode("create");
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {activities === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin actividades todavía.</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.hasExtraCost ? `Costo extra: $${activity.price}` : "Sin costo extra"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingActivity(activity);
                    setModalMode("edit");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(activity)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalMode ? (
        <Modal
          title={modalMode === "edit" ? "Editar actividad" : "Nueva actividad"}
          onClose={() => {
            setModalMode(null);
            setEditingActivity(null);
          }}
        >
          <ActivityForm
            activity={editingActivity ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalMode(null);
              setEditingActivity(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
