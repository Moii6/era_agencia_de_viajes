"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DepositForm } from "@/components/forms/DepositForm";
import { createDeposit, Deposit, DepositInput } from "@/lib/reservations";
import { formatDate } from "@/lib/formats";

type DepositsSectionProps = {
  reservationId: string;
  deposits: Deposit[];
  minimumInitialAmount: number;
  onChange: () => void;
};

export function DepositsSection({ reservationId, deposits, minimumInitialAmount, onChange }: DepositsSectionProps) {
  const [showModal, setShowModal] = useState(false);

  const hasInitialDeposit = deposits.some((d) => d.isInitialDeposit);

  async function handleSubmit(input: DepositInput) {
    await createDeposit(reservationId, input);
    setShowModal(false);
    onChange();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Anticipos</h3>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {deposits.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin anticipos registrados todavía.</p>
        ) : (
          deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  ${deposit.amount}
                  {deposit.isInitialDeposit ? (
                    <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                      Inicial
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(deposit.date)}
                  {deposit.note ? ` · ${deposit.note}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal ? (
        <Modal title="Nuevo anticipo" onClose={() => setShowModal(false)}>
          <DepositForm
            minimumInitialAmount={minimumInitialAmount}
            hasInitialDeposit={hasInitialDeposit}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
