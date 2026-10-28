"use client";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

export default function AdminError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert tone="error">
        Data tidak dapat dimuat. Pastikan <code>DATABASE_URL</code> di file{" "}
        <code>.env.local</code> sudah benar dan database dapat dijangkau.
      </Alert>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
