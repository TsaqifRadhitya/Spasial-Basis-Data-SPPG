"use client";

import React from "react";
import type { Toast } from "@/types/dashboard";
import ToastItem from "@/components/molecules/ToastItem";

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div
      style={{ zIndex: 99999 }}
      className="fixed top-6 right-6 flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
