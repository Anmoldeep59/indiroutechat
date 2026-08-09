"use client";

import { useState, type FormEvent } from "react";

type PurchaseItem = {
  id: string;
  productUrl: string;
  productName: string;
  quantity: string;
  color: string;
  size: string;
  specialInstructions: string;
};

const emptyItem = (): PurchaseItem => ({
  id: crypto.randomUUID(),
  productUrl: "",
  productName: "",
  quantity: "1",
  color: "",
  size: "",
  specialInstructions: "",
});

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function AssistedPurchaseForm() {
  const [items, setItems] = useState<PurchaseItem[]>([emptyItem()]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function updateItem(id: string, key: keyof PurchaseItem, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Assisted purchase requests will be saved to Supabase in the next integration step.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Assisted Purchase
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Request a purchase from India
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Add one or more products. IndiRoute can buy them on your behalf when
          you cannot complete checkout on an Indian website.
        </p>
      </section>

      {items.map((item, index) => (
        <section
          key={item.id}
          className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-brand">
              Item {index + 1}
            </h2>
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setItems((current) => current.filter((row) => row.id !== item.id))
                }
                className="text-sm font-semibold text-brand-muted hover:text-brand"
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClassName} htmlFor={`url-${item.id}`}>
                Product URL
              </label>
              <input
                id={`url-${item.id}`}
                className={fieldClassName}
                value={item.productUrl}
                onChange={(event) =>
                  updateItem(item.id, "productUrl", event.target.value)
                }
                placeholder="https://"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClassName} htmlFor={`name-${item.id}`}>
                Product Name
              </label>
              <input
                id={`name-${item.id}`}
                className={fieldClassName}
                value={item.productName}
                onChange={(event) =>
                  updateItem(item.id, "productName", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`qty-${item.id}`}>
                Quantity
              </label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min="1"
                className={fieldClassName}
                value={item.quantity}
                onChange={(event) =>
                  updateItem(item.id, "quantity", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`color-${item.id}`}>
                Color
              </label>
              <input
                id={`color-${item.id}`}
                className={fieldClassName}
                value={item.color}
                onChange={(event) =>
                  updateItem(item.id, "color", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`size-${item.id}`}>
                Size
              </label>
              <input
                id={`size-${item.id}`}
                className={fieldClassName}
                value={item.size}
                onChange={(event) =>
                  updateItem(item.id, "size", event.target.value)
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClassName} htmlFor={`notes-${item.id}`}>
                Special Instructions
              </label>
              <textarea
                id={`notes-${item.id}`}
                rows={3}
                className={`${fieldClassName} min-h-24 py-3`}
                value={item.specialInstructions}
                onChange={(event) =>
                  updateItem(item.id, "specialInstructions", event.target.value)
                }
              />
            </div>
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setItems((current) => [...current, emptyItem()])}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
        >
          Add another item
        </button>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <label className={labelClassName} htmlFor="request-notes">
          Request notes
        </label>
        <textarea
          id="request-notes"
          rows={3}
          className={`${fieldClassName} min-h-24 py-3`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything else we should know?"
        />
        <button
          type="submit"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Submit Request
        </button>
        {message ? (
          <p className="mt-4 text-sm text-brand-muted" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </form>
  );
}
