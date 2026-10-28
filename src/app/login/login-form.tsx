"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input-styles";
import { ApiError, apiRequest } from "@/lib/client-api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors({});

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}

      <Field label="Email" required error={fieldErrors.email?.[0]}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputStyles}
          />
        )}
      </Field>

      <Field label="Password" required error={fieldErrors.password?.[0]}>
        {(props) => (
          <input
            {...props}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputStyles}
          />
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
