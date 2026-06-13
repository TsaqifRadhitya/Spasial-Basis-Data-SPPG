import type { Toast } from "@/types/dashboard";

interface ToastItemProps {
  toast: Toast;
}

export default function ToastItem({ toast }: ToastItemProps) {
  return (
    <div
      className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 pointer-events-auto max-w-sm transition-all duration-300 animate-slide-in
        ${toast.type === "success" ? "bg-[#1C322D] border-[#1C322D] text-[#F8F3EE]" : ""}
        ${toast.type === "error" ? "bg-[#F1CDBE] border-[#1C322D] text-[#1C322D]" : ""}
        ${toast.type === "info" ? "bg-[#F8F3EE] border-[#1C322D] text-[#1C322D]" : ""}
      `}
    >
      {toast.type === "success" && (
        <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.type === "error" && (
        <svg className="w-4 h-4 text-[#1C322D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      <span>{toast.message}</span>
    </div>
  );
}
