import type { ReactNode } from "react";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";

import { cn } from "@/lib/utils";

interface AlertProps {
  tone: "success" | "error";
  children: ReactNode;
  className?: string;
}

/** Pesan status. Error memakai `role="alert"`, sukses memakai `role="status"`. */
export function Alert({ tone, children, className }: AlertProps) {
  const isError = tone === "error";
  const Icon = isError ? MdErrorOutline : MdCheckCircle;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border px-4 py-3 text-sm font-medium",
        isError
          ? "border-danger/30 bg-danger-soft text-danger"
          : "border-success/30 bg-success-soft text-success",
        className,
      )}
    >
      <Icon size={20} className="mt-px shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "success" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "success"
          ? "bg-success-soft text-success"
          : "bg-line text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#b5b5b5] bg-white px-6 py-14 text-center">
      <p className="font-heading text-lg font-bold">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
