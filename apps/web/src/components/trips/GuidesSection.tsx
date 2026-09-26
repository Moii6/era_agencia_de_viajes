"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { GuideForm } from "@/components/forms/GuideForm";
import { ApiError } from "@/lib/api";
import { createTripGuide, deleteTripGuide, listTripGuides, TripGuide, TripGuideInput } from "@/lib/trips";

export function GuidesSection({ tripId, readOnly = false }: { tripId: string; readOnly?: boolean }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [guides, setGuides] = useState<TripGuide[] | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      setGuides(await listTripGuides(tripId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los guías");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleSubmit(input: TripGuideInput) {
    await createTripGuide(tripId, input);
    toast.success("Guía agregado");
    setShowModal(false);
    await load();
  }

  async function handleDelete(guide: TripGuide) {
    if (!(await confirm(`¿Quitar a "${guide.user.name}" como guía de este viaje?`, { confirmLabel: "Quitar" })))
      return;
    try {
      await deleteTripGuide(tripId, guide.id);
      toast.success("Guía quitado");
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo quitar al guía";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Guías</h3>
        {readOnly ? null : (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            + Agregar
          </button>
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {guides === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : guides.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin guías asignados todavía.</p>
        ) : (
          guides.map((guide) => (
            <div
              key={guide.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {guide.user.name}
                  {guide.isLead ? (
                    <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                      Líder
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{guide.user.email}</p>
              </div>
              {readOnly ? null : (
                <button
                  onClick={() => handleDelete(guide)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Quitar
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showModal ? (
        <Modal title="Agregar guía" onClose={() => setShowModal(false)}>
          <GuideForm
            existingUserIds={(guides ?? []).map((g) => g.userId)}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
