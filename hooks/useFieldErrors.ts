"use client";

import { useState } from "react";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/**
 * Field-level errors raised on submit and cleared per field as the Creator
 * fixes them — so a form with two problems does not hand them over one
 * resubmit at a time.
 */
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<FieldErrors<K>>({});

  const clear = (key: K) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
    /**
     * Replaces the flagged set. Keys carrying `undefined` are dropped, so a
     * caller can write one object literal per field and let the passes fall
     * out. Returns true when nothing was flagged, to gate a submit.
     */
    raise: (candidate: FieldErrors<K>) => {
      const next = Object.fromEntries(
        Object.entries(candidate).filter(([, message]) => Boolean(message))
      ) as FieldErrors<K>;
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    clear,
  };
}
