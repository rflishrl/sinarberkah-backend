import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import * as React from "react";

export interface TurnstileFieldProps {
  action: string;
  onToken: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
  className?: string;
}

export interface TurnstileFieldHandle {
  reset: () => void;
}

/**
 * Komponen pelindung Cloudflare Turnstile sisi klien.
 * Mengelola perolehan token, penanganan kedaluwarsa, error,
 * serta mengekspos metode reset imperatif untuk formulir.
 */
export const TurnstileField = React.forwardRef<
  TurnstileFieldHandle,
  TurnstileFieldProps
>(function TurnstileField(
  { action, onToken, onError, onExpire, className },
  ref,
) {
  const turnstileRef = React.useRef<TurnstileInstance | undefined>(undefined);
  const siteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  React.useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        onToken("");
        try {
          turnstileRef.current?.reset();
        } catch {
          // Abaikan bila widget sedang unmounted
        }
      },
    }),
    [onToken],
  );

  return (
    <div
      className={
        className ?? "flex min-h-[65px] items-center justify-center py-2"
      }
    >
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{
          action,
          theme: "auto",
        }}
        onSuccess={(token) => {
          onToken(token);
        }}
        onExpire={() => {
          onToken("");
          onExpire?.();
        }}
        onError={(err) => {
          onToken("");
          onError?.(err);
        }}
      />
    </div>
  );
});
