"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { RoomTypeForm } from "@/components/forms/RoomTypeForm";
import { ApiError } from "@/lib/api";
import { createRoomType, deleteRoomType, listRoomTypes, RoomType, RoomTypeInput, updateRoomType } from "@/lib/trips";

export function RoomTypesSection({ tripId }: { tripId: string }) {
  const [roomTypes, setRoomTypes] = useState<RoomType[] | null>(null);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

  async function load() {
    try {
      setRoomTypes(await listRoomTypes(tripId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los tipos de habitación");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleSubmit(input: RoomTypeInput) {
    if (modalMode === "edit" && editingRoomType) {
      await updateRoomType(tripId, editingRoomType.id, input);
    } else {
      await createRoomType(tripId, input);
    }
    setModalMode(null);
    setEditingRoomType(null);
    await load();
  }

  async function handleDelete(roomType: RoomType) {
    if (!confirm(`¿Eliminar el tipo de habitación "${roomType.name}"?`)) return;
    try {
      await deleteRoomType(tripId, roomType.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el tipo de habitación");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tipos de habitación</h3>
        <button
          onClick={() => {
            setEditingRoomType(null);
            setModalMode("create");
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {roomTypes === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : roomTypes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin tipos de habitación todavía.</p>
        ) : (
          roomTypes.map((roomType) => (
            <div
              key={roomType.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{roomType.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hasta {roomType.maxOccupancy} personas · ${roomType.pricePerNight} por noche
                  {roomType.quantityAvailable != null ? ` · ${roomType.quantityAvailable} disponibles` : ""}
                </p>
                {roomType.characteristics ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{roomType.characteristics}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRoomType(roomType);
                    setModalMode("edit");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(roomType)}
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
          title={modalMode === "edit" ? "Editar tipo de habitación" : "Nuevo tipo de habitación"}
          onClose={() => {
            setModalMode(null);
            setEditingRoomType(null);
          }}
        >
          <RoomTypeForm
            roomType={editingRoomType ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalMode(null);
              setEditingRoomType(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
